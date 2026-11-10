import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundPlus,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { exportToExcel } from "../utils/exportToExcel";

interface UserRegistrationRecord {
  id: number;
  fullname: string;
  mobile: string;
  email?: string | null;
  address: string;
  pannumber?: string | null;
  aadhaarnumber?: string | null;
  occupation?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface UserRegistrationForm {
  fullname: string;
  mobile: string;
  email: string;
  address: string;
  pannumber: string;
  aadhaarnumber: string;
  occupation: string;
}

const fieldClassName =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const emptyForm: UserRegistrationForm = {
  fullname: "",
  mobile: "",
  email: "",
  address: "",
  pannumber: "",
  aadhaarnumber: "",
  occupation: "",
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const requestError = error as {
      message?: unknown;
      response?: {
        data?: {
          data?: { message?: unknown };
          message?: unknown;
        };
      };
    };
    const responseMessage =
      requestError.response?.data?.data?.message ??
      requestError.response?.data?.message;

    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    if (typeof requestError.message === "string" && requestError.message.trim()) {
      return requestError.message;
    }
  }

  return fallback;
};

export default function UserRegistration() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<
    UserRegistrationRecord[]
  >([]);
  const [form, setForm] = useState<UserRegistrationForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [yearMonth, setYearMonth] = useState(getCurrentMonth);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<
    UserRegistrationRecord[]
  >([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState("");
  const pageSize = 10;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const response = await api.post<ApiResponse<{ userType: string }>>(
          "/admin/get",
        );
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to load signed-in profile.",
          );
        }
        if (active) {
          setIsAdmin(response.data.data.userType?.toLowerCase() === "admin");
        }
      } catch (requestError) {
        console.error("Failed to load user registration permissions", requestError);
      }
    };

    void fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  const fetchRegistrations = async (month: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post<ApiResponse<UserRegistrationRecord[]>>(
        "/registration/get",
        { yearMonth: month },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load user registrations.",
        );
      }

      setRegistrations(
        Array.isArray(response.data.data) ? response.data.data : [],
      );
      setCurrentPage(1);
    } catch (requestError) {
      console.error("Failed to fetch user registrations", requestError);
      setError("Unable to load user registrations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRegistrations(yearMonth);
  }, [yearMonth]);

  useEffect(() => {
    const query = customerSearch.trim();
    if (query.length < 3) {
      setCustomerResults([]);
      setSearchingCustomers(false);
      setCustomerSearchError("");
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setSearchingCustomers(true);
      setCustomerSearchError("");
      try {
        const response = await api.post<ApiResponse<UserRegistrationRecord[]>>(
          "/registration/search",
          { search: query },
        );
        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Unable to search customers.",
          );
        }
        if (active) {
          setCustomerResults(
            Array.isArray(response.data.data) ? response.data.data : [],
          );
        }
      } catch (requestError) {
        console.error("Failed to search registered customers", requestError);
        if (active) {
          setCustomerSearchError(
            getApiErrorMessage(
              requestError,
              "Unable to search customers. Please try again.",
            ),
          );
          setCustomerResults([]);
        }
      } finally {
        if (active) setSearchingCustomers(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [customerSearch]);

  const filteredRegistrations = registrations.filter((registration) =>
    [
      registration.fullname,
      registration.mobile,
      registration.email,
      registration.address,
      registration.pannumber,
      registration.aadhaarnumber,
      registration.occupation,
      String(registration.id),
    ].some((value) =>
      value?.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    ),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRegistrations.length / pageSize),
  );
  const currentRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const handleExport = () => {
    exportToExcel(
      `user-registrations-${yearMonth}`,
      filteredRegistrations.map((registration) => ({
        ID: registration.id,
        "Full Name": registration.fullname,
        Mobile: registration.mobile,
        Email: registration.email ?? "",
        Address: registration.address,
        "PAN Number": registration.pannumber ?? "",
        "Aadhaar Number": registration.aadhaarnumber ?? "",
        Occupation: registration.occupation ?? "",
        "Registered On": registration.createdAt
          ? new Date(registration.createdAt).toLocaleDateString("en-IN")
          : "",
      })),
    );
  };

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

  const openEditForm = (registration: UserRegistrationRecord) => {
    setEditingId(registration.id);
    setForm({
      fullname: registration.fullname ?? "",
      mobile: registration.mobile ?? "",
      email: registration.email ?? "",
      address: registration.address ?? "",
      pannumber: registration.pannumber ?? "",
      aadhaarnumber: registration.aadhaarnumber ?? "",
      occupation: registration.occupation ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...(editingId === null ? {} : { id: editingId }),
      fullname: form.fullname.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      pannumber: form.pannumber.trim(),
      aadhaarnumber: form.aadhaarnumber.trim(),
      occupation: form.occupation.trim(),
    };

    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(
        editingId === null ? "/registration/add" : "/registration/update",
        payload,
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.data?.message ||
            response.data?.message ||
            `Unable to ${editingId === null ? "add" : "update"} user registration.`,
        );
      }

      closeForm();
      await fetchRegistrations(yearMonth);
    } catch (requestError) {
      console.error("Failed to save user registration", requestError);
      setError(
        getApiErrorMessage(
          requestError,
          `Unable to ${editingId === null ? "add" : "update"} user registration. Please try again.`,
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user registration?",
      )
    ) {
      return;
    }

    setDeletingId(id);
    setError("");
    try {
      const response = await api.post<ApiResponse<string>>(
        "/registration/delete",
        { id },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to delete user registration.",
        );
      }
      await fetchRegistrations(yearMonth);
    } catch (requestError) {
      console.error("Failed to delete user registration", requestError);
      setError("Unable to delete user registration. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            User Registration
          </h1>
          <p className="text-gray-500 mt-1">
            Manage registered user contact information.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-saffron-500/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add User
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

      <section className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800">Search Customer</h2>
          <p className="mt-1 text-sm text-gray-500">
            Find a registered customer to view their registration and sales history.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            autoComplete="off"
            value={customerSearch}
            onChange={(event) => setCustomerSearch(event.target.value)}
            className={`${fieldClassName} pl-10`}
            placeholder="Search by name, mobile, or address (minimum 3 characters)"
            aria-label="Search registered customers"
          />
        </div>
        {searchingCustomers && (
          <p
            role="status"
            className="mt-3 flex items-center gap-2 text-sm text-gray-500"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-saffron-500 border-t-transparent" />
            Searching customers...
          </p>
        )}
        {customerSearchError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {customerSearchError}
          </p>
        )}
        {customerSearch.trim().length > 0 &&
          customerSearch.trim().length < 3 && (
            <p className="mt-3 text-sm text-gray-500">
              Enter at least 3 characters to search.
            </p>
          )}
        {!searchingCustomers &&
          !customerSearchError &&
          customerSearch.trim().length >= 3 &&
          customerResults.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">No customers found.</p>
          )}
        {customerResults.length > 0 && (
          <ul
            role="listbox"
            aria-label="Customer search results"
            className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100"
          >
            {customerResults.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() =>
                    navigate(`/user-registration/${customer.id}`)
                  }
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-saffron-50"
                >
                  <span>
                    <span className="block font-medium text-gray-800">
                      {customer.fullname}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {[customer.mobile, `ID: ${customer.id}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <Eye className="h-4 w-4 shrink-0 text-saffron-600" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingId === null ? "Add User Registration" : "Edit User Registration"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close user registration form"
            >
              <X className="w-6 h-6" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="user-registration-fullname"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="user-registration-fullname"
                  required
                  type="text"
                  value={form.fullname}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullname: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label
                  htmlFor="user-registration-mobile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mobile *
                </label>
                <input
                  id="user-registration-mobile"
                  required
                  type="tel"
                  value={form.mobile}
                  maxLength={10}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mobile: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="user-registration-email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="user-registration-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className={fieldClassName}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label
                htmlFor="user-registration-address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address *
              </label>
              <textarea
                id="user-registration-address"
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
                placeholder="Enter address"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="user-registration-pan"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  PAN Number
                </label>
                <input
                  id="user-registration-pan"
                  type="text"
                  autoComplete="off"
                  value={form.pannumber}
                  maxLength={10}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      pannumber: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  placeholder="Enter PAN number"
                />
              </div>
              <div>
                <label
                  htmlFor="user-registration-aadhaar"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Aadhaar Number
                </label>
                <input
                  id="user-registration-aadhaar"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={12}
                  value={form.aadhaarnumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      aadhaarnumber: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  placeholder="Enter Aadhaar number"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="user-registration-occupation"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Occupation
              </label>
              <input
                id="user-registration-occupation"
                type="text"
                value={form.occupation}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    occupation: event.target.value,
                  }))
                }
                className={fieldClassName}
                placeholder="Enter occupation"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium shadow-md shadow-saffron-500/20 cursor-pointer ${
                  saving ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {saving
                  ? "Saving..."
                  : editingId === null
                    ? "Save User"
                    : "Update User"}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, mobile, or address..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all text-sm"
              />
            </div>
            <div className="flex w-full md:w-auto">
              <label htmlFor="user-registration-month" className="sr-only">
                Filter user registrations by month
              </label>
              <input
                id="user-registration-month"
                type="month"
                value={yearMonth}
                onChange={(event) => setYearMonth(event.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || filteredRegistrations.length === 0}
              title="Download filtered registrations as an Excel-compatible CSV"
             className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto relative min-h-[300px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <table className="w-full text-left border-collapse min-w-[1420px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">S.No</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                  <th className="px-6 py-4 font-medium">Full Name</th>
                  <th className="px-6 py-4 font-medium">Mobile</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Address</th>
                  <th className="px-6 py-4 font-medium">PAN Number</th>
                  <th className="px-6 py-4 font-medium">Aadhaar Number</th>
                  <th className="px-6 py-4 font-medium">Occupation</th>
                  <th className="px-6 py-4 font-medium">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentRegistrations.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No user registrations found for this month.
                    </td>
                  </tr>
                ) : (
                  currentRegistrations.map((registration, index) => (
                    <tr
                      key={registration.id}
                      className="hover:bg-saffron-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                          {(currentPage - 1) * pageSize + index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/user-registration/${registration.id}`)
                            }
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="View customer details"
                            aria-label={`View customer ${registration.fullname}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditForm(registration)}
                                className="p-2 text-saffron-600 hover:bg-saffron-50 rounded-lg cursor-pointer"
                                title="Edit user registration"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(registration.id)}
                                disabled={deletingId === registration.id}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer disabled:opacity-50"
                                title="Delete user registration"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-100 font-bold uppercase text-saffron-600">
                            <UserRoundPlus className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {registration.fullname}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {registration.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`tel:${registration.mobile}`}
                          className="text-sm text-gray-600 hover:text-saffron-700"
                        >
                          {registration.mobile}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {registration.email ? (
                          <a
                            href={`mailto:${registration.email}`}
                            className="hover:text-saffron-700"
                          >
                            {registration.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-600">
                        {registration.address || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {registration.pannumber || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {registration.aadhaarnumber || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {registration.occupation || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarDays className="w-4 h-4 text-saffron-500 shrink-0" />
                          <span className="whitespace-nowrap">
                            {registration.createdAt
                              ? new Date(
                                  registration.createdAt,
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredRegistrations.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 bg-gray-50/50">
              <p>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredRegistrations.length)}{" "}
                of {filteredRegistrations.length} entries
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
