/*
Hook executed before the 'prepare' stage. Only for iOS project.
It will check if project name has changed. If so - it will change the name of the .entitlements file to remove that file duplicates.
If file name has no changed - hook will do nothing.
*/

var path = require('path');
var fs = require('fs');
var ConfigXmlHelper = require('./lib/configXmlHelper.js');

module.exports = function(ctx) {
  run(ctx);
};

/**
 * Run the hook logic.
 *
 * @param {Object} ctx - cordova context object
 */
function run(ctx) {
  var projectRoot = ctx.opts.projectRoot;
  var iosProjectFilePath = path.join(projectRoot, 'platforms', 'ios');
  var configXmlHelper = new ConfigXmlHelper(ctx);
  var newProjectName = configXmlHelper.getProjectName();

  var oldProjectName = getOldProjectName(iosProjectFilePath);
  if (!oldProjectName) {
    return;
  }

  // cordova-ios 8 uses a stable native project folder named "App" even when
  // the Cordova display name is different. There is nothing to rename.
  if (oldProjectName === 'App') {
    return;
  }

  // if name has not changed - do nothing
  if (oldProjectName.length && oldProjectName === newProjectName) {
    return;
  }

  // if it does - rename it
  var oldEntitlementsFilePath = getEntitlementsFilePath(iosProjectFilePath, oldProjectName, oldProjectName);
  var newEntitlementsFilePath = getEntitlementsFilePath(iosProjectFilePath, oldProjectName, newProjectName);

  if (!oldEntitlementsFilePath || !newEntitlementsFilePath || !fs.existsSync(oldEntitlementsFilePath)) {
    return;
  }

  console.log('Project name has changed. Renaming .entitlements file.');

  try {
    fs.renameSync(oldEntitlementsFilePath, newEntitlementsFilePath);
  } catch (err) {
    console.warn('Failed to rename .entitlements file.');
    console.warn(err);
  }
}

// region Private API

/**
 * Get old name of the project.
 * Name is detected by the name of the .xcodeproj file.
 *
 * @param {String} projectDir absolute path to ios project directory
 * @return {String} old project name
 */
function getOldProjectName(projectDir) {
  var files = [];
  try {
    files = fs.readdirSync(projectDir);
  } catch (err) {
    return '';
  }

  var projectFile = '';
  files.forEach(function(fileName) {
    if (path.extname(fileName) === '.xcodeproj') {
      projectFile = path.basename(fileName, '.xcodeproj');
    }
  });

  return projectFile;
}

function getEntitlementsFilePath(projectDir, oldProjectName, fileProjectName) {
  var candidates = [
    path.join(projectDir, oldProjectName, 'Resources', fileProjectName + '.entitlements'),
    path.join(projectDir, oldProjectName, fileProjectName + '.entitlements'),
    path.join(projectDir, oldProjectName, 'Resources', 'Entitlements-Debug.plist'),
    path.join(projectDir, oldProjectName, 'Entitlements-Debug.plist')
  ];

  for (var i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) {
      return candidates[i];
    }
  }

  return candidates[0];
}

// endregion
