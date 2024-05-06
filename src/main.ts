import fs from "fs";
//
import excelToJson from "convert-excel-to-json";
//
import {
  devEUIPattern,
  Device,
  Groups,
  InputJson,
  OutputJson,
  Params,
} from "./types";
import { settings } from "./settings";
import { buildDownlinks, matchConfig } from "./functions";

console.log(`Starting with settings: ${JSON.stringify(settings, null, 4)}\n`);

// * import static parameter set (decission and output params)

export const params = excelToJson({
  sourceFile: "./Params.xlsx",
  sheets: [
    {
      name: "ConfigTable",
      header: {
        rows: 2,
      },
    },
    {
      name: "ptMap",
      header: {
        rows: 1,
      },
    },
  ],
  columnToKey: { "*": "{{columnHeader}}" },
}) as unknown as Params; // fix { [key: string]: any[]; } type

// * import user input as json

const input = excelToJson({
  sourceFile: settings.input.filepath,
  sheets: [
    {
      name: settings.input.sheetName,
      header: {
        rows: settings.input.skipRows,
      },
    },
    // {
    //   name: "Options",
    //   header: {
    //     rows: 2,
    //   },
    // },
  ],
  columnToKey: { "*": "{{columnHeader}}" },
}) as unknown as InputJson; // fix { [key: string]: any[]; } type

// * process user input (main loop)

let i = 0; // iteration counter
let ccnt = 0; // valid configuration counter
let fcnt = 0; // failed interation counter
let mdev = 0; // missing devEUI counter
let fdev = 0; // invalid devEUI counter
let failed: boolean; // flag for failed iteration
let errMsg: string; // error message
const output = {} as OutputJson;
for (const inputParams of input.Input) {
  i++;
  failed = false;
  const rowNum = i + settings.input.skipRows;
  try {
    // filter out server, group and devEUI and set to default if not present
    const server = inputParams.server
      ? inputParams.server.trim()
      : "_serverless";
    const group = inputParams.group ? inputParams.group.trim() : "_groupless";
    let device = inputParams.devEUI
      ? devEUIPattern.test(inputParams.devEUI.trim())
        ? inputParams.devEUI.trim()
        : false
      : undefined;
    if (device === false) {
      fdev++;
      if (!failed) fcnt++;
      failed = true;
      errMsg =
        `Invalid devEUI (must match RegEx-pattern: ${devEUIPattern}): ` +
        inputParams.devEUI;
      if (settings.errorHandling.continueOnInvalidDevEUI) {
        device = "_*_" + inputParams.devEUI.trim() + "_*_";
        console.log(
          errMsg +
            `, continuing with devEUI set to _*_${inputParams.devEUI}_*_`,
        );
      } else {
        throw new Error(errMsg);
      }
    } else if (device === undefined) {
      mdev++;
      if (!failed) fcnt++;
      failed = true;
      errMsg =
        "Missing devEUI in row " + rowNum + ", skipping and continuing ...";
      if (settings.errorHandling.continueOnMissingDevEUI) {
        console.log(errMsg);
        continue;
      } else {
        throw new Error(errMsg);
      }
    }
    if (!output[server]) {
      // add server key if not already present
      output[server] = {} as Groups;
    }
    if (!output[server][group]) {
      // add group key if not already present
      output[server][group] = {} as Device;
    }
    // main routine
    const configParams = matchConfig(inputParams, params.ConfigTable);
    if (configParams === undefined) {
      console.log(
        `No valid configuration possible for device ${inputParams.devEUI} ` +
          `in row ${rowNum}`,
      );
      output[server][group][device] = { valid: false, downlinks: [] };
    } else {
      ccnt++;
      output[server][group][device] = {
        valid: true,
        downlinks: buildDownlinks(inputParams, configParams),
      };
    }
  } catch (e) {
    if (!failed) fcnt++;
    errMsg = `Unexpected error in main loop (index: ${i}): ${e}`;
    if (settings.errorHandling.continueOnUnexpectedError) {
      console.log(errMsg);
      continue;
    } else {
      throw new Error(errMsg);
    }
  }
  // ! do not add code here
}

// * export downlinks output as json

fs.writeFileSync(
  settings.output.filepath,
  JSON.stringify(output, null, settings.output.indent),
);
console.log(`\nProcessed ${i - fcnt}/${i} successfully, ${fcnt} failed.`);
console.log(
  `There were ${mdev} missing devEUIs and ${fdev} invalid devEUIs ` +
    `of all (${fcnt}) failed rows.`,
);
console.log(
  "Done, exported generated configuration downlinks as " +
    settings.output.filepath,
);
