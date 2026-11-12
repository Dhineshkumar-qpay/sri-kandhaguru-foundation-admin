import { useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Clock3,
  Download,
  Eye,
  FileDown,
  IndianRupee,
  Pencil,
  Plus,
  TicketCheck,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { exportToExcel } from "../utils/exportToExcel";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface EventOption {
  id: number;
  title: string;
  registrationfee: string;
}

interface RegisteredUser {
  id: number;
  fullname: string;
  mobile?: string;
  address?: string;
}

interface StaffOption {
  userid: number;
  username: string;
}

interface RegistrationHistoryRecord {
  id: number;
  registerid: number;
  eventid: number;
  evenetname: string;
  registrationfee: number;
  advanceamount: number;
  balanceamount: number;
  subtotal?: number | string | null;
  discountamount?: number | string | null;
  cashamount?: number | string | null;
  upiamount?: number | string | null;
  paymentstatus: string;
  sessiontype: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  registration?: {
    id: number;
    fullname: string;
    mobile?: string;
    address?: string;
  };
}

interface RegistrationInvoiceRecord extends RegistrationHistoryRecord {
  registration?: {
    id: number;
    fullname: string;
    mobile?: string;
    address?: string;
  };
}

interface HistoryForm {
  eventid: string;
  advanceamount: string;
  discountamount: string;
  paymentstatus: string;
}

const fieldClassName =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all";

const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value);
  return `₹${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getOutstandingBalance = (history: RegistrationHistoryRecord) => {
  if (history.paymentstatus?.toLowerCase() === "completed") return 0;
  return Math.max(
    0,
    (Number(history.registrationfee) || 0) -
      (Number(history.discountamount) || 0) -
      (Number(history.advanceamount) || 0) -
      (Number(history.cashamount) || 0),
  );
};

const getRegistrationSubtotal = (history: RegistrationHistoryRecord) => {
  if (history.subtotal !== null && history.subtotal !== undefined) {
    const subtotal = Number(history.subtotal);
    if (Number.isFinite(subtotal)) return subtotal;
  }
  return Math.max(
    0,
    (Number(history.registrationfee) || 0) -
      (Number(history.discountamount) || 0),
  );
};

const formatInvoiceDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const formatInvoiceAmount = (value: number | string | null | undefined) => {
  const amount = Number(value);
  return `Rs. ${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const emptyForm: HistoryForm = {
  eventid: "",
  advanceamount: "",
  discountamount: "",
  paymentstatus: "pending",
};

const getCurrentMonthDateRange = () => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return {
    fromDate: `${yearMonth}-01`,
    toDate: `${yearMonth}-${String(
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    ).padStart(2, "0")}`,
  };
};

const getApiMessage = <T,>(response: ApiResponse<T>, fallback: string) => {
  const data = response.data;
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }
  return response.message || fallback;
};

const getRequestErrorMessage = (error: unknown, fallback: string) => {
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

export default function EventRegistration() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [histories, setHistories] = useState<RegistrationHistoryRecord[]>([]);
  const [staffs, setStaffs] = useState<StaffOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [form, setForm] = useState<HistoryForm>(emptyForm);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<RegisteredUser[]>([]);
  const [dateRange, setDateRange] = useState(getCurrentMonthDateRange);
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingHistories, setLoadingHistories] = useState(true);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<
    number | null
  >(null);
  const [error, setError] = useState("");
  const [eventsError, setEventsError] = useState("");
  const pageSize = 10;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const response =
          await api.post<ApiResponse<{ userType: string }>>("/admin/get");
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to load signed-in profile.",
          );
        }
        if (active) {
          setIsAdmin(response.data.data.userType?.toLowerCase() === "admin");
        }
      } catch (requestError) {
        console.error(
          "Failed to load event registration permissions",
          requestError,
        );
      }
    };

    void fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  const fetchHistories = async (
    fromDate: string,
    toDate: string,
    staffId = selectedStaffId,
  ) => {
    setLoadingHistories(true);
    setError("");
    if (!fromDate || !toDate || fromDate > toDate) {
      setHistories([]);
      setError("Choose a valid date range.");
      setLoadingHistories(false);
      return;
    }
    try {
      const response = await api.post<ApiResponse<RegistrationHistoryRecord[]>>(
        "/registration-history/get",
        {
          fromDate,
          toDate,
          ...(isAdmin ? { userid: staffId ? Number(staffId) : null } : {}),
        },
      );
      if (!response.data?.success) {
        throw new Error(
          getApiMessage(response.data, "Unable to load event registrations."),
        );
      }

      setHistories(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(1);
    } catch (requestError) {
      console.error("Failed to fetch event registration history", requestError);
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to load event registrations. Please try again.",
        ),
      );
    } finally {
      setLoadingHistories(false);
    }
  };

  useEffect(() => {
    void fetchHistories(dateRange.fromDate, dateRange.toDate, selectedStaffId);
  }, [dateRange.fromDate, dateRange.toDate, selectedStaffId, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    const fetchStaffs = async () => {
      setLoadingStaffs(true);
      try {
        const response =
          await api.post<ApiResponse<StaffOption[]>>("/admin/get-staffs");
        if (!response.data?.success) {
          throw new Error(
            getApiMessage(response.data, "Unable to load staff members."),
          );
        }
        if (active) {
          setStaffs(
            Array.isArray(response.data.data) ? response.data.data : [],
          );
        }
      } catch (requestError) {
        console.error(
          "Failed to load staff for event registration filter",
          requestError,
        );
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
  }, [isAdmin]);

  useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      setLoadingEvents(true);
      setEventsError("");
      try {
        const response = await api.post<ApiResponse<{ events: EventOption[] }>>(
          "/event/get-event-names",
        );
        if (!response.data?.success) {
          throw new Error(
            getApiMessage(response.data, "Unable to load events."),
          );
        }
        if (active) setEvents(response.data.data?.events ?? []);
      } catch (requestError) {
        console.error("Failed to fetch event choices", requestError);
        if (active) {
          setEventsError(
            getRequestErrorMessage(
              requestError,
              "Unable to load events. Please try again.",
            ),
          );
        }
      } finally {
        if (active) setLoadingEvents(false);
      }
    };

    void fetchEvents();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = userSearch.trim();
    if (!showForm || selectedUser || query.length < 3) {
      setUserResults([]);
      setSearchingUsers(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setSearchingUsers(true);
      setError("");
      try {
        const response = await api.post<ApiResponse<RegisteredUser[]>>(
          "/registration/search",
          { search: query },
        );
        if (!response.data?.success) {
          throw new Error(
            getApiMessage(response.data, "Unable to search registrations."),
          );
        }
        if (active) {
          setUserResults(
            Array.isArray(response.data.data) ? response.data.data : [],
          );
        }
      } catch (requestError) {
        console.error("Failed to search registered users", requestError);
        if (active) {
          setError(
            getRequestErrorMessage(
              requestError,
              "Unable to search registered users. Please try again.",
            ),
          );
          setUserResults([]);
        }
      } finally {
        if (active) setSearchingUsers(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [selectedUser, showForm, userSearch]);

  const selectedEvent = events.find(
    (event) => String(event.id) === form.eventid,
  );
  const registrationFee = selectedEvent
    ? Number(selectedEvent.registrationfee) || 0
    : 0;
  const advanceAmount = Number(form.advanceamount) || 0;
  const discountAmount = Number(form.discountamount) || 0;
  const balanceAmount = Math.max(
    0,
    registrationFee - discountAmount - advanceAmount,
  );

  const filteredHistories = histories.filter((history) =>
    [
      history.evenetname,
      history.registration?.fullname,
      String(history.registerid),
      history.paymentstatus,
      String(history.id),
    ].some((value) =>
      value?.toLowerCase().includes(tableSearch.trim().toLowerCase()),
    ),
  );
  const totalRegistrationAmount = filteredHistories.reduce(
    (total, history) => total + getRegistrationSubtotal(history),
    0,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistories.length / pageSize),
  );
  const currentHistories = filteredHistories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const handleExport = () => {
    exportToExcel(
      `event-registrations-${dateRange.fromDate}-to-${dateRange.toDate}`,
      filteredHistories.map((history) => ({
        ID: history.id,
        "User ID": history.registerid,
        "Full Name":
          history.registration?.fullname || `User #${history.registerid}`,
        "Event Name": history.evenetname,
        "Payment Status": history.paymentstatus || "pending",
        "Session Type": history.sessiontype || "absent",
        Notes: history.notes || "",
        "Registration Fee": Number(history.registrationfee) || 0,
        Discount: Number(history.discountamount) || 0,
        Advance: Number(history.advanceamount) || 0,
        "Cash Received": Number(history.cashamount) || 0,
        "UPI Amount": Number(history.upiamount) || 0,
        Balance: getOutstandingBalance(history),
        Subtotal: getRegistrationSubtotal(history),
      })),
    );
  };

  const handleDownloadInvoice = async (history: RegistrationHistoryRecord) => {
    setDownloadingInvoiceId(history.id);
    setError("");
    try {
      const { jsPDF } = await import("jspdf");
      const response = await api.post<ApiResponse<RegistrationInvoiceRecord>>(
        "/registration-history/details",
        { id: history.id },
      );
      if (!response.data?.success || !response.data.data) {
        throw new Error(
          getApiMessage(
            response.data,
            "Unable to load registration invoice details.",
          ),
        );
      }

      const invoice = response.data.data;
      const logoResponse = await fetch("/appLogo.png");
      if (!logoResponse.ok) {
        throw new Error("Unable to load the application logo.");
      }
      const logoBlob = await logoResponse.blob();
      const logoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Unable to read the application logo."));
          }
        };
        reader.onerror = () =>
          reject(new Error("Unable to read the application logo."));
        reader.readAsDataURL(logoBlob);
      });
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 16;
      const brand = [199, 83, 2] as const;
      const lightGray = [224, 230, 236] as const;

      doc.addImage(logoData, "PNG", pageWidth - margin - 30, 12, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(...brand);
      doc.text("INVOICE", margin, 29);
      doc.setFontSize(9);
      doc.setTextColor(45, 54, 64);
      doc.text("Sri Kandhaguru Foundation", pageWidth - margin - 34, 48, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(105, 113, 122);
      doc.text("Event Registration", pageWidth - margin - 34, 53, {
        align: "right",
      });
      doc.setDrawColor(...lightGray);
      doc.line(margin, 59, pageWidth - margin, 59);

      let customerY = 72;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...brand);
      doc.text("INVOICE TO", margin, customerY);
      customerY += 8;
      doc.setFontSize(11);
      doc.setTextColor(35, 40, 45);
      const customerName =
        invoice.registration?.fullname || `User ID : ${invoice.registerid}`;
      const nameLines = doc.splitTextToSize(customerName, 82);
      doc.text(nameLines, margin, customerY);
      customerY += nameLines.length * 5 + 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(68, 74, 81);
      doc.text(
        `Mobile: ${invoice.registration?.mobile || "—"}`,
        margin,
        customerY,
      );
      customerY += 6;
      const addressLines = doc.splitTextToSize(
        `Address: ${invoice.registration?.address || "—"}`,
        86,
      );
      doc.text(addressLines, margin, customerY);

      const detailsX = 129;
      const detailValueX = pageWidth - margin;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(45, 52, 60);
      doc.text("Invoice ID ", detailsX, 75);
      doc.text("Registration Date", detailsX, 84);
      doc.setFont("helvetica", "normal");
      doc.text(String(invoice.id), detailValueX, 75, { align: "right" });
      doc.text(formatInvoiceDate(invoice.createdAt), detailValueX, 84, {
        align: "right",
      });

      const tableY = Math.max(customerY + addressLines.length * 5 + 5, 101);
      const headerHeight = 11;
      const eventLines = doc.splitTextToSize(
        invoice.evenetname || `Event #${invoice.eventid}`,
        88,
      );
      const rowHeight = Math.max(15, eventLines.length * 5 + 8);
      doc.setFillColor(...brand);
      doc.rect(margin, tableY, pageWidth - margin * 2, headerHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      const feeX = 143;
      const quantityX = 160;
      const totalX = pageWidth - margin - 4;
      doc.text("S.No", margin + 4, tableY + 7);
      doc.text("Item Description", margin + 17, tableY + 7);
      doc.text("Fee", feeX, tableY + 7, { align: "right" });
      doc.text("Qty", quantityX, tableY + 7, { align: "right" });
      doc.text("Total", totalX, tableY + 7, { align: "right" });

      const rowY = tableY + headerHeight;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(45, 50, 56);
      const textY =
        rowY + Math.max(7, (rowHeight - eventLines.length * 5) / 2 + 3);
      doc.text("1", margin + 5, textY);
      doc.text(eventLines, margin + 17, textY);
      doc.text(formatInvoiceAmount(invoice.registrationfee), feeX, textY, {
        align: "right",
      });
      doc.text("1", quantityX, textY, { align: "right" });
      doc.text(formatInvoiceAmount(invoice.registrationfee), totalX, textY, {
        align: "right",
      });
      doc.setDrawColor(...lightGray);
      doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight);

      const summaryY = rowY + rowHeight + 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...brand);
      doc.text("PAYMENT INFO", margin, summaryY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(68, 74, 81);
      const paymentStatus = invoice.paymentstatus || "Pending";
      doc.text(
        `Status: ${paymentStatus.charAt(0).toUpperCase()}${paymentStatus.slice(1)}`,
        margin,
        summaryY + 8,
      );

      const summaryBoxX = pageWidth - margin - 78;
      const summaryX = summaryBoxX + 4;
      const summaryValueX = pageWidth - margin - 4;
      let summaryRowY = summaryY;
      const summaryRows: [string, string][] = [
        ["Registration Fee", formatInvoiceAmount(invoice.registrationfee)],
        ["Discount", formatInvoiceAmount(invoice.discountamount)],
        ["Advance", formatInvoiceAmount(invoice.advanceamount)],
        ["Cash Received", formatInvoiceAmount(invoice.cashamount)],
        ["UPI Received", formatInvoiceAmount(invoice.upiamount)],
      ];
      doc.setFontSize(8);
      for (const [label, value] of summaryRows) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 61, 68);
        doc.text(label, summaryX, summaryRowY);
        doc.text(value, summaryValueX, summaryRowY, { align: "right" });
        summaryRowY += 7;
      }
      doc.setFillColor(...brand);
      doc.rect(summaryBoxX, summaryRowY - 4, 78, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Sub Total", summaryX, summaryRowY + 2);
      doc.text(
        formatInvoiceAmount(invoice.subtotal || 0),
        summaryValueX,
        summaryRowY + 2,
        { align: "right" },
      );

      const footerY = Math.max(summaryRowY + 32, summaryY + 45);
      doc.setDrawColor(...lightGray);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(105, 113, 122);
      doc.text(
        "Thank you for registering with Sri Kandhaguru Foundation.",
        margin,
        footerY + 8,
      );
      doc.setDrawColor(105, 113, 122);
      doc.line(
        pageWidth - margin - 42,
        footerY + 4,
        pageWidth - margin,
        footerY + 4,
      );
      doc.setFontSize(7);
      doc.text("Authorized Signature", pageWidth - margin - 21, footerY + 9, {
        align: "center",
      });

      doc.save(`event-registration-invoice-${invoice.id}.pdf`);
    } catch (requestError) {
      console.error(
        "Failed to download event registration invoice",
        requestError,
      );
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to download invoice. Please try again.",
        ),
      );
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setSelectedUser(null);
    setUserSearch("");
    setUserResults([]);
    setError("");
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedUser(null);
    setUserSearch("");
    setUserResults([]);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (history: RegistrationHistoryRecord) => {
    setEditingId(history.id);
    setForm({
      eventid: String(history.eventid),
      advanceamount: String(history.advanceamount),
      discountamount: String(history.discountamount ?? ""),
      paymentstatus: history.paymentstatus || "pending",
    });
    setSelectedUser(
      history.registration
        ? {
            id: history.registration.id,
            fullname: history.registration.fullname,
          }
        : {
            id: history.registerid,
            fullname: `User #${history.registerid}`,
          },
    );
    setUserSearch(
      history.registration?.fullname ?? `User #${history.registerid}`,
    );
    setUserResults([]);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) {
      setError("Search for and select a registered user.");
      return;
    }
    if (!selectedEvent) {
      setError("Please select an event.");
      return;
    }

    setSaving(true);
    setError("");
    const payload = {
      ...(editingId === null ? {} : { id: editingId }),
      registerid: selectedUser.id,
      eventid: selectedEvent.id,
      evenetname: selectedEvent.title,
      registrationfee: registrationFee,
      advanceamount: advanceAmount,
      discountamount: discountAmount,
      balanceamount: balanceAmount,
      paymentstatus: form.paymentstatus,
    };

    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(
        editingId === null
          ? "/registration-history/add"
          : "/registration-history/update",
        payload,
      );
      if (!response.data?.success) {
        throw new Error(
          getApiMessage(response.data, "Unable to save event registration."),
        );
      }
      resetForm();
      await fetchHistories(dateRange.fromDate, dateRange.toDate);
    } catch (requestError) {
      console.error("Failed to save event registration", requestError);
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to save event registration. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event registration?",
      )
    ) {
      return;
    }

    setDeletingId(id);
    setError("");
    try {
      const response = await api.post<ApiResponse<string>>(
        "/registration-history/delete",
        { id },
      );
      if (!response.data?.success) {
        throw new Error(
          getApiMessage(response.data, "Unable to delete event registration."),
        );
      }
      await fetchHistories(dateRange.fromDate, dateRange.toDate);
    } catch (requestError) {
      console.error("Failed to delete event registration", requestError);
      setError(
        getRequestErrorMessage(
          requestError,
          "Unable to delete event registration. Please try again.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Event Registration
          </h1>
          <p className="text-gray-500 mt-1">
            Manage registered users’ event history and payments.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-saffron-500/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Event Registration
        </button>
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

      {showForm ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingId === null
                ? "Add Event Registration"
                : "Edit Event Registration"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close event registration form"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {eventsError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{eventsError}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <label
                htmlFor="event-registration-user"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Registered User *
              </label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="event-registration-user"
                  type="search"
                  autoComplete="off"
                  value={userSearch}
                  onChange={(event) => {
                    setUserSearch(event.target.value);
                    setSelectedUser(null);
                    setError("");
                  }}
                  required
                  className={`${fieldClassName} pl-10`}
                  placeholder="Type at least 3 characters to search"
                />
              </div>
              {searchingUsers && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 flex items-center gap-2 text-sm text-gray-500"
                >
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-saffron-500 border-t-transparent" />
                  Searching registered users...
                </div>
              )}
              {userSearch.trim().length > 0 && userSearch.trim().length < 3 && (
                <p className="mt-2 text-sm text-gray-500">
                  Enter at least 3 characters to search.
                </p>
              )}
              {!searchingUsers &&
                userSearch.trim().length >= 3 &&
                !selectedUser &&
                userResults.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    No matching registered users found.
                  </p>
                )}
              {userResults.length > 0 && !selectedUser && (
                <ul
                  role="listbox"
                  aria-label="Registered users"
                  className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                >
                  {userResults.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearch(user.fullname);
                          setUserResults([]);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-saffron-50"
                      >
                        <span className="block font-medium text-gray-800">
                          {user.fullname}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {[user.mobile, user.address]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedUser && (
                <p className="mt-2 text-sm font-medium text-green-700">
                  Selected: {selectedUser.fullname} (#{selectedUser.id})
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="event-registration-event"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Event *
              </label>
              <select
                id="event-registration-event"
                required
                value={form.eventid}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    eventid: event.target.value,
                  }))
                }
                disabled={loadingEvents || events.length === 0}
                className={fieldClassName}
              >
                <option value="">
                  {loadingEvents ? "Loading events..." : "Select an event"}
                </option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    #{event.id} — {event.title} — ₹
                    {Number(event.registrationfee).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="history-registration-fee"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Registration Fee
                </label>
                <input
                  id="history-registration-fee"
                  type="number"
                  value={selectedEvent ? registrationFee : ""}
                  readOnly
                  className={`${fieldClassName} bg-gray-50 text-gray-600`}
                />
              </div>
              <div>
                <label
                  htmlFor="history-advance-payment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Advance Payment *
                </label>
                <input
                  id="history-advance-payment"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.advanceamount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      advanceamount: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label
                  htmlFor="history-discount-payment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Discount Amount
                </label>
                <input
                  id="history-discount-payment"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountamount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      discountamount: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label
                  htmlFor="history-balance-payment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Balance Payment
                </label>
                <input
                  id="history-balance-payment"
                  type="number"
                  value={selectedEvent ? balanceAmount : ""}
                  readOnly
                  className={`${fieldClassName} bg-gray-50 text-gray-600`}
                />
              </div>
              <div>
                <label
                  htmlFor="history-payment-status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Payment Status *
                </label>
                <select
                  id="history-payment-status"
                  required
                  value={form.paymentstatus}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      paymentstatus: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  saving ||
                  loadingEvents ||
                  events.length === 0 ||
                  !selectedUser
                }
                className={`px-6 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium shadow-md shadow-saffron-500/20 cursor-pointer ${
                  saving ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {saving
                  ? "Saving..."
                  : editingId === null
                    ? "Save Event Registration"
                    : "Update Event Registration"}
              </button>
            </div>
          </form>
        </motion.section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-saffron-100 bg-gradient-to-br from-white via-white to-saffron-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-saffron-100/50" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Registration Count
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                    {filteredHistories.length.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Matching registrations
                  </p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-700 ring-1 ring-saffron-200/70">
                  <TicketCheck className="h-6 w-6" />
                </span>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-white via-white to-green-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-green-100/50" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Registration Subtotal
                  </p>
                  <p className="mt-2 truncate text-2xl font-bold tracking-tight text-green-800 sm:text-3xl">
                    {formatCurrency(totalRegistrationAmount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Total after discounts
                  </p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700 ring-1 ring-green-200/70">
                  <IndianRupee className="h-6 w-6" />
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search event, user, or status..."
                  value={tableSearch}
                  onChange={(event) => {
                    setTableSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all text-sm"
                />
              </div>
              <input
                type="date"
                aria-label="Filter event registrations from date"
                value={dateRange.fromDate}
                onChange={(event) =>
                  setDateRange((current) => ({
                    ...current,
                    fromDate: event.target.value,
                  }))
                }
                className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
              />
              <input
                type="date"
                aria-label="Filter event registrations to date"
                value={dateRange.toDate}
                onChange={(event) =>
                  setDateRange((current) => ({
                    ...current,
                    toDate: event.target.value,
                  }))
                }
                className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
              />
              {isAdmin && (
                <select
                  aria-label="Filter event registrations by staff"
                  value={selectedStaffId}
                  onChange={(event) => {
                    setSelectedStaffId(event.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={loadingStaffs}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white disabled:opacity-60"
                >
                  <option value="">
                    {loadingStaffs ? "Loading staff..." : "All staff"}
                  </option>
                  {staffs.map((staff) => (
                    <option key={staff.userid} value={staff.userid}>
                      {staff.username}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={handleExport}
                disabled={loadingHistories || filteredHistories.length === 0}
                title="Download filtered event registrations as an Excel-compatible CSV"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>

            <div className="overflow-x-auto relative min-h-[300px]">
              {loadingHistories && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <table className="w-full text-left border-collapse min-w-[1440px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                    <th className="px-6 py-4 font-medium">S.No</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="w-[200px] min-w-[200px] px-6 py-4 font-medium">
                      Event Name
                    </th>
                    <th className="px-6 py-4 font-medium">Payment Status</th>
                    <th className="px-6 py-4 font-medium">Session Type</th>
                    <th className="px-6 py-4 font-medium">Registration Fee</th>
                    <th className="px-6 py-4 font-medium">Discount</th>
                    <th className="px-6 py-4 font-medium">Advance</th>
                    <th className="px-6 py-4 font-medium">Cash Received</th>
                    <th className="px-6 py-4 font-medium">UPI Amount</th>
                    <th className="px-6 py-4 font-medium">Balance</th>
                    <th className="px-6 py-4 font-medium">SubTotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentHistories.length === 0 && !loadingHistories ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No event registrations found for this month.
                      </td>
                    </tr>
                  ) : (
                    currentHistories.map((history, index) => (
                      <tr
                        key={history.id}
                        className="hover:bg-saffron-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/registration/${history.id}`)
                              }
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="View event registration details"
                              aria-label={`View event registration ${history.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleDownloadInvoice(history)
                              }
                              disabled={downloadingInvoiceId === history.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                              title="Download registration invoice PDF"
                              aria-label={`Download invoice for registration ${history.id}`}
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditForm(history)}
                                  className="p-2 text-saffron-600 hover:bg-saffron-50 rounded-lg cursor-pointer"
                                  title="Edit event registration"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(history.id)}
                                  disabled={deletingId === history.id}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer disabled:opacity-50"
                                  title="Delete event registration"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="line-clamp-2 block font-medium text-gray-800">
                            {history.registration?.fullname ||
                              `User #${history.registerid}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            REGISTER ID:{history.registerid}
                          </span>
                        </td>
                        <td className="w-[200px] min-w-[200px] px-6 py-4 text-sm font-medium text-gray-800">
                          <span
                            className="line-clamp-2"
                            title={history.evenetname || "—"}
                          >
                            {history.evenetname || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
                              history.paymentstatus?.toLowerCase() ===
                              "completed"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }`}
                          >
                            {history.paymentstatus?.toLowerCase() ===
                            "completed" ? (
                              <BadgeCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Clock3 className="w-3.5 h-3.5" />
                            )}
                            {history.paymentstatus || "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
                              history.sessiontype?.toLowerCase() === "attended"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : history.sessiontype?.toLowerCase() ===
                                    "postponded"
                                  ? "bg-pink-100 text-pink-700 border-pink-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }`}
                          >
                            {history.sessiontype?.toLowerCase() ===
                            "completed" ? (
                              <BadgeCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Clock3 className="w-3.5 h-3.5" />
                            )}
                            {history.sessiontype || "absent"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(history.registrationfee)}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(history.discountamount)}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(history.advanceamount)}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(history.cashamount)}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(history.upiamount)}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(getOutstandingBalance(history))}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(getRegistrationSubtotal(history))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredHistories.length > 0 && (
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 bg-gray-50/50">
                <p>
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredHistories.length)}{" "}
                  of {filteredHistories.length} entries
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
        </>
      )}
    </div>
  );
}
