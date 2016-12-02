const path = require('path');
const fs = require('fs');
const pkg = require('../../package.json')

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
    url: `https://github.com/Stemn/Stemn-Desktop/releases/download/v${tag}/Stemn-${tag}-mac.zip`,
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