import { Configuration } from "./configuration.mjs";
import { initLogger, info } from "./logging.mjs";
import { Netmask } from "netmask";
import { getHost, storeHost, updateHost } from "./database.mjs";

const NA = "N/A";

class Scanner {
  async scan(configFile) {
    let config = new Configuration();
    await config.load(configFile);

    await this.#init(config);

    let scanResults = [];
    let ips = [];

    if (config.isTargetNetwork()) {
      const networkWithMask = `${config.target}/${config.netmask}`;

      if (config.reportStartScan()) {
        info(`Scanning network ${networkWithMask}`);
      }

      const netmask = new Netmask(networkWithMask);

      netmask.forEach((ip) => {
        ips.push(ip);
      });
    } else {
      if (config.reportStartScan()) {
        info(`Scanning host ${config.target}`);
      }

      ips.push(config.target);
    }

    for (const ip of ips) {
      let report = await this.#scanHost(config, ip);
      scanResults.push(report);
    }

    if (config.reportScanCompleted()) {
      await this.#generateReport(scanResults);
    }
  }

  async #init(config) {
    initLogger(config);

    if (this.scanner === undefined) {
      const { scannerPlugin } = await import(
        "./plugins/scanners/nmapScanner.mjs"
      );
      this.scanner = new scannerPlugin();
    }
  }

  async #analyseTargetInfo(config, targetInfo) {
    if (targetInfo.mac === undefined) {
      return;
    }

    const message =
      "------------------------------------\n" +
      `IP Address: ${targetInfo.address}\n` +
      `MAC Address: ${targetInfo.mac}\n` +
      `Vendor: ${targetInfo.vendor}\n` +
      `Status: ${targetInfo.status}\n` +
      "------------------------------------";

    const result = getHost(targetInfo.mac);
    if (result) {
      let address = targetInfo.address ? targetInfo.address : NA;
      let vendor = targetInfo.vendor ? targetInfo.vendor : NA;

      if (result["ip"] == address && result["vendor"] == vendor) {
        targetInfo.known = true;

        if (config.reportKnownDevices()) {
          info(`Host with MAC Address: ${targetInfo.mac} is known`);
        }
      } else {
        updateHost(targetInfo.mac, targetInfo.address, targetInfo.vendor);
        targetInfo.updated = true;

        if (config.reportUpdatedDevices()) {
          info(`Host with MAC Address: ${targetInfo.mac} is updated`);
          info(message);
        }
      }
    } else {
      storeHost(targetInfo.mac, targetInfo.address, targetInfo.vendor);

      if (config.reportNewDevices()) {
        info(message);
      }
    }
  }

  async #scanHost(config, host) {
    const targetInfo = await this.scanner.scan(host);
    if (targetInfo) {
      await this.#analyseTargetInfo(config, targetInfo);
      return targetInfo;
    } else {
      return undefined;
    }
  }

  /**
   * Generate a report based on the device scan report
   */
  async #generateReport(scanResults) {
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
}

export { Scanner };
