const { expect } = require("chai");
const pgpLib = require("pg-promise");
const { connectDb } = require('../lib/db');

describe('0-user-do', () => {
  let pgp;
  let db;

  before(() => {
    pgp = pgpLib();
    db = connectDb({ pgp })
  });

  after(() => {
    if (pgp) pgp.end();
  });

  it('should store users with emails', async () => {
    await db.none(`insert into "user" ("email") values ('b@e.org'), ('a@y.com')`)
    const userList = await db.many('select * from "user" order by "email"');
    expect(userList.map(u => u.email)).to.deep.equal(['a@y.com', 'b@e.org']);
  });
})

// verify that we can insert users with emails