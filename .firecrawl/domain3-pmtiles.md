[Protomaps Blog](https://protomaps.com/blog/)

[github](https://github.com/protomaps) [mastodon](https://mapstodon.space/@protomaps) [bluesky](https://bsky.app/profile/protomaps.com) [rss](https://protomaps.com/blog/index.xml)

# What's new in PMTiles V3

Oct 31, 2022

**PMTiles is a single-file archive format for map tiles**, optimized for the cloud. Think about it like [MBTiles](https://github.com/mapbox/mbtiles-spec), where the database can live on another computer or static storage like S3; or as a minimal alternative to [Cloud Optimized GeoTIFFs](https://www.cogeo.org/) for any tiled data - remote sensing readings, photographs, or vector GIS features.

Why adopt PMTiles? Companies like [Felt, a collaborative mapmaking app, are using PMTiles for user-uploaded datasets](https://felt.com/blog/upload-anything) \- eliminating the need to run map tile servers at all.

## Spec version 3

[Read the specification on GitHub](https://github.com/protomaps/PMTiles/blob/master/spec/v3/spec.md)

In its first year of existence, PMTiles focused on being the simplest possible implementation of the [HTTP Byte Range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests) read strategy. **PMTiles V3** is a revision that makes the retrieval and storage of tiles not just _simple_ but also _efficient_. Minimizing archive size and the number of intermediate requests has a direct effect on the latency of tile requests and ultimately the end user experience of viewing a map on the web.

### File Structure

- **97% smaller overhead** \- Spec version 2 would always issue a 512 kilobyte initial request; version 3 reduces this to **16 kilobytes.** What remains the same is that nearly any map tile can be retrieved in at most two additional requests.

- **Unlimited metadata** \- version 2 had a hard cap on the amount of JSON metadata of about 300 kilobytes; version 3 removes this limit. This is essential for tools like [tippecanoe](http://github.com/felt/tippecanoe) to store detailed column statistics. Essential archive information, such as tile type and compression methods, are stored in a binary header separate from application metadata.

- **Hilbert tile IDs** \- tiles internally are addressed by a single 64-bit Hilbert tile ID instead of Z/X/Y. See the [blog post on Tile IDs for details.](https://protomaps.com/blog/pmtiles-v3-hilbert-tile-ids/)

- **Archive ordering** \- An optional `clustered` mode enforces that tile contents are laid out in Tile ID order.

- **Compressed directories and metadata** \- Directories used to fetch offsets of tile data consume about 10% the space of those in version 2. See the [blog post on compressed directories](https://protomaps.com/blog/pmtiles-v3-layout-compression) for details.

## JavaScript

- **Compression** \- The TypeScript [pmtiles](https://github.com/protomaps/PMTiles/tree/master/js) library now includes a decompressor - [fflate](https://github.com/101arrowz/fflate) \- to allow reading compressed vector tile archives directly in the browser. This reduces the size and latency of vector tiles by as much as 70%.

- **Tile Cancellation** \- All JavaScript plugins now support _tile cancellation_, meaning quick zooming across many levels will interrupt the loading of tiles that are never shown. This has a significant effect on the perceived user experience, as tiles at the end of a animation will appear earlier.

- **ETag support** \- clients can detect when files change on static storage by reading the [ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) HTTP header. This means that PMTiles-based map applications can update datasets in place at low frequency without running into caching problems.

### Inspector app

[PMTiles on GitHub](https://github.com/protomaps/PMTiles) now hosts an open source inspector for local or remote archives. View an archive hosted on your cloud storage (CORS required) - or drag and drop a file from your computer - no server required.

Your browser doesn't support embedded videos, but don't worry, you can [download it](https://protomaps.com/blog/pmtiles-v3-whats-new/pmtiles_viewer.mp4) and watch it with your favorite video player!

### Leaflet

For raster tiles, there is first-class support for loading PNG or JPG image archives into Leaflet via the tiny (7 kilobytes!) `PMTiles` library like this:

```js
const p = new pmtiles.PMTiles("example.pmtiles");
pmtiles.leafletRasterLayer(p).addTo(map);
```

For vector tiles, you’ll need to use [protomaps.js](https://github.com/protomaps/protomaps.js), the from-scratch renderer built for vector rendering and labeling using plain Canvas. It’s only about 32 kilobytes - a fraction of the size of an alternative like MapLibre GL JS - and now supports V3 archives.

### MapLibre GL JS

The MapLibre [protocol plugin](https://maplibre.org/maplibre-gl-js-docs/api/properties/#addprotocol) has a new, simpler API; specifying the archive under a source `url` will automatically infer the archive’s `minzoom` and `maxzoom`.

```json
"sources": {
    "example_source": {
        "type": "vector",
        "url": "pmtiles://https://example.com/example.pmtiles",
    }
}
```

## Python

[pmtiles/python on GitHub](https://github.com/protomaps/PMTiles/tree/master/python)

- Python libraries are now modular and can have data sources swapped out. A PMTiles file can be read from disk, or a custom function can be provided to grab byte ranges from AWS via the boto library, Google Cloud, or any other blob data source.

- Python command line utilities have been deprecated as the first-class tooling for creating and working with PMTiles.

## Go

[go-pmtiles on GitHub](http://github.com/protomaps/go-pmtiles)

The greatest obstacle to adopting PMTiles for many users was the need to have a working Python 3 installation on your computer.

The official PMTiles tooling is now a single-file executable you can download at [GitHub Releases](https://github.com/protomaps/go-pmtiles/releases).

Example for converting an MBTiles archive:

```sh
pmtiles convert input.mbtiles output.pmtiles
```

This will spit out some facts on the internals of your archive:

```
tippecanoe ne_10m_admin_1_states_provinces.geojsonseq -o ne_10m_admin_1_states_provinces.mbtiles -z8
pmtiles convert ne_10m_admin_1_states_provinces.mbtiles ne_10m_admin_1_states_provinces.pmtiles
...
# of addressed tiles:  40560
# of tile entries (after RLE):  20733
# of tile contents:  18933
Root dir bytes:  57
Leaves dir bytes:  53570
Num leaf dirs:  6
Total dir bytes:  53627
Average leaf dir bytes:  8928
Average bytes per addressed tile: 1.32
Finished in  444.930625ms
```

The above shows that the sample dataset - [Admin 1 boundaries from Natural Earth](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/) has more than 50% redundant tiles. Although about 40,000 tiles are addresses by the archive, only 19,000 tiles are stored.

On average, only **1.3 bytes or 11 bits** is needed per tile in the directory index after compression!

To upgrade your PMTiles V2 archive to V3:

```sh
pmtiles convert input_v2.pmtiles output_v3.pmtiles
```

Inspect a PMTiles V3 archive:

```sh
pmtiles show file://. output.pmtiles
```

Uploading your archive to cloud storage, once you’ve put your credentials in environment variables:

```sh
pmtiles upload LOCAL.pmtiles "s3://BUCKET_NAME?endpoint=https://example.com&region=region" REMOTE.pmtiles
```

## Ecosystem

- Bringing PMTiles support to [OpenLayers (GitHub issue #3)](https://github.com/protomaps/PMTiles/issues/3).

- Luke Seelenbinder has started a implementation of [PMTiles in Rust](https://github.com/stadiamaps/pmtiles-rs).

## Free Downloads

Finally, you can download OpenStreetMap-derived, up-to-the minute basemap tilesets from [protomaps.com/downloads](https://protomaps.com/downloads), now only delivered in the V3 format. Small-area downloads are perfect for your hyper-local mapping project that will work forever, hosted on storage like GitHub Pages or S3.

[←Serverless Maps - Now Open Source](https://protomaps.com/blog/serverless-maps-now-open-source/) [PMTiles version 3: Disk Layout and Compressed Directories→](https://protomaps.com/blog/pmtiles-v3-layout-compression/)

© 2025
[Protomaps Blog](https://protomaps.com/blog/)

[powered by hugo️️](https://gohugo.io/) ️
[hugo-paper](https://github.com/nanxiaobei/hugo-paper)
