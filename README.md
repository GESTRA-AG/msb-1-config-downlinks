# Multisense Bolt 1 / Ecobolt 1 - Configuration Downlinks Generator

The ecoBolt is a continuous steam trap monitor and this repository contains JavaScript/TypeScript to generate configurational downlinks for those devices. The input can be a JSON or Excel workbook (.xslx file) and the output will be JSON as this is used by most LoRa network servers (LSN).

**Table of Contents**

- [Multisense Bolt 1 / Ecobolt 1 - Configuration Downlinks Generator](#multisense-bolt-1--ecobolt-1---configuration-downlinks-generator)
  - [1. Get started](#1-get-started)
  - [2. Format and I/O structure](#2-format-and-io-structure)
  - [3. Settings](#3-settings)
    - [3.1 Input file settings](#31-input-file-settings)
    - [3.2 Output file settings](#32-output-file-settings)
    - [3.3 Error handling](#33-error-handling)
      - [3.3.1 continueOnMissingDevEUI](#331-continueonmissingdeveui)
      - [3.3.2 continueOnInvalidDevEUI](#332-continueoninvaliddeveui)
      - [3.3.3 continueOnUnexpectedError](#333-continueonunexpectederror)
    - [3.4 Downlink options](#34-downlink-options)
      - [3.4.1 payloadDataType](#341-payloaddatatype)
      - [3.4.2 minimalSamplePeriod](#342-minimalsampleperiod)
      - [3.4.3 compressedDownlinkOption](#343-compresseddownlinkoption)
      - [3.4.4 additional](#344-additional)
  - [4. Repository files and directories](#4-repository-files-and-directories)
    - [4.1 src/](#41-src)
    - [4.2 dist/](#42-dist)
    - [4.3 Params.xlsx](#43-paramsxlsx)
    - [4.4 InputExample.xlsx](#44-inputexamplexlsx)
    - [4.5 InputTemplate.xlsx](#45-inputtemplatexlsx)
    - [4.6 LICENSE](#46-license)
    - [4.7 README.mc](#47-readmemc)
    - [4.8 Development files and directories](#48-development-files-and-directories)
  - [5. Bug report and feature suggestion](#5-bug-report-and-feature-suggestion)

## 1. Get started

The package object-to-arguments@npm:0.0.8 does to support **plugnplay** that comes with yarn >= v2. So, we need to use legacy **node_modules** directory (therefore is _{nodeLinker: node-modules}_ in _.yarnrc.yml_) ...

If you're using the [_`npm`_](https://www.npmjs.com/) package manager
instead of the suggested [_`yarn`_](https://yarnpkg.com/), the local environment can be initiated with

```sh
npm i
```

while you are in the root directory with the _package.json_ file. Exchange any further _yarn_ command prefix with _npm_, if you're using _npm_ respectively.

1. Initiate local environment and install required dependencies
   ```sh
   yarn
   ```
2. Copy the empty _InputTemplate.xlsx_ to _input.xlsx_ (default input filename) and fill your entires.
3. Adjust input and output file settings, regional LoRa restrictions etc. in _./src/settings.ts_ as described in the [_Settings_ section](#3-settings).
4. Compile TypeScript to JavaScript
   ```sh
   yarn build
   ```
5. Run the compiled file (by default bundeled into _./dist/main.js_) with
   ```sh
   yarn start
   ```

## 2. Format and I/O structure

The hirarchy is as follows

1. server (server reference/address/hostname or _\_serverless_ if none present)
2. group (group tag or _\_groupless_ if none present)
3. devEUI (this handling is explained in [_Settings_ section](#3-settings))
4. List with device configuration downlinks (see Downlink[] interface in types.ts)

Those rows which have _server_ entered will be grouped by the server field first. The same workaround applies to the custom _group_ column which will result in the nested 2nd level key-value pairs. If no server or group has been specified, it will be grouped under _\_serverless_ and _\_groupless_ keywords. This repository has a _./InputExample.xlsx_ file which covers all possible groupings:

|                         server | group | devEUI           | ... |
| -----------------------------: | :---- | :--------------- | --- |
| eu1.cloud.thethings.industries | A     | AAAAAAAAAAAAAAAA | ... |
| eu1.cloud.thethings.industries | A     | BBBBBBBBBBBBBBBB | ... |
|                                | A     | CCCCCCCCCCCCCCCC | ... |
|                                | A     | DDDDDDDDDDDDDDDD | ... |
|                                |       | EEEEEEEEEEEEEEEE | ... |
|                                |       | FFFFFFFFFFFFFFFF | ... |
|                            ... | ...   | ...              | ... |

Tab. 1: Partial example of some _InputExample.xlsx_ (_Input_ sheet) entries

The upper tabular example input results in:

```JSON
{
    "eu1.cloud.thethings.industries": {
        "A": {
            "AAAAAAAAAAAAAAAA": {
                "valid": true,
                "downlinks": [
                    {
                        "port": 145,
                        "payload": "9118dc0a3c0a4b0f5a1406680c6702d0"
                    },
                    {
                        "port": 2,
                        "payload": "04fc"
                    },
                    {
                        "port": 2,
                        "payload": "01000e10"
                    }
                ]
            },
            "BBBBBBBBBBBBBBBB": {
                "valid": true,
                "downlinks": [
                    {
                        "port": 145,
                        "payload": "9118bc063c0f4612501406680c6702d0"
                    },
                    {
                        "port": 2,
                        "payload": "04fc"
                    },
                    {
                        "port": 2,
                        "payload": "01000e10"
                    }
                ]
            }
        }
    },
    "_serverless": {
        "A": {
            "CCCCCCCCCCCCCCCC": {
                "valid": false,
                "downlinks": []
            },
            "DDDDDDDDDDDDDDDD": {
                "valid": true,
                "downlinks": [
                    {
                        "port": 145,
                        "payload": "9110af030e081409190a06680c6702d0"
                    },
                    {
                        "port": 2,
                        "payload": "01000e10"
                    }
                ]
            }
        },
        "_groupless": {
            "EEEEEEEEEEEEEEEE": {
                "valid": false,
                "downlinks": []
            },
            "FFFFFFFFFFFFFFFF": {
                "valid": true,
                "downlinks": [
                    {
                        "port": 145,
                        "payload": "9111a50a19023503500506680c6702d0"
                    },
                    {
                        "port": 2,
                        "payload": "01000e10"
                    }
                ]
            },
            ...
```

Snippet 1: Example conversion output corresponding to Tab. 1

## 3. Settings

There are defaults set which can be adjusted in the _./src/settings.ts_

### 3.1 Input file settings

- If you are not using the _InputTemplate.xslx_ for your input, you can adjust the Excel sheet name and the filepath of the input file (which needs to be set anyway).
- _skipRows_ tells how many rows are leading (with comments and header) before the actuall data input begins. This is necessary for the Excel-to-JSON converter.

```TypeScript
const input: InputSettings = {
  filepath: "./input.xlsx",
  sheetName: "Input",
  skipRows: 1,
} as const;
```

### 3.2 Output file settings

The output settings just include the output filepath and the indentation size (how many whitespaces should be used to indent key-value pairs) in the output JSON.

```TypeScript
const output: OutputSettings = {
  filepath: "./output.json",
  indent: 4,
} as const;
```

### 3.3 Error handling

```TypeScript
const errorHandling: ErrorHandlingSettings = {
  continueOnInvalidDevEUI: true,
  continueOnMissingDevEUI: true,
  continueOnUnexpectedError: false,
} as const;
```

#### 3.3.1 continueOnMissingDevEUI

This boolean constants sets if an error should be thrown directly or just continue processing after exchanging the missing DevEUI with `#` + row index.

#### 3.3.2 continueOnInvalidDevEUI

Invalid DevEUIs (e.g. G1..., hex EUI can only contain 0-9 digits and A-Z lower and upper case ascii letters) will be marked / prefixed with `!` symbol.

#### 3.3.3 continueOnUnexpectedError

Whenever to continue after an unexpected error occours. Not recommended.

### 3.4 Downlink options

```TypeScript
const downlinkOptions: DownlinkOptions = {
  payloadDataType: "HexString",
  minimalSamplePeriod: Math.ceil(1.4828 / 0.01), // 11 bytes, SF12, 125 kHz bw
  compressedDownlinkOption: 2,
  additional: {},
} as const;
```

#### 3.4.1 payloadDataType

Sets the ouput (downlink payload) data type to one of

1. Raw data bytes as Uint8Array **(Not implemented yet!)**
2. Hexadecimal string (0-9 digits, lower and upper case A-Z) **(default)**
3. Base64 converted string **(Not implemented yet!)**

#### 3.4.2 minimalSamplePeriod

This sets the minimal sample period can be used. Please respect the rigional LoRaWAN restrictions like duty cycle / air time. The default is set to a the miminal sample period for EU868.  
The [LoRaWAN airtime calculator of the things network (TTN)](https://www.thethingsnetwork.org/airtime-calculator) can be used to determine the correct value for your local frequency channel plan.

#### 3.4.3 compressedDownlinkOption

_This description is in development ..._

The default set _compressedDownlinkOption_ (value 2) conforms with the regional restrictions in US, EU and CN regions. For other regions the compliance needs to be verified.

#### 3.4.4 additional

Here you can insert a JSON which will be unpacked and nested in the ouput file. For example, if you need to add _confirm: true_ key-value pair to every downlink (which by default has only _port_ and _payload_ key-value pairs), you can set _additional to _{confirm: true}* and all the output downlink objects will include those *additional\* content.

```JSON
{
  port: ...,
  payload: ...,
  confirm: true
}
```

## 4. Repository files and directories

### 4.1 src/

The _./src_ folder contains source code as TypeScript which is split over multiple files.

### 4.2 dist/

The _./dist_ folder contains the compiled and bundeled JavaScript file(s). Use the

```sh
yarn build
```

command to format, compile and bundle the TypeScript source code into JavaScript file(s).

The compiled file will be _./dist/main.js_ by default, which can be executed without moving or specifying path with

```sh
yarn start
```

or

```sh
npm run start
```

in case of using _`npm`_ instead of _`yarn`_ as a package manager.

### 4.3 Params.xlsx

This Excel (.xslx) workbook contains two entirely protected sheets _ConfigTable_ and _ptMap_ (hidden) and is being used as a configuration storage file.

The sheet _ConfigTable_ contains configuration decission parameters and corresponfing configuration values _$k_n$_. In addition this excel workbook contains a hidden sheet _ptMap_ with mapped pressure and temperature values.

**Please do not adjust this file.**

This Excel (.xlsx) sheets can be converted to JSON files with following commands:

```sh
yarn convert-ConfigTable
yarn convert-ptMap
```

The entire Excel (.xlsx) workbook with both sheets can be converted into one single JSON file with

```sh
yarn convert-Params
```

The output format will be e.g.

```JSON
{
  "ConfTable": [
    {
      "index": number,
      "trapType": string,
      "mountType": string,
      "hardwareVersion": "MSBA-1.0" | "MSBA-1.2",
      "pMin": number,
      "pMax": number,
      "condensateLoad": string,
      "k1": number,
      "k2": number,
      "k3": number,
      "k4": number,
      "k5": number,
      "k6": number,
      "k7": number,
      "k8": number
    },
    {
      ...
    }
  ],
  "ptMap": [
    {
      "P [bar]": number,
      "P [psog]": number,
      "T [K]": number,
      "T [C]": number,
      "T [F]": number
    },
    {
      ...
    }
  ]
}
```

Snippet 2: Example conversion output corresponding to Tab. 1

For more information see command definitions in _scripts_ section in the _package.json_ file and [the _convert-excel-to-json_ package documentation](https://www.npmjs.com/package/convert-excel-to-json). If [_npm_](https://www.npmjs.com/) package manager is being used instead of [_yarn_](https://yarnpkg.com/), exchange the _`yarn`_ command prefix with _`npm run`_ (e.g. _npm run convert-Params_ instad of _yarn convert-Params_).

### 4.4 InputExample.xlsx

This file is an example input which was shown in [_Format and IO structure_ section](#2-format-and-io-structure). This can be initialy used for a test run (set the _input.filepath_ in the _./src/settings.ts_ to _InputExample.xlsx_) before executing _`yarn build`_ and running the JavaScript (_`yarn start`_).

### 4.5 InputTemplate.xlsx

This file is an empty version of the _InputExample.xlsx_ file, which can be used for custom user input.

### 4.6 LICENSE

This file contains license information (MIT license).

### 4.7 README.mc

The _README.md_ is the repositorys read-me file (which results in this text being rendered in GitHub).

### 4.8 Development files and directories

The files and directories listed below can be ignored as those are required for development, formatting, linting etc. and are mostly managed automatically by _git_, _yarn_ and other plugins.

- .git/
- .yarn/
- node_modules/
- .editorconfig
- .gitattributes
- .gitignore
- .prettierignore
- .prettierrc
- .yarnrc.yml
- tsconfig.json
- webpack.config.js
- yarn-error.log
- yarn.lock

## 5. Bug report and feature suggestion

For bug reports and feature suggestions please use the [issue board of this repository](https://github.com/GESTRA-AG/msb-1-config-downlinks/issues).
