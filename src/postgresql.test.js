const { expect } = require('chai');

const pgpLib = require("pg-promise");
const { GenericContainer } = require("testcontainers");

describe("postgresql", () => {
  let container;
  let db;
  let pgp;

  before(async function () {
    // TODO: usePostgres() test hook
    const mochaContext = this;
    mochaContext.timeout(120_000);
    container = await new GenericContainer("postgres")
      .withExposedPorts(5432)
      .withEnv('POSTGRES_DB', process.env.POSTGRES_DB)
      .withEnv('POSTGRES_USER', process.env.POSTGRES_USER)
      .withEnv('POSTGRES_PASSWORD', process.env.POSTGRES_PASSWORD)
      .withStartupTimeout(120_000)
      .start();
    pgp = pgpLib();
    db = pgp({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });
  });

  after(async () => {
    pgp.end();
    await container.stop();
  });

  it("works", async () => {
    expect(await db.one('SELECT current_database()')).to.deep.equal({ current_database: process.env.POSTGRES_DB });
  });
});