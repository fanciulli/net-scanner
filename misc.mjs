import { readFile } from "node:fs/promises";

async function printHeader() {
  const header = await readFile("./res/header.txt", "utf-8");
  console.log(header);
}

export { printHeader };
