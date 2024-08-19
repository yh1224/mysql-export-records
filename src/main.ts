"use strict"

import * as fs from "node:fs";
import * as process from "node:process";
import * as readline from "node:readline";
import {ArgumentParser} from "argparse";
import * as mysql from "mysql2/promise";
import {Exporter} from "./mysql";

export class MysqlExportRecords {
    async run(): Promise<void> {
        const parser = new ArgumentParser({prog: "mysql-export-records"});

        parser.add_argument("-o", "--out", {required: true, help: "output directory"});
        parser.add_argument("--host", {default: "localhost", help: "hostname"});
        parser.add_argument("--port", {default: 3306, help: "port"});
        parser.add_argument("--ca", {help: "CA certificates to trust"});
        parser.add_argument("--username", {required: true, help: "username"});
        parser.add_argument("--database", {required: true, help: "database name"});
        parser.add_argument("tables", {metavar: "TABLE", nargs: "+", help: "table name"});
        parser.set_defaults({
            func: async (args: any): Promise<boolean> => {
                return this.runExport(args.out, args.host, args.port, args.ca, args.username, args.database, args.tables);
            },
        });

        const args = parser.parse_args();
        if (args.func) {
            const result = await args.func(args);
            process.exit(result ? 0 : 1);
        } else {
            parser.print_usage();
        }
    }

    private async runExport(
        outputDir: string,
        host: string,
        port: string,
        ca: string | undefined,
        username: string,
        database: string,
        tables: string[],
    ): Promise<boolean> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const password = (await new Promise((resolve) => {
            rl.question("Enter password: ", resolve);
        })) as string;

        const options: mysql.ConnectionOptions = {
            host,
            port: Number.parseInt(port),
            user: username,
            password,
            database,
            dateStrings: true,
        };
        if (ca) {
            options["ssl"] = {
                ca: fs.readFileSync(ca).toString(),
            };
        }
        return new Exporter(outputDir, options).run(tables);
    }
}
