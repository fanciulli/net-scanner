import { readFile } from "node:fs/promises";
import { Command } from "commander";
import { scan } from "./src/scanner.mjs";
import { error } from "./src/logging.mjs";

const program = new Command();

program
  .name("net-scanner")
  .description("Scan a network for the connected devices")
  .requiredOption("-c, --config [path]", "Path to configuration file")
  .showHelpAfterError()
  .parse(process.argv);
const options = program.opts();

async function execute() {
  const header = await readFile("./res/header.txt", "utf-8");
  console.log(header);
  console.log();
  console.log(
    "Application output may be redirected to other transports. Please check configuration file."
  );

  try {
    await scan(options.config);
  } catch (err) {
    error(err.message);
  }
}

execute();
