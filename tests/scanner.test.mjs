import { expect, test, jest } from "@jest/globals";
import { readFile, writeFile, unlink, cp } from "node:fs/promises";

jest.unstable_mockModule("node:child_process", () => ({
  exec: jest
    .fn()
    .mockImplementationOnce((command, callback) => {
      expect(command).toBe("nmap -sn -oX scan.xml 192.168.0.2");
      cp("tests/resources/nmap.192.168.0.2.xml", "scan.xml").then(callback);
    })
    .mockImplementationOnce((command, callback) => {
      expect(command).toBe("nmap -sn -oX scan.xml 192.168.0.3");
      cp("tests/resources/nmap.192.168.0.3.xml", "scan.xml").then(callback);
    })
    .mockImplementationOnce((command, callback) => {
      expect(command).toBe("nmap -sn -oX scan.xml 192.168.0.2");
      cp("tests/resources/nmap.empty.xml", "scan.xml").then(callback);
    })
    .mockImplementationOnce((command, callback) => {
      expect(command).toBe("nmap -sn -oX scan.xml 192.168.0.2");
      cp("tests/resources/nmap.invalid.xml", "scan.xml").then(callback);
    })
    .mockImplementation((command, callback) => {
      expect(command).toContain("nmap -sn -oX scan.xml 192.168.0.");
      cp("tests/resources/nmap.192.168.0.2.xml", "scan.xml").then(callback);
    }),
}));

const { scan } = await import("../src/scanner.mjs");

async function writeConfigurationFile(content, filePath) {
  await writeFile(filePath, JSON.stringify(content));
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

    await writeConfigurationFile(testConfigData, "/tmp/invalid-config.json");
    await scan("/tmp/invalid-config.json");
  } catch (error) {
    expect(error.message).toMatch("Configuration is not valid");

    await unlink("/tmp/invalid-config.json");
  }
});

test("Scans target", async () => {
  await cp("./tests/resources/test-config-scan.json", "/tmp/config1.json");
  await scan("/tmp/config1.json");

  const targetInfoString = await readFile("targetInfo.json");
  const targetInfo = JSON.parse(targetInfoString);

  expect(targetInfo.status).toBe("up");
  expect(targetInfo.address).toBe("192.168.0.2");
  expect(targetInfo.mac).toBe("00:11:22:33:44:55");
  expect(targetInfo.vendor).toBe("My Vendor");

  await unlink("/tmp/config1.json");
});

test("Scans target that changed IP and Vendor", async () => {
  await cp("./tests/resources/test-config-scan2.json", "/tmp/config2.json");
  await scan("/tmp/config2.json");

  const targetInfoString = await readFile("targetInfo.json");
  const targetInfo = JSON.parse(targetInfoString);

  expect(targetInfo.status).toBe("up");
  expect(targetInfo.address).toBe("192.168.0.3");
  expect(targetInfo.mac).toBe("00:11:22:33:44:55");
  expect(targetInfo.vendor).toBe("Another Vendor");

  await unlink("/tmp/config2.json");
});

test("Scans target but nothing found", async () => {
  expect.assertions(3);
  await unlink("targetInfo.json");
  await cp(
    "./tests/resources/test-config-scan.json",
    "/tmp/no-target-config.json"
  );
  await scan("/tmp/no-target-config.json");

  try {
    await readFile("targetInfo.json");
  } catch (error) {
    expect(error.code).toMatch("ENOENT");
    expect(error.path).toMatch("targetInfo.json");
  }

  await unlink("/tmp/no-target-config.json");
});

test("Invalid nmap output file", async () => {
  expect.assertions(2);
  await cp(
    "./tests/resources/test-config-scan.json",
    "/tmp/no-target-config.json"
  );

  try {
    await scan("/tmp/no-target-config.json");
  } catch (error) {
    expect(error.message).toMatch("Attribute without value");
  }

  await unlink("/tmp/no-target-config.json");
});

test("Scans network", async () => {
  await cp(
    "./tests/resources/test-config-scan-network.json",
    "/tmp/network-config.json"
  );
  await scan("/tmp/network-config.json");

  await unlink("/tmp/network-config.json");
});
