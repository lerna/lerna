# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

The website is an npm workspace of the repository root, so dependencies are managed by the root `package.json` and `package-lock.json`.

### Installation

From the repository root:

```
$ npm install
```

### Local Development

```
$ npm run start -w website
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without
having to restart the server.

### Build

```
$ npm run build -w website
```

This command generates static content into the `build` directory and can be served using any static contents hosting
service.

### Deployment

Using SSH:

```
$ USE_SSH=true npm run deploy -w website
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> npm run deploy -w website
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to
the `gh-pages` branch.
