import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";

interface StaffRecord {
  userid: number;
  username: string;
  email: string;
  mobile: string;
  userType: string;
  whatsappnumber: string;
  address: string;
  pannumber?: string | null;
  aadhaarnumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StaffForm {
  username: string;
  email: string;
  mobile: string;
  password: string;
  whatsappnumber: string;
  address: string;
  pannumber: string;
  aadhaarnumber: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const emptyForm: StaffForm = {
  username: "",
  email: "",
  mobile: "",
  password: "",
  whatsappnumber: "",
  address: "",
  pannumber: "",
  aadhaarnumber: "",
};

const fieldClassName =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50";

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const requestError = error as {
      response?: {
        data?: {
          data?: { message?: unknown };
          message?: unknown;
        };
      };
    };
    const message =
      requestError.response?.data?.data?.message ??
      requestError.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

export default function Staffs() {
  const [staffs, setStaffs] = useState<StaffRecord[]>([]);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const pageSize = 10;

  const fetchStaffs = async () => {
    setLoading(true);
    setError("");
    try {
      const response =
        await api.post<ApiResponse<StaffRecord[]>>("/admin/get-staffs");
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to load staffs.");
      }
      setStaffs(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(1);
    } catch (requestError) {
      console.error("Failed to fetch staffs", requestError);
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to load staffs. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaffs();
  }, []);

  const filteredStaffs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return staffs;
    return staffs.filter((staff) =>
      [
        staff.username,
        staff.email,
        staff.mobile,
        staff.whatsappnumber,
        staff.address,
        staff.pannumber,
        staff.aadhaarnumber,
        String(staff.userid),
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [searchTerm, staffs]);

  const totalPages = Math.max(1, Math.ceil(filteredStaffs.length / pageSize));
  const currentStaffs = filteredStaffs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
    setShowForm(true);
  };

  const openEditForm = (staff: StaffRecord) => {
    setEditingId(staff.userid);
    setForm({
      username: staff.username ?? "",
      email: staff.email ?? "",
      mobile: staff.mobile ?? "",
      password: "",
      whatsappnumber: staff.whatsappnumber ?? "",
      address: staff.address ?? "",
      pannumber: staff.pannumber ?? "",
      aadhaarnumber: staff.aadhaarnumber ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...(editingId === null ? {} : { userid: editingId }),
      username: form.username.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      password: form.password,
      whatsappnumber: form.whatsappnumber.trim(),
      address: form.address.trim(),
      pannumber: form.pannumber.trim(),
      aadhaarnumber: form.aadhaarnumber.trim(),
    };

    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(
        editingId === null ? "/admin/register-staff" : "/admin/update-staff",
        payload,
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.data?.message ||
            response.data?.message ||
            `Unable to ${editingId === null ? "add" : "update"} staff.`,
        );
      }
      closeForm();
      await fetchStaffs();
    } catch (requestError) {
      console.error("Failed to save staff", requestError);
      setError(
        getApiErrorMessage(
          requestError,
          `Unable to ${editingId === null ? "add" : "update"} staff. Please try again.`,
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userid: number) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    setDeletingId(userid);
    setError("");
    try {
      const response = await api.post<ApiResponse<string>>(
        "/admin/delete-staff",
        { userid },
      );
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to delete staff.");
      }
      await fetchStaffs();
    } catch (requestError) {
      console.error("Failed to delete staff", requestError);
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to delete staff. Please try again.",
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
          <h1 className="text-3xl font-bold text-gray-800">Staffs</h1>
          <p className="mt-1 text-gray-500">
            Manage staff accounts and contact information.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-saffron-500 px-6 py-2.5 font-medium text-white shadow-lg shadow-saffron-500/30 transition-all hover:bg-saffron-600 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add Staff
        </button>
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

      {showForm ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {editingId === null ? "Add Staff" : "Edit Staff"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close staff form"
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
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="staff-username"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Username *
                </label>
                <input
                  id="staff-username"
                  required
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  autoComplete="name"
                />
              </div>
              <div>
                <label
                  htmlFor="staff-email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email *
                </label>
                <input
                  id="staff-email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  autoComplete="email"
                />
              </div>
              <div>
                <label
                  htmlFor="staff-mobile"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Mobile *
                </label>
                <input
                  id="staff-mobile"
                  required
                  type="tel"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mobile: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label
                  htmlFor="staff-whatsapp"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  WhatsApp Number
                </label>
                <input
                  id="staff-whatsapp"
                  type="tel"
                  maxLength={10}
                  value={form.whatsappnumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      whatsappnumber: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label
                  htmlFor="staff-pan"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  PAN Number
                </label>
                <input
                  id="staff-pan"
                  type="text"
                  autoComplete="off"
                  maxLength={10}
                  value={form.pannumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      pannumber: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label
                  htmlFor="staff-aadhaar"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Aadhaar Number
                </label>
                <input
                  id="staff-aadhaar"
                  type="text"
                  maxLength={12}
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.aadhaarnumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      aadhaarnumber: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label
                  htmlFor="staff-password"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="staff-password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  autoComplete="new-password"
                  placeholder={editingId === null ? "" : "Enter a new password"}
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="staff-address"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Address *
                </label>
                <textarea
                  id="staff-address"
                  required
                  rows={3}
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  autoComplete="street-address"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="cursor-pointer rounded-xl border border-gray-200 px-6 py-2 font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-xl bg-saffron-500 px-6 py-2 font-medium text-white shadow-md shadow-saffron-500/20 hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving
                  ? "Saving..."
                  : editingId === null
                    ? "Save Staff"
                    : "Update Staff"}
              </button>
            </div>
          </form>
        </motion.section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
          <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50 p-4 md:flex-row">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search name, email, phone, or address..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-sm transition-all focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
              />
            </div>
            <button
              type="button"
              onClick={() => void fetchStaffs()}
              disabled={loading}
              className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 md:w-auto"
            >
              Refresh
            </button>
          </div>

          <div className="relative min-h-[300px] overflow-x-auto">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
              </div>
            )}
            <table className="w-full min-w-[1320px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium">S.No</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                  <th className="px-6 py-4 font-medium">Staff</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Mobile</th>
                  <th className="px-6 py-4 font-medium">WhatsApp</th>
                  <th className="px-6 py-4 font-medium">Address</th>
                  <th className="px-6 py-4 font-medium">PAN Number</th>
                  <th className="px-6 py-4 font-medium">Aadhaar Number</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentStaffs.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  currentStaffs.map((staff, index) => (
                    <tr
                      key={staff.userid}
                      className="transition-colors hover:bg-saffron-50/30"
                    >
                      <td className="px-6 py-4">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(staff)}
                            title="Edit staff"
                            aria-label={`Edit ${staff.username}`}
                            className="cursor-pointer rounded-lg p-2 text-saffron-600 hover:bg-saffron-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(staff.userid)}
                            disabled={deletingId === staff.userid}
                            title="Delete staff"
                            aria-label={`Delete ${staff.username}`}
                            className="cursor-pointer rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-saffron-600">
                            <UserRound className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {staff.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {staff.userid}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {staff.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {staff.mobile || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {staff.whatsappnumber || "—"}
                      </td>
                      <td
                        className="max-w-xs truncate px-6 py-4 text-sm text-gray-600"
                        title={staff.address}
                      >
                        {staff.address || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {staff.pannumber || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {staff.aadhaarnumber || "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {staff.createdAt
                          ? new Date(staff.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredStaffs.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 p-4 text-sm text-gray-500 sm:flex-row">
              <p>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredStaffs.length)} of{" "}
                {filteredStaffs.length} staff
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="cursor-pointer rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="cursor-pointer rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
