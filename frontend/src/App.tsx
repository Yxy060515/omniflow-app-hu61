import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/custom/Login';
import Signup from './components/custom/Signup';
import Index from './pages/Index';
import Preview from './pages/Preview';
import NotFound from './pages/NotFound';

const AuthLoading = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
    <p className="text-sm text-muted-foreground">正在验证登录状态...</p>
  </div>
);

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return <AuthLoading />;
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/" element={isAuthenticated ? <Index /> : <Navigate to="/login" replace />} />
      <Route path="/preview" element={<Preview />} />
      <Route path="/d021aa4a-ac1f-41e5-856a-ac86f1d04637" element={<Preview />} />
      <Route path="/f7d19c21-4e0f-4219-95d1-886a89c9c12e" element={<Preview />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <HashRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </HashRouter>
);

export default App;
