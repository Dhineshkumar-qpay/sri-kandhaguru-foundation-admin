import { useState, useEffect, useMemo } from "react";
import { BASEURL } from "../services/api";
import {
  Search,
  Calendar,
  IndianRupee,
  FileText,
  Eye,
  Edit2,
  Trash2,
  ArrowLeft,
  X,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  HandHeart,
  Building,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

export interface DonorData {
  id: number;
  donorid?: number;
  _id?: number | string;
  cause: string;
  fullname: string;
  mobile: string;
  email: string | null;
  address: string | null;
  country: string;
  pannumber: string | null;
  aadhaarnumber: string | null;
  passportnumber: string | null;
  amount: string | number;
  paymentid: string | null;
  screenshot: string | null;
  donortype: string;
  type?: string;
  paymentstatus: string;
  createdAt: string;
  updatedAt?: string;
}

interface DonorFormData {
  cause: string;
  customCause: string;
  fullname: string;
  mobile: string;
  email: string;
  address: string;
  country: string;
  pannumber: string;
  aadhaarnumber: string;
  passportnumber: string;
  donortype: string;
  amount: string;
  paymentstatus: string;
}

const INITIAL_FORM: DonorFormData = {
  cause: "Annadhanam Contribution",
  customCause: "",
  fullname: "",
  mobile: "",
  email: "",
  address: "",
  country: "India",
  pannumber: "",
  aadhaarnumber: "",
  passportnumber: "",
  donortype: "domestic",
  amount: "",
  paymentstatus: "success",
};

const COMMON_CAUSES = [
  "Annadhanam Contribution",
  "Temple Construction & Renovation",
  "Ghosala Contribution",
  "Pooja Contribution",
];

const DONOR_TYPES = [
  "Domestic",
  "International",
];

export default function Donations() {
  const [donations, setDonations] = useState<DonorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDonation, setSelectedDonation] = useState<DonorData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Edit State
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingDonor, setEditingDonor] = useState<DonorData | null>(null);
  const [formData, setFormData] = useState<DonorFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [donorType, setDonorType] = useState("");
  const [cause, setCause] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        type: "online",
      };
      if (startDate) payload.startdate = startDate;
      if (endDate) payload.enddate = endDate;
      if (donorType) payload.donortype = donorType;
      if (cause) payload.cause = cause;
      if (paymentStatus) payload.paymentstatus = paymentStatus;
      if (searchTerm.trim()) payload.search = searchTerm.trim();

      const response = await api.post("/donor/get", payload);
      if (response.data?.success) {
        const raw = response.data.data;
        const list: DonorData[] = Array.isArray(raw)
          ? raw
          : raw?.donors || raw?.rows || raw?.data || [];
        // Strictly filter to display only online donations
        const onlineOnly = list.filter(
          (item) => !item.type || item.type.toLowerCase() === "online" || item.type.toLowerCase() !== "offline",
        );
        setDonations(onlineOnly);
        setCurrentPage(1); // Reset page on new fetch
      } else {
        setDonations([]);
      }
    } catch (error) {
      console.error("Failed to fetch donations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const openEditForm = (donor: DonorData) => {
    setEditingDonor(donor);
    const matchedCause = COMMON_CAUSES.find(
      (c) => c.toLowerCase() === donor.cause?.toLowerCase().trim(),
    );
    const matchedType = DONOR_TYPES.find(
      (t) => t.toLowerCase() === donor.donortype?.toLowerCase().trim(),
    );
    setFormData({
      cause: matchedCause || (donor.cause ? "Other" : "Annadhanam Contribution"),
      customCause: matchedCause ? "" : donor.cause || "",
      fullname: donor.fullname || "",
      mobile: donor.mobile || "",
      email: donor.email || "",
      address: donor.address || "",
      country: donor.country || "India",
      pannumber: donor.pannumber || "",
      aadhaarnumber: donor.aadhaarnumber || "",
      passportnumber: donor.passportnumber || "",
      donortype: matchedType || donor.donortype,
      amount: donor.amount !== undefined && donor.amount !== null ? String(donor.amount) : "",
      paymentstatus: donor.paymentstatus || "success",
    });
    setFormError("");
    setFormSuccess("");
    setShowEditForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingDonor(null);
    setFormData(INITIAL_FORM);
    setFormError("");
    setFormSuccess("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.fullname.trim()) {
      setFormError("Full Name is required.");
      return;
    }

    if (!formData.mobile.trim()) {
      setFormError("Mobile number is required.");
      return;
    }

    const numAmount = Number(formData.amount);
    if (!formData.amount || Number.isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid donation amount.");
      return;
    }

    const finalCause =
      formData.cause === "Other"
        ? formData.customCause.trim() || "General Donation"
        : formData.cause;

    const donorId =
      editingDonor?.id ||
      (editingDonor as { donorid?: number })?.donorid ||
      (editingDonor as { _id?: number })?._id;

    if (!donorId) {
      setFormError("Unable to identify donation record.");
      return;
    }

    const payload = {
      cause: finalCause,
      fullname: formData.fullname.trim(),
      type: editingDonor?.type || "online",
      mobile: formData.mobile.trim(),
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      country: formData.country.trim() || "India",
      pannumber: formData.pannumber.trim().toUpperCase() || null,
      aadhaarnumber: formData.aadhaarnumber.trim() || null,
      passportnumber: formData.passportnumber.trim() || null,
      donortype: formData.donortype,
      amount: numAmount,
      paymentstatus: formData.paymentstatus || "success",
    };

    setSubmitting(true);
    try {
      const editPayload = { id: donorId, ...payload };
      let response;
      try {
        response = await api.post(`/donor/edit/${donorId}`, editPayload);
      } catch (postErr: unknown) {
        const status = (postErr as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 405) {
          try {
            response = await api.put(`/donor/edit/${donorId}`, editPayload);
          } catch (putErr: unknown) {
            const putStatus = (putErr as { response?: { status?: number } })?.response?.status;
            if (putStatus === 404 || putStatus === 405) {
              try {
                response = await api.post(`/donor/edit`, editPayload);
              } catch (editErr: unknown) {
                const editStatus = (editErr as { response?: { status?: number } })?.response?.status;
                if (editStatus === 404 || editStatus === 405) {
                  response = await api.post(`/donor/update`, editPayload);
                } else {
                  throw editErr;
                }
              }
            } else {
              throw putErr;
            }
          }
        } else {
          throw postErr;
        }
      }

      const isSuccess =
        response.data?.success !== false &&
        (response.data?.success === true ||
          response.status === 200 ||
          response.status === 201);

      if (isSuccess) {
        setDonations((prev) =>
          prev.map((item) =>
            item.id === donorId ||
              (item as { donorid?: number }).donorid === donorId
              ? {
                ...item,
                ...payload,
                id: donorId,
                amount: String(numAmount),
                email: payload.email,
                address: payload.address,
                updatedAt: new Date().toISOString(),
              }
              : item,
          ),
        );
        setFormSuccess("Donation updated successfully!");
        setTimeout(() => {
          closeEditForm();
          void fetchDonations();
        }, 700);
      } else {
        setFormError(response.data?.message || "Failed to update donation.");
      }
    } catch (err: unknown) {
      console.error("Donation submission error:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error
          ? err.message
          : "An unexpected error occurred.");
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (donor: DonorData) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the donation of ₹${donor.amount} by "${donor.fullname}"?`,
      )
    ) {
      return;
    }

    setDeletingId(donor.id);
    setIsDeleting(true);
    try {
      const response = await api.post("/donor/delete", { id: donor.id });
      if (response.data?.success || response.status === 200) {
        setDonations((prev) => prev.filter((d) => d.id !== donor.id));
        if (selectedDonation?.id === donor.id) {
          setIsSidebarOpen(false);
          setSelectedDonation(null);
        }
      } else {
        alert(response.data?.message || "Unable to delete donation.");
      }
    } catch (err) {
      console.error("Failed to delete donation:", err);
      alert("An error occurred while deleting donation.");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredDonations = donations
    .filter((donor) => !donor.type || donor.type.toLowerCase() !== "offline")
    .filter(
      (donor) =>
        donor.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donor.mobile?.includes(searchTerm) ||
        donor.cause?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const currentDonations = filteredDonations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Statistics - Strictly online
  const totalAmount = useMemo(() => {
    return donations
      .filter((d) => !d.type || d.type.toLowerCase() !== "offline")
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  const templeAmount = useMemo(() => {
    return donations
      .filter((d) => {
        if (d.type && d.type.toLowerCase() === "offline") return false;
        const c = d.cause?.toLowerCase() || "";
        return c.includes("temple") || c.includes("kovil");
      })
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  const annadhanamAmount = useMemo(() => {
    return donations
      .filter((d) => {
        if (d.type && d.type.toLowerCase() === "offline") return false;
        const c = d.cause?.toLowerCase() || "";
        return c.includes("annadhanam") || c.includes("food") || c.includes("anna");
      })
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  const ghosalaAmount = useMemo(() => {
    return donations
      .filter((d) => {
        if (d.type && d.type.toLowerCase() === "offline") return false;
        const c = d.cause?.toLowerCase() || "";
        return c.includes("ghosala") || c.includes("gosala") || c.includes("cow");
      })
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  const poojaAmount = useMemo(() => {
    return donations
      .filter((d) => {
        if (d.type && d.type.toLowerCase() === "offline") return false;
        const c = d.cause?.toLowerCase() || "";
        return c.includes("pooja") || c.includes("puja");
      })
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Donations</h1>
          <p className="text-gray-500 mt-1">
            {showEditForm
              ? `Update online donation information for #${editingDonor?.id}`
              : "Manage and view all foundation donations."}
          </p>
        </div>
        {showEditForm && (
          <button
            onClick={closeEditForm}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            Back to List
          </button>
        )}
      </div>

      {showEditForm ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6 md:p-8"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Edit Donation #{editingDonor?.id}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Update the devotee contribution details below.
              </p>
            </div>
            <button
              type="button"
              onClick={closeEditForm}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="space-y-6">
            {formError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Donor Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Donation Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1000"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm font-semibold bg-white"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="ramesh@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                />
              </div>

              {/* Cause */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Donation Cause <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.cause}
                  onChange={(e) =>
                    setFormData({ ...formData, cause: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                >
                  {COMMON_CAUSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Donor Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Donor Type
                </label>
                <select
                  value={formData.donortype}
                  onChange={(e) =>
                    setFormData({ ...formData, donortype: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                >
                  {DONOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  {formData.donortype &&
                    !DONOR_TYPES.includes(formData.donortype) && (
                      <option value={formData.donortype}>
                        {formData.donortype}
                      </option>
                    )}
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Payment Status
                </label>
                <select
                  value={formData.paymentstatus}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentstatus: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                >
                  <option value="success">Success / Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  placeholder="India"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                />
              </div>

              {/* PAN */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  PAN Number (Tax Exemption)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={formData.pannumber}
                  onChange={(e) =>
                    setFormData({ ...formData, pannumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm uppercase font-mono bg-white"
                />
              </div>

              {/* Aadhaar Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="123456789012"
                  value={formData.aadhaarnumber}
                  onChange={(e) =>
                    setFormData({ ...formData, aadhaarnumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm font-mono bg-white"
                />
              </div>

              {/* Passport Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Passport Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={formData.passportnumber}
                  onChange={(e) =>
                    setFormData({ ...formData, passportnumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm font-mono bg-white"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Address / City
                </label>
                <textarea
                  rows={3}
                  placeholder="No. 25, Gandhi Road, Erode"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm resize-none bg-white"
                />
              </div>
            </div>

            <div className="pt-5 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditForm}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-saffron-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Update Donation
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-saffron-100/60 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Total Donars
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">
                  {donations.length}
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-saffron-100/60 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Total Collections
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-saffron-100/60 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Temple Fund
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">
                  ₹{templeAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-saffron-100/60 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <HandHeart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Annadhanam Fund
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">
                  ₹{annadhanamAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-saffron-100/60 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <HandHeart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Ghosala Fund
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">
                  ₹{ghosalaAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-saffron-100/60 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <HandHeart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Pooja Fund
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">
                  ₹{poojaAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row flex-wrap justify-between items-center gap-4 bg-gray-50/50">
              <div className="relative w-full md:max-w-xs">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, mobile or cause..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all text-sm bg-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
                <select
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
                >
                  <option value="">All Causes</option>
                  <option value="Annadhanam Contribution">Annadhanam Contribution</option>
                  <option value="Temple Construction & Renovation">Temple Construction</option>
                  <option value="Ghosala Contribution">Ghosala Contribution</option>
                  <option value="Pooja Contribution">Pooja Contribution</option>
                </select>
                <select
                  value={donorType}
                  onChange={(e) => setDonorType(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
                >
                  <option value="">All Types</option>
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
                  title="Start Date"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
                  title="End Date"
                />
                <button
                  onClick={fetchDonations}
                  className="w-full sm:w-auto px-5 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium transition-colors shadow-sm text-xs sm:text-sm cursor-pointer"
                >
                  Fetch
                </button>
              </div>
            </div>

            <div className="overflow-x-auto relative min-h-[300px]">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                    <th className="px-6 py-4 font-medium">S.No</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                    <th className="px-6 py-4 font-medium">Donor Details</th>
                    <th className="px-6 py-4 font-medium">Cause & Type</th>
                    <th className="px-6 py-4 font-medium">IDs (PAN/Aadhaar)</th>
                    <th className="px-6 py-4 font-medium">Amount & Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentDonations.length === 0 && !loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No donations found.
                      </td>
                    </tr>
                  ) : (
                    currentDonations.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-saffron-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <h1 className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 ring-orange-200">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </h1>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedDonation(item);
                                setIsSidebarOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditForm(item)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                              title="Edit Donation"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => void handleDelete(item)}
                              disabled={isDeleting && deletingId === item.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                              title="Delete Donation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">
                              {item.fullname}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.email}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.mobile}
                            </span>
                            <span
                              className="text-xs text-gray-400 mt-1 truncate max-w-[200px]"
                              title={item.address || ""}
                            >
                              {item.address}, {item.country}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium text-xs w-fit">
                              {item.cause}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {item.donortype}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col text-gray-600 space-y-1 text-xs">
                            {item.pannumber && (
                              <span title="PAN">
                                <span className="font-semibold">PAN:</span>{" "}
                                {item.pannumber}
                              </span>
                            )}
                            {item.aadhaarnumber && (
                              <span title="Aadhaar">
                                <span className="font-semibold">AADHAAR:</span>{" "}
                                {item.aadhaarnumber}
                              </span>
                            )}
                            {item.passportnumber && (
                              <span title="Passport">
                                <span className="font-semibold">PASSPORT:</span>{" "}
                                {item.passportnumber}
                              </span>
                            )}
                            {!item.pannumber &&
                              !item.aadhaarnumber &&
                              !item.passportnumber && (
                                <span className="text-gray-400 italic">
                                  Not Provided
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center font-bold text-gray-800">
                              <IndianRupee className="w-4 h-4 mr-0.5" />
                              {item.amount}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium w-fit uppercase tracking-wider ${item.paymentstatus === "completed" ||
                                item.paymentstatus === "success"
                                ? "bg-green-100 text-green-700"
                                : item.paymentstatus === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                                }`}
                            >
                              {item.paymentstatus}
                            </span>
                            {item.screenshot && (
                              <a
                                href={
                                  item.screenshot.startsWith("http")
                                    ? item.screenshot
                                    : `${BASEURL}${item.screenshot}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-saffron-600 hover:underline flex items-center mt-1"
                              >
                                <FileText className="w-3 h-3 mr-1" /> Receipt
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-saffron-500 shrink-0" />
                            <span className="whitespace-nowrap">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 bg-gray-50/50">
                <p>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredDonations.length)} of{" "}
                  {filteredDonations.length} entries
                </p>
                <div className="flex gap-1 overflow-x-auto">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${pageNum === currentPage
                          ? "bg-saffron-500 text-white shadow-sm"
                          : "border border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Right Sidebar for Donation Details */}
      <AnimatePresence>
        {isSidebarOpen && selectedDonation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-800">
                  Donation #{selectedDonation.id}
                </h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:bg-white hover:text-gray-800 rounded-full transition-colors shadow-sm border border-transparent hover:border-gray-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="bg-saffron-50 rounded-2xl p-6 border border-saffron-100/50 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-saffron-600 font-bold text-2xl mx-auto shadow-sm mb-3">
                    {selectedDonation.fullname.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedDonation.fullname}
                  </h3>

                  <div className="flex flex-col gap-2 mt-4 items-center">
                    {selectedDonation.email && (
                      <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 w-full justify-center">
                        <Mail className="w-4 h-4 text-saffron-500" />{" "}
                        {selectedDonation.email}
                      </p>
                    )}
                    <div className="flex gap-2 w-full justify-center">
                      <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 flex-1 justify-center">
                        <Phone className="w-4 h-4 text-saffron-500" />{" "}
                        {selectedDonation.mobile}
                      </p>
                    </div>
                    {selectedDonation.address && (
                      <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 w-full justify-center">
                        <MapPin className="w-4 h-4 text-saffron-500" />{" "}
                        {selectedDonation.address}, {selectedDonation.country}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                      Donation Details
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-bold text-gray-800 text-lg flex items-center">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {selectedDonation.amount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cause</span>
                        <span className="font-semibold text-gray-800 capitalize">
                          {selectedDonation.cause}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Donor Type</span>
                        <span className="font-semibold text-gray-800 capitalize">
                          {selectedDonation.donortype}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Status</span>
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-xs font-semibold capitalize ${selectedDonation.paymentstatus === "completed" ||
                            selectedDonation.paymentstatus === "success"
                            ? "bg-green-100 text-green-700"
                            : selectedDonation.paymentstatus === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {selectedDonation.paymentstatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Date</span>
                        <span className="font-semibold text-gray-800">
                          {new Date(selectedDonation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedDonation.paymentid && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                          <span className="text-gray-600 text-sm">
                            Payment ID
                          </span>
                          <span className="font-mono text-xs bg-white px-2 py-1 border border-gray-200 rounded">
                            {selectedDonation.paymentid}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                      Identification
                    </p>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">PAN:</span>
                        <span className="font-mono">
                          {selectedDonation.pannumber || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Aadhaar:</span>
                        <span className="font-mono">
                          {selectedDonation.aadhaarnumber || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Passport:</span>
                        <span className="font-mono">
                          {selectedDonation.passportnumber || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedDonation.screenshot && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                        Payment Receipt
                      </p>
                      <img
                        src={
                          selectedDonation.screenshot.startsWith("http")
                            ? selectedDonation.screenshot
                            : `${BASEURL}${selectedDonation.screenshot}`
                        }
                        alt="Receipt"
                        className="w-full rounded-lg border border-gray-200 object-contain"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setIsSidebarOpen(false);
                        openEditForm(selectedDonation);
                      }}
                      className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Donation
                    </button>
                    <button
                      onClick={() => void handleDelete(selectedDonation)}
                      className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
