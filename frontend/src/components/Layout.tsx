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
import Logo from './Logo';

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
    <div className="min-h-screen flex bg-forest bg-glow-spotlight">
      {/* Circuitry background overlay */}
      <div className="fixed inset-0 bg-circuitry bg-parallax-slow pointer-events-none opacity-50" />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-forest/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(1, 11, 10, 0.98) 0%, rgba(0, 143, 122, 0.1) 100%)',
          borderRight: '1px solid rgba(205, 127, 50, 0.3)',
          boxShadow: '0 0 30px rgba(0, 255, 212, 0.1)',
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-bronze/30 flex-shrink-0">
          <Link to="/" className="flex items-center group">
            <Logo size={48} />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-viridian/60 hover:text-viridian transition-colors"
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
                className={`group flex items-center gap-3 px-3 py-2.5 rounded mb-1 transition-all duration-300 sweep-effect ${
                  isActive
                    ? 'bg-viridian/20 text-viridian border-l-2 border-viridian shadow-viridian'
                    : 'text-viridian/60 hover:bg-viridian/10 hover:text-viridian border-l-2 border-transparent hover:border-bronze/50'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-all duration-300 ${
                  isActive ? 'drop-shadow-[0_0_8px_rgba(0,255,212,0.6)]' : 'group-hover:drop-shadow-[0_0_5px_rgba(0,255,212,0.4)]'
                }`} />
                <span className="font-spectral text-sm tracking-wide">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-viridian animate-pulse" />
                )}
              </Link>
            );
          })}

          {/* Super Admin Link - only visible to SUPER_ADMIN */}
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded mb-1 mt-4 transition-all duration-300 ${
                location.pathname === '/admin'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'text-red-400/60 hover:bg-red-500/10 hover:text-red-400 border border-red-500/20'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="font-spectral text-sm">Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* User Profile - fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-bronze/30">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded border-2 border-viridian/50 bg-viridian/10 flex items-center justify-center text-viridian font-orbitron font-bold shadow-viridian">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-viridian truncate font-spectral">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-bronze truncate font-spectral">{user?.companyName}</p>
            </div>
            <button
              onClick={logout}
              className="text-viridian/40 hover:text-viridian transition-colors p-2 hover:bg-viridian/10 rounded"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Header */}
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-bronze/20"
          style={{
            background: 'rgba(1, 11, 10, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-viridian/60 hover:text-viridian transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Header content - can add search, notifications, etc. */}
          <div className="flex-1" />

          {/* System Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-viridian animate-pulse shadow-viridian" />
            <span className="text-xs font-orbitron text-viridian/60 tracking-widest hidden sm:inline">
              SYSTEM ONLINE
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>

        {/* Footer accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-viridian/30 to-transparent" />
      </div>
    </div>
  );
}
