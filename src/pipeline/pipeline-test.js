require('dotenv').config({ path: '.env.test' });

const assert = require('assert');
const childProcessLib = require('child_process');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(childProcessLib.exec);

const { QueryFile } = require('pg-promise');
const pgpLib = require("pg-promise");
const glob = promisify(require('glob'));

const { connectDb, provisionDb } = require('../lib/db');
const { migrate } = require('./lib/pipeline-db');
const { expect } = require('chai');

const runTest = async ({ version }) => {
  await testApp({ version });
  await testMigration({ version });
}

const testApp = async ({ version }) => {
  let pgContainer;
  let pgp;
  try {
    // create test db
    pgContainer = await provisionDb({ version });

    // connect to db
    pgp = pgpLib();
    const db = connectDb({ pgp })

    // migrate db
    for (let v = 0; v <= version; ++v) {
      await migrate({ db, version: v });
    }

    // load test data 
    await loadTestData({ db, version });

    // run app test
    await runAppTest({ db, version });

    console.log(`(Tested app@${version})`)
  } finally {
    // disconnect from db
    if (pgp) pgp.end();
    // destroy test db
    if (pgContainer) await pgContainer.stop();
  }
}

const testMigration = async ({ version }) => {
  await testMigrationOnTestData({ version });
  await testMigrationOnProductionData({ version });
}

const testMigrationOnTestData = async ({ version }) => {
  let pgContainer;
  let pgp;
  try {
    // create test db
    pgContainer = await provisionDb({ version });

    // connect to db
    pgp = pgpLib();
    const db = connectDb({ pgp })

    // migrate db to previous version
    for (let v = 0; v < version; ++v) {
      await migrate({ db, version: v });
    }

    // TODO load test data V-1 
    // migrate to version
    await migrate({ db, version });

    // run migration test V
    await runMigrationTest({ db, version });

    // TODO: run app test V-1

    console.log(`(Tested migration@${version})`)
  } finally {
    // disconnect from db
    if (pgp) pgp.end();
    // destroy test db
    if (pgContainer) await pgContainer.stop();
  }
}

const testMigrationOnProductionData = async ({ version }) => { // TODO
  // create test db
  // for v < V
  //   migrate v
  //   apply prod transactions v
  // migrate V
  // run migration test V
  // destroy db
}

const loadTestData = async ({ db, version }) => {
  const [testDataPath] = await glob(`src/data/test/${version}-*.sql`, { absolute: true })
  const testDataFile = new QueryFile(testDataPath);
  await db.none(testDataFile);
}

const runAppTest = async ({ db, version }) => {
  const [testPath] = await glob(`src/app/${version}-*.test.js`, { absolute: true })
  await exec(`mocha ${testPath}`);
}

const runMigrationTest = async ({ db, version }) => {
  const [testPath] = await glob(`src/schema/${version}-*-do.test.js`, { absolute: true })
  await exec(`mocha ${testPath}`);
}

const version = parseInt(process.argv[2]);
runTest({ version }).catch((err) => { console.error(err); process.exit(1); })