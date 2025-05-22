import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Globe from './demos/globe';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Globe />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>,
);
