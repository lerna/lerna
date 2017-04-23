# Troubleshooting

This document contains solutions for certain issues our users encountered 
in the past while using Lerna.

## Bootstrap Command

### Error when using yarn as an npm client

Before the release of Lerna `v2.0.0-rc.3` users of the flag `--npm-client` 
who provided yarn as a client may have suffered from the bootstrap process 
not being able to run properly.

```
Error running command.
error Command failed with exit code 1.
```

If you can upgrade Lerna to said version please do so, or as an alternative  
solution you can add `--concurrency=1`.

## Import Command

### Buffer problems during import

When you try to import a repository which has many commits in it there is a 
chance that you get an error such as:

```
DeprecationWarning: Unhandled promise rejections are deprecated
```

or 

```
Error: spawnSync /bin/sh ENOBUFS during ImportCommand.execute
```

#### Solution:

Run `lerna import` with the `--max-buffer` flag and provide a large enough 
number (in bytes). At the writing of this entry the underlying default is 
10MB, so you should keep this in mind. 
