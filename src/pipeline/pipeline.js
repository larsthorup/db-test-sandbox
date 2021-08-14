const { runProduction } = require('./pipeline-deploy');

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
