# Geospatial Engine

## What is DBSCAN? (Beginner Explanation)
**DBSCAN** (Density-Based Spatial Clustering of Applications with Noise) is an algorithm that finds groups of points that are closely packed together.
Imagine looking at a map of a city. If you see 10 coffee shops on the same block, DBSCAN calls that a "cluster". If there is one coffee shop 10 miles away in the desert, DBSCAN calls it "noise" or an isolated point. 
In AgroSentinel, we use it to find clusters of diseased farms.

## Why DBSCAN for Outbreak Detection?
Traditional algorithms like K-Means require you to know *how many* clusters exist beforehand. We don't know how many disease outbreaks are happening on a given day. DBSCAN automatically discovers the number of clusters based purely on data density. It also perfectly handles "noise" (isolated disease cases that haven't spread yet).

## Haversine Distance Formula
To measure distance on the Earth's curved surface, a simple straight-line calculation (Euclidean) is inaccurate. We use the **Haversine formula**, which calculates the shortest distance between two points on a sphere using their latitudes and longitudes.
`d = 2 * r * arcsin(sqrt(sin²(Δlat/2) + cos(lat1)*cos(lat2)*sin²(Δlon/2)))`

## Cluster Parameters
- **eps = 5km**: This is the search radius. For any given farm reporting a disease, the algorithm looks for other cases within a 5-kilometer radius.
- **min_samples = 3**: This is the threshold. A cluster is only formed if there are at least 3 disease reports within that 5km radius. 
*Result*: 1 or 2 sick plants in a region is an isolated incident. 3 or more sick plants within 5km is officially classified as an **Outbreak**.

## Geospatial Features Computed
Beyond clustering, the engine calculates features for the ML model:
- Distance to nearest water body (influences humidity/fungus).
- Regional disease density (how many cases in the district).
- Elevation.

## Satellite Features
We incorporate derived metrics from satellite imagery:
- **NDVI (Normalized Difference Vegetation Index)**: Measures plant health and greenness. Low NDVI indicates crop stress.
- **NDWI (Normalized Difference Water Index)**: Measures moisture content in the vegetation/soil.
- **EVI (Enhanced Vegetation Index)**: Similar to NDVI but corrects for atmospheric noise and canopy background noise.

## Limitations
- **Resolution**: Public satellite data (like Landsat/Sentinel) has spatial resolutions of 10m to 30m per pixel. Smallholder farms (< 1 acre) might only be a few pixels wide, making precise satellite analysis difficult.
- **Cloud Cover**: Optical satellite features (NDVI) cannot be calculated accurately on cloudy days, requiring the system to fallback on historical averages or radar (SAR) data.
