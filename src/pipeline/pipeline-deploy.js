require('dotenv').config({ path: '.env.prod' });

const childProcessLib = require('child_process');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(childProcessLib.exec);

const { QueryFile } = require('pg-promise');
const pgPromiseLib = require("pg-promise");
const glob = promisify(require('glob'));

const { connectDb, provisionDb } = require('../lib/db');

const runProduction = async ({ version }) => {
  let pgContainer;
  let pgPromise;
  try {
    // recreate production db
    pgContainer = await recreateProductionDb({ version });

    // connect to db
    pgPromise = pgPromiseLib();
    const db = connectDb({ pgPromise })

    // run migration V
    await migrate({ db, version });
    console.log(`(${db.$cn.database} migrated to schema@${version})`)
    // run app V-1
    // run transactions V
    await applyTransactions({ db, version })
    console.log(`(${db.$cn.database} updated with new transactions)`)
    // run app V
    console.log(`(Output from app@${version})`)
    await runApp({ version })
  } finally {
    // disconnect from db
    if (pgPromise) pgPromise.end();
    // destroy test db
    if (pgContainer) await pgContainer.stop();
  }
}

const recreateProductionDb = async ({ version }) => {
  const pgContainer = provisionDb();

  // for v < V
  //    run migration v
  //    run prod transactions v
  return pgContainer;
}

const migrate = async ({ db, version }) => {
  const [migrationPath] = await glob(`src/schema/${version}-*-do.sql`, { absolute: true })
  const migrationFile = new QueryFile(migrationPath);
  await db.none(migrationFile);
}

const applyTransactions = async ({ db, version }) => {
  const [transactionPath] = await glob(`src/data/prod/${version}-*.sql`, { absolute: true })
  const transactionFile = new QueryFile(transactionPath);
  await db.none(transactionFile);
}

const runApp = async ({ version }) => {
  const [appPath] = await glob(`src/app/${version}-*.js`, { absolute: true, ignore: '*.test.js' })
  const { stdout } = await exec(`node ${appPath}`);
  console.log(stdout);
}

module.exports = {
  runProduction
}