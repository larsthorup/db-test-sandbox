const { promisify } = require('util');

const glob = promisify(require('glob'));
const { QueryFile } = require('pg-promise');

const { provisionDb } = require('../../lib/db');

const migrationFileMap = {};

const applyProductionTransactions = async ({ db, version }) => {
  const transactionGlob = `src/data/prod/${version}-*.sql`;
  const [transactionPath] = await glob(transactionGlob, { absolute: true })
  if (transactionPath) {
    const transactionFile = new QueryFile(transactionPath);
    await db.none(transactionFile);
  } else {
    console.log(`(No transactions found at "${transactionGlob}")`);
  }
}

const migrate = async ({ db, version }) => {
  try {
    const [migrationPath] = await glob(`src/schema/${version}-*-do.sql`, { absolute: true })
    if (!migrationFileMap[migrationPath]) {
      migrationFileMap[migrationPath] = new QueryFile(migrationPath);
    }
    const migrationFile = migrationFileMap[migrationPath];
    await db.none(migrationFile);
  } catch (err) {
    console.error(err); // detailed error info from postgres
    throw new Error(`Failed to migrate "${db.$cn.database}" to version ${version}`);
  }
}

const recreateProductionDb = async ({ db, version }) => {
  for (let v = 0; v <= version; ++v) {
    await migrate({ db, version: v });
    await applyProductionTransactions({ db, version: v })
  }
  console.log(`(Recreated "${db.$cn.database}" db to schema@${version} and transactions@${version})`)
}



module.exports = {
  applyProductionTransactions,
  migrate,
  recreateProductionDb
}