require('dotenv').config({ path: '.env.prod' });

const childProcessLib = require('child_process');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(childProcessLib.exec);

const { QueryFile } = require('pg-promise');
const pgpLib = require("pg-promise");
const glob = promisify(require('glob'));

const { connectDb } = require('../lib/db');
const { recreateProductionDb, migrate } = require('./lib/pipeline-db');

const runProduction = async ({ version }) => {
  let pgContainer;
  let pgp;
  try {
    // recreate production db
    pgContainer = await recreateProductionDb({ version });

    // connect to db
    pgp = pgpLib();
    const db = connectDb({ pgp })

    // run migration V
    await migrate({ db, version });
    console.log(`(Migrated "${db.$cn.database}" db to schema@${version})`)
    // run app V-1
    // run transactions V
    await applyProductionTransactions({ db, version })
    console.log(`(Updated "${db.$cn.database}" db with new transactions)`)
    // run app V
    console.log(`(Output from app@${version})`)
    await runApp({ version })
  } finally {
    // disconnect from db
    if (pgp) pgp.end();
    // destroy db
    if (pgContainer) await pgContainer.stop();
  }
}

const applyProductionTransactions = async ({ db, version }) => {
  const [transactionPath] = await glob(`src/data/prod/${version}-*.sql`, { absolute: true })
  const transactionFile = new QueryFile(transactionPath);
  await db.none(transactionFile);
}

const runApp = async ({ version }) => {
  const [appPath] = await glob(`src/app/${version}-*.js`, { absolute: true, ignore: '*.test.js' })
  const { stdout } = await exec(`node ${appPath}`);
  console.log(stdout);
}

const version = parseInt(process.argv[2]);
runProduction({ version }).catch((err) => { console.error(err); process.exit(1); })