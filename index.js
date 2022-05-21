'use strict';

const fs = require('fs');
const argv = require('yargs').argv;
const readlineSync = require('readline-sync');

const helpers = require('./lib/helpers');
const log = require('./lib/log');


const pathToRoot = process.cwd();
const pathToPackage = argv.pathToPackage || `${pathToRoot}/package.json`;
const info = helpers.getPackageInfo(pathToPackage);

const pathToPlist = argv.pathToPlist || `${pathToRoot}/ios/${info.name}/Info.plist`;
const pathToGradle = argv.pathToGradle || `${pathToRoot}/android/app/build.gradle`;
// handle case of several plist files
const pathsToPlists = Array.isArray(pathToPlist) ? pathToPlist : [pathToPlist];


// getting next version
const versionCurrent = info.version;
const versions = helpers.versions(versionCurrent);
let major = helpers.version(versions[0], argv.major);
let minor = helpers.version(versions[1], argv.minor, argv.major);
let patch = helpers.version(versions[2], argv.patch, argv.major || argv.minor);
const version = `${major}.${minor}.${patch}`;

log.info(`- runNumber (${argv.runNumber});`, 1);


// getting next build number
const buildCurrent = helpers.getBuildNumberFromPlist(pathsToPlists[0]);
const build = major + ('000' + minor).slice(-3) + ('000' + patch).slice(-3) + ('000' + argv.runNumber).slice(-3);

log.info(`New Build Nuimber ${build}`,1);

const message = version;

log.info('\nI\'m going to increase the version in:');
log.info(`- package.json (${pathToPackage});`, 1);
log.info(`- ios project (${pathsToPlists.join(', ')});`, 1);
log.info(`- android project (${pathToGradle}).`, 1);

log.notice(`\nThe version will be changed:`);
log.notice(`- from: ${versionCurrent} (${buildCurrent});`, 1);
log.notice(`- to:   ${version} (${build}).`, 1);



const chain = new Promise((resolve, reject) => {
  log.line();

  if (versions.length !== 3) {
    log.warning(`I can\'t understand format of the version "${versionCurrent}".`);
  }

  const question = log.info(`Use "${version}" as the next version? [y/n] `, 0, true);
  resolve()
});


const update = chain.then(() => {
  log.notice('\nUpdating versions');
}).then(() => {
  log.info('Updating version in xcode project...', 1);

  pathsToPlists.forEach(pathToPlist => {
    helpers.changeVersionAndBuildInPlist(pathToPlist, version, build);
  });
  log.success(`Version and build number in ios project (plist file) changed.`, 2);
}).then(() => {
  log.info('Updating version in android project...', 1);

  helpers.changeVersionAndBuildInGradle(pathToGradle, version, build);
  log.success(`Version and build number in android project (gradle file) changed.`, 2);
});

