---
id: share-your-cache
title: Share Your Cache
type: recipe
---

# Share Your Cache

The computation cache provided by Lerna can be distributed across multiple machines. You can either build an implementation
of the cache or use Nx Cloud. Nx Cloud is an app that provides a fast and zero-config implementation of distributed
caching. It's completely free for OSS projects and for most closed-sourced
projects ([read more here](https://dev.to/nrwl/more-time-saved-for-free-with-nx-cloud-4a2j)).

**Connecting your workspace to Nx Cloud is easy via the interactive, browser-baseed workflow.** You can start the process by running the following command from your lerna workspace root which will automatically open a browser window to your unique connection URL:

```bash title="Terminal Output"
npx nx connect-to-nx-cloud

✔ Opening Nx Cloud https://cloud.nx.app/connect/abc123456 in your browser to connect your workspace.
```

To see the remote cache in action, run:

```bash
lerna run build --scope=header && nx reset && lerna run build --scope=header
```

```bash title="Terminal Output"
> lerna run build --scope=header

> header@0.0.0 build
> rimraf dist && rollup --config

src/index.tsx → dist...
created dist in 786ms

 —————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

 Lerna (powered by Nx)   Successfully ran target build for project header (2s)

   See logs and investigate cache misses at https://cloud.nx.app/runs/k0HDHACpL8


 >  NX   Resetting the Nx workspace cache and stopping the Nx Daemon.

   This might take a few minutes.


 >  NX   Daemon Server - Stopped


 >  NX   Successfully reset the Nx workspace.


> lerna run build --scope=header  [remote cache]


> header@0.0.0 build
> rimraf dist && rollup --config


src/index.tsx → dist...
created dist in 786ms

 —————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

 Lerna (powered by Nx)   Successfully ran target build for project header (664ms)

   Nx read the output from the cache instead of running the command for 1 out of 1 tasks.

   Nx Cloud made it possible to reuse header: https://nx.app/runs/P0X6ZGTkqZ
```

## Skipping Cloud

Similar to how `--skip-nx-cache` will instruct Nx not to use the cache, passing `--no-cloud` will tell Nx not to use Nx
Cloud. You can also set `NX_NO_CLOUD` to `true` in your environment.
