import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync("scan-db.sqlite");

const NA = "N/A";

database.exec(`
        CREATE TABLE IF NOT EXISTS hosts(
          mac TEXT PRIMARY KEY,
          ip TEXT,
          vendor TEXT
        ) STRICT
      `);

function storeHost(mac, ip, vendor) {
  let dbIP = ip ? ip : NA; // add sanitizing
  let dbVendor = vendor ? vendor : NA; // add sanitizing

  database.exec(
    `INSERT INTO hosts (mac, ip, vendor) VALUES ('${mac}', '${dbIP}', '${dbVendor}')`
  );
}

function updateHost(mac, ip, vendor) {
  let dbIP = ip ? ip : NA; // add sanitizing
  let dbVendor = vendor ? vendor : NA; // add sanitizing

  database.exec(
    `UPDATE hosts SET ip = '${dbIP}',  vendor = '${dbVendor}' WHERE mac == '${mac}'`
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
