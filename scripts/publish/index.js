const path = require('path');
const fs = require('fs');
const pkg = require('../../package.json')

// We assume we are running this script from the root folder
const assetsPath = './release/mac';

const publishOsxReleaseFile = (tag) => {
  console.log('------------------------------------');
  console.log('Writing release.json to release.json');
  const data = {
    url: `https://github.com/Stemn/Stemn-Desktop/releases/download/v${tag}/Stemn-${tag}-mac.zip`,
    name: '',
    notes: '',
    pub_date: new Date().toISOString()
  };
  const releaseFilePath = path.join(assetsPath, 'release.json');
  fs.writeFileSync(releaseFilePath, JSON.stringify(data, null, '  '));
}

publishOsxReleaseFile(pkg.version);