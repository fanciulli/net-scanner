import { printHeader } from "./misc.mjs";
import { Command } from "commander";
import { Netmask } from "netmask";
import { Scanner } from "./scanner.mjs";

const program = new Command();

program
  .name("net-scanner")
  .description("Scan a network for the connected devices")
  .requiredOption("-n, --network [netmask]", "Network to scan for devices")
  .showHelpAfterError()
  .parse(process.argv);
const options = program.opts();

printHeader();
console.log(`Scanning network ${options.network}`);
console.log("");

var block = new Netmask(options.network);
block.forEach((ip, long, index) => {
  console.log(`Scanning IP address ${ip}`);
});
