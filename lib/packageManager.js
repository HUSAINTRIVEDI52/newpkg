'use strict';

const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');
const { logInfo, logSuccess, logError } = require('./logger');

/**
 * installDevDependency(pkgInput)
 *
 * Installs one or more packages into node_modules AND records them in devDependencies.
 * pkgInput can be a single string or an array of strings.
 */
exports.installDevDependency = async (pkgInput) => {
  const pkgs = Array.isArray(pkgInput) ? pkgInput : [pkgInput];
  const pkgPath = path.join(process.cwd(), 'package.json');

  if (!await fs.pathExists(pkgPath)) {
    logInfo(`No package.json found at ${process.cwd()}. Skipping: ${pkgs.join(', ')}`);
    return;
  }

  const pkgJson = await fs.readJSON(pkgPath);
  const missingPkgs = [];

  for (const pkg of pkgs) {
    const isInstalledInPkg = (pkgJson.dependencies && pkgJson.dependencies[pkg]) || 
                              (pkgJson.devDependencies && pkgJson.devDependencies[pkg]);
    
    const isBinaryPresent = await fs.pathExists(path.join(process.cwd(), 'node_modules', pkg));

    if (!isInstalledInPkg || !isBinaryPresent) {
      missingPkgs.push(pkg);
    }
  }

  if (missingPkgs.length === 0) {
    if (pkgs.length === 1) {
      logInfo(`${pkgs[0]} is already installed — skipping.`);
    } else {
      logInfo('All dependencies are already installed — skipping.');
    }
    return;
  }

  logInfo(`Installing missing dependencies: ${missingPkgs.join(', ')}...`);
  try {
    await execa('npm', ['install', '--save-dev', ...missingPkgs], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NPM_CONFIG_LEGACY_PEER_DEPS: 'true' },
    });
    logSuccess(`${missingPkgs.join(', ')} installed successfully.`);
  } catch (err) {
    logError(
      `Failed to install ${missingPkgs.join(', ')}: ${err.message}\n` +
      `  → Run manually: npm install --save-dev ${missingPkgs.join(' ')}`
    );
  }
};