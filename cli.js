#!/usr/bin/env node

const path = require('path');
const tinyssg = require('./index');

const args = process.argv.slice(2);
const command = args[0] || 'build';

// Try to load config from cwd
let config = {};
try {
  config = require(path.join(process.cwd(), 'config.js'));
} catch (_e) {
  // No config file, that's fine
}

if (command === 'build') {
  tinyssg.build(config);
} else if (command === 'serve') {
  tinyssg.serve(config);
} else {
  console.log('Usage: tinyssg [build|serve]');
  console.log('  build  - Build the site (default)');
  console.log('  serve  - Build and start dev server');
}
