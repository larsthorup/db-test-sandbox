const { runProduction } = require('./pipeline-deploy');
const { runTest } = require('./pipeline-test');

const version = parseInt(process.argv[2]);

const main = async ({ version }) => {
  await runTest({ version });
  await runProduction({ version });
}

main({ version }).catch(console.error)
