## Depricated - New viewer have 'Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS'

A few changes has been made to allow the bearer token to be added to requests for svf data...

## Changes
The autodesk source code has been modified to allow Authorization headers to be added to some GET requests (those fetching SVF data from STEMNs servers)
Namely, an additional option is now supported: `svfHeaders : { some header object }`

These changes must be replicated on any new version of the Autodesk viewer.


** LINE 19544 - Viewer3d.js (v2.13) **
Add the headers to the svf/pf file requests
```
SvfLoader.prototype.loadSvfCB = function(path, options, onSuccess, onError, onWorkerStart) {
    this.t0 = new Date().getTime();
    this.firstPixelTimestamp = null;
    this.failedToLoadSomeGeometryPacks = null;
    this.failedToLoadPacksCount = 0;
    var first = true;

    var scope = this;
    var msg = {
        url: avp.pathToURL(path),
        basePath: this.currentLoadPath,
        objectIds : options.ids,
        globalOffset : options.globalOffset,
        placementTransform : options.placementTransform,
        applyRefPoint: options.applyRefPoint,
        queryParams : this.queryParam,
        bvhOptions : options.bvhOptions || {isWeakDevice : av.isMobileDevice()},
        applyScaling: options.applyScaling,
        loadInstanceTree: options.loadInstanceTree,
		headers: options.svfHeaders,        <-------------- THIS WAS ADDED (it takes the svfHeaders option and applies it to the SVF workers context which then runs in the LMV file as `ViewingService.rawGet`)
    };
	
```

** LINE 18861 - Viewer3d.js (v.2.13) **
Add the headers to the DB loaders. Inside the function `PropDbLoader.prototype.load = function() {`:
```
    var options = this.model.loader.options <-------------- GET THE OPTIONS
    var xfer = { "operation":WORKER_LOAD_PROPERTYDB,
       "dbPath": this.dbPath,
       "sharedDbPath": this.sharedDbPath,
       "propertydb" : this.dbFiles,
       "fragToDbId": this.svf && this.svf.fragments.fragId2dbId, //the 1:1 mapping of fragment to dbId we got from the SVF or the 1:many we built on the fly for f2d
       "fragBoxes" : this.svf && this.svf.fragments.boxes, //needed to precompute bounding box hierarchy for explode function (and possibly others)
       headers: options.svfHeaders, <-------------- ADD THE HEADERS
       cbId: cbId,
       queryParams : this.queryParam }; 
```

** LINE 20083 - Viewer3d.js (v.2.13) **
```
  var xfer = { "operation":WORKER_LOAD_GEOMETRY,
     "url": reqPath,
     "packId": parseInt(packId), /* mesh IDs treat the pack file id as integer to save on storage in the per-fragment arrays */
     "workerId": workerId,
     "headers": this.options.svfHeaders, <-------------- ADD THE HEADERS
     "packNormals": this.options.packNormals,
     "queryParams" : this.queryParam };
```
## Building

After these changes are made. The minified version must be rebuilt.

## A note about the architecure.

The `msg` and `xfer` objects are passed to a worker (lmv worker) where they are actioned.
The actual requests happen in `lmvworker.js` in the `rawGet` function.
The options we modified come in as part of the `loadContext`

It is often useful to log out `loadContext` inside the lmv `copyOptions` to find out where in the main code the requests come from using the `operation` key.