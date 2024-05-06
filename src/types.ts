/*
  This file contains menu options, interfaces and types used in other files.
*/

// * options, types and interfaces of "ConfigTable" sheet in Params.xlsx

export const trapTypeOptions = {
  "BK / BI - Bimetallic": 0,
  "MK / KAP - Membrane (capsule)": 1,
  "UNA / KU - Ball float": 2,
  "UIB / GLO - Inverted bucket": 3,
  "DK / TH - Thermodynamic": 4,
  Venturi: 0,
} as const;
export type TrapType = keyof typeof trapTypeOptions;

export const mountTypeOptions = [
  "PBS - vertical pressure bearing screw",
  "ADP - horizontal pressure bearing screw (90° adapter)",
  "RFC - retro fit clamp",
] as const;
export type MountType = (typeof mountTypeOptions)[number];

export const hardwareVersionOptions = ["MSBA-1.0", "MSBA-1.2"] as const;
export type HardwareVersion = (typeof hardwareVersionOptions)[number];

export const condensateLoadOptions = [
  "To be defined",
  "low (L < 20 kg/h)",
  "middle (20 kg/h <= L < 100 kg/h)",
  "high (100 kg/h <= L)",
] as const;
export type CondensateLoad = (typeof condensateLoadOptions)[number];

export interface ConfigTableRow {
  index: number;
  trapType: TrapType;
  mountType: MountType;
  hardwareVersion: HardwareVersion;
  pMin: number;
  pMax: number;
  condensateLoad: CondensateLoad;
  k1: number;
  k2: number;
  k3: number;
  k4: number;
  k5: number;
  k6: number;
  k7: number;
  k8: number;
  k9?: number;
  k10?: number;
}
export type ConfigTable = ConfigTableRow[];

// * types and interface for ptMap sheet in Params.xlsx

export interface PTMapRow {
  "P [bar]": number;
  "P [psog]": number;
  "T [K]": number;
  "T [C]": number;
  "T [F]": number;
}
export type PTMap = PTMapRow[];
export type PTMapKey = keyof PTMapRow;

// * combined interface for both sheets in Params.xlsx

export const paramsSheets = ["ConfigTable", "ptMap"] as const;
export type ParamsSheet = (typeof paramsSheets)[number];
export interface Params {
  ConfigTable: ConfigTable;
  ptMap: PTMap;
}

// * input parameter types and interface (for 'input.xlsx')

export const devEUIPattern: RegExp = /^[0-9A-F]{16}$/i;

interface VisibleInputParams {
  server?: string;
  group?: string;
  devEUI: string;
  trapType: TrapType;
  mountType: MountType;
  trapInletPressure: number;
  trapOutletPressure: number;
  hardwareVersion: HardwareVersion;
  condensateLoad: CondensateLoad;
}
interface HiddenInputParams {
  samplePeriod?: number;
  warnCntThDef?: number;
  errCntThDef?: number;
  errCntThRstDef?: number;
  counterReset?: string;
  requestConfig?: string;
  piezoCalFacSensor?: number;
  piezoCalOffSensor?: number;
  piezoCalFacAmp?: number;
  piezoCalOffAmp?: number;
  piezoCalFacMount?: number;
  piezoCalOffMount?: number;
  pt100Cal0C?: number;
  pt100Cal250C?: number;
  pt100CalFacSensor?: number;
  pt100CalOffSensor?: number;
  pt100CalFacAmp?: number;
  pt100CalOffAmp?: number;
  pt100CalFacMount?: number;
  pt100CalOffMount?: number;
}
export type InputParams = VisibleInputParams & HiddenInputParams;

// * combined interface for all sheets in input.xlsx

export interface InputJson {
  Input: InputParams[];
  Options: { [key: string]: string };
}

// * downlink options, interfaces and types

export const payloadDataTypeOptions = [
  "Uint8Array",
  "HexString",
  "Base64String",
] as const;
export type PayloadDataType = (typeof payloadDataTypeOptions)[number];

export const compressedDownlinkOptions = [1, 2, 3] as const;
export type CompressedDownlinkOption =
  (typeof compressedDownlinkOptions)[number];

// * output interfaces

export type AdditionalDownlinkData = {
  [key: string]: number | string | boolean;
};
export interface Downlink {
  port: number;
  payload: string;
  // allow additional properties passed as settings.downlinkOptions.additional
  [key: string]: number | string | boolean;
}
export interface DeviceSetup {
  valid: boolean;
  downlinks: Downlink[];
}
export interface Device {
  [devEUI: string]: DeviceSetup;
}
export interface Group {
  [group: string]: Device;
}
export type Groups = Group & { _groupless: Device };
export interface Server {
  [server: string]: Groups;
}
export type OutputJson = Server & { _serverless: Groups };

// * settings interfaces

export interface InputSettings {
  filepath: string;
  sheetName: string;
  skipRows: number;
}
export interface OutputSettings {
  filepath: string;
  indent: number;
}
export interface ErrorHandlingSettings {
  continueOnInvalidDevEUI: boolean;
  continueOnMissingDevEUI: boolean;
  continueOnUnexpectedError: boolean;
}
export interface DownlinkOptions {
  payloadDataType: PayloadDataType;
  minimalSamplePeriod: number;
  compressedDownlinkOption: CompressedDownlinkOption;
  additional?: AdditionalDownlinkData;
}
export interface Settings {
  input: InputSettings;
  output: OutputSettings;
  errorHandling: ErrorHandlingSettings;
  downlinkOptions: DownlinkOptions;
}
