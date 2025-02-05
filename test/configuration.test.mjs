import { describe, test } from "mocha";
import { should as shouldFun } from "chai";
const should = shouldFun();

import { Configuration } from "../src/configuration.mjs";
import {
  copyConfigurationFile,
  saveConfigurationFile,
  saveConfigurationJsonFile,
  deleteConfigurationFile,
} from "./utils.mjs";

const testConfigFilePath = "/tmp/config.json";
const config = new Configuration();

describe("Configuration", () => {
  describe("load()", () => {
    test("throws an Error if configuration file cannot be accessed", async () => {
      try {
        await config.load("/bin/missing_file");
      } catch (error) {
        error.code.should.be.equal("ENOENT");
        error.path.should.be.equal("/bin/missing_file");
      }
    });

    test("throws an Error if configuration file is not a JSON", async () => {
      try {
        const testConfigData = "FILE = /bin/sh";

        await saveConfigurationFile(testConfigFilePath, testConfigData);
        await config.load(testConfigFilePath);
      } catch (error) {
        error.message.should.include("is not valid JSON");
        should.equal(config.target, undefined);
        should.equal(config.netmask, undefined);
        config.isTargetNetwork().should.be.false;
      }
      await deleteConfigurationFile(testConfigFilePath);
    });

    test("throws an Error if configuration file is invalid (1)", async () => {
      try {
        const testConfigData = {
          target: "INVALID",
        };

        await saveConfigurationFile(
          testConfigFilePath,
          JSON.stringify(testConfigData)
        );
        await config.load(testConfigFilePath);
      } catch (error) {
        error.message.should.be.equal("Configuration is not valid");
        should.equal(config.target, undefined);
        should.equal(config.netmask, undefined);
        config.isTargetNetwork().should.be.false;
      }
      await deleteConfigurationFile(testConfigFilePath);
    });

    test("reads configuration from file", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan.json",
        testConfigFilePath
      );

      await config.load(testConfigFilePath);

      config.target.should.be.equal("192.168.0.2");
      should.equal(config.netmask, undefined);
      config.isTargetNetwork().should.be.false;
      config.logger.should.not.be.undefined;
      config.logger.should.have.property("transport", "console");

      await deleteConfigurationFile(testConfigFilePath);
    });

    test("reads configuration from file with Slack logger", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan-slack.json",
        testConfigFilePath
      );
      await config.load(testConfigFilePath);

      config.target.should.be.equal("192.168.0.2");
      should.equal(config.netmask, undefined);
      config.isTargetNetwork().should.be.false;
      config.logger.should.not.be.undefined;
      config.logger.should.have.property("transport", "slack");
      config.logger.should.have.property("level", "info");
      config.logger.should.have.property(
        "webhookUrl",
        "https://hooks.slack.com/services/xxx/xxx/xxx"
      );
      config.logger.should.have.property("channel", "#test-channel");
      config.logger.should.have.property("username", "webhookbot");
      config.logger.should.have.property("icon_emoji", ":ghost:");

      await deleteConfigurationFile(testConfigFilePath);
    });

    test("reads configuration from file without logger specified", async () => {
      const testConfigData = {
        target: "192.168.0.2",
      };

      await saveConfigurationJsonFile(testConfigFilePath, testConfigData);

      await config.load(testConfigFilePath);

      config.target.should.be.equal("192.168.0.2");
      should.equal(config.netmask, undefined);
      config.isTargetNetwork().should.be.false;
      config.logger.should.not.be.undefined;
      config.logger.should.have.property("transport", "console");

      await deleteConfigurationFile(testConfigFilePath);
    });

    test("reads configuration for a target network", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan-network.json",
        testConfigFilePath
      );

      await config.load(testConfigFilePath);

      config.target.should.be.equal("192.168.0.2");
      config.netmask.should.be.equal(24);
      config.isTargetNetwork().should.be.true;
      config.logger.should.not.be.undefined;
      config.logger.should.have.property("transport", "console");
    });
  });

  describe("isTargetNetwork()", () => {
    test("returns false if target is an host", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan.json",
        testConfigFilePath
      );

      await config.load(testConfigFilePath);

      config.target.should.be.equal("192.168.0.2");
      should.equal(config.netmask, undefined);
      config.isTargetNetwork().should.be.false;
    });

    test("returns true if target is a network", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan-network.json",
        testConfigFilePath
      );

      await config.load(testConfigFilePath);

      config.target.should.be.equal("192.168.0.2");
      config.netmask.should.be.equal(24);
      config.isTargetNetwork().should.be.true;
    });
  });

  describe("report flags", async () => {
    test("reportNewDevices", async () => {
      let config = new Configuration();
      config._config = {
        report: {
          newDevices: true,
        },
      };

      config.reportNewDevices().should.be.true;

      config._config = {
        report: {
          newDevices: false,
        },
      };

      config.reportNewDevices().should.be.false;

      config._config = {};
      config.reportNewDevices().should.be.false;

      config._config = undefined;
      config.reportNewDevices().should.be.false;
    });

    test("reportScanCompleted", async () => {
      let config = new Configuration();
      config._config = {
        report: {
          end: true,
        },
      };

      config.reportScanCompleted().should.be.true;

      config._config = {
        report: {
          end: false,
        },
      };

      config.reportScanCompleted().should.be.false;

      config._config = {};
      config.reportScanCompleted().should.be.false;

      config._config = undefined;
      config.reportScanCompleted().should.be.false;
    });

    test("reportUpdatedDevices", async () => {
      let config = new Configuration();
      config._config = {
        report: {
          updatedDevices: true,
        },
      };

      config.reportUpdatedDevices().should.be.true;

      config._config = {
        report: {
          updatedDevices: false,
        },
      };

      config.reportUpdatedDevices().should.be.false;

      config._config = {};
      config.reportUpdatedDevices().should.be.false;

      config._config = undefined;
      config.reportUpdatedDevices().should.be.false;
    });

    test("reportKnownDevices", async () => {
      let config = new Configuration();
      config._config = {
        report: {
          knownDevices: true,
        },
      };

      config.reportKnownDevices().should.be.true;

      config._config = {
        report: {
          knownDevices: false,
        },
      };

      config.reportKnownDevices().should.be.false;

      config._config = {};
      config.reportKnownDevices().should.be.false;

      config._config = undefined;
      config.reportKnownDevices().should.be.false;
    });

    test("reportStartScan", async () => {
      let config = new Configuration();
      config._config = {
        report: {
          begin: true,
        },
      };

      config.reportStartScan().should.be.true;

      config._config = {
        report: {
          begin: false,
        },
      };

      config.reportStartScan().should.be.false;

      config._config = {};
      config.reportStartScan().should.be.false;

      config._config = undefined;
      config.reportStartScan().should.be.false;
    });

    test("reportNewDevices", async () => {
      let config = new Configuration();
      config._config = {
        report: {
          newDevices: true,
        },
      };

      config.reportNewDevices().should.be.true;

      config._config = {
        report: {
          newDevices: false,
        },
      };

      config.reportNewDevices().should.be.false;

      config._config = {};
      config.reportNewDevices().should.be.false;

      config._config = undefined;
      config.reportNewDevices().should.be.false;
    });
  });
});
