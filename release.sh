git pull

cp -r ../stemn-electron/dist .
cp -r ../stemn-electron/build .
cp ../stemn-electron/package.json .

git commit -am 'release'
git push
