const { SentryClient } = require('@sentry/electron');

const DSN =
  'https://cb7b474b2e874afb8e400c47d1452ecc:7876224cbff543d992cb0ac4021962f8@sentry.io/1040940';

SentryClient.create({
  dsn: DSN
});
