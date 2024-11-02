import { printHeader } from "./misc.mjs";
import { Command } from "commander";
import { Scanner } from "./scanner.mjs";

const program = new Command();

program
  .name("net-scanner")
  .description("Scan a network for the connected devices")
  .requiredOption("-n, --network [netmask]", "Network to scan for devices")
  .showHelpAfterError()
  .parse(process.argv);
const options = program.opts();

execute();

async function execute() {
  await printHeader();

  let scanner = new Scanner(options.network);
  await scanner.scan();
}
