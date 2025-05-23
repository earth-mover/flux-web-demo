# Earthmover Flux Web App Demos

A collection of demos how Flux APIs can be used to build web applications with Weather and Climate data.

## Demos

### Globe

A [MaplibreGL](https://maplibre.org/) Globe displaying a raster tile layer of GFS temperature data in Celsius. There is also a [DeckGL](https://deck.gl/) [wind vector layer](https://github.com/weatherlayers/weatherlayers-gl) displaying the animated wind particles.

The globe is interactive and allows to click on a point to get a timeseries of temperature data. The timeseries is displayed in a drawer, and the data can be downloaded in a list of our currently supported formats.

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
