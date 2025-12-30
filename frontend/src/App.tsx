import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import Leases from './pages/Leases';
import Vendors from './pages/Vendors';
import Inspections from './pages/Inspections';
import Settings from './pages/Settings';
import TenantPortal from './pages/TenantPortal';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/tenant" element={<TenantPortal />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/:id" element={<PropertyDetail />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/tickets/:id" element={<TicketDetail />} />
                <Route path="/leases" element={<Leases />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/inspections" element={<Inspections />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
