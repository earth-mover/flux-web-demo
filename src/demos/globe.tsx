import Map, { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay as DeckOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layer as DeckLayer } from '@deck.gl/core';
import { BitmapLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { useQuery } from '@tanstack/react-query';
import * as WeatherLayers from 'weatherlayers-gl';

/**
 * Creates a WMS URL template for fetching GFS wind data from Flux
 * @param colorPalette - The color palette to use. This is any matplotlib colormap name. See https://matplotlib.org/stable/tutorials/colors/colormaps.html
 * @param colorScaleRange - The range of the color scale, formatted as [min, max].
 * @param layer - The data variable to use.
 * @param tileWidth - The width of the tile.
 * @param tileHeight - The height of the tile.
 * @param x - The x coordinate of the tile. If creating a tile template leave undefined.
 * @param y - The y coordinate of the tile. If creating a tile template leave undefined.
 * @param z - The z coordinate of the tile. If creating a tile template leave undefined.
 */
function createGfsWmsUrlTemplate({
    colorPalette,
    colorScaleRange,
    layer,
    tileWidth,
    tileHeight,
    x,
    y,
    z,
}: {
    colorPalette: string;
    colorScaleRange: [number, number];
    layer: 'temperature_2m' | 'wind_u_10m' | 'wind_v_10m';
    tileWidth: number;
    tileHeight: number;
    x?: number;
    y?: number;
    z?: number;
}): string {
    const xx = x ?? '{x}';
    const yy = y ?? '{y}';
    const zz = z ?? '{z}';
    return `https://compute.earthmover.io/v1/services/wms/earthmover-demos/dyanmical-gfs-analysis/main/wms?version=1.3.0&service=WMS&request=GetMap&layers=${layer}&colorscalerange=${colorScaleRange.join(
        ',',
    )}&width=${tileWidth}&height=${tileHeight}&tile=${xx},${yy},${zz}&crs=EPSG:3857&styles=raster/${colorPalette}`;
}

/**
 * Fetches the global GFS wind data for the current time step and creates a bipped image to be used for drawing animated particles.
 * See https://docs.weatherlayers.com/weatherlayers-gl/data-sources for more information on the data source specification..
 *
 * @returns The wind data for the current time step, combining the u and v wind components into a single image.
 */
async function fetchGlobalGfsWindParticleData({
    dataRange,
    imageWidth,
    imageHeight,
}: {
    dataRange: [number, number];
    imageWidth: number;
    imageHeight: number;
}) {
    const uwindUrl = createGfsWmsUrlTemplate({
        colorPalette: 'Greys_r',
        colorScaleRange: dataRange,
        layer: 'wind_u_10m',
        tileWidth: imageWidth,
        tileHeight: imageHeight,
        x: 0,
        y: 0,
        z: 0,
    });
    const vwindUrl = createGfsWmsUrlTemplate({
        colorPalette: 'Greys_r',
        colorScaleRange: dataRange,
        layer: 'wind_v_10m',
        tileWidth: imageWidth,
        tileHeight: imageHeight,
        x: 0,
        y: 0,
        z: 0,
    });
    const [uwind, vwind] = await Promise.all([fetch(uwindUrl), fetch(vwindUrl)]);
    const [uwindData, vwindData] = await Promise.all([uwind.arrayBuffer(), vwind.arrayBuffer()]);

    // Create ImageBitmap objects from the array buffers
    const [uBitmap, vBitmap] = await Promise.all([
        createImageBitmap(new Blob([uwindData], { type: 'image/png' })),
        createImageBitmap(new Blob([vwindData], { type: 'image/png' })),
    ]);

    // Create canvases to read pixel data
    const uCanvas = new OffscreenCanvas(uBitmap.width, uBitmap.height);
    const vCanvas = new OffscreenCanvas(vBitmap.width, vBitmap.height);
    const uCtx = uCanvas.getContext('2d');
    const vCtx = vCanvas.getContext('2d');

    if (!uCtx || !vCtx) {
        throw new Error('Failed to get canvas context');
    }

    // Draw the bitmaps to canvases
    uCtx.drawImage(uBitmap, 0, 0);
    vCtx.drawImage(vBitmap, 0, 0);

    // Get pixel data
    const uImageData = uCtx.getImageData(0, 0, uCanvas.width, uCanvas.height);
    const vImageData = vCtx.getImageData(0, 0, vCanvas.width, vCanvas.height);

    // Modify U data array directly, only copying G channel from V
    for (let i = 0; i < uImageData.data.length; i += 4) {
        uImageData.data[i + 1] = vImageData.data[i]; // G from V
    }

    return {
        data: uImageData.data,
        width: uBitmap.width,
        height: uBitmap.height,
    };
}

function DeckGLOverlay(props: MapboxOverlayProps) {
    const overlay = useControl((context) => {
        console.log(context.map.getStyle());
        return new DeckOverlay(props);
    });
    overlay.setProps(props);
    return null;
}

export default function Globe() {
    const { data } = useQuery({
        queryKey: ['gfs-wind-bipped'],
        queryFn: async () =>
            await fetchGlobalGfsWindParticleData({
                dataRange: [-40, 40],
                imageWidth: 1440,
                imageHeight: 720,
            }),
    });

    const layers: DeckLayer[] = [
        new TileLayer({
            id: 'gfs-temperature',
            data: createGfsWmsUrlTemplate({
                colorPalette: 'jet',
                colorScaleRange: [-40, 40],
                layer: 'temperature_2m',
                tileWidth: 512,
                tileHeight: 512,
            }),
            tileSize: 512,
            maxZoom: 15,
            opacity: 0.2,
            refinementStrategy: 'no-overlap',
            parameters: {
                depthTest: false,
            },
            beforeId: 'gfs-wind',
            renderSubLayers: (props) => {
                const [[west, south], [east, north]] = props.tile.boundingBox;
                const { data, ...otherProps } = props;
                return new BitmapLayer(otherProps, {
                    image: data,
                    bounds: [west, south, east, north],
                });
            },
        }),
        new WeatherLayers.ParticleLayer({
            id: 'gfs-wind',
            image: data,
            imageType: 'VECTOR',
            imageUnscale: [-40, 40],
            maxAge: 10,
            speedFactor: 3.0,
            numParticles: 6000,
        }),
    ];

    return (
        <main className="h-screen w-screen">
            <Map
                initialViewState={{
                    longitude: -100,
                    latitude: 30,
                    zoom: 3,
                }}
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, var(--blue) 0%, var(--midnight) 70%)',
                }}
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                projection="globe"
                sky={{
                    'sky-color': '#199EF3',
                    'sky-horizon-blend': 0.5,
                    'horizon-color': '#ffffff',
                    'horizon-fog-blend': 0.5,
                    'fog-color': '#0000ff',
                    'fog-ground-blend': 0.5,
                    'atmosphere-blend': 0.3,
                }}
            >
                <DeckGLOverlay layers={layers} interleaved={false} />
            </Map>
        </main>
    );
}
