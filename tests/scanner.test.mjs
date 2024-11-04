import { expect, test } from "@jest/globals";
import { scan } from "../src/scanner.mjs";
import { writeFile, unlink } from "node:fs/promises";

const testConfigFilePath = "/tmp/config.json";

test("throws an Error if configuration file cannot be accessed", async () => {
  expect.assertions(2);
  try {
    await scan("/bin/missing_file");
  } catch (error) {
    expect(error.code).toMatch("ENOENT");
    expect(error.path).toMatch("/bin/missing_file");
  }
});

test("throws an Error if configuration file is invalid (1)", async () => {
  expect.assertions(1);
  try {
    const testConfigData = {
      target: "INVALID",
    };

    await writeFile(testConfigFilePath, JSON.stringify(testConfigData));
    await scan(testConfigFilePath);
  } catch (error) {
    expect(error.message).toMatch("Configuration is not valid");

    await unlink(testConfigFilePath);
  }
});

test("reads configuration from file", async () => {
  const testConfigData = {
    target: "192.168.0.1",
  };

  await writeFile(testConfigFilePath, JSON.stringify(testConfigData));
  await scan(testConfigFilePath);

  await unlink(testConfigFilePath);
});
