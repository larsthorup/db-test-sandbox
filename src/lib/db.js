const { PostgreSqlContainer } = require("testcontainers");

const connectDb = ({ pgp }) => {
  const host = process.env.POSTGRES_HOST;
  const port = parseInt(process.env.POSTGRES_PORT);
  const database = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  return pgp({ host, port, database, user, password });
}

const provisionDb = async () => {
  const pgContainer = await new PostgreSqlContainer('postgres:13.3-alpine')
    .withDatabase(process.env.POSTGRES_DB)
    .withUsername(process.env.POSTGRES_USER)
    .withPassword(process.env.POSTGRES_PASSWORD)
    .start()
  process.env.POSTGRES_HOST = pgContainer.getHost();
  process.env.POSTGRES_PORT = pgContainer.getPort();
}

module.exports = {
  connectDb,
  provisionDb,
};