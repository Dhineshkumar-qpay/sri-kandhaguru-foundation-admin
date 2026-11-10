import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";
import Dashboard from "./Dashboard";
import StaffDashboard from "./StaffDashboard";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface UserProfile {
  userType: string;
}

export default function DashboardPage() {
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const response = await api.post<ApiResponse<UserProfile>>("/admin/get");
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to load signed-in profile.",
          );
        }
        if (active) setUserType(response.data.data.userType?.toLowerCase());
      } catch (requestError) {
        console.error("Failed to identify dashboard user", requestError);
        if (active) {
          setError(
            requestError instanceof Error && requestError.message
              ? requestError.message
              : "Unable to load your dashboard. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
      >
        {error}
      </div>
    );
  }

  if (userType === "staff") return <StaffDashboard />;
  if (userType === "admin") return <Dashboard />;

  return <Navigate to="/login" replace />;
}
