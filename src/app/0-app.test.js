const childProcessLib = require('child_process');
const path = require('path');
const { promisify } = require('util');

const { expect } = require('chai');

const exec = promisify(childProcessLib.exec);

describe('app', () => {
  it('should run against "test" db', () => {
    expect(process.env.POSTGRES_DB).to.equal('test');
  });

  it('should list emails of users alphabetically', async () => {
    const appPath = path.join(__dirname, '0-app.js');
    const { stdout } = await exec(`node ${appPath}`);
    expect(stdout).to.equal([
      'Users in "test" db',
      'adm@example.com',
      'u1@example.com',
      'u2@example.com',
      '',
    ].join('\n'));
  });
});