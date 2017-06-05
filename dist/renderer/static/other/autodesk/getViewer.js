const viewerFileList = require('./fileList.js');
const http = require('axios');
const fs = require('fs');
const mkdirp = require('mkdirp');

// Config - Change this as required
const version = 'v2.13'
const outputFolder = 'viewer-2-13'

const downloadAndSave = ({url, dest, onProgress}) => {
  return new Promise((resolve, reject) => {
    http({
      url          : url,
      responseType : 'stream'
    }).then(response => {
      // Make directory
      const path       = dest.substring(0, dest.lastIndexOf('/'));
      mkdirp(path, () => {
        const stream     = response.data;
        const file       = fs.createWriteStream(dest);
        stream.on('error', response => {
          fs.unlink(dest);
          console.log(`Error downloading: ${url}`);
          reject('error')
        });
        stream.on('end', response => {
          console.log(`Downloaded and saved: ${url}`);
          resolve('success')
        });
        stream.pipe(file);
      })
    })
  })
};

Promise.all(viewerFileList.map(item => downloadAndSave({
  url  : `https://developer.api.autodesk.com/viewingservice/v1/viewers/${item}?v=${version}`,
  dest : `./${outputFolder}/${item}`
}))).then(response => {
  console.log('Download complete');
})

