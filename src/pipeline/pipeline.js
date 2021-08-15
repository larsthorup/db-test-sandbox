const childProcessLib = require('child_process');
const { promisify } = require('util');

const spawn = async (command, args) => {
  return new Promise((resolve, reject) => {
    const process = childProcessLib.spawn(command, args, { stdio: 'inherit' });
    process.on('error', reject);
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command "${command} ${args.join(' ')}" failed with exit code ${code}`))
      }
    });
  })
};

const pipeline = async ({ version }) => {
  await spawn('node', ['src/pipeline/pipeline-test', version]);
  await spawn('node', ['src/pipeline/pipeline-deploy', version]);
}

const version = parseInt(process.argv[2]);
pipeline({ version }).catch((err) => { console.error(err.stack); process.exit(1); })
