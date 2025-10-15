import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import GfsGlobeTiles from './demos/gfs-globe-tiles';
import GfsGlobeWMS from './demos/gfs-globe-wms';
import HrrrTccTiles from './demos/hrrr-tcc-tiles';
import Root from './root';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Root />}>
                        <Route path="/gfs-globe-tiles" element={<GfsGlobeTiles />} />
                        <Route path="/gfs-globe-wms" element={<GfsGlobeWMS />} />
                        <Route path="/hrrr-tcc-tiles" element={<HrrrTccTiles />} />
                        <Route path="/" element={<Navigate to="/gfs-globe-wms" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>,
);
