# sequelize-utils


Some handy utils for the development of Sequelize.

## Overview


```
bin/sequelize-utils -h

  Usage: sequelize-utils [options]

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -d, --download-repositories  Downloads all the related repositories.
    -t, --test [branch]          Runs the tests for the given branch.
    -r, --release [version]      Releases a new version after running the tests.
    -u, --update-bundles         Releases new bundles for the supported dialects.
    -f, --force                  Submit changes to the remote servers.
```

## Releasing a new version

In order to release version of Sequelize you just have to call this:

```
# download all the repositories
bin/sequelize-utils -d

# release a new version + the respective v2.0.0
bin/sequelize-utils -r 1.7.0-beta.<X>

# release the bundled versions
bin/sequelize-utils -u

```