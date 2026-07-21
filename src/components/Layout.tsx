import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Image as ImageIcon,
  Video,
  Users,
  Settings,
  Tags,
  MessageSquare,
  Menu,
  ChevronLeft,
  LogOut,
  X,
  Star,
  Ticket,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

interface UserProfile {
  username: string;
  userType: string;
}

const sidebarLinks = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Event Bookings", path: "/bookings", icon: Ticket },
  { name: "Events", path: "/events", icon: Calendar },
  { name: "Categories", path: "/categories", icon: Tags },
  { name: "Video Library", path: "/videos", icon: Video },
  { name: "Gallery", path: "/gallery", icon: ImageIcon },
  { name: "Users", path: "/users", icon: Users },
  { name: "Contacts", path: "/contacts", icon: MessageSquare },
  { name: "Reviews", path: "/reviews", icon: Star },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    api
      .post("/user/get")
      .then((res) => {
        if (res.data?.success) {
          setProfile(res.data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch profile in header", err));
  }, []);

  return (
    <div className="h-screen bg-spiritual-cream flex overflow-hidden w-full relative">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen || mobileMenuOpen ? 260 : 80 }}
        className={clsx(
          "bg-white border-r border-saffron-100 flex flex-col transition-transform duration-300 z-50 shadow-elegant h-full",
          "fixed md:relative top-0 left-0 bottom-0",
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-20 flex items-center justify-between px-4 border-b border-saffron-100">
          {(sidebarOpen || mobileMenuOpen) && (
            <div className="flex items-center gap-3 overflow-hidden w-full">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white-400 to-white-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 overflow-hidden">
                <img
                  src="appLogo.png"
                  alt="applogo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="flex-1 leading-tight">
                <span className="block text-lg font-extrabold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent tracking-wide">
                  Sri Kandhaguru
                </span>
                <span className="block text-sm font-semibold text-gray-700 tracking-[0.25em]">
                  Foundation
                </span>
              </span>
              <button
                className="md:hidden p-1 text-gray-400 hover:text-gray-600 shrink-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {!sidebarOpen && !mobileMenuOpen && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md shrink-0">
              SK
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute -right-3 top-24 bg-white border border-saffron-200 rounded-full p-1 shadow-md hover:bg-saffron-50 transition-colors z-50"
        >
          <ChevronLeft
            className={clsx(
              "w-4 h-4 text-gray-600 transition-transform",
              !sidebarOpen && "rotate-180",
            )}
          />
        </button>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);

            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-500/20"
                      : "text-gray-600 hover:bg-saffron-50 hover:text-saffron-600",
                  )
                }
                title={!sidebarOpen && !mobileMenuOpen ? link.name : undefined}
              >
                <Icon
                  className={clsx(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-white"
                      : "text-gray-500 group-hover:text-saffron-600",
                  )}
                />
                {(sidebarOpen || mobileMenuOpen) && (
                  <span className="font-medium whitespace-nowrap">
                    {link.name}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="p-3 border-t border-saffron-100 mt-auto">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className={clsx(
              "flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all duration-200 group text-red-500 hover:bg-red-50 cursor-pointer",
              !sidebarOpen && !mobileMenuOpen && "justify-center",
            )}
            title={!sidebarOpen && !mobileMenuOpen ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(sidebarOpen || mobileMenuOpen) && (
              <span className="font-medium whitespace-nowrap">Logout</span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-saffron-100 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 shadow-sm w-full">
          <div className="flex items-center gap-4 flex-1">
            <button
              className="md:hidden p-2 -ml-2 text-gray-500 hover:text-saffron-600 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 pl-0 sm:pl-6 sm:border-l border-saffron-100 cursor-pointer group">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-saffron-600 transition-colors">
                  {profile ? profile.username : "Loading..."}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile ? profile.userType : ""}
                </p>
              </div>
              <img
                src={`https://ui-avatars.com/api/?name=${profile ? encodeURIComponent(profile.username) : "U"}&background=ff8a05&color=fff`}
                alt="Profile"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-saffron-200 shadow-sm shrink-0"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
