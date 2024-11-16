import { readFile } from "node:fs/promises";

async function printHeader() {
  const header = await readFile("res/header.txt", "utf-8");
  console.log(header);
  console.log();
  console.log(
    "Application output may be redirected to other transports. Please check configiuration file."
  );
}

export { printHeader };
