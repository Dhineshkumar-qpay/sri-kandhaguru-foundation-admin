import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Video,
  Image as ImageIcon,
  IndianRupee,
  Ticket,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import api from "../services/api";

const chartData = [
  { name: "Jan", visitors: 4000, donations: 2400 },
  { name: "Feb", visitors: 3000, donations: 1398 },
  { name: "Mar", visitors: 2000, donations: 9800 },
  { name: "Apr", visitors: 2780, donations: 3908 },
  { name: "May", visitors: 1890, donations: 4800 },
  { name: "Jun", visitors: 2390, donations: 3800 },
  { name: "Jul", visitors: 3490, donations: 4300 },
];

interface DashboardData {
  visistors: number;
  revenue: number;
  eventss: number;
  bookings: number;
  videos: number;
  images: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.post("/dashboard/get");
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Visitors",
      value: data?.visistors?.toLocaleString() || 0,
      icon: Users,
      color: "bg-blue-500",
      trend: "Live",
    },
    {
      title: "Total Revenue",
      value: `₹${(data?.revenue || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "bg-green-500",
      trend: "Live",
    },
    {
      title: "Total Events",
      value: data?.eventss?.toLocaleString() || 0,
      icon: Calendar,
      color: "bg-saffron-500",
      trend: "Live",
    },
    {
      title: "Event Bookings",
      value: data?.bookings?.toLocaleString() || 0,
      icon: Ticket,
      color: "bg-purple-500",
      trend: "Live",
    },
  ];

  const secondaryStats = [
    {
      title: "Videos Published",
      value: data?.videos?.toLocaleString() || 0,
      icon: Video,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      title: "Gallery Images",
      value: data?.images?.toLocaleString() || 0,
      icon: ImageIcon,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-8 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
          <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back to Sri Kandhaguru Foundation Admin Panel.
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-elegant border border-saffron-50/50 hover:shadow-premium transition-shadow group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-saffron-50 to-saffron-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />

              <div className="relative flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-xl font-[900] text-gray-800">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.color} p-3 rounded-xl text-white shadow-lg shadow-black/5`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  {stat.trend}
                </span>
                <span className="text-xs text-gray-400">up to date</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-elegant border border-saffron-50/50"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Traffic & Revenue Overview
            </h2>
            <select className="bg-saffron-50 border-none text-sm font-medium text-saffron-800 rounded-lg focus:ring-0">
              <option>Last 7 months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorVisitors"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ff8a05" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff8a05" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorDonations"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#ff8a05"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                />
                <Area
                  type="monotone"
                  dataKey="donations"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDonations)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Secondary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-elegant border border-saffron-50/50 flex flex-col"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Content Overview
          </h2>
          <div className="flex-1 flex flex-col justify-start space-y-4">
            {secondaryStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-saffron-200 hover:bg-saffron-50/30 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`${stat.bg} ${stat.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-700">
                      {stat.title}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 text-lg">
                    {stat.value}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
