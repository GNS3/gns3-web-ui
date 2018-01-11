# gns3-web-ui

Test WebUI implementation for GNS3. 

This is not production ready version. It has been made to evaluate possibility of creation Web User Interface for GNS3 application.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.2.6.

## Installation for development

Please install `npm` if not present in your system. 

Next step is `angular-cli` installation:

```
npm install @angular/cli
```

## Development server

### Run GNS3 server

Please run locally GNS3 server.

### Using default CORS policy.

GNS3 server contains CORS policies to run Web UI on 8080 at localhost. In order to use it, please run development server with custom port:

```
ng serve --port 8080
``` 

Application is accessible on `http://localhost:8080/`. The app will automatically reload if you change any of the source files.


## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.


# Releasing

## Bumping releases

We're using [version-bump-prompt](https://www.npmjs.com/package/version-bump-prompt) for increasing version.

Intall `bump` via:

        npm install -g version-bump-prompt
        
If you would like to bump prepatch just type:

        bump --prepatch --tag --push
        
## Final release

We have got configured CircleCI, TravisCI and AppVeyor for distributing application for particular platform. In order to release you need to tag your code nad push it.

Using `bump`:

        bump --patch --tag --push

Or manually:

        git tag v0.0.1
        git push origin v0.0.1
        

When artifacts are made you can see draft release here: [gns3-web-ui releases](https://github.com/GNS3/gns3-web-ui/releases) which is waiting to be published.
After release please change current version in `package.json` to `X.X.X-beta.0`'. Otherwise artifacts will be overwritten during the next commit. 

You may use `bump` to achieve that:
      
        bump --prepatch

## Staging release

In case you would like to create a new staging release. Please create draft release on github, like `0.0.1-dev1`. After successful build you can find there artifacts. 


## Further help

If you want to contribute to GNS3 Web UI feel free to reach us at `developers@gns3.net`.
