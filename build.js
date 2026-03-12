#!/usr/bin/env node
/**
 * Build script for Teambuilder Beautify
 * Generates the Chrome extension JS from the Tampermonkey userscript.
 */

const fs = require('fs');
const path = require('path');

const userscript = fs.readFileSync(path.join(__dirname, 'teambuilder-beautify.user.js'), 'utf8');

// Strip the ==UserScript== header block for the Chrome extension
const extensionJS = userscript.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/, '');

const extDir = path.join(__dirname, 'chrome-extension');
fs.writeFileSync(path.join(extDir, 'teambuilder-beautify.js'), extensionJS, 'utf8');

// Sync version from userscript to manifest
const versionMatch = userscript.match(/@version\s+(\S+)/);
if (versionMatch) {
  const manifestPath = path.join(extDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = versionMatch[1];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

console.log('Build complete!');
console.log('  - chrome-extension/teambuilder-beautify.js');
console.log('  - Version:', versionMatch ? versionMatch[1] : 'unknown');
