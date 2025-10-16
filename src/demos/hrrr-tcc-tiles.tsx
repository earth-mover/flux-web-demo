import Map, { Layer, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router';
// import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

/**
 * Creates a Tiles URL template for fetching HRRR data from Flux
 * @param colorPalette - The color palette to use. This is any matplotlib colormap name. See https://matplotlib.org/stable/tutorials/colors/colormaps.html
 * @param colorScaleRange - The range of the color scale, formatted as [min, max].
 * @param layer - The data variable to use.
 * @param tileWidth - The width of the tile.
 * @param tileHeight - The height of the tile.
 * @param x - The x coordinate of the tile. If creating a tile template leave undefined.
 * @param y - The y coordinate of the tile. If creating a tile template leave undefined.
 * @param z - The z coordinate of the tile. If creating a tile template leave undefined.
 */
function createHrrrTilesUrlTemplate({
    colorPalette,
    colorScaleRange,
    layer,
    tileWidth,
    tileHeight,
    x,
    y,
    z,
    time,
    step,
}: {
    colorPalette: string;
    colorScaleRange: [number, number];
    layer: 'tcc';
    tileWidth: number;
    tileHeight: number;
    x?: number;
    y?: number;
    z?: number;
    time: string;
    step: string;
}): string {
    const xx = x ?? '{x}';
    const yy = y ?? '{y}';
    const zz = z ?? '{z}';
    return `https://compute.earthmover.io/v1/services/tiles/earthmover-public/hrrr/main/solar/tiles/WebMercatorQuad/${zz}/${yy}/${xx}?&variables=${layer}&colorscalerange=${colorScaleRange.join(
        ',',
    )}&width=${tileWidth}&height=${tileHeight}&style=raster/${colorPalette}&time=${time}&step=${step}`;
}

function createHrrrPointTimeseriesUrlTemplate({
    layers,
    latitude,
    longitude,
    format,
    time,
}: {
    layers: 'tcc'[];
    latitude: number;
    longitude: number;
    format: 'cf_covjson' | 'csv' | 'nc' | 'geojson' | 'parquet';
    time: string;
}): string {
    return `https://compute.earthmover.io/v1/services/edr/earthmover-public/hrrr/main/edr/position?coords=POINT(${longitude}%20${latitude})&time=${time}&f=cf_covjson&parameter-name=${layers.join(
        ',',
    )}&f=${format}`;
}

// async function fetchTimeseriesData({
//     layers,
//     latitude,
//     longitude,
//     time,
// }: {
//     layers: 'tcc'[];
//     latitude: number;
//     longitude: number;
//     time: string;
// }): Promise<{ data: { time: number; value: number }[]; url: string }> {
//     const url = createHrrrPointTimeseriesUrlTemplate({
//         layers,
//         latitude,
//         longitude,
//         time,
//         format: 'cf_covjson',
//     });
//     const response = await fetch(url);
//     const data = await response.json();

//     const values = data.ranges[layers[0]].values as number[];

//     return {
//         data: values.map((value, index) => ({
//             time: new Date(data.domain.axes.t.values[index] + 'Z').getTime(),
//             value,
//         })),
//         url,
//     };
// }

function TimeseriesDrawer({
    drawerOpen,
    time,
    setDrawerOpen,
    selectedPoint,
    timeseriesData,
    onClose,
}: {
    drawerOpen: boolean;
    time: string;
    setDrawerOpen: (open: boolean) => void;
    selectedPoint: { longitude: number; latitude: number } | null;
    timeseriesData: { data: { time: number; value: number }[]; isLoading: boolean };
    onClose: () => void;
}) {
    if (!selectedPoint) return null;
    const covjsonUrl = createHrrrPointTimeseriesUrlTemplate({
        layers: ['tcc'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        time,
        format: 'cf_covjson',
    });
    const csvUrl = createHrrrPointTimeseriesUrlTemplate({
        layers: ['tcc'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        time,
        format: 'csv',
    });
    const geojsonUrl = createHrrrPointTimeseriesUrlTemplate({
        layers: ['tcc'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        time,
        format: 'geojson',
    });
    const parquetUrl = createHrrrPointTimeseriesUrlTemplate({
        layers: ['tcc'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        time,
        format: 'parquet',
    });
    const ncUrl = createHrrrPointTimeseriesUrlTemplate({
        layers: ['tcc'],
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        time,
        format: 'nc',
    });
    return (
        <Drawer open={drawerOpen} modal={false} onOpenChange={setDrawerOpen} onClose={onClose}>
            <DrawerContent>
                <DrawerHeader className="flex flex-row justify-between items-start align-middle w-full">
                    <div className="flex flex-col items-start gap-2">
                        <DrawerTitle>
                            <div className="flex flex-row items-center gap-2">
                                <span>Total Cloud Cover (%)</span>
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

function Legend({ time }: { time: string }) {
    return (
        <div className="absolute bottom-16 right-4 bg-[var(--background)] p-2 rounded-md">
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center justify-between py-2">
                    <div className="flex flex-col items-start">
                        <span>Total Cloud Cover (%)</span>
                        <span className="text-sm text-muted-foreground">Valid: {time}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Globe() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [time, _setTime] = useState('2025-10-01T00:00:00Z');
    const [step, _setStep] = useState('0 hours');
    const [colorPalette, _setColorPalette] = useState('Blues');
    const [colorScaleRange, _setColorScaleRange] = useState<[number, number]>([0, 100]);

    const clickedPoint = useMemo(() => {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        return lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null;
    }, [searchParams]);

    const { data: _timeseriesData, isLoading: timeseriesDataIsLoading } = useQuery({
        queryKey: ['timeseries', clickedPoint],
        queryFn: async () => {
            return null
            // return await fetchTimeseriesData({
            //     layers: ['tcc'],
            //     latitude: clickedPoint.latitude,
            //     longitude: clickedPoint.longitude,
            //     time,
            // });
        },
    });

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

    // useEffect(() => {
    //     setDrawerOpen(clickedPoint !== null);
    // }, [clickedPoint]);

    return (
        <section className="flex flex-col flex-1">
            <TimeseriesDrawer
                time={time}
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                selectedPoint={clickedPoint ?? { longitude: 0, latitude: 0 }}
                timeseriesData={{
                    data: [],
                    isLoading: timeseriesDataIsLoading,
                }}
                onClose={() => setSearchParams({})}
            />
            <Map
                initialViewState={{
                    longitude: clickedPoint?.longitude ?? -100,
                    latitude: clickedPoint?.latitude ?? 30,
                    zoom: 3,
                }}
                style={{
                    flex: 1,
                    background: 'radial-gradient(circle at center, var(--blue) 0%, var(--midnight) 70%)',
                }}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                projection="mercator"
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
                <Source
                    id="hrrr-tcc"
                    maxzoom={10}
                    type="raster"
                    tileSize={512}
                    tiles={[
                        createHrrrTilesUrlTemplate({
                            colorPalette: colorPalette,
                            colorScaleRange: colorScaleRange,
                            layer: 'tcc',
                            tileWidth: 512,
                            tileHeight: 512,
                            time,
                            step,
                        }),
                    ]}
                >
                    <Layer id="hrrr-tcc" type="raster" paint={{ 'raster-opacity': 0.6 }} />
                </Source>
                {/*{clickedPoint && <Marker longitude={clickedPoint.longitude} latitude={clickedPoint.latitude} />}*/}
            </Map>
            <Legend time={time} />
        </section>
    );
}
