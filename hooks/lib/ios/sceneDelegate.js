var fs = require('fs');
var path = require('path');

var PATCH_MARKER = 'cordova-plugin-deeplinks: handle cold-start universal links';

/**
 * Patch the cordova-ios 8 SceneDelegate so Universal Links received while the
 * app is not running are forwarded through Cordova's existing notification.
 *
 * @param {Object} cordovaContext - Cordova hook context
 */
exports.enableColdStartUniversalLinks = function(cordovaContext) {
  var sceneDelegatePath = path.join(
    cordovaContext.opts.projectRoot,
    'platforms',
    'ios',
    'App',
    'SceneDelegate.swift'
  );

  if (!fs.existsSync(sceneDelegatePath)) {
    return;
  }

  var source = fs.readFileSync(sceneDelegatePath, 'utf8');
  if (source.indexOf(PATCH_MARKER) !== -1) {
    return;
  }

  var classDeclaration = /class\s+SceneDelegate\s*:\s*CDVSceneDelegate\s*\{/;
  if (!classDeclaration.test(source)) {
    console.warn('Could not add cold-start Universal Link handling to SceneDelegate.swift.');
    return;
  }

  var handler = [
    '',
    '    // ' + PATCH_MARKER,
    '    override func scene(',
    '        _ scene: UIScene,',
    '        willConnectTo session: UISceneSession,',
    '        options connectionOptions: UIScene.ConnectionOptions',
    '    ) {',
    '        super.scene(scene, willConnectTo: session, options: connectionOptions)',
    '',
    '        guard !connectionOptions.userActivities.isEmpty else {',
    '            return',
    '        }',
    '',
    '        // Load onload plugins before forwarding the activity so the',
    '        // UniversalLinks observer is ready to receive and buffer it.',
    '        window.rootViewController?.loadViewIfNeeded()',
    '',
    '        for userActivity in connectionOptions.userActivities {',
    '            super.scene(scene, continue: userActivity)',
    '        }',
    '    }',
    ''
  ].join('\n');

  source = source.replace(classDeclaration, function(match) {
    return match + handler;
  });

  fs.writeFileSync(sceneDelegatePath, source, 'utf8');
};
