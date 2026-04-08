import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { MobileNav } from './components/MobileNav';
import { PinDetail } from './pages/PinDetail';
import { Profile } from './pages/Profile';
import { Saved } from './pages/Saved';
import { CreatePin } from './pages/CreatePin';
import { Settings } from './pages/Settings';
import AlbumDetail from './pages/AlbumDetail';
import { TermsPage, PrivacyPage, HelpPage } from './pages/StaticPages';
import { SavedPinsProvider } from './contexts/SavedPinsContext';
import { CreatedPinsProvider } from './contexts/CreatedPinsContext';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UISettingsProvider } from './contexts/UISettingsContext';
import { ImageHistoryProvider } from './contexts/ImageHistoryContext';
import { PhotoAlbumProvider } from './contexts/PhotoAlbumContext';
import ImageHistoryPage from './components/ImageHistoryPage';
import PhotoAlbumsPage from './components/PhotoAlbumsPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppRoutes() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const state = location.state as { background?: Location };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-anime-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-anime-primary"></div>
          <p className="text-anime-text font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Hide mobile nav on login/signup page or deep detail pages if desired
  const showMobileNav = isAuthenticated && location.pathname !== '/login' && location.pathname !== '/signup' && !location.pathname.includes('/pin/');

  return (
    <>
      <Routes location={state?.background || location}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/saved" element={<RequireAuth><Saved /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><ImageHistoryPage /></RequireAuth>} />
        <Route path="/albums" element={<RequireAuth><PhotoAlbumsPage /></RequireAuth>} />
        <Route path="/album/:albumId" element={<RequireAuth><AlbumDetail /></RequireAuth>} />
        <Route path="/create-pin" element={<RequireAuth><CreatePin /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/pin/:id" element={<RequireAuth><PinDetail /></RequireAuth>} />
      </Routes>

      {state?.background && (
        <Routes>
          <Route path="/pin/:id" element={<RequireAuth><PinDetail /></RequireAuth>} />
        </Routes>
      )}

      {showMobileNav && <MobileNav />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UISettingsProvider>
        <AuthProvider>
          <ToastProvider>
            <UserProvider>
              <SavedPinsProvider>
                <CreatedPinsProvider>
                  <ImageHistoryProvider>
                    <PhotoAlbumProvider>
                      <BrowserRouter>
                        <ErrorBoundary>
                          <AppRoutes />
                        </ErrorBoundary>
                      </BrowserRouter>
                    </PhotoAlbumProvider>
                  </ImageHistoryProvider>
                </CreatedPinsProvider>
              </SavedPinsProvider>
            </UserProvider>
          </ToastProvider>
        </AuthProvider>
      </UISettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
