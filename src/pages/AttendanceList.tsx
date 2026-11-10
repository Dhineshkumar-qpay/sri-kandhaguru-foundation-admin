import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertCircle, CalendarCheck2, Clock3 } from "lucide-react";
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

interface AttendanceRecord {
  id: number;
  userid: number;
  date: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt: string;
  updatedAt: string;
  username?: string;
  email?: string;
  mobile?: string;
}

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const formatTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
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

export default function AttendanceList() {
  const [userType, setUserType] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [staffs, setStaffs] = useState<StaffOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [yearMonth, setYearMonth] = useState(getCurrentMonth);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const pageRecords = records.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstRecordNumber =
    records.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRecordNumber = Math.min(currentPage * pageSize, records.length);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const response =
          await api.post<ApiResponse<AdminProfile>>("/admin/get");
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to verify the signed-in user.",
          );
        }
        if (active) setUserType(response.data.data.userType);
      } catch (requestError) {
        console.error(
          "Failed to verify access to attendance list",
          requestError,
        );
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
        const response =
          await api.post<ApiResponse<StaffOption[]>>("/admin/get-staffs");
        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Unable to load staff members.",
          );
        }
        if (active) {
          setStaffs(
            Array.isArray(response.data.data) ? response.data.data : [],
          );
        }
      } catch (requestError) {
        console.error(
          "Failed to load staff for attendance filter",
          requestError,
        );
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

  const fetchAttendance = useCallback(async () => {
    setLoadingRecords(true);
    setError("");
    try {
      const userid = selectedUserId ? Number(selectedUserId) : null;
      const response = await api.post<ApiResponse<AttendanceRecord[]>>(
        "/staff/get-all-attendance",
        { userid, yearMonth },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load attendance records.",
        );
      }
      setRecords(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(1);
    } catch (requestError) {
      console.error("Failed to load attendance list", requestError);
      setError(
        getErrorMessage(
          requestError,
          "Unable to load attendance records. Please try again.",
        ),
      );
      setRecords([]);
      setCurrentPage(1);
    } finally {
      setLoadingRecords(false);
    }
  }, [selectedUserId, yearMonth]);

  useEffect(() => {
    if (!profileLoading && userType?.toLowerCase() === "admin") {
      void fetchAttendance();
    }
  }, [fetchAttendance, profileLoading, userType]);

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
        <h1 className="text-3xl font-bold text-gray-800">Attendance List</h1>
        <p className="mt-1 text-gray-500">
          Review staff attendance by month and staff member.
        </p>
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

      <section className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-elegant sm:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Filter Attendance
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select a staff member to view attendance records.
            </p>
          </div>

          <input
            type="month"
            aria-label="Filter attendance by month"
            value={yearMonth}
            onChange={(event) => setYearMonth(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-saffron-500 focus:bg-white focus:ring-2 focus:ring-saffron-500/20 sm:w-52"
          />
        </div>

        {/* Staff Cards - 4 per row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* All Staff Card */}
          <button
            type="button"
            aria-pressed={selectedUserId === ""}
            onClick={() => setSelectedUserId("")}
            className={`group relative rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              selectedUserId === ""
                ? "border-saffron-400 bg-saffron-50 shadow-sm ring-2 ring-saffron-200"
                : "border-gray-200 bg-white hover:border-saffron-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  selectedUserId === ""
                    ? "bg-saffron-200 text-saffron-700"
                    : "bg-saffron-50 text-saffron-600"
                }`}
              >
                <CalendarCheck2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-800">
                  All Staff
                </p>
                <p className="mt-1 text-xs text-gray-500">View everyone</p>
              </div>

              {selectedUserId === "" && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-saffron-500 ring-4 ring-saffron-100" />
              )}
            </div>
          </button>

          {/* Individual Staff Cards */}
          {staffs.map((staff) => {
            const selected = selectedUserId === String(staff.userid);

            return (
              <button
                key={staff.userid}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedUserId(String(staff.userid))}
                className={`group relative rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  selected
                    ? "border-saffron-400 bg-saffron-50 shadow-sm ring-2 ring-saffron-200"
                    : "border-gray-200 bg-white hover:border-saffron-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      selected
                        ? "bg-saffron-200 text-saffron-700"
                        : "bg-gray-100 text-gray-600 group-hover:bg-saffron-50 group-hover:text-saffron-600"
                    }`}
                  >
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-800">
                      {staff.username}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Staff ID{staff.userid}
                    </p>
                  </div>

                  {selected && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-saffron-500 ring-4 ring-saffron-100" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {loadingStaffs && (
          <p role="status" className="mt-4 text-sm text-gray-500">
            Loading staff members...
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
        <div className="border-b border-gray-100 bg-gray-50/50 p-5">
          <h2 className="font-bold text-gray-800">Attendance Records</h2>
          <p className="mt-1 text-sm text-gray-500">
            {records.length} record{records.length === 1 ? "" : "s"} for{" "}
            {yearMonth}
          </p>
        </div>
        <div className="relative min-h-[300px] overflow-x-auto">
          {loadingRecords && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
            </div>
          )}
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">S.No</th>
                <th className="px-6 py-4 font-medium">Staff</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Check In</th>
                <th className="px-6 py-4 font-medium">Check Out</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loadingRecords && records.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    {selectedUserId
                      ? "No attendance records found for this staff member and month."
                      : "No attendance records found for this month."}
                  </td>
                </tr>
              ) : (
                pageRecords.map((record, index) => {
                  const elapsed =
                    record.checkInTime && record.checkOutTime
                      ? new Date(record.checkOutTime).getTime() -
                        new Date(record.checkInTime).getTime()
                      : null;
                  const duration =
                    elapsed === null || !Number.isFinite(elapsed) || elapsed < 0
                      ? record.checkInTime
                        ? "In progress"
                        : "—"
                      : `${Math.floor(elapsed / 3600000)}h ${Math.floor((elapsed % 3600000) / 60000)}m`;

                  return (
                    <tr
                      key={record.id}
                      className="transition-colors hover:bg-saffron-50/30"
                    >
                      <td className="px-6 py-4">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">
                          {record.username || `Staff #${record.userid}`}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          ID: {record.userid}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatTime(record.checkInTime)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatTime(record.checkOutTime)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{duration}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            record.checkOutTime
                              ? "border-green-200 bg-green-100 text-green-700"
                              : "border-yellow-200 bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {record.checkOutTime ? "Completed" : "Checked in"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {records.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:px-6">
            <p className="text-sm text-gray-500">
              Showing {firstRecordNumber}–{lastRecordNumber} of {records.length}{" "}
              records
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
