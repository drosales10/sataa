import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy load de páginas para code-splitting
const Index = lazy(() => import('./pages/Index'));
const Login = lazy(() => import('./pages/Login'));
const MapView = lazy(() => import('./pages/MapView'));
const TimeSeries = lazy(() => import('./pages/TimeSeries'));
const Reports = lazy(() => import('./pages/Reports'));
const Alerts = lazy(() => import('./pages/Alerts'));
const CommunityReport = lazy(() => import('./pages/CommunityReport'));
const Settings = lazy(() => import('./pages/Settings'));
const SupabaseTest = lazy(() => import('./pages/SupabaseTest'));
const NotFound = lazy(() => import('./pages/NotFound'));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner fullScreen text="Cargando página..." />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/time-series" element={<TimeSeries />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/community-report" element={<CommunityReport />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/supabase-test" element={<SupabaseTest />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;