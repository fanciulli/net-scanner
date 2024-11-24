import { expect, test } from "@jest/globals";
import { Configuration } from "../src/configuration.mjs";
import { writeFile, unlink, cp } from "node:fs/promises";

const testConfigFilePath = "/tmp/config.json";
let config = new Configuration();

test("throws an Error if configuration file cannot be accessed", async () => {
  expect.assertions(2);
  try {
    await config.load("/bin/missing_file");
  } catch (error) {
    expect(error.code).toMatch("ENOENT");
    expect(error.path).toMatch("/bin/missing_file");
  }
});

test("throws an Error if configuration file is not a JSON", async () => {
  expect.assertions(2);
  try {
    const testConfigData = "FILE = /bin/sh";

    await writeFile(testConfigFilePath, testConfigData);
    await config.load(testConfigFilePath);
  } catch (error) {
    expect(error.message).toContain("is not valid JSON");
    expect(config.target).toBe(undefined);

    await unlink(testConfigFilePath);
  }
});

test("throws an Error if configuration file is invalid (1)", async () => {
  expect.assertions(2);
  try {
    const testConfigData = {
      target: "INVALID",
    };

    await writeFile(testConfigFilePath, JSON.stringify(testConfigData));
    await config.load(testConfigFilePath);
  } catch (error) {
    expect(error.message).toMatch("Configuration is not valid");
    expect(config.target).toBe(undefined);

    await unlink(testConfigFilePath);
  }
});

test("reads configuration from file", async () => {
  expect.assertions(3);

  await cp("./tests/resources/test-config-scan.json", testConfigFilePath);
  await config.load(testConfigFilePath);

  expect(config.target).toMatch("192.168.0.2");
  expect(config.logger).toBeDefined();
  expect(config.logger).toHaveProperty("transport", "console");

  await unlink(testConfigFilePath);
});

test("reads configuration from file with Slack logger", async () => {
  expect.assertions(8);

  await cp("./tests/resources/test-config-scan-slack.json", testConfigFilePath);
  await config.load(testConfigFilePath);

  expect(config.target).toMatch("192.168.0.2");
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

  await unlink(testConfigFilePath);
});

test("reads configuration from file without logger specified", async () => {
  expect.assertions(3);

  const testConfigData = {
    target: "192.168.0.2",
  };

  await writeFile(testConfigFilePath, JSON.stringify(testConfigData));
  await config.load(testConfigFilePath);

  expect(config.target).toMatch("192.168.0.2");
  expect(config.logger).toBeDefined();
  expect(config.logger).toHaveProperty("transport", "console");

  await unlink(testConfigFilePath);
});
