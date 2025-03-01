import { describe, test, before, after } from "mocha";
import { cp } from "fs/promises";
import child_process from "node:child_process";
import sinon from "sinon";
import { should as shouldFun } from "chai";

const should = shouldFun();

const HOST = "192.168.0.2";
const NA = "N/A";

let execStub;
let nmapScanner;

describe("nmapScanner", async () => {
  before(async function setup() {
    execStub = sinon
      .stub(child_process, "exec")
      .onCall(0)
      .callsFake((command, callback) => {
        command.should.be.equal(`sudo nmap -sn -oX scan.xml ${HOST}`);
        cp("test/resources/nmap.invalid.xml", "scan.xml").then(() =>
          callback()
        );
      })
      .onCall(1)
      .callsFake((command, callback) => {
        command.should.be.equal(`sudo nmap -sn -oX scan.xml ${HOST}`);
        cp("test/resources/nmap.empty.xml", "scan.xml").then(() => callback());
      })
      .onCall(2)
      .callsFake((command, callback) => {
        command.should.be.equal(`sudo nmap -sn -oX scan.xml ${HOST}`);
        cp("test/resources/nmap.192.168.0.2.noinfo.xml", "scan.xml").then(() =>
          callback()
        );
      })
      .onCall(3)
      .callsFake((command, callback) => {
        command.should.be.equal(`sudo nmap -sn -oX scan.xml ${HOST}`);
        cp("test/resources/nmap.192.168.0.2.xml", "scan.xml").then(() =>
          callback()
        );
      });

    const { scannerPlugin } = await import(
      "../../../src/plugins/scanners/nmapScanner.mjs"
    );
    nmapScanner = new scannerPlugin();
  });

  after(function restore() {
    execStub.restore();
  });

  test("hangs of XML file is not valid", async () => {
    try {
      await nmapScanner.scan(HOST);
    } catch (error) {
      error.message.should.have.string("Attribute without value");
    }
  });

  test("returns undefined if xml contains no host description", async () => {
    const info = await nmapScanner.scan(HOST);
    should.equal(info, undefined);
  });

  test("returns minimal host data", async () => {
    const info = await nmapScanner.scan(HOST);

    info.status.should.be.equal("up");
    info.address.should.be.equal(NA);
    info.mac.should.be.equal(NA);
    info.vendor.should.be.equal(NA);
  });

  test("returns host data", async () => {
    const info = await nmapScanner.scan(HOST);

    info.status.should.be.equal("up");
    info.address.should.be.equal(HOST);
    info.mac.should.be.equal("00:11:22:33:44:55");
    info.vendor.should.be.equal("My Vendor");
  });
});
