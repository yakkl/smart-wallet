// import initSqlJs from "sql.js";

// let db: any = null;

// export async function initSQLite() {
  // const SQL = await initSqlJs();
  // db = new SQL.Database();
  // db.run("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY, timestamp TEXT, label TEXT, message TEXT)");
// }

// export function saveToSQLite(log: { timestamp: string; label: string; message: string }) {
  // if (!db) return;
  // db.run("INSERT INTO logs (timestamp, label, message) VALUES (?, ?, ?)", [
  //   log.timestamp,
  //   log.label,
  //   log.message,
  // ]);
// }
