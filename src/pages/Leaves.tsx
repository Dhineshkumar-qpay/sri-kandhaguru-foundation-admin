import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertCircle, CalendarDays } from "lucide-react";
import api from "../services/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface AdminProfile {
  userType: string;
}

interface StaffOption {
  userid: number;
  username: string;
}

interface LeaveRecord {
  id: number;
  userid: number;
  fromDate: string;
  toDate: string;
  leaveType: "casual" | "sick";
  dayType: "fullday" | "morning" | "afternoon";
  leaveReason: string;
  createdAt: string;
  updatedAt: string;
  username?: string;
  email?: string;
  mobile?: string;
}

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const requestError = error as {
      response?: {
        data?: {
          data?: unknown;
          message?: unknown;
        };
      };
    };
    const responseData = requestError.response?.data;
    if (typeof responseData?.data === "string" && responseData.data.trim()) {
      return responseData.data;
    }
    if (
      typeof responseData?.message === "string" &&
      responseData.message.trim()
    ) {
      return responseData.message;
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

export default function Leaves() {
  const [userType, setUserType] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [staffs, setStaffs] = useState<StaffOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(leaves.length / pageSize));
  const pageLeaves = leaves.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstRecordNumber =
    leaves.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRecordNumber = Math.min(currentPage * pageSize, leaves.length);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await api.post<ApiResponse<AdminProfile>>("/admin/get");
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to verify the signed-in user.",
          );
        }
        if (active) setUserType(response.data.data.userType);
      } catch (requestError) {
        console.error("Failed to verify access to all leaves", requestError);
        if (active) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to verify access. Please try again.",
            ),
          );
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (profileLoading || userType?.toLowerCase() !== "admin") return;

    let active = true;
    const loadStaffs = async () => {
      setLoadingStaffs(true);
      try {
        const response = await api.post<ApiResponse<StaffOption[]>>(
          "/admin/get-staffs",
        );
        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Unable to load staff members.",
          );
        }
        if (active) {
          setStaffs(Array.isArray(response.data.data) ? response.data.data : []);
        }
      } catch (requestError) {
        console.error("Failed to load staff for leave filter", requestError);
        if (active) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load staff members. Please try again.",
            ),
          );
        }
      } finally {
        if (active) setLoadingStaffs(false);
      }
    };

    void loadStaffs();
    return () => {
      active = false;
    };
  }, [profileLoading, userType]);

  const fetchLeaves = useCallback(async () => {
    setLoadingLeaves(true);
    setError("");
    try {
      const userid = selectedUserId ? Number(selectedUserId) : null;
      const response = await api.post<ApiResponse<LeaveRecord[]>>(
        "/staff/get-all-leaves",
        { userid },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load leave records.",
        );
      }
      setLeaves(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(1);
    } catch (requestError) {
      console.error("Failed to load all staff leaves", requestError);
      setError(
        getErrorMessage(
          requestError,
          "Unable to load leave records. Please try again.",
        ),
      );
      setLeaves([]);
      setCurrentPage(1);
    } finally {
      setLoadingLeaves(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (!profileLoading && userType?.toLowerCase() === "admin") {
      void fetchLeaves();
    }
  }, [fetchLeaves, profileLoading, userType]);

  if (profileLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
      </div>
    );
  }

  if (userType?.toLowerCase() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Leaves</h1>
        <p className="mt-1 text-gray-500">View staff leave requests.</p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50 p-4 sm:flex-row">
          <div>
            <h2 className="font-bold text-gray-800">All Leave Requests</h2>
            <p className="mt-1 text-sm text-gray-500">
              {leaves.length} request{leaves.length === 1 ? "" : "s"}
            </p>
          </div>
          <select
            aria-label="Filter leaves by staff member"
            value={selectedUserId}
            onChange={(event) => {
              setSelectedUserId(event.target.value);
              setCurrentPage(1);
            }}
            disabled={loadingStaffs}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50 sm:w-auto sm:min-w-56"
          >
            <option value="">
              {loadingStaffs ? "Loading staff..." : "All staff"}
            </option>
            {staffs.map((staff) => (
              <option key={staff.userid} value={staff.userid}>
                {staff.username} (#{staff.userid})
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-h-[300px] overflow-x-auto">
          {loadingLeaves && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
            </div>
          )}
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">S.No</th>
                <th className="px-6 py-4 font-medium">Staff</th>
                <th className="px-6 py-4 font-medium">Dates</th>
                <th className="px-6 py-4 font-medium">Leave type</th>
                <th className="px-6 py-4 font-medium">Day type</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loadingLeaves && leaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <CalendarDays className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                pageLeaves.map((leave, index) => (
                  <tr
                    key={leave.id}
                    className="transition-colors hover:bg-saffron-50/30"
                  >
                    <td className="px-6 py-4">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">
                        {leave.username || `Staff #${leave.userid}`}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        ID: {leave.userid}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(leave.fromDate)}
                      {leave.fromDate !== leave.toDate && (
                        <>
                          <span className="mx-1.5 text-gray-400">–</span>
                          {formatDate(leave.toDate)}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-saffron-100 bg-saffron-50 px-2.5 py-1 text-xs font-semibold capitalize text-saffron-700">
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-gray-700">
                      {leave.dayType === "fullday" ? "Full day" : leave.dayType}
                    </td>
                    <td className="max-w-xs whitespace-normal px-6 py-4 text-sm text-gray-700">
                      {leave.leaveReason || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <p>{leave.mobile || "—"}</p>
                      {leave.email && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {leave.email}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {leaves.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:px-6">
            <p className="text-sm text-gray-500">
              Showing {firstRecordNumber}–{lastRecordNumber} of {leaves.length}{" "}
              requests
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
