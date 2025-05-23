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

### Globe

[Try the demo](https://flux-web-demo.vercel.app/gfs-globe)

[See the code](https://github.com/earth-mover/flux-web-demo/blob/main/src/demos/globe.tsx)

A [MaplibreGL](https://maplibre.org/) Globe displaying a raster tile layer of GFS temperature data in Celsius. There is also a [DeckGL](https://deck.gl/) [wind vector layer](https://github.com/weatherlayers/weatherlayers-gl) displaying the animated wind particles.

The globe is interactive and allows to click on a point to get a timeseries of temperature data. The timeseries is displayed in a drawer, and the data can be downloaded in a list of our currently supported formats.

This demo uses Flux [`WMS`](https://docs.earthmover.io/flux/wms) and [`EDR`](https://docs.earthmover.io/flux/edr) endpoints to fetch the data:

* [WMS GetMap](https://docs.earthmover.io/flux/wms#getmap) requests for showing the temperature and wind data on the globe
* [EDR position](https://docs.earthmover.io/flux/edr#position-queries) requests for fetching the timeseries data

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
