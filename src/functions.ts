import {
  CompressedDownlinkOption,
  ConfigTable,
  ConfigTableRow,
  Downlink,
  InputParams,
  PayloadDataType,
  PTMap,
  PTMapKey,
  trapTypeOptions,
} from "./types";
import { settings } from "./settings";
import { params } from "./main";

export function matchConfig(
  inputParams: InputParams,
  configTable: ConfigTable = params.ConfigTable,
): ConfigTableRow | undefined {
  const deltaPressure =
    inputParams.trapInletPressure - inputParams.trapOutletPressure;
  let cfgRow: ConfigTableRow | undefined = undefined;
  for (const item of configTable) {
    if (!inputParams.trapType.includes(item.trapType)) {
      continue;
    }
    if (!inputParams.mountType.includes(item.mountType)) {
      continue;
    }
    if (!(deltaPressure >= item.pMin && deltaPressure <= item.pMax)) {
      continue;
    }
    if (!inputParams.hardwareVersion.includes(item.hardwareVersion)) {
      continue;
    }
    if (!inputParams.condensateLoad.includes(item.condensateLoad)) {
      continue;
    }
    cfgRow = item;
  }
  return cfgRow;
}

export function findNearestPTMapRow(
  value: number,
  table: PTMap = params.ptMap,
  inputKey: PTMapKey = "P [bar]",
  outputKey: PTMapKey = "T [C]",
): number {
  return table.reduce((nearestItem, currentItem) => {
    const currentValue = currentItem[inputKey];
    const nearestValue = nearestItem[inputKey];
    const currentDelta = Math.abs(currentValue - value);
    const minimalDelta = Math.abs(nearestValue - value);
    if (currentDelta < minimalDelta) {
      return currentItem;
    } else {
      return nearestItem;
    }
  }, table[0])[outputKey];
}

export function hex(
  value: number,
  digits: number,
  bytereverse = false,
): string {
  let hexstr = value.toString(16);
  if (bytereverse) {
    if (hexstr.length % 2 !== 0) {
      hexstr = hexstr.padStart(hexstr.length + 1, "0");
    }
    const hexWords: string[] = [];
    for (let i = 0; i < hexstr.length; i += 2) {
      hexWords.push(hexstr.substring(i, i + 2));
    }
    hexstr = hexWords.reverse().join("");
  }
  return hexstr.padStart(digits, "0");
}

export function buildDownlinks(
  inputParams: InputParams,
  configParams: ConfigTableRow,
  payloadDataType: PayloadDataType = "HexString",
  minimalSamplePeriod: number = settings.downlinkOptions.minimalSamplePeriod,
  compressedDownlinkOption: CompressedDownlinkOption = 2,
): Downlink[] {
  const downlinks = [] as Downlink[];
  if (payloadDataType !== "HexString") {
    throw new Error(
      // todo: adjust after feature has been implemented
      "Uint8Array (raw bytes) and Base64String is not implemented yet.",
    );
  }
  const cmdDownlinkValue = Number.parseInt(
    // tbd, tbd, reboot, ack, ...
    `0001${inputParams.counterReset ? 1 : 0}` +
      `${trapTypeOptions[configParams.trapType].toString(2).padStart(3, "0")}`,
    2,
  );
  const commonCompressedDownlinkValues = [
    cmdDownlinkValue,
    Math.trunc(findNearestPTMapRow(inputParams.trapInletPressure)),
    configParams.k1,
    configParams.k3, // same value as k2 but other register
    configParams.k4,
    configParams.k5,
    configParams.k6,
    configParams.k7,
    configParams.k8,
  ];

  // compressed downlinks
  switch (compressedDownlinkOption) {
    case 1: {
      downlinks.push({
        port: 144,
        payload: [
          144,
          ...commonCompressedDownlinkValues,
          inputParams.piezoCalFacSensor ? inputParams.piezoCalFacSensor : 0,
          inputParams.piezoCalFacAmp ? inputParams.piezoCalFacAmp : 0,
          inputParams.pt100Cal0C ? inputParams.pt100Cal0C : 1640,
          inputParams.pt100Cal250C ? inputParams.pt100Cal250C : 3175,
          inputParams.pt100CalFacMount ? inputParams.pt100CalFacMount : 0,
          inputParams.pt100CalOffMount ? inputParams.pt100CalOffMount : 0,
          inputParams.warnCntThDef ? inputParams.warnCntThDef : 360,
          inputParams.errCntThDef ? inputParams.errCntThDef : 720,
        ]
          .map((value, index) => hex(value, index > 9 ? 4 : 2))
          .join(""),
        ...settings.downlinkOptions.additional,
      });
      break;
    }
    case 2: {
      downlinks.push({
        port: 145,
        payload: [
          145,
          ...commonCompressedDownlinkValues,
          inputParams.pt100Cal0C ? inputParams.pt100Cal0C : 1640,
          inputParams.pt100Cal250C ? inputParams.pt100Cal250C : 3175,
          inputParams.errCntThDef ? inputParams.errCntThDef : 720,
        ]
          .map((value, index) => hex(value, index > 9 ? 4 : 2))
          .join(""),
        ...settings.downlinkOptions.additional,
      });
      break;
    }
    case 3: {
      downlinks.push({
        port: 146,
        payload: [
          146,
          ...commonCompressedDownlinkValues,
          inputParams.pt100Cal0C ? inputParams.pt100Cal0C : 1640,
          inputParams.pt100Cal250C ? inputParams.pt100Cal250C : 3175,
        ]
          .map((value, index) => hex(value, index > 9 ? 4 : 2))
          .join(""),
        ...settings.downlinkOptions.additional,
      });
      break;
    }
    default: {
      throw new Error(
        `Compressed downlink option '${compressedDownlinkOption}' ` +
          `is not implemented yet.`,
      );
    }
  }

  // uncompressed downlinks
  [
    ...(configParams.trapType === "DK / TH - Thermodynamic"
      ? [
          "95" + // prefix
            hex(configParams.k9 as number, 2) + // minminval
            "01" + // minminconf
            hex(configParams.k10 as number, 2) + // maxmaxval
            "01" + // minmaxconf
            "0502050200", // default minval, minconf, maxval, maxconf, piezocorr
        ]
      : []),
    ...(inputParams.piezoCalFacSensor && compressedDownlinkOption > 1
      ? ["8900" + hex(inputParams.piezoCalFacSensor, 4)]
      : []),
    ...(inputParams.piezoCalOffSensor
      ? ["8901" + hex(inputParams.piezoCalOffSensor, 4)]
      : []),
    ...(inputParams.piezoCalFacAmp && compressedDownlinkOption > 1
      ? ["8902" + hex(inputParams.piezoCalFacAmp, 4)]
      : []),
    ...(inputParams.piezoCalOffAmp
      ? ["8903" + hex(inputParams.piezoCalOffAmp, 4)]
      : []),
    ...(inputParams.piezoCalFacMount
      ? ["8904" + hex(inputParams.piezoCalFacMount, 4)]
      : []),
    ...(inputParams.piezoCalOffMount
      ? ["8905" + hex(inputParams.piezoCalOffMount, 4)]
      : []),
    ...(inputParams.pt100CalFacSensor
      ? ["8906" + hex(inputParams.pt100CalFacSensor, 4)]
      : []),
    ...(inputParams.pt100CalOffSensor
      ? ["8907" + hex(inputParams.pt100CalOffSensor, 4)]
      : []),
    ...(inputParams.pt100CalFacAmp
      ? ["8908" + hex(inputParams.pt100CalFacAmp, 4)]
      : []),
    ...(inputParams.pt100CalOffAmp
      ? ["8909" + hex(inputParams.pt100CalOffAmp, 4)]
      : []),
    ...(inputParams.pt100CalFacMount && compressedDownlinkOption > 1
      ? ["890a" + hex(inputParams.pt100CalFacMount, 4)]
      : []),
    ...(inputParams.pt100CalOffMount && compressedDownlinkOption > 1
      ? ["890b" + hex(inputParams.pt100CalOffMount, 4)]
      : []),
    ...(inputParams.pt100Cal0C && compressedDownlinkOption > 3
      ? ["890c" + hex(inputParams.pt100Cal0C, 4)]
      : []),
    ...(inputParams.pt100Cal250C && compressedDownlinkOption > 3
      ? ["890d" + hex(inputParams.pt100Cal250C, 4)]
      : []),
    ...(inputParams.warnCntThDef && compressedDownlinkOption > 1
      ? ["8402" + hex(inputParams.warnCntThDef, 4)]
      : []),
    ...(inputParams.errCntThDef && compressedDownlinkOption > 2
      ? ["8502" + hex(inputParams.errCntThDef, 4)]
      : []),
    ...(inputParams.errCntThRstDef && compressedDownlinkOption > 1
      ? ["8503" + hex(inputParams.errCntThRstDef, 4)]
      : []),
    ...(inputParams.counterReset?.toUpperCase() === "TRUE" ? ["04fc"] : []),
    ...(inputParams.requestConfig?.toUpperCase() === "TRUE"
      ? [
          "8b",
          "8e06",
          "8e00",
          "8600",
          "8601",
          "8602",
          "8603",
          ...(configParams.trapType === "DK / TH - Thermodynamic"
            ? ["95"]
            : []),
        ]
      : []),
    // ! this must be the last downlink
    ...(inputParams.samplePeriod
      ? [hex(0x01000000 | Math.ceil(inputParams.samplePeriod), 8)]
      : [hex(0x01000e10, 8)]),
  ].map((payload) =>
    downlinks.push({
      port: 2,
      payload,
      ...settings.downlinkOptions.additional,
    }),
  );

  // speed up process if there are more than 3 downlinks in queue
  if (downlinks.length > 3) {
    downlinks.unshift({
      port: 2,
      payload: hex(0x01000000 | minimalSamplePeriod, 8),
    });
  }

  return downlinks.map((downlink) => {
    return {
      ...downlink,
      ...(settings.downlinkOptions.additional
        ? settings.downlinkOptions.additional
        : {}),
    };
  });
}
