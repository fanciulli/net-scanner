import { Configuration } from "./configuration.mjs";
import { info, error } from "./logging.mjs";
import { promisify } from "node:util";
import child_process from "node:child_process";
const exec = promisify(child_process.exec);

async function scanTarget(target) {
  info(`Scanning host ${target}`);

  const { stdout, stderr } = await exec("nmap -A -oX scan.xml " + target);
  info(stdout);
  error(stderr);
}

async function scan(configFile) {
  let config = new Configuration();
  await config.load(configFile);

  if (config.target) {
    await scanTarget(config.target);
  } else {
    throw Error("Nothing to do");
  }
}

export { scan };
