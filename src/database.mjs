import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync("scan-db.sqlite");

database.exec(`
        CREATE TABLE IF NOT EXISTS hosts(
          mac TEXT PRIMARY KEY,
          ip TEXT,
          vendor TEXT
        ) STRICT
      `);

function storeHost(mac, ip, vendor) {
  database.exec(
    `INSERT INTO hosts (mac, ip, vendor) VALUES ('${mac}', '${ip}', '${vendor}')`
  );
}

function updateHost(mac, ip, vendor) {
  database.exec(
    `UPDATE hosts SET ip = '${ip}',  vendor = '${vendor}' WHERE mac == '${mac}'`
  );
}

function getHost(mac) {
  const preparedStmt = database.prepare(
    `SELECT * FROM hosts WHERE mac == '${mac}'`
  );
  const result = preparedStmt.all();
  return result.length == 1 ? result[0] : undefined;
}

export { getHost, storeHost, updateHost };
