#!/usr/bin/env node

'use strict';

const path = require('path');
const spawn = require('child_process').spawn;
const Coverage = require('./coverage');

let coverage;

async function main() {
  if (!process.argv.includes('--no-coverage')) {
    coverage = new Coverage();
    await coverage.init();
  }

  const MOCHA_PATH = require.resolve('mocha/bin/mocha');
  const args = [
    MOCHA_PATH,
    '**/*.spec.ts',
    '--colors',
    '-r',
    path.join(__dirname, './ts.js')
  ];

  process.argv.slice(2).forEach(function (arg, idx, arr) {
    switch (arg) {
      case '-p':
      case '--project':
        const tsconfigPath = arr[idx + 1];
        process.env.TS_NODE_PROJECT = tsconfigPath;
        break;

      case '--no-coverage':
        break;

      default:
        args.push(arg);
        break;
    }
  });

  if (!process.argv.includes('--reporter'))
    args.push('--reporter', 'mocha-multi', '--reporter-options', 'spec=-,mocha-junit-reporter=-');

  const mocha = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: {
      LOGGING_ENABLED: false
    }
  });

  mocha.on('exit', async function (code, signal) {
    if (coverage && code === 0) {
      await coverage.report();
      await coverage.check();
    }

    process.on('exit', function () {
      if (signal)
        process.kill(process.pid, signal);
      else
        process.exit(code);
    });
  });

  process.on('SIGINT', function () {
    mocha.kill('SIGINT');
    mocha.kill('SIGTERM');
  });
}

main().catch(error => {
  try {
    console.error(error.message)
  } catch (_) {
    /* We need to run process.exit(1) even if stderr is destroyed */
  }

  process.exit(1)
})