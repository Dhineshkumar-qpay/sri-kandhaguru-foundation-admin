import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Image as ImageIcon, 
  Video, 
  Users, 
  Settings, 
  Heart,
  MessageSquare,
  FileText,
  Menu,
  Bell,
  Search,
  ChevronLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const sidebarLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Programs', path: '/programs', icon: Heart },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Video Library', path: '/videos', icon: Video },
  { name: 'Gallery', path: '/gallery', icon: ImageIcon },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="h-screen bg-spiritual-cream flex overflow-hidden w-full">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="bg-white border-r border-saffron-100 flex flex-col transition-all duration-300 z-20 relative shadow-elegant h-full"
      >
        <div className="h-20 flex items-center justify-between px-4 border-b border-saffron-100">
          {sidebarOpen && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white-400 to-white-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              <img src="appLogo.png" alt="applogo" />
              </div>
              <span className="font-bold text-gray-800 text-lg whitespace-nowrap">Sri Kandhaguru</span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">
              SK
            </div>
          )}
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-24 bg-white border border-saffron-200 rounded-full p-1 shadow-md hover:bg-saffron-50 transition-colors"
        >
          <ChevronLeft className={clsx("w-4 h-4 text-gray-600 transition-transform", !sidebarOpen && "rotate-180")} />
        </button>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            
            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-500/20" 
                    : "text-gray-600 hover:bg-saffron-50 hover:text-saffron-600"
                )}
                title={!sidebarOpen ? link.name : undefined}
              >
                <Icon className={clsx("w-5 h-5 shrink-0", isActive ? "text-white" : "text-gray-500 group-hover:text-saffron-600")} />
                {sidebarOpen && <span className="font-medium whitespace-nowrap">{link.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-saffron-100 flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2.5 bg-saffron-50/50 border border-saffron-100 rounded-full focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-500 hover:text-saffron-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-saffron-100 cursor-pointer group">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-saffron-600 transition-colors">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
              <img 
                src="https://ui-avatars.com/api/?name=Admin+User&background=ff8a05&color=fff" 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-saffron-200 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
