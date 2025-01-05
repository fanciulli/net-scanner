import { expect, test } from "@jest/globals";
import { Configuration } from "../src/configuration.mjs";
import { copyConfigurationFile, deleteConfigurationFile } from "./utils.mjs";
import { initLogger, logger, debug, info, error } from "../src/logging.mjs";

test("Console logger initialization", () => {
  expect(logger).toBeUndefined();
  info("TEST");
  error("TEST");
  debug("TEST");
});

test("Initialize Console logger", async () => {
  await copyConfigurationFile(
    "./tests/resources/test-config-scan.json",
    "/tmp/config-console.json"
  );

  const configuration = new Configuration();
  await configuration.load("/tmp/config-console.json");

  initLogger(configuration);

  expect(logger).toBeDefined();
  info("TEST");
  error("TEST");
  debug("TEST");

  await deleteConfigurationFile("/tmp/config-console.json");
});

test("Initialize Slack logger", async () => {
  await copyConfigurationFile(
    "./tests/resources/test-config-scan-slack.json",
    "/tmp/config-slack.json"
  );

  const configuration = new Configuration();
  await configuration.load("/tmp/config-slack.json");

  initLogger(configuration);

  expect(logger).toBeDefined();

  await deleteConfigurationFile("/tmp/config-slack.json");
});
