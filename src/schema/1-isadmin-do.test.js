const { expect } = require("chai");
const pgpLib = require("pg-promise");
const { connectDb } = require('../lib/db');

describe('1-isadmin-do', () => {
  let pgp;
  let db;

  before(() => {
    pgp = pgpLib();
    db = connectDb({ pgp })
  });

  after(() => {
    if (pgp) pgp.end();
  });

  it('should have marked no users admin', async () => {
    await db.none('select * from "user" where isadmin is true');
  });
})

// verify that we can insert users with emails