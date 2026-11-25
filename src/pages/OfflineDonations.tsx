import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Calendar,
  IndianRupee,
  Eye,
  Edit2,
  Trash2,
  X,
  MapPin,
  Mail,
  Phone,
  Plus,
  ArrowLeft,
  Download,
  HandHeart,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { exportToExcel } from "../utils/exportToExcel";

export interface OfflineDonorData {
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
  donortype: string;
  amount: string | number;
  type: string;
  paymentmethod?: "upi" | "cash" | string | null;
  paymentstatus?: string;
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
  paymentmethod: string;
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
  donortype: "Domestic",
  amount: "",
  paymentmethod: "cash",
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

export default function OfflineDonations() {
  const [donations, setDonations] = useState<OfflineDonorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDonation, setSelectedDonation] = useState<OfflineDonorData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Page view mode: list vs form
  const [showForm, setShowForm] = useState(false);
  const [editingDonor, setEditingDonor] = useState<OfflineDonorData | null>(null);
  const [formData, setFormData] = useState<DonorFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [causeFilter, setCauseFilter] = useState("");
  const [donorTypeFilter, setDonorTypeFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        type: "offline",
      };
      if (startDate) payload.startdate = startDate;
      if (endDate) payload.enddate = endDate;
      if (causeFilter) payload.cause = causeFilter;
      if (donorTypeFilter) payload.donortype = donorTypeFilter;
      if (paymentStatusFilter) payload.paymentstatus = paymentStatusFilter;
      if (searchTerm.trim()) payload.search = searchTerm.trim();

      const response = await api.post("/donor/get", payload);
      if (response.data?.success) {
        const raw = response.data.data;
        const list: OfflineDonorData[] = Array.isArray(raw)
          ? raw
          : raw?.donors || raw?.rows || raw?.data || [];
        // Strictly filter to display only offline donations
        const offlineOnly = list.filter(
          (item) => item.type?.toLowerCase() === "offline",
        );
        setDonations(offlineOnly);
        setCurrentPage(1);
      } else {
        setDonations([]);
      }
    } catch (error) {
      console.error("Failed to fetch offline donations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDonations();
  }, []);

  const openAddForm = () => {
    setEditingDonor(null);
    setFormData(INITIAL_FORM);
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const openEditForm = (donor: OfflineDonorData) => {
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
      paymentmethod: donor.paymentmethod?.toLowerCase() === "upi" ? "upi" : "cash",
    });
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDonor(null);
    setFormData(INITIAL_FORM);
    setFormError("");
    setFormSuccess("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.fullname.trim()) {
      setFormError("Full Name is required.");
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

    const payload = {
      cause: finalCause,
      fullname: formData.fullname.trim(),
      type: "offline",
      mobile: formData.mobile.trim(),
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      country: formData.country.trim() || "India",
      pannumber: formData.pannumber.trim().toUpperCase() || null,
      aadhaarnumber: formData.aadhaarnumber.trim() || null,
      passportnumber: formData.passportnumber.trim() || null,
      donortype: formData.donortype,
      amount: numAmount,
      paymentmethod: formData.paymentmethod || "cash",
      paymentstatus: "success",
    };

    setSubmitting(true);
    try {
      if (editingDonor && donorId) {
        // Edit donor: Support POST /donor/edit/:id, PUT /donor/edit/:id, POST /donor/edit
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
          // Immediately update local state
          setDonations((prev) =>
            prev.map((item) =>
              item.id === donorId ||
                (item as { donorid?: number }).donorid === donorId
                ? {
                  ...item,
                  ...payload,
                  id: donorId,
                  email: payload.email,
                  address: payload.address,
                  updatedAt: new Date().toISOString(),
                }
                : item,
            ),
          );
          setFormSuccess("Donation updated successfully!");
          setTimeout(() => {
            closeForm();
            void fetchDonations();
          }, 700);
        } else {
          setFormError(response.data?.message || "Failed to update donation.");
        }
      } else {
        // Add donor
        const response = await api.post("/donor/add", payload);
        const isSuccess =
          response.data?.success !== false &&
          (response.data?.success === true ||
            response.status === 200 ||
            response.status === 201);

        if (isSuccess) {
          setFormSuccess("Donation added successfully!");
          setTimeout(() => {
            closeForm();
            void fetchDonations();
          }, 700);
        } else {
          setFormError(response.data?.message || "Failed to add donation.");
        }
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

  const handleDelete = async (donor: OfflineDonorData) => {
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
      if (response.data?.success) {
        setDonations((prev) => prev.filter((d) => d.id !== donor.id));
        if (selectedDonation?.id === donor.id) {
          setIsDrawerOpen(false);
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

  const filteredDonations = useMemo(() => {
    // Strictly display only offline donations
    const offlineOnly = donations.filter(
      (donor) => donor.type?.toLowerCase() === "offline",
    );
    const q = searchTerm.toLowerCase().trim();
    if (!q) return offlineOnly;
    return offlineOnly.filter(
      (donor) =>
        donor.fullname?.toLowerCase().includes(q) ||
        donor.email?.toLowerCase().includes(q) ||
        donor.mobile?.includes(q) ||
        donor.cause?.toLowerCase().includes(q) ||
        donor.pannumber?.toLowerCase().includes(q) ||
        donor.aadhaarnumber?.includes(q),
    );
  }, [donations, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredDonations.length / itemsPerPage));
  const currentDonations = useMemo(() => {
    return filteredDonations.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredDonations, currentPage, itemsPerPage]);

  // Statistics - Strictly offline
  const totalAmount = useMemo(() => {
    return donations
      .filter((d) => d.type?.toLowerCase() === "offline")
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  const templeAmount = useMemo(() => {
    return donations
      .filter((d) => {
        if (d.type?.toLowerCase() !== "offline") return false;
        const c = d.cause?.toLowerCase() || "";
        return c.includes("temple") || c.includes("kovil");
      })
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  const annadhanamAmount = useMemo(() => {
    return donations
      .filter((d) => {
        if (d.type?.toLowerCase() !== "offline") return false;
        const c = d.cause?.toLowerCase() || "";
        return c.includes("annadhanam") || c.includes("food") || c.includes("anna");
      })
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  const ghosalaAmount = useMemo(() => {
    return donations
      .filter((d) => {
        if (d.type?.toLowerCase() !== "offline") return false;
        const c = d.cause?.toLowerCase() || "";
        return c.includes("ghosala") || c.includes("gosala") || c.includes("cow");
      })
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  const poojaAmount = useMemo(() => {
    return donations
      .filter((d) => {
        if (d.type?.toLowerCase() !== "offline") return false;
        const c = d.cause?.toLowerCase() || "";
        return c.includes("pooja") || c.includes("puja");
      })
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  const handleExport = () => {
    if (filteredDonations.length === 0) {
      alert("No donation records to export.");
      return;
    }
    const rows = filteredDonations.map((d, index) => ({
      "S.No": index + 1,
      "Donor Name": d.fullname,
      "Mobile": d.mobile,
      "Email": d.email || "",
      "Amount (₹)": d.amount,
      "Cause": d.cause,
      "Donor Type": d.donortype,
      "Address": d.address || "",
      "Country": d.country || "",
      "PAN Number": d.pannumber || "",
      "Aadhaar Number": d.aadhaarnumber || "",
      "Passport Number": d.passportnumber || "",
      "Payment Status": d.paymentstatus || "Success",
      "Date": d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "",
    }));
    exportToExcel("offline-donations", rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <HandHeart className="w-8 h-8 text-saffron-600" />
            Offline Donations
          </h1>
          <p className="text-gray-500 mt-1">
            {showForm
              ? editingDonor
                ? "Update offline donor information"
                : "Enter devotee offline contribution details"
              : "Record, manage, and verify counter and in-person donations."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {showForm ? (
            <button
              onClick={closeForm}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
              Back to List
            </button>
          ) : (
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
                title="Export as CSV"
              >
                <Download className="w-4 h-4 text-gray-500" />
                Export CSV
              </button>
              <button
                onClick={openAddForm}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-saffron-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Offline Donation
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content: Form View vs List View */}
      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6 md:p-8"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {editingDonor ? "Edit Offline Donation" : "Add Offline Donation"}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {editingDonor
                  ? `Updating donation record #${editingDonor.id}`
                  : "Fill out the devotee contribution details below."}
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
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

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paymentmethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentmethod: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
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
                onClick={closeForm}
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
                {editingDonor ? "Update Donation" : "Save Offline Donation"}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <>
          {/* Summary KPI Cards */}
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

          {/* Main Table Card */}
          <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
            {/* Filters Bar */}
            <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row flex-wrap justify-between items-stretch lg:items-center gap-3 bg-gray-50/50">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search donor name, mobile, email, PAN, cause..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all text-sm bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={causeFilter}
                  onChange={(e) => setCauseFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
                >
                  <option value="">All Causes</option>
                  <option value="Annadhanam Contribution">Annadhanam Contribution</option>
                  <option value="Temple Construction & Renovation">Temple Construction</option>
                  <option value="Ghosala Contribution">Ghosala Contribution</option>
                  <option value="Pooja Contribution">Pooja Contribution</option>
                </select>

                <select
                  value={donorTypeFilter}
                  onChange={(e) => setDonorTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
                >
                  <option value="">All Types</option>
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>

                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
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
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
                  title="Start Date"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xs sm:text-sm bg-white"
                  title="End Date"
                />

                <button
                  onClick={() => void fetchDonations()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl font-medium transition-colors shadow-sm text-xs sm:text-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Fetch
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto relative min-h-[300px]">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-semibold">S.No</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    <th className="px-5 py-3.5 font-semibold">Donor Details</th>
                    <th className="px-5 py-3.5 font-semibold">Cause & Type</th>
                    <th className="px-5 py-3.5 font-semibold">Identifiers</th>
                    <th className="px-5 py-3.5 font-semibold">Amount</th>
                    <th className="px-5 py-3.5 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentDonations.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        <HandHeart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        No offline donations found.
                      </td>
                    </tr>
                  ) : (
                    currentDonations.map((donor, idx) => (
                      <tr
                        key={donor.id}
                        className="hover:bg-saffron-50/30 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedDonation(donor);
                                setIsDrawerOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditForm(donor)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                              title="Edit Donation"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => void handleDelete(donor)}
                              disabled={isDeleting && deletingId === donor.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                              title="Delete Donation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 text-sm">
                              {donor.fullname}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-saffron-500" />
                              {donor.mobile}
                            </span>
                            {donor.email && (
                              <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-saffron-500" />
                                {donor.email}
                              </span>
                            )}
                            {donor.address && (
                              <span
                                className="text-xs text-gray-400 mt-1 truncate max-w-[200px]"
                                title={`${donor.address}, ${donor.country}`}
                              >
                                {donor.address}, {donor.country}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-0.5 rounded-full font-medium text-xs w-fit">
                              {donor.cause}
                            </span>
                            <span className="text-[11px] text-gray-500 capitalize pl-1">
                              {donor.donortype}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs">
                          <div className="flex flex-col text-gray-600 space-y-1">
                            {donor.pannumber && (
                              <span>
                                <span className="font-semibold text-gray-500">PAN:</span>{" "}
                                <span className="font-mono">{donor.pannumber}</span>
                              </span>
                            )}
                            {donor.aadhaarnumber && (
                              <span>
                                <span className="font-semibold text-gray-500">Aadhaar:</span>{" "}
                                <span className="font-mono">{donor.aadhaarnumber}</span>
                              </span>
                            )}
                            {donor.passportnumber && (
                              <span>
                                <span className="font-semibold text-gray-500">Passport:</span>{" "}
                                <span className="font-mono">{donor.passportnumber}</span>
                              </span>
                            )}
                            {!donor.pannumber && !donor.aadhaarnumber && !donor.passportnumber && (
                              <span className="text-gray-400 italic">Not Provided</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center font-bold text-gray-900 text-sm">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-saffron-600" />
                            {Number(donor.amount).toLocaleString("en-IN")}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider rounded">
                              {donor.paymentstatus || "Offline"}
                            </span>
                            {donor.paymentmethod && (
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold uppercase tracking-wider rounded">
                                {donor.paymentmethod}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-saffron-500" />
                            {donor.createdAt
                              ? new Date(donor.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                              : "N/A"}
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
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-500 bg-gray-50/50">
                <p>
                  Showing {filteredDonations.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
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

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${pageNum === currentPage
                        ? "bg-saffron-500 text-white shadow-sm font-semibold"
                        : "border border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}

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

      {/* Right Drawer for Donation Details */}
      <AnimatePresence>
        {isDrawerOpen && selectedDonation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
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
                  Offline Donation #{selectedDonation.id}
                </h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
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
                    <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 w-full justify-center">
                      <Phone className="w-4 h-4 text-saffron-500" />{" "}
                      {selectedDonation.mobile}
                    </p>
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
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                      Donation Summary
                    </p>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-bold text-gray-900 text-lg flex items-center">
                          <IndianRupee className="w-4 h-4 mr-0.5 text-saffron-600" />
                          {Number(selectedDonation.amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cause</span>
                        <span className="font-semibold text-gray-800">
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
                        <span className="text-gray-600">Type</span>
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-orange-100 text-orange-700">
                          Offline
                        </span>
                      </div>
                      {selectedDonation.paymentmethod && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Payment Method</span>
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-700">
                            {selectedDonation.paymentmethod}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Date</span>
                        <span className="font-semibold text-gray-800">
                          {selectedDonation.createdAt
                            ? new Date(selectedDonation.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                      Tax & Identification Details
                    </p>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">PAN:</span>
                        <span className="font-mono font-semibold">
                          {selectedDonation.pannumber || "Not Provided"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">Aadhaar:</span>
                        <span className="font-mono font-semibold">
                          {selectedDonation.aadhaarnumber || "Not Provided"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">Passport:</span>
                        <span className="font-mono font-semibold">
                          {selectedDonation.passportnumber || "Not Provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
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
