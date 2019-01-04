const { init } = require('@sentry/electron');
const fs = require('fs');

const { ipcRenderer } = require('electron')

let crashReportsEnabled = true;
const DSN =
  'https://cb7b474b2e874afb8e400c47d1452ecc:7876224cbff543d992cb0ac4021962f8@sentry.io/1040940';

const isDev = () => {
  return fs.existsSync('.git');
};

const shouldSendCallback = () => {
  return !isDev() && crashReportsEnabled;
};


ipcRenderer.on('settings.changed', function (event, settings) {
  crashReportsEnabled = settings.crash_reports;
});


init({
  dsn: DSN,
  shouldSendCallback: shouldSendCallback
});
