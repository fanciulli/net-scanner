import { Netmask } from "netmask";

async function scan(network) {
  console.log(`Scanning network ${network}`);
  console.log("");

  var block = new Netmask(network);
  block.forEach(function (ip) {
    // TODO: Move this to a proper destination
    let regex = new RegExp("^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$");
    if (regex.test(ip)) {
      console.log(`Scanning IP address ${ip}`);
    }
  });
}

export { scan };
