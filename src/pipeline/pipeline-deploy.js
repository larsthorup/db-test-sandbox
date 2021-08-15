require('dotenv').config({ path: '.env.prod' });

const childProcessLib = require('child_process');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(childProcessLib.exec);

const { QueryFile } = require('pg-promise');
const pgpLib = require("pg-promise");
const glob = promisify(require('glob'));

const { connectDb, provisionDb } = require('../lib/db');
const { recreateProductionDb, migrate, applyProductionTransactions } = require('./lib/pipeline-db');

const runProduction = async ({ version }) => {
  let pgContainer;
  let pgp;
  try {
    pgContainer = await provisionDb();

    // connect to db
    pgp = pgpLib();
    const db = connectDb({ pgp })

    // recreate production db to previous version
    if (version > 0) {
      await recreateProductionDb({ db, version: version - 1 });
    }

    // migrate to version
    await migrate({ db, version });
    console.log(`(Migrated "${db.$cn.database}" db to schema@${version})`)

    // run app V-1 
    if (version > 0) {
      await runApp({ db, version: version - 1 })
    }

    // run transactions V
    await applyProductionTransactions({ db, version })
    console.log(`(Updated "${db.$cn.database}" db with transactions@${version})`)

    // run app V
    await runApp({ version })

  } finally {
    // disconnect from db
    if (pgp) pgp.end();
    // destroy db
    if (pgContainer) await pgContainer.stop();
  }
}

const runApp = async ({ version }) => {
  const [appPath] = await glob(`src/app/${version}-*.js`, { absolute: true, ignore: '*.test.js' })
  const { stdout } = await exec(`node ${appPath}`);
  console.log(`(Output from app@${version})`)
  console.log(stdout);
}

const version = parseInt(process.argv[2]);
runProduction({ version }).catch((err) => { console.error(err.stack); process.exit(1); })