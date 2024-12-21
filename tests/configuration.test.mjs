import { expect, test } from "@jest/globals";
import { Configuration } from "../src/configuration.mjs";
import {
  copyConfigurationFile,
  saveConfigurationFile,
  saveConfigurationJsonFile,
  deleteConfigurationFile,
} from "./utils.mjs";

const testConfigFilePath = "/tmp/config.json";
const config = new Configuration();

test("isTargetNetwork", () => {
  expect(config.target).toBeUndefined;
  expect(config.netmask).toBeUndefined;
  expect(config.isTargetNetwork()).toBe(false);
});

test("throws an Error if configuration file cannot be accessed", async () => {
  expect.assertions(2);
  try {
    await config.load("/bin/missing_file");
  } catch (error) {
    expect(error.code).toBe("ENOENT");
    expect(error.path).toBe("/bin/missing_file");
  }
});

test("throws an Error if configuration file is not a JSON", async () => {
  try {
    const testConfigData = "FILE = /bin/sh";

    await saveConfigurationFile(testConfigFilePath, testConfigData);
    await config.load(testConfigFilePath);
  } catch (error) {
    expect(error.message).toContain("is not valid JSON");
    expect(config.target).toBeUndefined;
    expect(config.netmask).toBeUndefined;
    expect(config.isTargetNetwork()).toBe(false);
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
    expect(error.message).toBe("Configuration is not valid");
    expect(config.target).not.toBeUndefined;
    expect(config.netmask).toBeUndefined;
    expect(config.isTargetNetwork()).toBe(false);
  }
  await deleteConfigurationFile(testConfigFilePath);
});

test("reads configuration from file", async () => {
  await copyConfigurationFile(
    "./tests/resources/test-config-scan.json",
    testConfigFilePath
  );

  await config.load(testConfigFilePath);

  expect(config.target).toBe("192.168.0.2");
  expect(config.netmask).toBeUndefined;
  expect(config.isTargetNetwork()).toBe(false);
  expect(config.logger).toBeDefined();
  expect(config.logger).toHaveProperty("transport", "console");

  await deleteConfigurationFile(testConfigFilePath);
});

test("reads configuration from file with Slack logger", async () => {
  await copyConfigurationFile(
    "./tests/resources/test-config-scan-slack.json",
    testConfigFilePath
  );
  await config.load(testConfigFilePath);

  expect(config.target).toBe("192.168.0.2");
  expect(config.netmask).toBeUndefined;
  expect(config.isTargetNetwork()).toBe(false);
  expect(config.logger).toBeDefined();
  expect(config.logger).toHaveProperty("transport", "slack");
  expect(config.logger).toHaveProperty("level", "info");
  expect(config.logger).toHaveProperty(
    "webhookUrl",
    "https://hooks.slack.com/services/xxx/xxx/xxx"
  );
  expect(config.logger).toHaveProperty("channel", "#test-channel");
  expect(config.logger).toHaveProperty("username", "webhookbot");
  expect(config.logger).toHaveProperty("icon_emoji", ":ghost:");

  await deleteConfigurationFile(testConfigFilePath);
});

test("reads configuration from file without logger specified", async () => {
  const testConfigData = {
    target: "192.168.0.2",
  };

  await saveConfigurationJsonFile(testConfigFilePath, testConfigData);

  await config.load(testConfigFilePath);

  expect(config.target).toBe("192.168.0.2");
  expect(config.netmask).toBeUndefined;
  expect(config.isTargetNetwork()).toBe(false);
  expect(config.logger).toBeDefined();
  expect(config.logger).toHaveProperty("transport", "console");

  await deleteConfigurationFile(testConfigFilePath);
});

test("reads configuration for a target network", async () => {
  await copyConfigurationFile(
    "./tests/resources/test-config-scan-network.json",
    testConfigFilePath
  );

  await config.load(testConfigFilePath);

  expect(config.target).toBe("192.168.0.2");
  expect(config.netmask).toBe(24);
  expect(config.isTargetNetwork()).toBe(true);
  expect(config.logger).toBeDefined();
  expect(config.logger).toHaveProperty("transport", "console");
});
