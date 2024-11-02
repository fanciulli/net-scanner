import { Netmask } from "netmask";

export class Scanner {
  constructor(network) {
    this._network = network;
  }

  async scan() {
    console.log(`Scanning network ${this._network}`);
    console.log("");

    var block = new Netmask(this._network);
    block.forEach((ip, long, index) => {
      console.log(`Scanning IP address ${ip}`);
    });
  }
}
