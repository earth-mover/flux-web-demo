# Earthmover Flux Web App Demos

A collection of demos how Flux APIs can be used to build web applications with Weather and Climate data.

All demos are built using the following technologies:

* [React](https://react.dev/)
* [Vite](https://vitejs.dev/)
* [TailwindCSS](https://tailwindcss.com/)
* [Shadcn UI](https://ui.shadcn.com/)
* [MapLibreGL](https://maplibre.org/)
* [DeckGL](https://deck.gl/)
* [Flux APIs](https://docs.earthmover.io/flux/)

## Demos

### GFS Globe with WMS and EDR

[Try the demo](https://flux-web-demo.vercel.app/gfs-globe-wms)

[See the code](https://github.com/earth-mover/flux-web-demo/blob/main/src/demos/gfs-globe-wms.tsx)

Checkout the [source data](https://dynamical.org/catalog/noaa-gfs-analysis-hourly/) on [Arraylake](https://app.earthmover.io/earthmover-demos/dyanmical-gfs-analysis)

A [MaplibreGL](https://maplibre.org/) Globe displaying a raster tile layer of GFS temperature data in Celsius. There is also a [DeckGL](https://deck.gl/) [wind vector layer](https://github.com/weatherlayers/weatherlayers-gl) displaying the animated wind particles.

The globe is interactive and allows to click on a point to get a timeseries of temperature data. The timeseries is displayed in a drawer, and the data can be downloaded in a list of our currently supported formats.

This demo uses Flux [`WMS`](https://docs.earthmover.io/flux/wms) and [`EDR`](https://docs.earthmover.io/flux/edr) endpoints to fetch the data:

* [WMS GetMap](https://docs.earthmover.io/flux/wms#getmap) requests for showing the temperature and wind data on the globe
* [WMS GetMetadata](https://docs.earthmover.io/flux/wms#metadata-queries) requests for fetching the min and max values of the temperature data to automatically set the color scale range
* WMS GetLegendGraphic requests for fetching the legend image
* [EDR position](https://docs.earthmover.io/flux/edr#position-queries) requests for fetching the timeseries data

### GFS Globe Temperature with Tiles and edr

[Try the demo](https://flux-web-demo.vercel.app/gfs-globe-tiles)

[See the code](https://github.com/earth-mover/flux-web-demo/blob/main/src/demos/gfs-globe-tiles.tsx)

Checkout the source data on [Arraylake](https://app.earthmover.io/earthmover-public/gfs)

A [MaplibreGL](https://maplibre.org/) Globe displaying a raster tile layer of GFS temperature data in Kelvin.

The globe is interactive and allows to click on a point to get a timeseries of temperature data. The timeseries is displayed in a drawer, and the data can be downloaded in a list of our currently supported formats.

This demo uses Flux [`Tiles`](https://docs.earthmover.io/flux/tiles) and [`EDR`](https://docs.earthmover.io/flux/edr) endpoints to fetch the data

### HRRR Total Cloud Cover with Tiles

[Try the demo](https://flux-web-demo.vercel.app/hrrr-tcc-tiles)

[See the code](https://github.com/earth-mover/flux-web-demo/blob/main/src/demos/hrr-tcc-tiles.tsx)

Checkout the source data on [Arraylake](https://app.earthmover.io/earthmover-public/hrrr)

A [MaplibreGL](https://maplibre.org/) Globe displaying a raster tile layer of HRRR Total Cloud Cover data in percentage.

This demo uses Flux [`Tiles`](https://docs.earthmover.io/flux/tiles) endpoints to fetch the data

## Development

```bash
npm install
npm run dev
```

Browse to http://localhost:5173/ to play with the demos. Modify the code in the `src/demos` directory to build your own demos.


## License

Apache 2.0

## Copyright

Copyright 2025 Earthmover PBC
