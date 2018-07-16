# gns3-web-ui

[![Greenkeeper badge](https://badges.greenkeeper.io/GNS3/gns3-web-ui.svg)](https://greenkeeper.io/)
[![Travis CI](https://api.travis-ci.org/GNS3/gns3-web-ui.svg?branch=master)](https://travis-ci.org)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/github/GNS3/gns3-web-ui?branch=master&svg=true)](https://www.appveyor.com/)
[![CircleCI](https://circleci.com/gh/GNS3/gns3-web-ui/tree/master.png)](https://circleci.com/gh/GNS3/gns3-web-ui/tree/master.png)
[![codecov](https://codecov.io/gh/GNS3/gns3-web-ui/branch/master/graph/badge.svg)](https://codecov.io/gh/GNS3/gns3-web-ui)


Test WebUI implementation for GNS3. 

This is not production ready version. It has been made to evaluate possibility of creation Web User Interface for GNS3 application.


## Demo

Please use GNS3 WebUI bundled in `gns3server` and `gns3`.

## Development

### Installation

We're using [yarn](https://yarnpkg.com/lang/en/) for packages installation:

```
yarn install
```

#### Run GNS3 server

Visit [gns3-server](https://github.com/GNS3/gns3-server) for guide how to run GNS3 server.

#### Run WebUI

```
yarn ng serve
``` 

Application is accessible on `http://127.0.0.1:4200/`. The app will automatically reload if you change any of the source files.

### Docker container

For development you can also run the GNS3 Web UI in a container

```
bash scripts/docker_dev_webui.sh
```

### How to upgrade package.json?

```
yarn upgrade --latest
```

### gns3server bundled in WebUI - electron based

In special cases it's possible to build `gns3server` for GNS3 WebUI. This version is included in `electronjs` dist application.

```
python3 scripts/build.py build -b dist
```

### Code scaffolding

Run `yarn ng generate component component-name` to generate a new component. You can also use `yarn ng generate directive|pipe|service|class|module`.

### Build

Run `yarn ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

### Running unit tests

Run `yarn ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).


## Releasing

### Bumping releases

We're using [version-bump-prompt](https://www.npmjs.com/package/version-bump-prompt) for increasing version.

Install `version-bump-prompt` via:

        npm install -g version-bump-prompt
        
If you would like to bump prepatch just type:

        bump --prepatch --tag --push
        
### Distribute release

We have got configured CircleCI, TravisCI and AppVeyor for distributing application for particular platform. In order to release you need to tag&push your changes.

Using `bump`:

        bump --patch --tag --push

Or manually:

        git tag v0.0.1
        git push origin v0.0.1
        

When artifacts are made you can see draft release here: [gns3-web-ui releases](https://github.com/GNS3/gns3-web-ui/releases) which is waiting to be published.
After release please change current version in `package.json` to `X.X.X-beta.0`'. Otherwise artifacts will be overwritten during the next commit. 

You may use `bump` to achieve that:
      
        bump --prepatch

### Staging release

In case you would like to create a new staging release. Please create draft release on github, like `0.0.1-dev1`. After successful build you can find artifacts there. 


## Further help

If you want to contribute to GNS3 Web UI feel free to reach us at `developers@gns3.net`.
