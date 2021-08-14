require('dotenv').config({ path: '.env.test' });

const childProcessLib = require('child_process');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(childProcessLib.exec);

const { QueryFile } = require('pg-promise');
const pgPromiseLib = require("pg-promise");
const { PostgreSqlContainer } = require("testcontainers");
const glob = promisify(require('glob'));

const { connectDb } = require('./db');

const version = parseInt(process.argv[2]);

const main = async ({ version }) => {
  await runTest({ version });
  await runProduction({ version });
}

const runTest = async ({ version }) => {
  await runTestOnTestData({ version });
  await runTestOnProductionData({ version });
}

const runTestOnTestData = async ({ version }) => {

}

const runTestOnProductionData = async ({ version }) => {

}

const runProduction = async ({ version }) => {
  let pgContainer;
  let pgPromise;
  try {
    // create test db with prod data
    pgContainer = await new PostgreSqlContainer('postgres:13.3-alpine')
      .withDatabase(process.env.POSTGRES_DB)
      .withUsername(process.env.POSTGRES_USER)
      .withPassword(process.env.POSTGRES_PASSWORD)
      .start()
    process.env.POSTGRES_HOST = pgContainer.getHost();
    process.env.POSTGRES_PORT = pgContainer.getPort();
    // connect to db
    pgPromise = pgPromiseLib();
    const db = connectDb({ pgPromise })

    // for v < V
    //    run migration v
    //    run prod transactions v

    // run migration V
    await migrate({ db, version });
    console.log(`(Production db migrated to schema@${version})`)
    // run app V-1
    // run transactions V
    await applyTransactions({ db, version })
    console.log(`(Production transactions applied)`)
    // run app V
    console.log(`(Output from app@${version})`)
    await runApp({ db, version })
  } finally {
    // disconnect from db
    if (pgPromise) pgPromise.end();
    // destroy test db
    if (pgContainer) await pgContainer.stop();
  }
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

const runApp = async ({ db, version }) => {
  const [appPath] = await glob(`src/app/${version}-*.js`, { absolute: true, ignore: '*.test.js' })
  const { stdout } = await exec(`node ${appPath}`);
  console.log(stdout);
}

// test with test data and app tests

// create test db
// for v < V
//   migrate v
// load test data V-1
// migrate V
// run migration test V
// run app test V-1
// destroy prod db

// test with prod data

// create test db
// for v < V
//   migrate v
// load prod data V-1
// migrate V
// run migration test V
// destroy test db

main({ version }).catch(console.error)
