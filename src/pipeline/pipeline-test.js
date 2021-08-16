require('dotenv').config({ path: '.env.test' });

const assert = require('assert');
const childProcessLib = require('child_process');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(childProcessLib.exec);
const { spawnSync } = childProcessLib;

const { QueryFile } = require('pg-promise');
const pgpLib = require("pg-promise");
const glob = promisify(require('glob'));

const { connectDb, provisionDb } = require('../lib/db');
const { migrate, recreateProductionDb } = require('./lib/pipeline-db');
const { expect } = require('chai');

const debugContainer = Boolean(process.env.DEBUG_CONTAINER);

const runTest = async ({ version }) => {
  console.group(`Testing version "${version}"`)
  try {
    await testApp({ version });
    await testMigration({ version });
  } finally {
    console.groupEnd();
  }
}

const testApp = async ({ version }) => {
  let pgContainer;
  let pgp;
  console.group(`(testing app@${version})`)
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
  } finally {
    console.groupEnd();
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
  console.group(`(testing migration@${version} on test data)`)
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

    // load test data V-1 
    if (version > 0) {
      await loadTestData({ db, version: version - 1 });
    }

    // migrate to version
    await migrate({ db, version });

    // run migration test V
    await runMigrationTest({ db, version });

    // run app test V-1
    if (version > 0) {
      await runAppTest({ db, version: version - 1 });
    }

  } finally {
    console.groupEnd();
    // disconnect from db
    if (pgp) pgp.end();
    // destroy test db
    if (pgContainer) await pgContainer.stop();
  }
}

const testMigrationOnProductionData = async ({ version }) => {
  let pgContainer;
  let pgp;
  if (version > 0) {
    console.group(`(testing migration@${version} on production data)`)
    try {
      // create test db
      pgContainer = await provisionDb({ version });

      // connect to db
      pgp = pgpLib();
      const db = connectDb({ pgp })

      // recreate production db to previous version
      await recreateProductionDb({ db, version: version - 1 });

      // migrate to version
      await migrate({ db, version });

      // run migration test V
      await runMigrationTest({ db, version });

    } finally {
      if (debugContainer) {
        console.log('----- Entering psql on container to debug.');
        console.log(`jdbc:postgresql://${pgContainer.getHost()}:${pgContainer.getMappedPort(5432)}/${pgContainer.getDatabase()}?user=${pgContainer.getUsername()}&password=${pgContainer.getPassword()}`);
        console.log('----- Type ctrl-d to exit.')
        spawnSync('docker', ['exec', '-it', pgContainer.getName(), 'psql', pgContainer.getDatabase(), pgContainer.getUsername()], { stdio: 'inherit' });
        console.log('-----');
      }
      console.groupEnd();
      // disconnect from db
      if (pgp) pgp.end();
      // destroy test db
      if (pgContainer) await pgContainer.stop();
    }
  }
}

const loadTestData = async ({ db, version }) => {
  const testDataGlob = `src/data/test/${version}-*.sql`;
  const [testDataPath] = await glob(testDataGlob, { absolute: true })
  if (testDataPath) {
    const testDataFile = new QueryFile(testDataPath);
    await db.none(testDataFile);
  } else {
    console.log(`(No test data found at "${testDataGlob}")`);
  }
}

const runAppTest = async ({ db, version }) => {
  const testGlob = `src/app/${version}-*.test.js`;
  const [testPath] = await glob(testGlob, { absolute: true });
  if (testPath) {
    await exec(`mocha ${testPath}`);
  } else {
    console.log(`(No app test found at "${testGlob}")`);
  }
}

const runMigrationTest = async ({ db, version }) => {
  try {
    const testGlob = `src/schema/${version}-*-do.test.js`;
    const [testPath] = await glob(testGlob, { absolute: true })
    if (testPath) {
      await exec(`mocha ${testPath}`);
    } else {
      console.log(`(No migration test found at "${testGlob}")`);
    }
  } catch (err) {
    console.error(err);
    throw new Error(`Failed to run migration test for version ${version}`)
  }
}

const version = parseInt(process.argv[2]);
runTest({ version }).catch((err) => { console.error(err.stack); process.exit(1); })
