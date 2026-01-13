import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Wrench,
  FileText,
  Users,
  ClipboardCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Cog,
  ClipboardList,
  DollarSign,
  RefreshCw,
  Package,
  UserCircle,
  BarChart3,
  Shield,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Work', href: '/my-work', icon: UserCircle },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Assets', href: '/assets', icon: Cog },
  { name: 'Tasks', href: '/maintenance-tasks', icon: ClipboardList },
  { name: 'Tickets', href: '/tickets', icon: Wrench },
  { name: 'Turnovers', href: '/turnovers', icon: RefreshCw },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Team', href: '/team', icon: BarChart3 },
  { name: 'CapEx', href: '/capex', icon: DollarSign },
  { name: 'Leases', href: '/leases', icon: FileText },
  { name: 'Vendors', href: '/vendors', icon: Users },
  { name: 'Inspections', href: '/inspections', icon: ClipboardCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-800/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800 flex-shrink-0">
          <Link to="/" className="text-xl font-bold text-white">
            Maintenance Tasker
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}

          {/* Super Admin Link - only visible to SUPER_ADMIN */}
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 mt-4 transition-colors ${
                location.pathname === '/admin'
                  ? 'bg-red-600 text-white'
                  : 'text-red-400 hover:bg-red-900/50 hover:text-red-300 border border-red-800'
              }`}
            >
              <Shield className="w-5 h-5" />
              Admin Panel
            </Link>
          )}
        </nav>

        {/* User Profile - fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.companyName}</p>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
