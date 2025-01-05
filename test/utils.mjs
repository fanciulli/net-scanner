import { writeFile, unlink, cp } from "node:fs/promises";

async function copyConfigurationFile(from, to) {
  await cp(from, to);
}

async function saveConfigurationFile(path, data) {
  await writeFile(path, data);
}

async function saveConfigurationJsonFile(path, data) {
  await saveConfigurationFile(path, JSON.stringify(data));
}

async function deleteConfigurationFile(path) {
  await unlink(path);
}

export {
  saveConfigurationFile,
  saveConfigurationJsonFile,
  deleteConfigurationFile,
  copyConfigurationFile,
};
