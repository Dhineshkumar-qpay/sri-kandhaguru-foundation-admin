import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Video,
  Image as ImageIcon,
  IndianRupee,
  Ticket,
  Box,
  Star,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import api from "../services/api";

interface RevenueData {
  month: number;
  orders: number;
  bookings: number;
  donations: number;
  total: number;
}

interface DashboardData {
  visitors: number;
  orderrevenue: number;
  bookingsrevenue: number;
  donationrevenue: number;
  events: number;
  bookings: number;
  videos: number;
  images: number;
  products: number;
  reviews: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("one_month");
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchDashboardData(dateFilter);
  }, [dateFilter]);

  useEffect(() => {
    fetchRevenueData(revenueYear);
  }, [revenueYear]);

  const fetchRevenueData = async (year: string) => {
    try {
      const response = await api.post("/dashboard/get-revenues", { year });
      if (response.data?.success) {
        setRevenueData(response.data.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch revenue data", error);
    }
  };

  const fetchDashboardData = async (date: string) => {
    try {
      setLoading(true);
      const response = await api.post("/dashboard/get", { date });
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!data) return;
    const csvContent = [
      ["Metric", "Value"],
      ["Visitors", data.visitors],
      ["Order Revenue", data.orderrevenue],
      ["Bookings Revenue", data.bookingsrevenue],
      ["Donation Revenue", data.donationrevenue],
      ["Events", data.events],
      ["Bookings", data.bookings],
      ["Videos", data.videos],
      ["Images", data.images],
      ["Products", data.products],
      ["Reviews", data.reviews],
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `dashboard_data_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    {
      title: "Total Visitors",
      value: data?.visitors?.toLocaleString() || 0,
      icon: Users,
      color: "bg-blue-500",
      trend: "Live",
    },
    {
      title: "Total Events",
      value: data?.events?.toLocaleString() || 0,
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
    {
      title: "Order Revenue",
      value: `₹${(data?.orderrevenue || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "bg-green-500",
      trend: "Live",
    },
    {
      title: "Donation Revenue",
      value: `₹${(data?.donationrevenue || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "bg-pink-500",
      trend: "Live",
    },
    {
      title: "Event Bookings Revenue",
      value: `₹${(data?.bookingsrevenue || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "bg-teal-500",
      trend: "Live",
    },
  ];

  const secondaryStats = [
    {
      title: "Products",
      value: data?.products?.toLocaleString() || 0,
      icon: Box,
      color: "text-green-500",
      bg: "bg-green-50",
    },
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
    {
      title: "Reviews",
      value: data?.reviews?.toLocaleString() || 0,
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  const pieData = [
    { name: "Orders", value: data?.orderrevenue || 0, color: "#14B8A6" },
    { name: "Bookings", value: data?.bookingsrevenue || 0, color: "#6366F1" },
    { name: "Donations", value: data?.donationrevenue || 0, color: "#F59E0B" },
  ].filter((item) => item.value > 0);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedRevenueData = revenueData.map((item) => ({
    name: monthNames[item.month - 1] || "",
    orders: item.orders,
    bookings: item.bookings,
    donations: item.donations,
    total: item.total
  }));

  return (
    <div className="space-y-8 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
          <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back to Sri Kandhaguru Foundation Admin Panel.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-saffron-500 outline-none cursor-pointer"
          >
            <option value="all_time">All Time</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_two_weeks">Last 2 Weeks</option>
            <option value="one_month">1 Month</option>
            <option value="three_months">3 Months</option>
            <option value="one_years">1 Year</option>
          </select>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-saffron-500 hover:bg-saffron-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {secondaryStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="bg-white flex items-center justify-between p-5 rounded-xl border border-gray-100 shadow-sm hover:border-saffron-200 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`${stat.bg} ${stat.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700 text-sm">
                  {stat.title}
                </span>
              </div>
              <span className="font-bold text-gray-900 text-lg">
                {stat.value}
              </span>
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
            <select 
              value={revenueYear}
              onChange={(e) => setRevenueYear(e.target.value)}
              className="bg-saffron-50 border-none text-sm font-medium text-saffron-800 rounded-lg focus:ring-0 cursor-pointer outline-none"
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedRevenueData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any, name?: any, props?: any) => {
                    // value can be a number, string or an array (for stacked values) so handle generically
                    const raw = Array.isArray(value) ? value[0] : value;
                    const num = typeof raw === "number" ? raw : Number(raw) || 0;
                    return `₹${num.toLocaleString()}`;
                  }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area type="monotone" dataKey="orders" stroke="#14B8A6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                <Area type="monotone" dataKey="bookings" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
                <Area type="monotone" dataKey="donations" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Revenue Breakdown (Pie Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-elegant border border-saffron-50/50 flex flex-col"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Revenue Breakdown
          </h2>
          <div className="flex-1 flex items-center justify-center min-h-[250px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => {
                      const num =
                        typeof value === "number" ? value : Number(value) || 0;
                      return `₹${num.toLocaleString()}`;
                    }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm">No revenue data.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
