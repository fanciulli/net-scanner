import { describe, test, after } from "mocha";
import child_process from "node:child_process";
import sinon from "sinon";
import "chai/register-should.js";

import { readFile, cp } from "fs/promises";
import { copyConfigurationFile, deleteConfigurationFile } from "./utils.mjs";

const execStub = sinon
  .stub(child_process, "exec")
  .onCall(0)
  .callsFake((command, callback) => {
    command.should.be.equal("sudo nmap -sn -oX scan.xml 192.168.0.2");
    cp("test/resources/nmap.192.168.0.2.xml", "scan.xml").then(() =>
      callback()
    );
  })
  .onCall(1)
  .callsFake((command, callback) => {
    command.should.be.equal("sudo nmap -sn -oX scan.xml 192.168.0.3");
    cp("test/resources/nmap.192.168.0.3.xml", "scan.xml").then(() =>
      callback()
    );
  })
  .onCall(2)
  .callsFake((command, callback) => {
    command.should.be.equal("sudo nmap -sn -oX scan.xml 192.168.0.2");
    cp("test/resources/nmap.empty.xml", "scan.xml").then(() => callback());
  })
  .onCall(3)
  .callsFake((command, callback) => {
    command.should.be.equal("sudo nmap -sn -oX scan.xml 192.168.0.2");
    cp("test/resources/nmap.invalid.xml", "scan.xml").then(() => callback());
  });

execStub.callsFake((command, callback) => {
  command.should.have.string("sudo nmap -sn -oX scan.xml 192.168.0.");
  cp("test/resources/nmap.192.168.0.2.xml", "scan.xml").then(() => callback());
});

const { scan } = await import("../src/scanner.mjs");

describe("Scanner", async () => {
  after(function restore() {
    execStub.restore();
  });

  describe("scan()", () => {
    test("Scans a host target", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan.json",
        "/tmp/config1.json"
      );

      await scan("/tmp/config1.json");

      const targetInfoString = await readFile("targetInfo.json");
      const targetInfo = JSON.parse(targetInfoString);

      targetInfo.status.should.equal("up");
      targetInfo.address.should.equal("192.168.0.2");
      targetInfo.mac.should.equal("00:11:22:33:44:55");
      targetInfo.vendor.should.equal("My Vendor");

      await deleteConfigurationFile("/tmp/config1.json");
    });

    test("Scans a host target that changed IP and Vendor", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan2.json",
        "/tmp/config2.json"
      );

      await scan("/tmp/config2.json");

      const targetInfoString = await readFile("targetInfo.json");
      const targetInfo = JSON.parse(targetInfoString);

      targetInfo.status.should.equal("up");
      targetInfo.address.should.equal("192.168.0.3");
      targetInfo.mac.should.equal("00:11:22:33:44:55");
      targetInfo.vendor.should.equal("Another Vendor");

      await deleteConfigurationFile("/tmp/config2.json");
    });

    test("Scans a host target but nothing is found", async () => {
      await deleteConfigurationFile("targetInfo.json");
      await copyConfigurationFile(
        "./test/resources/test-config-scan.json",
        "/tmp/no-target-config.json"
      );

      await scan("/tmp/no-target-config.json");

      try {
        await readFile("targetInfo.json");
      } catch (error) {
        error.code.should.equal("ENOENT");
        error.path.should.include("targetInfo.json");
      }

      await deleteConfigurationFile("/tmp/no-target-config.json");
    });

    test("nmap creates an invalid output file", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan.json",
        "/tmp/no-target-config.json"
      );

      try {
        await scan("/tmp/no-target-config.json");
      } catch (error) {
        error.message.should.have.string("Attribute without value");
      }

      await deleteConfigurationFile("/tmp/no-target-config.json");
    });

    test("Scans a network", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan-network.json",
        "/tmp/network-config.json"
      );

      await scan("/tmp/network-config.json");

      await deleteConfigurationFile("/tmp/network-config.json");
    });
  });
});
