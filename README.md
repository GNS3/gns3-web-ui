# gns3-web-ui

[![Build](https://github.com/GNS3/gns3-web-ui/actions/workflows/main.yml/badge.svg)](https://github.com/GNS3/gns3-web-ui/actions/workflows/main.yml)
[![Dependency](https://img.shields.io/librariesio/github/GNS3/gns3-web-ui)](https://libraries.io/github/GNS3/gns3-web-ui)
[![Packages versions](https://repology.org/badge/latest-versions/gns3.svg)](https://repology.org/metapackage/gns3/versions)
[![Packages](https://repology.org/badge/tiny-repos/gns3.svg)](https://repology.org/metapackage/gns3/versions)

## Demo

Please use GNS3 WebUI bundled in `gns3server` and `gns3`.

## Development

### Branches policy

**Current branch**: `master-3.0` (Angular 21 Zoneless)

This is the active development branch using Angular 21 Zoneless framework.

### Installation

We're using [yarn](https://yarnpkg.com/lang/en/) for packages installation:

```
yarn install
```

#### Run GNS3 server

Visit [gns3-server](https://github.com/GNS3/gns3-server) for guide how to run GNS3 server.

#### Run WebUI

```
yarn start
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

### Build

Run `yarn build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

### Running unit tests

Run `yarn test` to execute the unit tests via [Vitest](https://vitest.dev/).

### Code Quality Standards

This project enforces strict code quality standards through automated checks:

**Pre-commit Hooks**:
- No `!important` in SCSS
- No `::ng-deep` or `:deep()` in SCSS
- No `ViewEncapsulation.None`
- No Zone.js APIs (Zoneless framework)
- No hardcoded colors (use CSS variables)

**Hardcoded Color Protection**:
- Use Material Design 3 variables: `--mat-sys-*`
- Use GNS3 variables: `var(--gns3-*)`
- See [docs/guides/css/](docs/guides/css/) for details

**For exceptions**:
- See [How to Add Hardcoded Colors](docs/guides/css/how-to-add-hardcoded-colors.md)
- Requires `hooks-update` label when modifying quality checks

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.


## Releasing

### Distribute release

To create a release:

1. Build the project: `yarn build --configuration production`
2. Create a new release on [GitHub Releases](https://github.com/GNS3/gns3-web-ui/releases)
3. Tag the release: `git tag v3.1.0 && git push origin v3.1.0`
4. Upload the build artifacts from the `dist/` directory

After publishing the release, update the version in `package.json` to the next development version (e.g., `3.1.0` → `3.2.0-dev`).

#### Updating gns3server

To bundle this Web UI into gns3-server, checkout the latest gns3-server and run:

```bash
./scripts/update-bundled-web-ui.sh
```

Commit the changes with an appropriate release message.

## Contributing

Want to contribute to GNS3 Web UI? We'd love your help!

Check out [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup and guidelines
- Code style and standards
- Testing best practices
- Pull request process

## Further help

- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Documentation**: See [docs/](docs/) directory
- **Project Guide**: See [CLAUDE.md](CLAUDE.md) for AI-assisted development
- **Issues**: [GitHub Issues](https://github.com/GNS3/gns3-web-ui/issues)

For questions, feel free to open an issue or reach us at `developers@gns3.net`.
