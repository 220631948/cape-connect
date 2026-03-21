/**
 * @file src/lib/duckdb/client.ts
 * @description DuckDB-Wasm client for high-performance in-browser spatial analytics.
 * @compliance POPIA: Analytics performed on-device where possible to minimize data transfer.
 */

import * as duckdb from "@duckdb/duckdb-wasm";
import * as arrow from "apache-arrow";

let db: duckdb.AsyncDuckDB | null = null;

/**
 * Initialize DuckDB-Wasm instance.
 */
export async function initDuckDB() {
  if (db) return db;

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], {
      type: "text/javascript",
    }),
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  URL.revokeObjectURL(worker_url);
  return db;
}

/**
 * Execute a spatial query using DuckDB-Wasm.
 * @param sql The SQL query to execute.
 */
export async function querySpatial(sql: string) {
  const instance = await initDuckDB();
  const conn = await instance.connect();
  try {
    const result = await conn.query(sql);
    return result;
  } finally {
    await conn.close();
  }
}

/**
 * Load a GeoParquet file into DuckDB from a URL.
 * @param url The URL of the .parquet file.
 * @param tableName The table name to create.
 */
export async function loadParquet(url: string, tableName: string) {
  const instance = await initDuckDB();
  const conn = await instance.connect();
  try {
    await conn.query(`
      CREATE TABLE ${tableName} AS
      SELECT * FROM read_parquet('${url}')
    `);
  } finally {
    await conn.close();
  }
}
