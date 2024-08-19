"use strict"

import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import * as mysql from "mysql2/promise";

export class Exporter {
    constructor(
        private readonly outputDir: string,
        private readonly config: mysql.ConnectionOptions,
    ) {
    }

    async exportTable(
        conn: mysql.Connection,
        outputPath: string,
        tableName: string,
    ): Promise<boolean> {
        const out = fs.createWriteStream(outputPath, {
            encoding: "utf-8",
            flags: "w",
            highWaterMark: 100_000,
        });
        try {
            process.stdout.write(`Exporting ${tableName}:`);
            const [rows] = await conn.query("SELECT * FROM " + tableName);
            let count = 0;
            for (const row of rows as mysql.RowDataPacket[]) {
                const error = await new Promise((resolve) => {
                    out.write(JSON.stringify(row) + "\n", resolve);
                });
                if (error) {
                    // wait draining
                    await new Promise((resolve) => out.on("drain", resolve));
                }

                count++;
            }

            process.stdout.write(` ${count} records\n`);
            return true;
        } catch (error) {
            process.stderr.write(`${error}\n`);
            return false;
        } finally {
            out.end();
        }
    }

    async run(tables: string[]): Promise<boolean> {
        let failed = 0;
        const conn = await mysql.createConnection(this.config);
        for (const tableName of tables) {
            const result = await this.exportTable(
                conn,
                path.resolve(this.outputDir, `${tableName}.jsonl`),
                tableName,
            );
            if (!result) {
                failed++;
            }
        }
        await conn.end();
        return failed == 0;
    }
}
