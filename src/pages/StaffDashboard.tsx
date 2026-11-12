import { useEffect, useState } from "react";
import {
  CalendarCheck2,
  ClipboardList,
  IndianRupee,
  ShoppingBag,
  Stethoscope,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface StaffDashboardData {
  totalRegistrationHistorycount: number;
  totalpurchasehistorycount: number;
  totalRegistrationHistoryvalue: number;
  totalpurchasehistoryvalue: number;
  totalleavecount: number;
  currentmonthpresentdayscount: number;
}

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const cards = [
  {
    key: "totalRegistrationHistorycount",
    title: "Event Registrations",
    icon: ClipboardList,
    color: "bg-saffron-500",
    format: "count",
  },
  {
    key: "totalRegistrationHistoryvalue",
    title: "Registration Value",
    icon: IndianRupee,
    color: "bg-teal-500",
    format: "currency",
  },
  {
    key: "totalpurchasehistorycount",
    title: "Purchases",
    icon: ShoppingBag,
    color: "bg-blue-500",
    format: "count",
  },
  {
    key: "totalpurchasehistoryvalue",
    title: "Sales Value",
    icon: IndianRupee,
    color: "bg-green-500",
    format: "currency",
  },
  {
    key: "totalleavecount",
    title: "Leave Requests",
    icon: Stethoscope,
    color: "bg-purple-500",
    format: "count",
  },
  {
    key: "currentmonthpresentdayscount",
    title: "Present Days This Month",
    icon: CalendarCheck2,
    color: "bg-rose-500",
    format: "count",
  },
] as const;

export default function StaffDashboard() {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [yearMonth, setYearMonth] = useState(getCurrentMonth);

  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const response =
          await api.post<ApiResponse<StaffDashboardData>>(
            "/staff/dashboard/get",
            { yearMonth },
          );
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to load staff dashboard.",
          );
        }
        if (active) setData(response.data.data);
      } catch (requestError) {
        console.error("Failed to load staff dashboard", requestError);
        if (active) {
          setError(
            requestError instanceof Error && requestError.message
              ? requestError.message
              : "Unable to load staff dashboard. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchDashboard();
    return () => {
      active = false;
    };
  }, [yearMonth]);

  return (
    <div className="relative space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            Staff Dashboard
          </h1>
          <p className="mt-1 text-gray-500">
            Overview of your registrations, purchases, leave, and attendance.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
          Select month
          <input
            type="month"
            aria-label="Filter staff dashboard by month"
            value={yearMonth}
            onChange={(event) => setYearMonth(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
          />
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="flex min-h-40 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
        </div>
      )}
      {!loading && (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const value = data?.[card.key] ?? 0;
          const formattedValue =
            card.format === "currency"
              ? `₹${value.toLocaleString("en-IN")}`
              : value.toLocaleString("en-IN");

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="relative overflow-hidden rounded-xl border border-saffron-50/50 bg-white p-6 shadow-elegant"
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-saffron-50/70" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500">
                    {card.title}
                  </p>
                  <p className="text-2xl font-black text-gray-800">
                    {formattedValue}
                  </p>
                </div>
                <span
                  className={`${card.color} rounded-xl p-3 text-white shadow-lg shadow-black/5`}
                >
                  <Icon className="h-6 w-6" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}
    </div>
  );
}
