const pgpLib = require("pg-promise");
const { connectDb } = require('../lib/db');

const main = async () => {
  let pgp;
  try {
    pgp = pgpLib();
    const db = connectDb({ pgp })
    console.log(`Users in "${db.$cn.database}" db`)
    const userList = await db.many('select * from "user" order by "email"');
    console.log(userList.map(u => `${u.email} (${u.isadmin ? 'admin' : 'user'})`).join('\n'));
  } finally {
    if (pgp) pgp.end();
  }
}

main().catch((err) => { console.error(err.stack); process.exit(1); })