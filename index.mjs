import { printHeader } from "./src/misc.mjs";
import { Command } from "commander";
import { scan } from "./src/scanner.mjs";

const program = new Command();

program
  .name("net-scanner")
  .description("Scan a network for the connected devices")
  .requiredOption("-c, --config [path]", "Path to configuration file")
  .showHelpAfterError()
  .parse(process.argv);
const options = program.opts();

async function execute() {
  await printHeader();

  await scan(options.config);
}

execute();
