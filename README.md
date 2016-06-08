# Arsenal

[![CircleCI][badgepub]](https://circleci.com/gh/scality/Arsenal)
[![Scality CI][badgepriv]](http://ci.ironmann.io/gh/scality/Arsenal)

Common utilities for the S3 project components

Within this repository, you will be able to find the shared libraries for the
multiple components making up the whole Project.

* [Guidelines](#guidelines)
* [Shuffle](#shuffle) to shuffle an array.
* [Errors](#errors) load an object of errors instances.
    - [errors/arsenalErrors.json](errors/arsenalErrors.json)

## Guidelines

Please read our coding and workflow guidelines at
[scality/Guidelines](https://github.com/scality/Guidelines).

### Contributing

In order to contribute, please follow the
[Contributing Guidelines](
https://github.com/scality/Guidelines/blob/master/CONTRIBUTING.md).

## Shuffle

### Usage

``` js
import { shuffle } from 'arsenal';

let array = [1, 2, 3, 4, 5];

shuffle(array);

console.log(array);

//[5, 3, 1, 2, 4]
```

## Errors

### Usage

``` js
import { errors } from 'arsenal';

console.log(errors.AccessDenied);

//{ [Error: AccessDenied]
//    code: 403,
//    description: 'Access Denied',
//    AccessDenied: true }

```

## Clustering

The clustering class can be used to set up a cluster of workers. The class will
create at least 1 worker, will log any worker event (started, exited).
The class has also a watchdog who will restart workers until the stop() method
is called.

### Usage

#### Simple

```
import { Clustering } from 'arsenal';

const clusters = new Clustering(clusterSize, logger);
clusters.start(current => {
    // Put here the logic of every worker.
    // 'current' is the Clustering instance, worker id is accessible by
    // current.getIndex()
});
```

The callback will be called every time a worker is started/restarted.

#### Handle exit

```
import { Clustering } from 'arsenal';

const clusters = new Clustering(clusterSize, logger);
clusters.start(current => {
    // Put here the logic of every worker.
    // 'current' is the Clustering instance, worker id is accessible by
    // current.getIndex()
}).onExit(current => {
    if (current.isMaster()) {
        // Master process exiting
    } else {
        const id = current.getIndex();
        // Worker (id) exiting
    }
});
```

You can handle the exiting event on both master and workers by calling the
'onExit' method and setting the callback. That allow release ressources  or
save states before exiting a worker or the master.

#### Silenting signal

```
import { Clustering } from 'arsenal';

const clusters = new Clustering(clusterSize, logger);
clusters.start(current => {
    // Put here the logic of every worker.
    // 'current' is the Clustering instance, worker id is accessible by
    // current.getIndex()
}).onExit((current, signal) => {
    if (signal !== 'SIGTERM') {
        process.exit(current.getStatus());
    }
});
```

You can silent stop signals, by simply not exiting on the exit callback

[badgepub]: https://circleci.com/gh/scality/Arsenal.svg?style=svg
[badgepriv]: http://ci.ironmann.io/gh/scality/Arsenal.svg?style=svg&circle-token=c3d2570682cba6763a97ea0bc87521941413d75c
