const yargs = require('yargs');
// const tmp = require('tmp');
const fs = require('fs');
const path = require('path');

const argv = yargs.argv;
const tempFile = `.temp-var-file.ts`;

if(argv.set) {
    const envFile = argv.set;

    console.log(`Backuping up '${envFile}' into '${tempFile}'.`);
    fs.copyFileSync(envFile, tempFile);
    const content = fs.readFileSync(envFile, "utf8");
    const variables = `solarputty_download_url: '${process.env.SOLARPUTTY_DOWNLOAD_URL}',`
    const replaced = content.replace('//ENV', variables);
    fs.writeFileSync(envFile, replaced);
}

if(argv.unset) {
    const envFile = argv.unset;
    console.log(`Restoring '${tempFile}' into '${envFile}'.`);
    fs.copyFileSync(tempFile, envFile);
}