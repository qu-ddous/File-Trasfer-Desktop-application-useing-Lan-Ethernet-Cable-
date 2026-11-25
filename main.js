const path = require('path');
const fs = require('fs');

// Primary path to compiled Electron main
const primaryMain = path.join(__dirname, 'dist-electron', 'main', 'main.js');
const fallbackMain = path.join(__dirname, 'main', 'main.js');

if (fs.existsSync(primaryMain)) {
  require(primaryMain);
} else if (fs.existsSync(fallbackMain)) {
  require(fallbackMain);
} else {
  console.error('[WireDrop] Could not find compiled main entry point.');
}
