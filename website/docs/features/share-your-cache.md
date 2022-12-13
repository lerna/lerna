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

You can connect your workspace to Nx Cloud by running:

```bash
npx nx connect-to-nx-cloud
```

```bash title="Terminal Output"
✔ Enable distributed caching to make your CI faster · Yes

>  NX  Generating @nrwl/nx-cloud:init

UPDATE nx.json

 >  NX   Distributed caching via Nx Cloud has been enabled

   In addition to the caching, Nx Cloud provides config-free distributed execution,
   UI for viewing complex runs and GitHub integration. Learn more at https://nx.app

   Your workspace is currently unclaimed. Run details from unclaimed workspaces can be viewed on cloud.nx.app by anyone
   with the link. Claim your workspace at the following link to restrict access.

   https://cloud.nx.app/orgs/workspace-setup?accessToken=YOURACCESSTOKEN
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

 >  Lerna (powered by Nx)   Successfully ran target build for project header (2s)

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

 >  Lerna (powered by Nx)   Successfully ran target build for project header (664ms)

   Nx read the output from the cache instead of running the command for 1 out of 1 tasks.

   Nx Cloud made it possible to reuse header: https://nx.app/runs/P0X6ZGTkqZ
```

## Connecting Your Workspace to Your Nx Cloud Account

After you have enabled Nx Cloud in your workspace, you will see the following:

```shell
>  NX   NOTE  Nx Cloud has been enabled

  Your workspace is currently public. Anybody with code access
  can view the workspace on nx.app.

  You can connect the workspace to your Nx Cloud account at
  https://nx.app/orgs/workspace-setup?accessToken=N2Y3NzcyO...
  (You can do this later.)
```

Click on this link to associate the workspace with your Nx Cloud account. If you don't have an Nx Cloud account, you can
create one on the spot.

After you claim your workspace, you will be able to manage permissions, create access tokens, set up billing, and so
forth.

**You will also see an interactive tutorial helping you explore distributed caching and the Nx Cloud user interface.**

If you lose this link, you can still connect your workspace to Nx Cloud. Go to [nx.app](https://nx.app), create an
account, and connect your workspace using the access token from `nx.json`.

## Skipping Cloud

Similar to how `--skip-nx-cache` will instruct Nx not to use the cache, passing `--no-cloud` will tell Nx not to use Nx
Cloud.
