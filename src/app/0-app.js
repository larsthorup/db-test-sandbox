const pgPromiseLib = require("pg-promise");
const { connectDb } = require('../db');

const main = async () => {
  let pgPromise;
  try {
    pgPromise = pgPromiseLib();
    const db = connectDb({ pgPromise })
    console.log(await db.many('select * from "user"'))
  } finally {
    if (pgPromise) pgPromise.end();
  }
}

main().catch(console.error);