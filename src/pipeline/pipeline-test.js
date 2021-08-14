require('dotenv').config({ path: '.env.test' });

const assert = require('assert');
const childProcessLib = require('child_process');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(childProcessLib.exec);

const { QueryFile } = require('pg-promise');
const pgPromiseLib = require("pg-promise");
const glob = promisify(require('glob'));

const { connectDb, provisionDb } = require('../lib/db');
const { migrate, recreateDb } = require('./lib/pipeline-db');
const { expect } = require('chai');

const runTest = async ({ version }) => {
  await testApp({ version });
  await testMigration({ version });
}

const testApp = async ({ version }) => {
  let pgContainer;
  let pgPromise;
  try {
    // recreate test db
    pgContainer = await recreateDb({ version });

    // connect to db
    pgPromise = pgPromiseLib();
    const db = connectDb({ pgPromise })

    // migrate db
    for (let v = 0; v <= version; ++v) {
      await migrate({ db, version: v });
    }

    // load test data 
    await loadTestData({ db, version });

    // run app test
    await runMochaTest({ db, version });

    console.log(`(Tested app@${version})`)
  } finally {
    // disconnect from db
    if (pgPromise) pgPromise.end();
    // destroy test db
    if (pgContainer) await pgContainer.stop();
  }
}

const testMigration = async ({ version }) => {
  await testMigrationOnTestData({ version });
  await testMigrationOnProductionData({ version });
}

const testMigrationOnTestData = async ({ version }) => { // TODO
  // create test db
  // for v < V
  //   migrate v
  // load test data V-1
  // migrate V
  // run migration test V
  // run app test V-1
  // destroy db
}

const testMigrationOnProductionData = async ({ version }) => { // TODO
  // create test db
  // for v < V
  //   migrate v
  // load prod data V-1
  // migrate V
  // run migration test V
  // destroy db
}

const loadTestData = async ({ db, version }) => {
  const [testDataPath] = await glob(`src/data/test/${version}-*.sql`, { absolute: true })
  const testDataFile = new QueryFile(testDataPath);
  await db.none(testDataFile);
}

const runMochaTest = async ({ db, version }) => {
  const [testPath] = await glob(`src/app/${version}-*.test.js`, { absolute: true })
  await exec(`mocha ${testPath}`);
}

const version = parseInt(process.argv[2]);
runTest({ version }).catch((err) => { console.error(err); process.exit(1); })