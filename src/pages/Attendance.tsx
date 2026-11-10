import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
} from "lucide-react";
import api from "../services/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface AttendanceRecord {
  id: number;
  userid: number;
  date: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TodayAttendance {
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface AdminProfile {
  userid: number;
  username: string;
  userType: string;
}

const RECORDS_PER_PAGE = 10;

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthCalendarDays = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return [];
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  return Array.from(
    { length: firstWeekday + daysInMonth },
    (_, index) => (index < firstWeekday ? null : index - firstWeekday + 1),
  );
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

const formatDuration = (checkIn: string, checkOut: string | null) => {
  if (!checkOut) return "In progress";
  const elapsed = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return "—";
  const minutes = Math.floor(elapsed / 60000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export default function Attendance() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [yearMonth, setYearMonth] = useState(getCurrentMonth);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] =
    useState<TodayAttendance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingTodayAttendance, setLoadingTodayAttendance] = useState(false);
  const [processingAction, setProcessingAction] = useState<
    "checkin" | "checkout" | null
  >(null);
  const [error, setError] = useState("");
  const [todayAttendanceError, setTodayAttendanceError] = useState("");
  const [notice, setNotice] = useState("");

  const calendarDays = useMemo(
    () => getMonthCalendarDays(yearMonth),
    [yearMonth],
  );
  const attendedDates = useMemo(
    () =>
      new Set(
        records
          .filter(
            (record) =>
              typeof record.date === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
              record.date.startsWith(`${yearMonth}-`),
          )
          .map((record) => record.date),
      ),
    [records, yearMonth],
  );
  const totalPages = Math.max(1, Math.ceil(records.length / RECORDS_PER_PAGE));
  const pageRecords = records.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );
  const firstRecordNumber =
    records.length === 0 ? 0 : (currentPage - 1) * RECORDS_PER_PAGE + 1;
  const lastRecordNumber = Math.min(
    currentPage * RECORDS_PER_PAGE,
    records.length,
  );
  const today = new Date();
  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const hasTodayCheckIn = Boolean(todayAttendance?.checkInTime?.trim());
  const hasTodayCheckOut = Boolean(todayAttendance?.checkOutTime?.trim());
  const activeAttendance = records.find((record) => !record.checkOutTime);

  useEffect(() => {
    setCurrentPage(1);
  }, [yearMonth]);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setError("");
      try {
        const response = await api.post<ApiResponse<AdminProfile>>(
          "/admin/get",
        );
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to load signed-in profile.",
          );
        }

        const signedInProfile = response.data.data;
        if (active) {
          setProfile(signedInProfile);
        }
      } catch (requestError) {
        console.error("Failed to load attendance profile", requestError);
        if (active) {
          setError(
            requestError instanceof Error && requestError.message
              ? requestError.message
              : "Unable to load signed-in profile. Please try again.",
          );
        }
      } finally {
        if (active) setLoadingProfile(false);
      }
    };

    void fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  const fetchAttendance = useCallback(async () => {
    const userid = Number(profile?.userid);
    if (!Number.isInteger(userid) || userid <= 0 || !yearMonth) {
      setRecords([]);
      return;
    }

    setLoadingRecords(true);
    setError("");
    try {
      const response = await api.post<ApiResponse<AttendanceRecord[]>>(
        "/staff/get-attendance",
        { userid, yearMonth },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load attendance records.",
        );
      }
      setRecords(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (requestError) {
      console.error("Failed to load staff attendance", requestError);
      setError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : "Unable to load attendance records. Please try again.",
      );
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [profile?.userid, yearMonth]);

  const fetchTodayAttendance = useCallback(async () => {
    const userid = Number(profile?.userid);
    if (!Number.isInteger(userid) || userid <= 0) {
      setTodayAttendance(null);
      setTodayAttendanceError("");
      return;
    }

    setLoadingTodayAttendance(true);
    setTodayAttendanceError("");
    try {
      const response = await api.post<ApiResponse<TodayAttendance>>(
        "/staff/today-attendance",
        { userid },
      );
      if (!response.data?.success || !response.data.data) {
        throw new Error(
          response.data?.message || "Unable to load today's attendance.",
        );
      }
      setTodayAttendance(response.data.data);
    } catch (requestError) {
      console.error("Failed to load today's staff attendance", requestError);
      setTodayAttendance(null);
      setTodayAttendanceError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : "Unable to load today's attendance. Please try again.",
      );
    } finally {
      setLoadingTodayAttendance(false);
    }
  }, [profile?.userid]);

  useEffect(() => {
    if (!loadingProfile && profile?.userid) {
      void fetchAttendance();
      void fetchTodayAttendance();
    } else {
      setRecords([]);
      setTodayAttendance(null);
    }
  }, [
    fetchAttendance,
    fetchTodayAttendance,
    loadingProfile,
    profile?.userid,
    yearMonth,
  ]);

  const handleAttendanceAction = async (action: "checkin" | "checkout") => {
    const userid = Number(profile?.userid);
    if (!Number.isInteger(userid) || userid <= 0) {
      setError("Unable to identify the signed-in staff member.");
      return;
    }
    if (action === "checkin" && hasTodayCheckIn) {
      setError("You have already checked in today.");
      return;
    }
    if (action === "checkout" && (!hasTodayCheckIn || hasTodayCheckOut)) {
      setError("There is no active check-in to check out today.");
      return;
    }

    setProcessingAction(action);
    setError("");
    setNotice("");
    try {
      const endpoint =
        action === "checkin" ? "/staff/checkin" : "/staff/checkout";
      let payload: { userid: number; attendanceid?: number } = { userid };
      if (action === "checkout") {
        let todayRecord = records.find(
          (record) => record.date === todayDate && !record.checkOutTime,
        );
        if (!todayRecord) {
          const todayRecordsResponse = await api.post<
            ApiResponse<AttendanceRecord[]>
          >("/staff/get-attendance", {
            userid,
            yearMonth: todayDate.slice(0, 7),
          });
          if (!todayRecordsResponse.data?.success) {
            throw new Error(
              todayRecordsResponse.data?.message ||
                "Unable to find today's check-in record.",
            );
          }
          todayRecord = (Array.isArray(todayRecordsResponse.data.data)
            ? todayRecordsResponse.data.data
            : []
          ).find((record) => record.date === todayDate && !record.checkOutTime);
        }
        if (!todayRecord) {
          throw new Error("Unable to find today's active check-in record.");
        }
        payload = { userid, attendanceid: todayRecord.id };
      }
      const response = await api.post<ApiResponse<string>>(endpoint, payload);
      const actionMessage =
        action === "checkin" ? "Checkin successfully" : "Checkout successfully";
      const responseText =
        typeof response.data?.data === "string"
          ? response.data.data.trim()
          : "";
      const actionSucceeded =
        response.data?.success === true ||
        responseText.toLowerCase() === actionMessage.toLowerCase();

      if (!actionSucceeded) {
        throw new Error(
          responseText ||
            response.data?.message ||
            `Unable to ${action === "checkin" ? "check in" : "check out"}.`,
        );
      }

      setNotice(responseText || actionMessage);
      await Promise.all([fetchAttendance(), fetchTodayAttendance()]);
    } catch (requestError) {
      console.error(`Staff ${action} failed`, requestError);
      setError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : `Unable to ${action === "checkin" ? "check in" : "check out"}. Please try again.`,
      );
    } finally {
      setProcessingAction(null);
    }
  };

  const pageLoading = loadingProfile;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Attendance</h1>
          <p className="mt-1 text-gray-500">
            Record staff check-in and check-out times.
          </p>
        </div>
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
      {todayAttendanceError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{todayAttendanceError}</span>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <section className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-saffron-50 text-saffron-600">
              <CalendarCheck2 className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Your attendance
              </p>
              <h2 className="text-xl font-bold text-gray-800">
                {pageLoading ? "Loading..." : profile?.username || "—"}
              </h2>
              {profile?.userid && (
                <p className="text-xs text-gray-500">Staff ID: #{profile.userid}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleAttendanceAction("checkin")}
              disabled={
                pageLoading ||
                loadingTodayAttendance ||
                processingAction !== null ||
                !profile?.userid ||
                !todayAttendance ||
                hasTodayCheckIn
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {processingAction === "checkin" ? "Checking in..." : "Check In"}
            </button>
            <button
              type="button"
              onClick={() => void handleAttendanceAction("checkout")}
              disabled={
                pageLoading ||
                loadingTodayAttendance ||
                processingAction !== null ||
                !todayAttendance ||
                !hasTodayCheckIn ||
                hasTodayCheckOut
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-saffron-500 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {processingAction === "checkout"
                ? "Checking out..."
                : "Check Out"}
            </button>
          </div>
        </div>
        {activeAttendance && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-yellow-100 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <Clock3 className="h-4 w-4 shrink-0" />
            Checked in at {formatTime(activeAttendance.checkInTime)}. Remember to
            check out when your workday ends.
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50 p-4 sm:flex-row">
          <div>
            <h2 className="font-bold text-gray-800">Monthly Attendance</h2>
            <p className="mt-1 text-sm text-gray-500">
              {records.length} record{records.length === 1 ? "" : "s"} for{" "}
              {yearMonth}
            </p>
          </div>
          <input
            type="month"
            aria-label="Filter attendance by month"
            value={yearMonth}
            onChange={(event) => setYearMonth(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50 sm:w-auto"
          />
        </div>
        <div className="relative min-h-[260px]">
          {loadingRecords && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
            </div>
          )}
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600">
                  <CalendarCheck2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-800">Attendance Calendar</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {yearMonth
                      ? new Date(`${yearMonth}-01T00:00:00`).toLocaleDateString(
                          "en-IN",
                          { month: "long", year: "numeric" },
                        )
                      : "Select a month"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-green-200 bg-green-100" />
                  Present
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-rose-200 bg-rose-100" />
                  No attendance
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-gray-200 bg-gray-50" />
                  Upcoming
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3 sm:p-4">
              <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (weekday) => (
                  <div
                    key={weekday}
                    className="py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 sm:text-xs"
                  >
                    {weekday}
                  </div>
                ),
              )}
              {calendarDays.map((day, index) =>
                day === null ? (
                  <div key={`empty-${index}`} aria-hidden="true" />
                ) : (
                  (() => {
                    const date = `${yearMonth}-${String(day).padStart(2, "0")}`;
                    const present = attendedDates.has(date);
                    const upcoming = date > todayDate;
                    const status = present
                      ? "Present"
                      : upcoming
                        ? "Upcoming"
                        : "No attendance";

                    return (
                      <div
                        key={day}
                        aria-label={`${date}: ${status}`}
                        className={`flex min-h-10 items-center justify-center rounded-xl border text-sm font-semibold transition-colors sm:min-h-11 ${
                          present
                            ? "border-green-200 bg-green-100 text-green-700"
                            : upcoming
                              ? "border-gray-100 bg-white/70 text-gray-300"
                              : "border-rose-200 bg-rose-100 text-rose-700"
                        } ${date === todayDate ? "ring-2 ring-offset-1" : ""}`}
                      >
                        {day}
                      </div>
                    );
                  })()
                ),
              )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium">S.No</th>
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
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      "No attendance records found for this month."
                    </td>
                  </tr>
                ) : (
                  pageRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className="transition-colors hover:bg-saffron-50/30"
                    >
                      <td className="px-6 py-4">
                        {(currentPage - 1) * RECORDS_PER_PAGE + index + 1}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {record.date
                          ? new Date(`${record.date}T00:00:00`).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatTime(record.checkInTime)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatTime(record.checkOutTime)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatDuration(record.checkInTime, record.checkOutTime)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            record.checkOutTime
                              ? "border-green-200 bg-green-100 text-green-700"
                              : "border-yellow-200 bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {record.checkOutTime ? "Completed" : "Checked in"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {records.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:px-6">
              <p className="text-sm text-gray-500">
                Showing {firstRecordNumber}–{lastRecordNumber} of {records.length} records
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
        </div>
      </section>
    </div>
  );
}
