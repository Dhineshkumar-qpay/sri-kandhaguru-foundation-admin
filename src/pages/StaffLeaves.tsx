import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface StaffLeave {
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

interface StaffOption {
  userid: number;
  username: string;
}

interface AdminProfile {
  userid: number;
  username: string;
  userType: string;
}

interface LeaveForm {
  fromDate: string;
  toDate: string;
  leaveType: "casual" | "sick";
  dayType: "fullday" | "morning" | "afternoon";
  leaveReason: string;
}

const fieldClassName =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50";

const emptyForm: LeaveForm = {
  fromDate: "",
  toDate: "",
  leaveType: "casual",
  dayType: "fullday",
  leaveReason: "",
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getResponseMessage = (data: unknown, fallback: string) => {
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data === "object" && data !== null && "message" in data) {
    const message = data.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

const getRequestErrorMessage = (error: unknown, fallback: string) => {
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
    if (responseData) {
      return getResponseMessage(
        responseData.data,
        typeof responseData.message === "string"
          ? responseData.message
          : fallback,
      );
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

const formatDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

export default function StaffLeaves() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [staffs, setStaffs] = useState<StaffOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [yearMonth, setYearMonth] = useState(getCurrentMonth);
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [form, setForm] = useState<LeaveForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isStaff = profile?.userType?.toLowerCase() === "staff";
  const isAdmin = profile?.userType?.toLowerCase() === "admin";
  const pageLoading = loadingProfile || loadingStaffs;

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setError("");
      try {
        const response = await api.post<ApiResponse<AdminProfile>>("/admin/get");
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            getResponseMessage(
              response.data?.data,
              response.data?.message || "Unable to load signed-in profile.",
            ),
          );
        }

        if (active) {
          const signedInProfile = response.data.data;
          setProfile(signedInProfile);
          if (signedInProfile.userType?.toLowerCase() === "staff") {
            setSelectedUserId(String(signedInProfile.userid));
            setStaffs([
              {
                userid: signedInProfile.userid,
                username: signedInProfile.username,
              },
            ]);
          }
        }
      } catch (requestError) {
        console.error("Failed to load profile for staff leaves", requestError);
        if (active) {
          setError(
            getRequestErrorMessage(
              requestError,
              "Unable to load signed-in profile. Please try again.",
            ),
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

  useEffect(() => {
    if (!profile || isStaff) return;

    let active = true;
    const fetchStaffs = async () => {
      setLoadingStaffs(true);
      setError("");
      try {
        const response = await api.post<ApiResponse<StaffOption[]>>(
          "/admin/get-staffs",
        );
        if (!response.data?.success) {
          throw new Error(
            getResponseMessage(
              response.data?.data,
              response.data?.message || "Unable to load staff members.",
            ),
          );
        }
        const staffList = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        if (active) {
          setStaffs(staffList);
          setSelectedUserId((current) =>
            current && staffList.some((staff) => String(staff.userid) === current)
              ? current
              : String(staffList[0]?.userid ?? ""),
          );
        }
      } catch (requestError) {
        console.error("Failed to load staff for leave management", requestError);
        if (active) {
          setError(
            getRequestErrorMessage(
              requestError,
              "Unable to load staff members. Please try again.",
            ),
          );
        }
      } finally {
        if (active) setLoadingStaffs(false);
      }
    };

    void fetchStaffs();
    return () => {
      active = false;
    };
  }, [isStaff, profile]);

  const fetchLeaves = useCallback(async () => {
    const userid = Number(selectedUserId);
    if (!Number.isInteger(userid) || userid <= 0 || !yearMonth) {
      setLeaves([]);
      return;
    }

    setLoadingLeaves(true);
    setError("");
    try {
      const response = await api.post<ApiResponse<StaffLeave[]>>(
        "/staff/get-all-staff-leaves",
        { yearMonth, userid },
      );
      if (!response.data?.success) {
        throw new Error(
          getResponseMessage(
            response.data?.data,
            response.data?.message || "Unable to load staff leaves.",
          ),
        );
      }
      setLeaves(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (requestError) {
      console.error("Failed to load staff leaves", requestError);
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to load staff leaves. Please try again.",
        ),
      );
      setLeaves([]);
    } finally {
      setLoadingLeaves(false);
    }
  }, [selectedUserId, yearMonth]);

  useEffect(() => {
    if (!loadingProfile && !loadingStaffs && selectedUserId) {
      void fetchLeaves();
    } else {
      setLeaves([]);
    }
  }, [fetchLeaves, loadingProfile, loadingStaffs, selectedUserId]);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const openEditForm = (leave: StaffLeave) => {
    setEditingId(leave.id);
    setForm({
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      leaveType: leave.leaveType,
      dayType: leave.dayType,
      leaveReason: leave.leaveReason ?? "",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.toDate < form.fromDate) {
      setError("The end date must be on or after the start date.");
      return;
    }
    const userid = Number(selectedUserId);
    if (editingId === null && (!Number.isInteger(userid) || userid <= 0)) {
      setError("Select a staff member before applying for leave.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      ...(editingId === null ? { userid } : { id: editingId }),
      fromDate: form.fromDate,
      toDate: form.toDate,
      leaveType: form.leaveType,
      dayType: form.dayType,
      leaveReason: form.leaveReason.trim(),
    };

    try {
      const response = await api.post<ApiResponse<unknown>>(
        editingId === null ? "/staff/add-leave" : "/staff/update-leave",
        payload,
      );
      if (!response.data?.success) {
        throw new Error(
          getResponseMessage(
            response.data?.data,
            response.data?.message ||
              `Unable to ${editingId === null ? "apply for" : "update"} leave.`,
          ),
        );
      }

      const successMessage = getResponseMessage(
        response.data.data,
        editingId === null
          ? "Staff leave added successfully"
          : "Staff leave updated successfully",
      );
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setNotice(successMessage);
      await fetchLeaves();
    } catch (requestError) {
      console.error("Failed to save staff leave", requestError);
      setError(
        getRequestErrorMessage(
          requestError,
          `Unable to ${editingId === null ? "apply for" : "update"} leave. Please try again.`,
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (leave: StaffLeave) => {
    if (
      !window.confirm(
        `Delete the leave from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)}?`,
      )
    ) {
      return;
    }

    setDeletingId(leave.id);
    setError("");
    setNotice("");
    try {
      const response = await api.post<ApiResponse<unknown>>(
        "/staff/delete-leave",
        { id: leave.id },
      );
      if (!response.data?.success) {
        throw new Error(
          getResponseMessage(
            response.data?.data,
            response.data?.message || "Unable to delete staff leave.",
          ),
        );
      }
      setNotice(
        getResponseMessage(response.data.data, "Staff leave deleted successfully"),
      );
      await fetchLeaves();
    } catch (requestError) {
      console.error("Failed to delete staff leave", requestError);
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to delete staff leave. Please try again.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Leaves</h1>
          <p className="mt-1 text-gray-500">
            Apply, review, and manage staff leave requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isStaff && (
            <select
              aria-label="Select staff member"
              value={selectedUserId}
              onChange={(event) => {
                setSelectedUserId(event.target.value);
                setNotice("");
              }}
              disabled={pageLoading || staffs.length === 0}
              className="min-w-52 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
            >
              <option value="">
                {loadingStaffs ? "Loading staff..." : "Select staff"}
              </option>
              {staffs.map((staff) => (
                <option key={staff.userid} value={staff.userid}>
                  {staff.username} (#{staff.userid})
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={openAddForm}
            disabled={pageLoading || !selectedUserId}
            className="flex items-center gap-2 rounded-xl bg-saffron-500 px-6 py-2.5 font-medium text-white shadow-lg shadow-saffron-500/30 transition-all hover:bg-saffron-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            Apply Leave
          </button>
        </div>
      </div>

      {error && !showForm && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
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

      {showForm ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {editingId === null ? "Apply for Leave" : "Edit Leave"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close leave form"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="leave-from-date"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  From date *
                </label>
                <input
                  id="leave-from-date"
                  type="date"
                  required
                  value={form.fromDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fromDate: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label
                  htmlFor="leave-to-date"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  To date *
                </label>
                <input
                  id="leave-to-date"
                  type="date"
                  required
                  min={form.fromDate || undefined}
                  value={form.toDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      toDate: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label
                  htmlFor="leave-type"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Leave type *
                </label>
                <select
                  id="leave-type"
                  value={form.leaveType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      leaveType: event.target.value as LeaveForm["leaveType"],
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="leave-day-type"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Day type *
                </label>
                <select
                  id="leave-day-type"
                  value={form.dayType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dayType: event.target.value as LeaveForm["dayType"],
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value="fullday">Full day</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="leave-reason"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Reason *
                </label>
                <textarea
                  id="leave-reason"
                  required
                  rows={3}
                  value={form.leaveReason}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      leaveReason: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  placeholder="Enter the reason for leave"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-gray-200 px-6 py-2 font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-saffron-500 px-6 py-2 font-medium text-white shadow-md shadow-saffron-500/20 hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving
                  ? "Saving..."
                  : editingId === null
                    ? "Submit Leave"
                    : "Update Leave"}
              </button>
            </div>
          </form>
        </motion.section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
          <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50 p-4 sm:flex-row">
            <div>
              <h2 className="font-bold text-gray-800">Leave Requests</h2>
              <p className="mt-1 text-sm text-gray-500">
                {leaves.length} request{leaves.length === 1 ? "" : "s"} for{" "}
                {yearMonth}
              </p>
            </div>
            <input
              type="month"
              aria-label="Filter leaves by month"
              value={yearMonth}
              onChange={(event) => setYearMonth(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50 sm:w-auto"
            />
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
                  {isAdmin && <th className="px-6 py-4 font-medium">Actions</th>}
                  {!isStaff && <th className="px-6 py-4 font-medium">Staff</th>}
                  <th className="px-6 py-4 font-medium">Dates</th>
                  <th className="px-6 py-4 font-medium">Leave type</th>
                  <th className="px-6 py-4 font-medium">Day type</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!loadingLeaves && leaves.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : isStaff ? 5 : 6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <CalendarDays className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                      {selectedUserId
                        ? "No leave requests found for this month."
                        : "Select a staff member to view leave requests."}
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave, index) => (
                    <tr
                      key={leave.id}
                      className="transition-colors hover:bg-saffron-50/30"
                    >
                      <td className="px-6 py-4">{index + 1}</td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditForm(leave)}
                              aria-label={`Edit leave request ${leave.id}`}
                              className="rounded-lg p-2 text-saffron-600 hover:bg-saffron-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(leave)}
                              disabled={deletingId === leave.id}
                              aria-label={`Delete leave request ${leave.id}`}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                      {!isStaff && (
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">
                            {leave.username || `Staff #${leave.userid}`}
                          </p>
                          {leave.email && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {leave.email}
                            </p>
                          )}
                        </td>
                      )}
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
                        {leave.dayType === "fullday"
                          ? "Full day"
                          : leave.dayType}
                      </td>
                      <td className="max-w-xs whitespace-normal px-6 py-4 text-sm text-gray-700">
                        {leave.leaveReason || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
