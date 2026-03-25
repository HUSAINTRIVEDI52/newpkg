'use strict';

const fs = require('fs-extra');
const path = require('path');
const { logInfo, logSuccess } = require('./logger');

/**
 * checkForTypeScript(projectRoot)
 *
 * Checks if the project uses TypeScript by looking for:
 * - tsconfig.json file
 * - .ts/.tsx files in the project
 */
async function checkForTypeScript(projectRoot) {
  // Check for typescript in package.json
  const pkgPath = path.join(projectRoot, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJSON(pkgPath);
      if (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) {
        return true;
      }
    } catch {
      // Ignore errors
    }
  }

  // Check for tsconfig.json
  if (await fs.pathExists(path.join(projectRoot, 'tsconfig.json'))) {
    return true;
  }

  // Check for TypeScript files in common directories
  const searchDirs = ['src', 'lib', 'app', 'components', 'pages', 'utils'];

  for (const dir of searchDirs) {
    const dirPath = path.join(projectRoot, dir);
    if (await fs.pathExists(dirPath)) {
      try {
        const files = await fs.readdir(dirPath);
        const hasTsFiles = files.some(file =>
          file.endsWith('.ts') || file.endsWith('.tsx')
        );
        if (hasTsFiles) return true;
      } catch {
        // Ignore directory read errors
      }
    }
  }

  // Check root directory for TypeScript files
  try {
    const rootFiles = await fs.readdir(projectRoot);
    return rootFiles.some(file =>
      file.endsWith('.ts') || file.endsWith('.tsx')
    );
  } catch {
    return false;
  }
}

/**
 * setupESLintConfig()
 * Checks if an ESLint configuration exists. If not, creates a default one.
 * If one exists, merges only the required settings (root:true + .mjs override).
 * Works for both JavaScript-only and TypeScript projects.
 */
exports.setupESLintConfig = async () => {
  const projectRoot = process.cwd();

  // Check if TypeScript is used in the project
  const hasTypeScript = await checkForTypeScript(projectRoot);

  // Detect ESLint version to decide flat config (v9+) vs legacy (.eslintrc)
  let isLegacy = false;
  try {
    const eslintPkgPath = path.join(projectRoot, 'node_modules', 'eslint', 'package.json');
    if (await fs.pathExists(eslintPkgPath)) {
      const eslintPkg = await fs.readJSON(eslintPkgPath);
      const version = parseInt(eslintPkg.version.split('.')[0], 10);
      if (version < 9) {
        isLegacy = true;
      }
    }
  } catch {
    // Ignore errors, assume modern ESLint (v9+)
  }

  // List of required base dependencies
  const baseDeps = ['eslint', '@eslint/js'];

  // Install TypeScript ESLint dependencies if TypeScript is detected
  const { installDevDependency } = require('./packageManager');
  if (hasTypeScript) {
    logInfo('TypeScript files detected. Installing TypeScript ESLint dependencies...');
    await installDevDependency([
      ...baseDeps,
      '@typescript-eslint/parser',
      '@typescript-eslint/eslint-plugin',
      'typescript'
    ]);
  } else {
    logInfo('Installing basic ESLint dependencies...');
    await installDevDependency(baseDeps);
  }

  // List of common ESLint config files (flat config v9+ and legacy)
  const configFiles = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    '.eslintrc.json',
    '.eslintrc',
  ];

  // ── Cleanup: Always remove existing config files to ensure a fresh overwrite ─
  logInfo('Cleaning up existing ESLint configuration files for a fresh overwrite...');
  for (const file of configFiles) {
    const filePath = path.join(projectRoot, file);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      logInfo(`Removed existing config: ${file}`);
    }
  }

  // Cleanup: Remove redundant eslintConfig from package.json if it exists
  const pkgPath = path.join(projectRoot, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJSON(pkgPath);
      if (pkg.eslintConfig) {
        delete pkg.eslintConfig;
        await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
        logInfo('Removed redundant eslintConfig from package.json.');
      }
    } catch {
      // Ignore errors
    }
  }

  // ── Apply template automatically (overwrite mode) ───────────────────────────
  const templateFile = isLegacy ? '.eslintrc.json' : 'eslint.config.mjs';
  const fullTemplatePath = path.resolve(__dirname, '../templates', templateFile);
  const targetPath = path.join(projectRoot, templateFile);

  logInfo(`Applying default ESLint config: ${templateFile} (TypeScript: ${hasTypeScript}, Legacy: ${isLegacy})...`);

  if (!await fs.pathExists(fullTemplatePath)) {
    logInfo(`${templateFile} template not found — skipping configuration.`);
    return;
  }

  await fs.copy(fullTemplatePath, targetPath, { overwrite: true });
  logSuccess(`ESLint config applied: ${targetPath}`);

  // Note: Manual TypeScript extension of .eslintrc.json is no longer required 
  // as the new legacy template already includes comprehensive TS support.
};