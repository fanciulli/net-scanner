import { promisify } from "node:util";
import childProcess from "node:child_process";
import { parseStringPromise as xmlParse } from "xml2js";
import { readFile, unlink } from "node:fs/promises";

const executeShell = promisify(childProcess.exec);

const FILE_SCAN = "scan.xml";
const NA = "N/A";

class nmapScanner {
  async scan(host) {
    await executeShell(`sudo nmap -sn -oX ${FILE_SCAN} ${host}`);
    return await this.#collectInfo();
  }

  async #collectInfo() {
    const xml = await readFile(FILE_SCAN);
    const xmlAsObj = await xmlParse(xml);
    await unlink(FILE_SCAN);

    if (xmlAsObj.nmaprun?.host) {
      const host = xmlAsObj.nmaprun.host[0];
      const hostStatus = host.status[0].$.state;

      const addresses = host.address;

      const ipv4AddressSection = addresses?.find(
        (address) => address.$.addrtype == "ipv4"
      );
      const ipv4Address = ipv4AddressSection ? ipv4AddressSection.$.addr : NA;

      const macAddressSection = addresses?.find(
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
}

export { nmapScanner as scannerPlugin };
