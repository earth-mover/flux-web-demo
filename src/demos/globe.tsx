import Map from "react-map-gl/maplibre";


export default function Globe() {
  return (
    <main className="h-screen w-screen">
      <Map
        initialViewState={{
          longitude: -100,
          latitude: 30,
          zoom: 3,
        }}
        style={{ 
          width: "100%", 
          height: "100%", 
          background: "radial-gradient(circle at center, var(--blue) 0%, var(--midnight) 70%)" 
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        projection="globe"
        sky={{
            "sky-color": "#199EF3",
            "sky-horizon-blend": 0.5,
            "horizon-color": "#ffffff",
            "horizon-fog-blend": 0.5,
            "fog-color": "#0000ff",
            "fog-ground-blend": 0.5,
            "atmosphere-blend": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0, 1,
                5, 1,
                7, 0,
            ]
        }}
      />
    </main>
  );
}