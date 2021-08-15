const { promisify } = require('util');

const glob = promisify(require('glob'));
const { QueryFile } = require('pg-promise');

const { provisionDb } = require('../../lib/db');

const migrationFileMap = {};

const migrate = async ({ db, version }) => {
  const [migrationPath] = await glob(`src/schema/${version}-*-do.sql`, { absolute: true })
  if (!migrationFileMap[migrationPath]) {
    migrationFileMap[migrationPath] = new QueryFile(migrationPath);
  }
  const migrationFile = migrationFileMap[migrationPath];
  await db.none(migrationFile);
}

const recreateProductionDb = async ({ version }) => {
  const pgContainer = provisionDb();

  // for v < V
  //    run migration v
  //    run prod transactions v
  return pgContainer;
}

module.exports = {
  migrate,
  recreateProductionDb
}