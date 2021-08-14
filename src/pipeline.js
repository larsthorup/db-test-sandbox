require('dotenv').config({ path: '.env.test' });

const { promisify } = require('util');
const path = require('path');

const { QueryFile } = require('pg-promise');
const pgPromiseLib = require("pg-promise");
const { PostgreSqlContainer } = require("testcontainers");
const glob = promisify(require('glob'));

const version = "0"; // TODO: pass in

const main = async ({ version }) => {
  await runProduction({ version });
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
    pgPromise = pgPromiseLib();
    const db = pgPromise({
      host: pgContainer.getHost(),
      port: pgContainer.getPort(),
      database: pgContainer.getDatabase(),
      user: pgContainer.getUsername(),
      password: pgContainer.getPassword(),
    });

    // for v < V
    //    run migration v
    //    run prod transactions v

    // run migration V
    await runMigration({ db, version });
    // run app V-1
    // run transactions V
    await runTransactions({ db, version })
    // run app V
    await runApp({ db, version })
  } finally {
    // destroy test db
    if (pgPromise) pgPromise.end();
    if (pgContainer) await pgContainer.stop();
  }
}

const runMigration = async ({ db, version }) => {
  const [migrationPath] = await glob(`src/schema/${version}-*-do.sql`, { absolute: true })
  const migrationFile = new QueryFile(migrationPath);
  await db.none(migrationFile);
}

const runTransactions = async ({ db, version }) => {
  const [transactionPath] = await glob(`src/data/prod/${version}-*.sql`, { absolute: true })
  const transactionFile = new QueryFile(transactionPath);
  await db.none(transactionFile);
}

const runApp = async ({ db, version }) => {
  console.log(await db.many('select * from "user"'))
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
