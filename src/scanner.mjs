import { Configuration } from "./configuration.mjs";
import { initLogger, info } from "./logging.mjs";
import { parseStringPromise as xmlParse } from "xml2js";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import childProcess from "node:child_process";
import { Netmask } from "netmask";
import { getHost, storeHost, updateHost } from "./database.mjs";

const executeShell = promisify(childProcess.exec);

const NA = "N/A";

async function scanTarget(target) {
  await executeShell("sudo nmap -sn -oX scan.xml " + target);
}

async function collectTargetInfo() {
  const xml = await readFile("scan.xml");
  const xmlAsObj = await xmlParse(xml);

  if (xmlAsObj.nmaprun?.host) {
    const host = xmlAsObj.nmaprun.host[0];
    const hostStatus = host.status[0].$.state;

    const addresses = host.address;

    const ipv4AddressSection = addresses.find(
      (address) => address.$.addrtype == "ipv4"
    );
    const ipv4Address = ipv4AddressSection ? ipv4AddressSection.$.addr : NA;

    const macAddressSection = addresses.find(
      (address) => address.$.addrtype == "mac"
    );
    const macAddress = macAddressSection ? macAddressSection.$.addr : NA;
    const vendor = macAddressSection ? macAddressSection.$.vendor : NA;

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

function isSameHost(targetInfo, result) {
  let address = targetInfo.address ? targetInfo.address : NA;
  let vendor = targetInfo.vendor ? targetInfo.vendor : NA;

  result["ip"] == address && result["vendor"] == vendor;
}

async function analyseTargetInfo(config, targetInfo) {
  const message =
    "------------------------------------\n" +
    `IP Address: ${targetInfo.address}\n` +
    `MAC Address: ${targetInfo.mac}\n` +
    `Vendor: ${targetInfo.vendor}\n` +
    `Status: ${targetInfo.status}\n` +
    "------------------------------------";

  const result = getHost(targetInfo.mac);
  if (result) {
    if (isSameHost(targetInfo, result)) {
      targetInfo.known = true;

      if (config.isKnownDevicesReportEnabled()) {
        info(`Host with MAC Address: ${targetInfo.mac} is known`);
      }
    } else {
      updateHost(targetInfo.mac, targetInfo.address, targetInfo.vendor);
      targetInfo.updated = true;

      if (config.isUpdatedDevicesReportEnabled()) {
        info(`Host with MAC Address: ${targetInfo.mac} is updated`);
        info(message);
      }
    }
  } else {
    storeHost(targetInfo.mac, targetInfo.address, targetInfo.vendor);

    if (config.isNewDevicesReportEnabled()) {
      info(message);
    }
  }
}

async function scanHost(config, host) {
  await scanTarget(host);
  const targetInfo = await collectTargetInfo();
  if (targetInfo) {
    await analyseTargetInfo(config, targetInfo);
    await saveTargetInfo(targetInfo);
    return targetInfo;
  } else {
    return undefined;
  }
}

/**
 * Generate a report based on the device scan report
 */
async function generateReport(scanResults) {
  let report = scanResults
    .filter((report) => report !== undefined)
    .reduce(
      (accumulator, report) => {
        accumulator.total += 1;
        if (report.known) {
          accumulator.known += 1;
        } else if (report.updated) {
          accumulator.updated += 1;
        }

        return accumulator;
      },
      {
        known: 0,
        updated: 0,
        total: 0,
      }
    );

  const message =
    "------------------------------------\n" +
    `Known: ${report.known}\n` +
    `Updated: ${report.updated}\n` +
    `Total: ${report.total}\n` +
    "------------------------------------";

  info(message);
}

async function scan(configFile) {
  let config = new Configuration();
  await config.load(configFile);

  initLogger(config);

  let scanResults = [];
  let ips = [];

  if (config.isTargetNetwork()) {
    const networkWithMask = `${config.target}/${config.netmask}`;

    if (config.isStartStopScanReportEnabled()) {
      info(`Scanning network ${networkWithMask}`);
    }

    const netmask = new Netmask(networkWithMask);

    netmask.forEach((ip) => {
      ips.push(ip);
    });
  } else {
    if (config.isStartStopScanReportEnabled()) {
      info(`Scanning host ${config.target}`);
    }

    ips.push(config.target);
  }

  for (const ip of ips) {
    let report = await scanHost(config, ip);
    scanResults.push(report);
  }

  if (config.isScanReportEnabled()) {
    await generateReport(scanResults);
  }
}

export { scan };
