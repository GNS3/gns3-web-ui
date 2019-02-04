const yargs = require('yargs');
const fs = require('fs');

const argv = yargs.argv;
const tempFile = `.temp-var-file.ts`;

if(argv.set) {
    const envFile = argv.set;
    console.log(`Backuping up '${envFile}' into '${tempFile}'.`);
    fs.copyFileSync(envFile, tempFile);
    let content = fs.readFileSync(envFile, "utf8");

    if(process.env.SOLARPUTTY_DOWNLOAD_URL) {
      const variables = `solarputty_download_url: '${process.env.SOLARPUTTY_DOWNLOAD_URL}',`
      content = content.replace('solarputty_download_url: "",', variables);
    }

    fs.writeFileSync(envFile, content);
}

if(argv.unset) {
    const envFile = argv.unset;
    console.log(`Restoring '${tempFile}' into '${envFile}'.`);
    fs.copyFileSync(tempFile, envFile);
}