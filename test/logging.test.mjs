import { describe, test } from "mocha";
import { should as shouldFun } from "chai";
const should = shouldFun();
import { Configuration } from "../src/configuration.mjs";
import { copyConfigurationFile, deleteConfigurationFile } from "./utils.mjs";
import { initLogger, logger, debug, info, error } from "../src/logging.mjs";

describe("Logging", () => {
  describe("Console logger", () => {
    test("Default initialization", () => {
      should.equal(logger, undefined);
      info("TEST");
      error("TEST");
      debug("TEST");
    });

    test("From configuration file", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan.json",
        "/tmp/config-console.json"
      );

      const configuration = new Configuration();
      await configuration.load("/tmp/config-console.json");

      initLogger(configuration);

      logger.should.not.be.undefined;
      info("TEST");
      error("TEST");
      debug("TEST");

      await deleteConfigurationFile("/tmp/config-console.json");
    });
  });

  describe("Slack transport", () => {
    test("From configuration file", async () => {
      await copyConfigurationFile(
        "./test/resources/test-config-scan-slack.json",
        "/tmp/config-slack.json"
      );

      const configuration = new Configuration();
      await configuration.load("/tmp/config-slack.json");

      initLogger(configuration);

      logger.should.not.be.undefined;

      await deleteConfigurationFile("/tmp/config-slack.json");
    });
  });
});
