const connectDb = ({ pgPromise }) => {
  const host = process.env.POSTGRES_HOST;
  const port = parseInt(process.env.POSTGRES_PORT);
  const database = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  return pgPromise({ host, port, database, user, password });
}

module.exports = {
  connectDb
}