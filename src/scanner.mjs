import { Configuration } from "./configuration.mjs";
import { info } from "./logging.mjs";
import { parseStringPromise as xmlParse } from "xml2js";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { exec } from "node:child_process";
const executeShell = promisify(exec);

async function scanTarget(target) {
  info(`Scanning host ${target}`);

  await executeShell("nmap -sn -oX scan.xml " + target);
}

async function collectTargetInfo() {
  const xml = await readFile("scan.xml");
  const xmlAsObj = await xmlParse(xml);

  const host = xmlAsObj.nmaprun.host[0];
  const hostStatus = host.status[0].$.state;

  const addresses = host.address;

  const ipv4AddressSection = addresses.find(
    (address) => address.$.addrtype == "ipv4"
  );
  const ipv4Address = ipv4AddressSection.$.addr;

  const macAddressSection = addresses.find(
    (address) => address.$.addrtype == "mac"
  );
  const macAddress = macAddressSection.$.addr;
  const vendor = macAddressSection.$.vendor;

  return {
    status: hostStatus,
    address: ipv4Address,
    mac: macAddress,
    vendor: vendor,
  };
}

async function saveTargetInfo(targetInfo) {
  await writeFile("targetInfo.json", JSON.stringify(targetInfo));
}

async function scan(configFile) {
  let config = new Configuration();
  await config.load(configFile);

  if (config.target) {
    await scanTarget(config.target);
    const targetInfo = await collectTargetInfo();
    await saveTargetInfo(targetInfo);
  } else {
    throw Error("Nothing to do");
  }
}

export { scan };
