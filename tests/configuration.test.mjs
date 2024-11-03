import { expect, test } from "@jest/globals";
import { Configuration } from "../src/configuration.mjs";
import { writeFile, unlink } from "node:fs/promises";

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
  expect.assertions(1);
  const testConfigData = {
    target: "192.168.0.1",
  };

  await writeFile(testConfigFilePath, JSON.stringify(testConfigData));
  await config.load(testConfigFilePath);

  expect(config.target).toMatch("192.168.0.1");

  await unlink(testConfigFilePath);
});
