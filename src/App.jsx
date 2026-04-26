import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Timeline from './pages/Timeline';
import Ask from './pages/Ask';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import People from './pages/People';
import { Toaster } from '@/components/ui/sonner';
import UploadModal from './components/upload/UploadModal';
import { getReports } from './lib/supabase';
import { AuthProvider, useAuth } from './lib/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

function AppContent() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchReports = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getReports();
      setReports(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    } else {
      setReports([]);
    }
  }, [user]);

  const handleReportDeleted = (deletedId) => {
    setReports(prev => prev.filter(r => r.id !== deletedId));
  };

  const handleSignOutClear = () => {
    setReports([]);
  };

  return (
      <div className="min-h-screen bg-surface">
        {user && <Header onOpenUpload={() => setIsUploadOpen(true)} onSignOut={handleSignOutClear} />}
        <Routes>
          <Route path="/" element={<ProtectedRoute><Timeline reports={reports} isLoading={isLoading} fetchReports={fetchReports} onReportDeleted={handleReportDeleted} /></ProtectedRoute>} />
          <Route path="/ask" element={<ProtectedRoute><Ask /></ProtectedRoute>} />
          <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
        <UploadModal 
          isOpen={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
          onReportSaved={fetchReports} 
        />
        <Toaster />
      </div>
  );
}

export default function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
