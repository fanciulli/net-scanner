import { Configuration } from "./configuration.mjs";
import { initLogger, info, error } from "./logging.mjs";
import { parseStringPromise as xmlParse } from "xml2js";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import { Netmask } from "netmask";
const executeShell = promisify(exec);

async function scanTarget(target) {
  await executeShell("nmap -sn -oX scan.xml " + target);
}

async function collectTargetInfo() {
  const xml = await readFile("scan.xml");
  const xmlAsObj = await xmlParse(xml);

  if (xmlAsObj.nmaprun.host) {
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
}

async function saveTargetInfo(targetInfo) {
  await writeFile("targetInfo.json", JSON.stringify(targetInfo));
}

async function analyseTargetInfo(targetInfo) {
  // Currently doing nothing, just printing out info

  const message =
    "------------------------------------\n" +
    `IP Address: ${targetInfo.address}\n` +
    `MAC Address: ${targetInfo.mac}\n` +
    `Vendor: ${targetInfo.vendor}\n` +
    `Status: ${targetInfo.status}\n` +
    "------------------------------------";

  info(message);
}

async function scanHost(host) {
  try {
    await scanTarget(host);
    const targetInfo = await collectTargetInfo();
    if (targetInfo) {
      await analyseTargetInfo(targetInfo);
      await saveTargetInfo(targetInfo);
    }
  } catch (ecc) {
    error(ecc);
  }
}

async function scan(configFile) {
  let config = new Configuration();
  await config.load(configFile);

  initLogger(config);

  if (config.isTargetNetwork()) {
    const networkWithMask = `${config.target}/${config.netmask}`;

    info(`Scanning network ${networkWithMask}`);
    const netmask = new Netmask(networkWithMask);

    var ips = [];
    netmask.forEach((ip) => {
      ips.push(ip);
    });

    for (const ip of ips) {
      await scanHost(ip);
    }
    info(`Done scanning network ${networkWithMask}`);
  } else {
    info("Scanning host");
    await scanHost(config.target);
  }
}

export { scan };
