/**
 * Install hook dependencies locally when Cordova has not already made them
 * available through the application.
 */

var path = require('path');
var spawnSync = require('child_process').spawnSync;
var pluginDependencies = require('../package.json').dependencies;

module.exports = function(ctx) {
  var pluginDirectory = path.join(
    ctx.opts.projectRoot,
    'plugins',
    ctx.opts.plugin.id
  );

  var hasAllDependencies = Object.keys(pluginDependencies).every(function(dependency) {
    try {
      require.resolve(dependency, { paths: [pluginDirectory] });
      return true;
    } catch (err) {
      return false;
    }
  });

  if (hasAllDependencies) {
    return;
  }

  var npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  var result = spawnSync(
    npm,
    ['install', '--omit=dev', '--no-save', '--package-lock=false'],
    {
      cwd: pluginDirectory,
      stdio: 'inherit'
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error('Failed to install plugin dependencies.');
  }
};
