[Skip to content](https://forrest.nyc/cloud-native-geospatial-formats-geoparquet-zarr-cog-and-pmtiles-explained/#content)

[![](https://forrest.nyc/wp-content/uploads/2023/09/Modern-GIS-5.png)](https://forrest.nyc/)

- [Posts](https://forrest.nyc/posts/)
- [Join the Spatial Lab](https://forrest.nyc/spatial-lab/)
- [Courses](https://forrest.nyc/cloud-native-geospatial-formats-geoparquet-zarr-cog-and-pmtiles-explained/#)
  - [Learn Modern GIS](https://forrest.nyc/accelerator/)
  - [Land Your Dream Job](https://forrest.nyc/career-compass/)
- [Sponsor](https://forrest.nyc/sponsor/)
- [Coaching](https://forrest.nyc/coaching/)
- [Podcast](https://www.youtube.com/playlist?list=PL6L1mY6cDuDAqOlXiKKQGV-DxCKZlaqfD)

X

[navsearch-button](https://forrest.nyc/cloud-native-geospatial-formats-geoparquet-zarr-cog-and-pmtiles-explained/#ekit_modal-popup-18868faf)

Sign Up

#### Get the newsletter

Join 71,000+ geospatial experts growing their skills and careers. Get updates on the most cutting edge updates in modern GIS and geospatial every week.

Edit Content

- [LinkedIn](https://www.linkedin.com/in/mbforr/)
- [YouTube](https://www.youtube.com/@MattForrest)

Uncategorized

[Share on Facebook](https://www.facebook.com/sharer/sharer.php?u=https://forrest.nyc/cloud-native-geospatial-formats-geoparquet-zarr-cog-and-pmtiles-explained/ "Share on Facebook")

[Share on X](https://x.com/intent/post?url=https://forrest.nyc/cloud-native-geospatial-formats-geoparquet-zarr-cog-and-pmtiles-explained/ "Share on X")

[Share on Pinterest](https://pinterest.com/pin/create/link/?url=https://forrest.nyc/cloud-native-geospatial-formats-geoparquet-zarr-cog-and-pmtiles-explained/ "Share on Pinterest")

[Share on LinkedIn](https://www.linkedin.com/shareArticle?mini=true&url=https://forrest.nyc/cloud-native-geospatial-formats-geoparquet-zarr-cog-and-pmtiles-explained/ "Share on LinkedIn")

# Cloud Native Geospatial Formats: GeoParquet, Zarr, COG, and PMTiles Explained

July 11, 2025 [Matt Forrest](https://forrest.nyc/author/admin/ "Posts by Matt Forrest")Comments Off on Cloud Native Geospatial Formats: GeoParquet, Zarr, COG, and PMTiles Explained

![](https://forrest.nyc/wp-content/uploads/2025/07/Blue-Overlay-Blog-Title-Instagram-Post-1.png)

Storage is the foundation, but formats are what make cloud-native geospatial actually work.

You can put any file in cloud storage. A shapefile, a GeoTIFF, a KML file, whatever. But just because it’s in the cloud doesn’t mean it’s cloud-native. And there’s a big difference between the two.

Cloud-native formats are designed from the ground up to take advantage of the properties that make cloud storage so powerful: cheap storage, HTTP range requests, and the ability to leave data where it sits while still being able to query and analyze it efficiently.

This essay is going to dive into four formats that are enabling the shift to cloud-native geospatial: GeoParquet, Zarr, Cloud Optimized GeoTIFF (COG), and PMTiles. Each solves a different problem and enables different workflows, but together they represent the building blocks of modern geospatial data infrastructure.

## GeoParquet: Making vector data analytics-ready

Let’s start with GeoParquet because it’s probably the most straightforward to understand if you’ve been following the modern data stack evolution.

Parquet is a columnar storage format that became the de facto standard for analytics workflows. It’s fast to read, compresses well, and works seamlessly with every major query engine out there. GeoParquet takes that foundation and adds spatial data types and spatial indexing.

Here’s what makes GeoParquet different from throwing a shapefile in cloud storage:

**Columnar storage means faster queries.** When you want to find all the points within a certain date range, you only read the date column. When you want to calculate the average area of polygons in a certain region, you only read the geometry column. If you don’t need to read more data, it won’t, and it pays off in speed.

**Native “spatial indexing”.** GeoParquet includes a bounding box column on the file (which there can be many of if the files are partitioned) and/or row groups, or chunks of rows inside the file. This means query engines can quickly eliminate geometries that don’t intersect with your area of interest without having to read the entire file.

**Compression that actually works.** Because geometries are stored in a columnar format, similar coordinate values get compressed together. Imagine you have a file with a column that has this data:

1

1

1

2

2

Parquet will remove sequential values to save space so the file will really look like:

1

.

.

2

.

This can result in file sizes that are much smaller than equivalent spatial files. The example above would be 60% smaller and this is why ordering your data spatially is important.

​

![](https://forrest.nyc/wp-content/uploads/2025/07/image.png)https://vutr.substack.com/p/the-overview-of-parquet-file-format

But here’s the key part: GeoParquet works with all the analytics tools that companies are already using. You can query GeoParquet files with DuckDB, read them with GeoPandas, process them with Apache Sedona, and analyze them in Wherobots, Databricks, or Snowflake. No special GIS software required.

This is what makes vector data analytics ready. You’re not asking the analytics team to learn QGIS or install PostGIS. You’re giving them spatial data in a format that works with their existing tools and workflows.

## Zarr: Multidimensional arrays for climate and earth observation

Now let’s talk about Zarr, which solves a completely different problem than GeoParquet.

If GeoParquet is about making vector data work with analytics tools, Zarr is about making multidimensional array (sounds complex but its simpler than it sounds) data work with cloud storage. Think climate data, satellite imagery time series, weather models, or any data that has multiple dimensions: time, latitude, longitude, elevation, spectral bands, etc.

This data usually has 4 dimensions: a location grid much like raster data representing an X and Y dimension, a value stored in each grid, and then a series of grids stored over time.

![](https://forrest.nyc/wp-content/uploads/2025/07/image-2.png)[https://earthmover.io/blog/what-is-zarr](https://preview.convertkit-mail2.com/click/dpheh0hzhm/aHR0cHM6Ly9lYXJ0aG1vdmVyLmlvL2Jsb2cvd2hhdC1pcy16YXJy)

Traditional formats for this type of data, like NetCDF or HDF5, were designed for local file systems. They assume you can seek to any part of the file instantly and read data in any order. But cloud storage doesn’t work that way. Every read operation is an HTTP request, and those have latency costs.

Zarr solves this by chunking multidimensional arrays into regular, optimally-sized pieces that can be read independently. Each chunk is stored as a separate object in cloud storage, and metadata tells you which chunks you need for any given query.

Here’s what this enables:

**Efficient subsetting.** Want just the temperature data for New York City from a global climate model? Zarr can identify and read only the chunks that contain that geographic region, rather than downloading the entire global dataset.

**Time series analysis at scale.** Want to analyze 20 years of data for a specific location? Zarr can read just the pixels you need across all time steps, rather than downloading entire images.

**Parallel processing.** Different chunks can be read and processed simultaneously, which means you can scale compute horizontally across as many workers as you have chunks.

The weather and climate data I mentioned in the first post? Most of that is becoming available in Zarr format. The satellite imagery time series? Same thing. This is what makes earth observation data actually usable for analytics workflows rather than just downloadable.

## Cloud Optimized GeoTIFF: Raster data that works over HTTP

COG (Cloud Optimized GeoTIFF) takes a different approach than Zarr. Instead of completely rethinking how raster data is stored, it takes the existing GeoTIFF format and optimizes it for cloud storage.

The key insight is that most raster workflows don’t need the entire raster. You usually want a specific geographic region, a specific zoom level, or a specific spectral band. COG enables this by storing data in a tiled, pyramidal structure with all the metadata up front.

![](https://forrest.nyc/wp-content/uploads/2025/07/image-3.png)https://youssefharby.com/Youtube+Videos/2024/DSM+of+Egypt+and+TIFF+vs+GeoTiff+vs+Cloud+Optimized+GeoTIFF+(COG)

Here’s how it works:

**Tiled storage.** Instead of storing raster data row by row, COG stores it in tiles (usually 512×512 pixels). This means you can read just the tiles that cover your area of interest.

**Pyramidal structure.** COG includes multiple resolution levels (overviews) in the same file. This means you can quickly preview a dataset at low resolution without downloading the full-resolution data.

**Metadata up front.** All the information about tile locations, coordinate systems, and data types is stored at the beginning of the file. This means applications can understand what’s in the file without reading the entire thing.

This is what makes raster data streamable. You can connect to a COG file via HTTP and read just the pixels you need for your analysis. No need to download entire datasets to crop them locally.

And just like GeoParquet, COG works with existing tools. You can read COG files with GDAL, display them in web maps, analyze them with Python, or process them with distributed computing frameworks.

## PMTiles: Vector and raster tiles without servers

PMTiles is the newest format in this list and solves a problem that’s been nagging the web mapping world for years: how do you serve map tiles without running a tile server?

Traditional web map tiles require a server that can take incoming requests, query a database, generate tiles on the fly, and serve them to client applications. This works great if you have the infrastructure to support it, but it’s overkill for many use cases.

PMTiles packages all the vector tiles for a dataset into a single file that can be served from static storage. The file includes a spatial index that allows client applications to quickly find and extract just the tiles they need for any given map view.

Here’s what this enables:

**Serverless vector tiles.** You can serve interactive vector maps directly from cloud storage without any server infrastructure. Just upload the PMTiles file and serve it via HTTP.

**Offline-first workflows.** Because all the tiles are in a single file, you can download that file and serve maps completely offline. No internet connection required.

**Cost-effective large datasets.** Traditional vector tile servers can get expensive when you’re serving tiles for large datasets with lots of zoom levels. PMTiles eliminates the compute costs entirely.

PMTiles is particularly interesting because it enables workflows that weren’t possible before. You can create interactive maps of massive datasets and serve them from a CDN for pennies. You can ship offline mapping applications that include all the data they need. You can share complex spatial datasets as a single file that anyone can use without special software.

## How these formats work together

These four formats aren’t competing with each other. They’re complementary and solve different problems in the geospatial data ecosystem.

GeoParquet is for when you need to do analytics on vector data. You want to join spatial data with business data, run aggregations across geographic regions, or feed spatial features into machine learning models.

Zarr is for when you’re working with multidimensional earth observation data. You want to analyze climate trends, process satellite imagery time series, or run models on weather data.

COG is for when you need to work with single-time-step raster data. You want to analyze elevation models, land cover classifications, or individual satellite images.

PMTiles is for when you need to display spatial data interactively. You want to create web maps, serve reference layers, or enable spatial exploration of datasets.

But here’s where it gets interesting: these formats enable workflows that span multiple data types. You can use Zarr to analyze climate trends, export the results to GeoParquet for further analysis, create a COG surface from the results, and serve key findings via PMTiles for visualization.

​This is the promise of cloud-native geospatial: formats that work together, tools that can consume multiple formats, and workflows that span the entire data lifecycle without forcing you to download and convert data at every step.

## What this means for the three data types

Remember the three data types I mentioned in the first post? Satellite imagery, GPS/IoT data, and weather/climate data? These formats are what make working with that data at scale actually possible.

**Satellite imagery** is increasingly available as Cloud Optimized GeoTIFF for individual scenes and Zarr for time series. This means you can analyze imagery without downloading it, subset it to your area of interest, and process it in parallel across multiple workers.

**GPS and IoT data** works perfectly with GeoParquet. You can store trajectories, analyze movement patterns, and join mobility data with other datasets using standard analytics tools. No special GIS software required.

**Weather and climate data** is moving to Zarr format across the board. NOAA, NASA, and major climate research institutions are publishing data in Zarr format, which means you can analyze decades of climate data without downloading terabytes of files.

## The tooling ecosystem

These formats only work because there’s a growing ecosystem of tools that can consume them. Here’s what’s available today:

**Query engines:** Apache Sedona, Wherobots, DuckDB, Trino, BigQuery, Snowflake, and Databricks all support reading GeoParquet and COG files directly from cloud storage.

**Python libraries:** Geopandas, xarray, rasterio, and GDAL all support these formats. You can read cloud-native data directly into your analysis workflows.

**Web mapping:** Leaflet, MapLibre, and other mapping libraries can consume COG and PMTiles directly from cloud storage.

**Cloud services:** AWS, Google Cloud, and Azure all provide managed services for working with these formats.

This is what makes cloud-native geospatial different from previous waves of geospatial innovation. The formats are designed to work with existing tools rather than requiring specialized software.

## What’s next

These formats are enabling the shift to cloud-native geospatial, but they’re just the beginning. The real value comes from the workflows and infrastructure you build around them.

In my next post, I’ll dive into managing data pipelines for cloud-native geospatial data. How do you create repeatable processes for converting legacy formats to cloud-native formats? How do you orchestrate workflows that span multiple data types? And how do you ensure your pipelines can scale with the volume of data we’re seeing in earth observation and mobility datasets?

The formats make it possible. The pipelines make it practical.

![](https://secure.gravatar.com/avatar/89d3667d46cfb02bb67aee7bb97ecf1ee20e1f50f4f8c632e686ac0f8d3c2b52?s=240&d=mm&r=g)

##### [Matt Forrest](https://forrest.nyc/author/admin/ "Posts by Matt Forrest")

## Post navigation

[Previous](https://forrest.nyc/airflow-ai-iceberg-v3-the-new-stack-for-scalable-geospatial-data/)

[Next](https://forrest.nyc/esri-vs-open-source-gis-the-real-debate-behind-the-tools/)

#### Search

Search for:

#### Categories

- [Article](https://forrest.nyc/category/article/) (27)

- [Essay](https://forrest.nyc/category/essay/) (1)

- [Podcast](https://forrest.nyc/category/podcast/) (5)

- [Tutorial](https://forrest.nyc/category/tutorial/) (6)

#### Recent posts

- [![](https://forrest.nyc/wp-content/uploads/2026/02/YouTube-Thumbnails-1-150x150.png)\\
  \\
  The Spatial SQL Landscape in 2026: A Guide to 50+ Databases](https://forrest.nyc/best-spatial-sql-tools/)
- [![](https://forrest.nyc/wp-content/uploads/2026/02/YouTube-Thumbnails-150x150.png)\\
  \\
  From Static Maps to Living Systems: How TomTom & Overture are Redefining Geospatial Intelligence](https://forrest.nyc/ai-mapping-tomtom-overture-geospatial-future/)
- [![](https://forrest.nyc/wp-content/uploads/2026/02/YouTube-Thumbnails-15-150x150.png)\\
  \\
  Apache Sedona vs. Big Data: Solving the Geospatial Scale Problem](https://forrest.nyc/apache-sedona-geospatial-big-data/)

#### Tags

[aggregations](https://forrest.nyc/tag/aggregations/) [Apache Airflow](https://forrest.nyc/tag/apache-airflow/) [Apache Iceberg](https://forrest.nyc/tag/apache-iceberg/) [Apache Sedona](https://forrest.nyc/tag/apache-sedona/) [ArcGIS](https://forrest.nyc/tag/arcgis/) [bigquery](https://forrest.nyc/tag/bigquery/) [Cloud-Native Geospatial](https://forrest.nyc/tag/cloud-native-geospatial/) [Cloud GIS](https://forrest.nyc/tag/cloud-gis/) [Cloud Optimized GeoTIFF](https://forrest.nyc/tag/cloud-optimized-geotiff/) [duckdb](https://forrest.nyc/tag/duckdb/) [Esri](https://forrest.nyc/tag/esri/) [geoparquet](https://forrest.nyc/tag/geoparquet/) [geospatial](https://forrest.nyc/tag/geospatial/) [gis](https://forrest.nyc/tag/gis/) [GISP](https://forrest.nyc/tag/gisp/) [Modern GIS](https://forrest.nyc/tag/modern-gis/) [postgis](https://forrest.nyc/tag/postgis/) [Python](https://forrest.nyc/tag/python-for-gis/) [snowflake](https://forrest.nyc/tag/snowflake/) [Spatial SQL](https://forrest.nyc/tag/spatial-sql/) [sql](https://forrest.nyc/tag/sql/) [Wherobots](https://forrest.nyc/tag/wherobots/) [zip codes](https://forrest.nyc/tag/zip-codes/)

##### Spatial Lab

- [Join the Spatial Lab community](https://spatialstack.ai/)

##### Policies

- [Privacy Policy](https://forrest.nyc/privacy-policy/)
- [Terms & Conditions](https://forrest.nyc/terms-and-conditions/)

##### Spatial SQL

- [Get the Spatial SQL book today](https://spatial-sql.com/)

##### Join Us

- [LinkedIn](https://www.linkedin.com/in/mbforr/)
- [YouTube](https://www.youtube.com/@MattForrest)

© Matt Forrest 2024. All Rights Reserved.
