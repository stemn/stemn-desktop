const path = require('path');
const fs = require('fs');
const pkg = require('../../package.json');
const ghRelease = require('gh-release');

const config = {
  owner: 'Stemn',
  repo: 'Stemn-Desktop',
}

// We assume we are running this script from the root folder
const assetsPath = './release/mac';

const createDir = (dir) => {
  // This will create a dir given a path such as './folder/subfolder' 
  const splitPath = dir.split('/');
  splitPath.reduce((path, subPath) => {
    let currentPath;
    if(subPath != '.'){
      currentPath = path + '/' + subPath;
      if (!fs.existsSync(currentPath)){
        fs.mkdirSync(currentPath);
      }
    }
    else{
      currentPath = subPath;
    }
    return currentPath
  }, '')
}

const publishOsxReleaseFile = (tag) => {
  console.log('Writing release.json to release/mac/release.json...');
  const data = {
    url: `https://github.com/${config.owner}/${config.repo}/releases/download/v${tag}/Stemn-${tag}-mac.zip`,
    name: '',
    notes: '',
    pub_date: new Date().toISOString()
  };
  
  // Create the release/mac dir if it doesn't exist
  createDir(assetsPath)

  // Write release.json to disk
  const releaseFilePath = path.join(assetsPath, 'release.json');
  fs.writeFileSync(releaseFilePath, JSON.stringify(data, null, '  '));
}

publishOsxReleaseFile(pkg.version);


const options = {
  tag_name: `v${pkg.version}`,
  target_commitish: 'something',
  name: `v${pkg.version}`,
  body: ' ',
  draft: true,
  prerelease: false,
  repo: config.repo,
  owner: config.owner,
  assets: ['./release/mac/release.json'],
  workpath: './',
  auth: {
    token: process.env.GH_TOKEN,
  }
}

console.log('Adding release.json to github release');
ghRelease(options, function (err, result) {
  if (err) throw err
  console.log(result);
})