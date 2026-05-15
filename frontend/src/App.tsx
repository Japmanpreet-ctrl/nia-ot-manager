import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import api from './lib/api';
import { auth } from './lib/firebase';
import { useAuthStore } from './store/authStore';
import { Toast } from './components/shared/Toast';
import { LoginPage } from './components/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Records } from './pages/Records';
import { AddRecord } from './pages/AddRecord';
import { Analytics } from './pages/Analytics';
import { Inventory } from './pages/Inventory';
import { Linen } from './pages/Linen';
import { Operations } from './pages/Operations';
import { Culture } from './pages/Culture';
import { Articles } from './pages/Articles';
import { AdminPanel } from './pages/AdminPanel';
import { RoleRoute } from './components/auth/RoleRoute';
import type { AppUser } from './types';

export const App = () => {
  const { setFirebaseUser, setAppUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setFirebaseUser(user);
      if (!user) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get<AppUser>('/users/me');
        setAppUser(data);
      } catch {
        setAppUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setAppUser, setFirebaseUser, setLoading]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            <Route element={<RoleRoute action="view_records" />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/records" element={<Records />} />
            </Route>
            
            <Route element={<RoleRoute action="add_record" />}>
              <Route path="/add-record" element={<AddRecord />} />
            </Route>
            
            <Route element={<RoleRoute action="view_analytics" />}>
              <Route path="/analytics" element={<Analytics />} />
            </Route>
            
            <Route element={<RoleRoute action="view_inventory" />}>
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/linen" element={<Linen />} />
            </Route>
            
            <Route element={<RoleRoute action="view_operations" />}>
              <Route path="/operations" element={<Operations />} />
              <Route path="/culture" element={<Culture />} />
              <Route path="/articles" element={<Articles />} />
            </Route>
            
            <Route element={<RoleRoute action="access_admin" />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
      <Toast />
    </>
  );
};
