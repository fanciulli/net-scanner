import { describe, test, before, after } from "mocha";
import sinon from "sinon";
import "chai/register-should.js";
import { DatabaseSync } from "node:sqlite";
import { copyConfigurationFile, deleteConfigurationFile } from "./utils.mjs";

const database = new DatabaseSync("scan-db.sqlite");

let execStub;
let scanner;

describe("Scanner", async () => {
  function assertDBContent(expectedCount) {
    const preparedStmt = database.prepare(
      "SELECT COUNT(*) AS total FROM hosts"
    );
    const result = preparedStmt.all();
    result[0].total.should.equal(expectedCount);
  }

  before(async function setup() {
    database.exec("DELETE FROM hosts");

    const { scannerPlugin } = await import(
      "../src/plugins/scanners/nmapScanner.mjs"
    );
    execStub = sinon
      .stub(scannerPlugin.prototype, "scan")
      .onCall(0)
      .callsFake((host) => {
        host.should.equal("192.168.0.2");
        return {
          status: "up",
          address: "192.168.0.2",
          mac: "00:11:22:33:44:55",
          vendor: "My Vendor",
        };
      })
      .onCall(1)
      .callsFake((host) => {
        host.should.equal("192.168.0.3");
        return {
          status: "up",
          address: "192.168.0.3",
          mac: "00:11:22:33:44:55",
          vendor: "My Vendor 2",
        };
      })
      .onCall(2)
      .callsFake((host) => {
        host.should.equal("192.168.0.2");
        return {
          status: "down",
        };
      })
      .callsFake((host) => {
        const mac = "XX:XX:XX:XX:XX:XX".replace(/X/g, function () {
          return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16));
        });

        return {
          status: "up",
          address: host,
          mac: mac,
          vendor: "My Vendor",
        };
      });

    const { Scanner } = await import("../src/scanner.mjs");
    scanner = new Scanner();
  });

  after(function restore() {
    execStub.restore();
  });

  describe("scan()", () => {
    test("Scans a host target", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan.json",
        "/tmp/config1.json"
      );

      await scanner.scan("/tmp/config1.json");

      await deleteConfigurationFile("/tmp/config1.json");

      execStub.callCount.should.equal(1);

      assertDBContent(1);
    });

    test("Scans a host target that changed IP and Vendor", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan2.json",
        "/tmp/config2.json"
      );

      await scanner.scan("/tmp/config2.json");

      await deleteConfigurationFile("/tmp/config2.json");

      assertDBContent(1);
    });

    test("Scans a host target but nothing is found", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan.json",
        "/tmp/no-target-config.json"
      );

      await scanner.scan("/tmp/no-target-config.json");

      await deleteConfigurationFile("/tmp/no-target-config.json");

      assertDBContent(1);
    });

    test("Scans a network", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan-network.json",
        "/tmp/network-config.json"
      );

      await scanner.scan("/tmp/network-config.json");

      await deleteConfigurationFile("/tmp/network-config.json");

      assertDBContent(255);
    });
  });
});
