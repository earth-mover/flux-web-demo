import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import GfsGlobeWMS from './demos/gfs-globe-wms';
import Root from './root';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Root />}>
                        <Route path="/gfs-globe-wms" element={<GfsGlobeWMS />} />
                        <Route path="/" element={<Navigate to="/gfs-globe-wms" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>,
);
