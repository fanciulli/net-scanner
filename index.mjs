import { access, readFile, writeFile } from "node:fs/promises";
import { rmSync } from "node:fs";
import { Command } from "commander";
import { Scanner } from "./src/scanner.mjs";
import process from "node:process";

const LOCK_FILE = ".lock";

const program = new Command();

program
  .name("net-scanner")
  .description("Scan a network for the connected devices")
  .requiredOption("-c, --config [path]", "Path to configuration file")
  .showHelpAfterError()
  .parse(process.argv);
const options = program.opts();

process.on("exit", () => {
  rmSync(LOCK_FILE, { force: true });
});

async function execute() {
  try {
    await access(LOCK_FILE);
    console.log("Another instance of the application is running. Exiting...");
  } catch {
    await writeFile(LOCK_FILE, "LOCK");

    const header = await readFile("./res/header.txt", "utf-8");
    console.log(header);
    console.log();
    console.log(
      "Application output may be redirected to other transports. Please check configuration file."
    );

    const scanner = new Scanner();
    await scanner.scan(options.config);
  }
}

execute();
