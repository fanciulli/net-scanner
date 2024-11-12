import { expect, test, jest } from "@jest/globals";
import { readFile, writeFile, unlink, cp } from "node:fs/promises";

jest.unstable_mockModule("node:child_process", () => ({
  exec: jest.fn((command, callback) => {
    expect(command).toMatch("nmap -sn -oX scan.xml 192.168.0.2");
    cp("tests/resources/nmap.192.168.0.2.xml", "scan.xml").then(callback);
  }),
}));

const { scan } = await import("../src/scanner.mjs");

const testConfigFilePath = "/tmp/config.json";

async function writeConfigurationFile(content) {
  await writeFile(testConfigFilePath, JSON.stringify(content));
}

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

    await writeConfigurationFile(testConfigData);
    await scan(testConfigFilePath);
  } catch (error) {
    expect(error.message).toMatch("Configuration is not valid");

    await unlink(testConfigFilePath);
  }
});

test("scans target", async () => {
  await cp("./tests/resources/test-config-scan.json", testConfigFilePath);
  await scan(testConfigFilePath);

  const targetInfoString = await readFile("targetInfo.json");
  const targetInfo = JSON.parse(targetInfoString);

  expect(targetInfo.status).toMatch("up");
  expect(targetInfo.address).toMatch("192.168.0.2");
  expect(targetInfo.mac).toMatch("11:22:33");
  expect(targetInfo.vendor).toMatch("Vendor");

  await unlink(testConfigFilePath);
});
