import Map, { Layer, Marker, Source, useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay as DeckOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layer as DeckLayer } from '@deck.gl/core';
import { useQuery } from '@tanstack/react-query';
import * as WeatherLayers from 'weatherlayers-gl';
import { useEffect, useMemo, useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router';

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

function createGfsPointTimeseriesUrlTemplate({
    layers,
    latitude,
    longitude,
    format,
}: {
    layers: ('temperature_2m' | 'wind_u_10m' | 'wind_v_10m')[];
    latitude: number;
    longitude: number;
    format: 'cf_covjson' | 'csv' | 'nc' | 'geojson' | 'parquet';
}): string {
    return `https://compute.earthmover.io/v1/services/edr/earthmover-demos/dyanmical-gfs-analysis/main/edr/position?coords=POINT(${longitude}%20${latitude})&time=2015-05-01T00:00:00/2015-06-01T00:00:00&f=cf_covjson&parameter-name=${layers.join(
        ',',
    )}&f=${format}`;
}

async function fetchTimeseriesData({
    layers,
    latitude,
    longitude,
}: {
    layers: ('temperature_2m' | 'wind_u_10m' | 'wind_v_10m')[];
    latitude: number;
    longitude: number;
}): Promise<{ data: { time: number; value: number }[]; url: string }> {
    const url = createGfsPointTimeseriesUrlTemplate({
        layers,
        latitude,
        longitude,
        format: 'cf_covjson',
    });
    const response = await fetch(url);
    const data = await response.json();

    const values = data.ranges[layers[0]].values as number[];

    return {
        data: values.map((value, index) => ({
            time: new Date(data.domain.axes.t.values[index] + 'Z').getTime(),
            value,
        })),
        url,
    };
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
    const overlay = useControl(() => new DeckOverlay(props));
    overlay.setProps(props);
    return null;
}

function TimeseriesDrawer({
    drawerOpen,
    setDrawerOpen,
    selectedPoint,
    timeseriesData,
    onClose,
}: {
    drawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    selectedPoint: { longitude: number; latitude: number } | null;
    timeseriesData: { data: { time: number; value: number }[]; isLoading: boolean };
    onClose: () => void;
}) {
    if (!selectedPoint) return null;
    const covjsonUrl = createGfsPointTimeseriesUrlTemplate({
        layers: ['temperature_2m'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        format: 'cf_covjson',
    });
    const csvUrl = createGfsPointTimeseriesUrlTemplate({
        layers: ['temperature_2m'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        format: 'csv',
    });
    const geojsonUrl = createGfsPointTimeseriesUrlTemplate({
        layers: ['temperature_2m'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        format: 'geojson',
    });
    const parquetUrl = createGfsPointTimeseriesUrlTemplate({
        layers: ['temperature_2m'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        format: 'parquet',
    });
    const ncUrl = createGfsPointTimeseriesUrlTemplate({
        layers: ['temperature_2m'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        format: 'nc',
    });
    return (
        <Drawer open={drawerOpen} modal={false} onOpenChange={setDrawerOpen} onClose={onClose}>
            <DrawerContent>
                <DrawerHeader className="flex flex-row justify-between items-start align-middle w-full">
                    <div className="flex flex-col items-start gap-2">
                        <DrawerTitle>
                            <div className="flex flex-row items-center gap-2">
                                <span>2 Meter Air Temperature (°C)</span>
                                <span className="text-sm text-muted-foreground">
                                    {selectedPoint?.latitude.toFixed(2)}°, {selectedPoint?.longitude.toFixed(2)}°
                                </span>
                            </div>
                        </DrawerTitle>
                        <div className="flex flex-row gap-2 items-center flex-wrap">
                            <span className="text-sm text-muted-foreground">Download data as:</span>
                            <Button variant="outline" asChild>
                                <a href={covjsonUrl} target="_blank" rel="noopener noreferrer">
                                    CovJSON
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={csvUrl} target="_blank" rel="noopener noreferrer">
                                    CSV
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={geojsonUrl} target="_blank" rel="noopener noreferrer">
                                    GeoJSON
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={parquetUrl} target="_blank" rel="noopener noreferrer">
                                    Parquet
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={ncUrl} target="_blank" rel="noopener noreferrer">
                                    NetCDF
                                </a>
                            </Button>
                        </div>
                    </div>
                    <DrawerTrigger className="cursor-pointer" onClick={onClose}>
                        Close
                    </DrawerTrigger>
                </DrawerHeader>
                {timeseriesData.isLoading && (
                    <div className="h-48 flex justify-center items-center">
                        <LoadingSpinner className="m-auto" />
                    </div>
                )}
                {timeseriesData.data && timeseriesData.data.length > 0 && (
                    <ChartContainer config={{}} className="h-48">
                        <AreaChart
                            accessibilityLayer
                            data={timeseriesData.data}
                            margin={{
                                top: 5,
                                left: 5,
                                right: 0,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid />
                            <XAxis
                                dataKey="time"
                                tickLine={false}
                                axisLine={false}
                                type="number"
                                domain={[
                                    timeseriesData.data[0].time,
                                    timeseriesData.data[timeseriesData.data.length - 1].time,
                                ]}
                                tickMargin={8}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'numeric',
                                    });
                                }}
                            />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} orientation="right" />
                            <Area dataKey="value" type="natural" fill="blue" fillOpacity={0.4} stroke="blue" />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        indicator="line"
                                        labelFormatter={(_value, payload) => {
                                            const date = new Date(payload[0].payload.time);
                                            return date.toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: 'numeric',
                                            });
                                        }}
                                    />
                                }
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </DrawerContent>
        </Drawer>
    );
}

export default function Globe() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const clickedPoint = useMemo(() => {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        return lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null;
    }, [searchParams]);
    const { data: gfsWindBippedData } = useQuery({
        queryKey: ['gfs-wind-bipped'],
        queryFn: async () =>
            await fetchGlobalGfsWindParticleData({
                dataRange: [-40, 40],
                imageWidth: 1440,
                imageHeight: 720,
            }),
    });

    const { data: timeseriesData, isLoading: timeseriesDataIsLoading } = useQuery({
        queryKey: ['timeseries', clickedPoint],
        queryFn: async () => {
            if (!clickedPoint) return null;
            return await fetchTimeseriesData({
                layers: ['temperature_2m'],
                latitude: clickedPoint.latitude,
                longitude: clickedPoint.longitude,
            });
        },
    });

    const layers: DeckLayer[] = [
        // new TileLayer({
        //     id: 'gfs-temperature',
        //     data: createGfsWmsUrlTemplate({
        //         colorPalette: 'jet',
        //         colorScaleRange: [-40, 40],
        //         layer: 'temperature_2m',
        //         tileWidth: 512,
        //         tileHeight: 512,
        //     }),
        //     tileSize: 512,
        //     maxZoom: 15,
        //     opacity: 0.2,
        //     refinementStrategy: 'no-overlap',
        //     parameters: {
        //         depthTest: false,
        //     },
        //     beforeId: 'housenumber',
        //     pickable: true,
        //     onClick: (info) => {
        //         if (info?.coordinate) {
        //             setClickedPoint({ longitude: info.coordinate[0], latitude: info.coordinate[1] });
        //         }
        //     },
        //     renderSubLayers: (props) => {
        //         const [[west, south], [east, north]] = props.tile.boundingBox;
        //         const { data, ...otherProps } = props;
        //         return new BitmapLayer(otherProps, {
        //             image: data,
        //             bounds: [west, south, east, north],
        //         });
        //     },
        // }),
        new WeatherLayers.ParticleLayer({
            id: 'gfs-wind',
            image: gfsWindBippedData,
            imageType: 'VECTOR',
            imageUnscale: [-40, 40],
            maxAge: 10,
            speedFactor: 3.0,
            numParticles: 6000,
        }),
    ];

    // Prevent drawer from blocking pointer events when open
    // https://github.com/emilkowalski/vaul/issues/497#issuecomment-2457929052
    useEffect(() => {
        if (drawerOpen) {
            // Pushing the change to the end of the call stack
            const timer = setTimeout(() => {
                document.body.style.pointerEvents = '';
            }, 0);

            return () => clearTimeout(timer);
        } else {
            document.body.style.pointerEvents = 'auto';
        }
    }, [drawerOpen]);

    useEffect(() => {
        setDrawerOpen(clickedPoint !== null);
    }, [clickedPoint]);

    return (
        <main className="h-screen w-screen">
            <TimeseriesDrawer
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                selectedPoint={clickedPoint ?? { longitude: 0, latitude: 0 }}
                timeseriesData={{
                    data: timeseriesData?.data ?? [],
                    isLoading: timeseriesDataIsLoading,
                }}
                onClose={() => setSearchParams({},)}
            />
            <Map
                initialViewState={{
                    longitude: clickedPoint?.longitude ?? -100,
                    latitude: clickedPoint?.latitude ?? 30,
                    zoom: 2,
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
                onClick={(e) => setSearchParams({ lat: e.lngLat.lat.toString(), lng: e.lngLat.lng.toString() })}
            >
                <DeckGLOverlay layers={layers} interleaved={false} />
                <Source
                    id="gfs-temperature"
                    maxzoom={10}
                    type="raster"
                    tileSize={512}
                    tiles={[
                        createGfsWmsUrlTemplate({
                            colorPalette: 'jet',
                            colorScaleRange: [-40, 40],
                            layer: 'temperature_2m',
                            tileWidth: 512,
                            tileHeight: 512,
                        }),
                    ]}
                >
                    <Layer id="gfs-temperature" type="raster" paint={{ 'raster-opacity': 0.4 }} />
                </Source>
                {clickedPoint && <Marker longitude={clickedPoint.longitude} latitude={clickedPoint.latitude} />}
            </Map>
        </main>
    );
}
