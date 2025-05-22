import Map, { Layer, Source, useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay as DeckOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layer as DeckLayer } from '@deck.gl/core';

function createGfsWmsUrlTemplate({
    colorPalette,
    colorScaleRange,
    layer,
    tileSize,
}: {
    colorPalette: string;
    colorScaleRange: [number, number];
    layer: 'temperature_2m' | 'wind_u_10m' | 'wind_v_10m';
    tileSize: number;
}): string {
    return `https://compute.earthmover.io/v1/services/wms/earthmover-demos/dyanmical-gfs-analysis/main/wms?version=1.3.0&service=WMS&request=GetMap&layers=${layer}&colorscalerange=${colorScaleRange.join(
        ',',
    )}&width=${tileSize}&height=${tileSize}&tile={x},{y},{z}&crs=EPSG:3857&styles=raster/${colorPalette}`;
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
    const layers: DeckLayer[] = [
        // new TileLayer({
        //     id: 'gfs-temperature',
        //     data: 'https://compute.earthmover.io/v1/services/wms/earthmover-demos/dyanmical-gfs-analysis/main/wms?version=1.3.0&service=WMS&request=GetMap&layers=temperature_2m&colorscalerange=0,50&width=512&height=512&tile={x},{y},{z}&crs=EPSG:3857&styles=raster/viridis',
        //     tileSize: 512,
        //     maxRequests: 8,
        //     opacity: 0.5,
        //     refinementStrategy: 'no-overlap',
        //     beforeId: '"housenumber"',
        //     renderSubLayers: (props) => {
        //         const [[west, south], [east, north]] = props.tile.boundingBox;
        //         const { data, ...otherProps } = props;
        //         return [
        //             new BitmapLayer(otherProps, {
        //                 image: data,
        //                 bounds: [west, south, east, north],
        //             }),
        //         ];
        //     },
        // }),
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
                <DeckGLOverlay layers={layers} interleaved />
                <Source
                    id={'gfs-temperature'}
                    type="raster"
                    tiles={[
                        createGfsWmsUrlTemplate({
                            colorPalette: 'gist_earth',
                            colorScaleRange: [-40, 40],
                            layer: 'temperature_2m',
                            tileSize: 512,
                        }),
                    ]}
                >
                    <Layer
                        id={'gfs-temperature'}
                        type="raster"
                        source={'gfs-temperature'}
                        paint={{ 'raster-opacity': 0.5 }}
                    />
                </Source>
            </Map>
        </main>
    );
}
