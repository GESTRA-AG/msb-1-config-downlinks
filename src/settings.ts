import {
  DownlinkOptions,
  ErrorHandlingSettings,
  InputSettings,
  OutputSettings,
  Settings,
} from "./types";

// * input file & sheet name

const input: InputSettings = {
  filepath: "./input.xlsx",
  sheetName: "Input",
  skipRows: 1,
} as const;

const output: OutputSettings = {
  filepath: "./output.json",
  indent: 4,
} as const;

// * error handling

const errorHandling: ErrorHandlingSettings = {
  // if "continueOnInvalidDevEUI" is set to true, DevEUI will be prefixed
  // with `!` => `!${DevEUI}` => e.g. `!A0...
  continueOnInvalidDevEUI: true,
  // if "continueOMissingDevEUI" is set to true, DevEUI will be prefixed
  // with `#${ExcelSheetRowIndex}` => `#1`, `#2`, `#3`, ...
  continueOnMissingDevEUI: true,
  continueOnUnexpectedError: false,
} as const;

// * regional (frequency channel plan) limits and constants

const downlinkOptions: DownlinkOptions = {
  payloadDataType: "HexString",
  // (D = A / T): (duty cycle = air time / sample period)
  minimalSamplePeriod: Math.ceil(1.4828 / 0.01), // 11 bytes, SF12, 125 kHz bw
  compressedDownlinkOption: 2,
  additional: {}, // put additional key-value pair
} as const;

// * combined settings object

export const settings: Settings = {
  input,
  output,
  errorHandling,
  downlinkOptions,
} as const;
