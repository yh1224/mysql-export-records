#!/usr/bin/env node
"use strict"

import process from "node:process";
import {MysqlExportRecords} from "./main";

process.on("uncaughtException", (error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
});
process.on("unhandledRejection", (error) => {
    const message = typeof error === "string" ? error : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
});

void new MysqlExportRecords().run();
