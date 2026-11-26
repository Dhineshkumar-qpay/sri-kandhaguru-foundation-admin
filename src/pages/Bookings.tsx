import React, { useState, useEffect } from "react";
import {
  Search,
  Mail,
  Phone,
  Calendar,
  Eye,
  X,
  MapPin,
  Users,
  Edit2,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

interface Booking {
  id: number;
  eventid: number;
  userid: number;
  fullname: string;
  phone: string;
  whatsapp: string;
  email: string;
  occupation: string;
  gender: string;
  age: number;
  city: string;
  state: string;
  country: string;
  ishealthissue: boolean;
  healthissues: { name: string; issue: string }[];
  participants: number;
  adultcount: number;
  childrencount: number;
  bookingdate: string | null;
  bookingtime: string | null;
  remarks: string;
  totalamount: string;
  deliverymode: string;
  paymentstatus: string;
  transactionid: string | null;
  bookingstatus: string;
  screenshot?: string | null;
  eventname: string;
  eventdate: string;
  eventtodate?: string;
  programtype?: string;
  leveltype?: string;
  isofferprice?: boolean;
  pricetype?: "platinum" | "gold" | "silver" | string | null;
  platinumprice?: number | string | null;
  goldprice?: number | string | null;
  silverprice?: number | string | null;
  lastofferdate?: string | null;
  address: string;
  registrationfee: number;
  createdAt: string;
  updatedAt?: string;
}

export default function Bookings() {
  const [onlineBookings, setOnlineBookings] = useState<Booking[]>([]);
  const [offlineBookings, setOfflineBookings] = useState<Booking[]>([]);
  const [loadingOnline, setLoadingOnline] = useState(false);
  const [loadingOffline, setLoadingOffline] = useState(false);

  const [onlineSearchTerm, setOnlineSearchTerm] = useState("");
  const [offlineSearchTerm, setOfflineSearchTerm] = useState("");
  const [currentPageOnline, setCurrentPageOnline] = useState(1);
  const [currentPageOffline, setCurrentPageOffline] = useState(1);
  const pageSize = 10;

  // Sidebar state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [sidebarStatus, setSidebarStatus] = useState<string>("");
  const [pendingBookingStatus, setPendingBookingStatus] = useState<
    Record<number, string>
  >({});

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    whatsapp: "",
    occupation: "",
    gender: "Male",
    age: 0,
    city: "",
    state: "",
    country: "",
    adultcount: 1,
    childrencount: 0,
    participants: 1,
    totalamount: "0",
    bookingdate: "",
    bookingtime: "",
    remarks: "",
    paymentstatus: "pending",
    bookingstatus: "pending",
    transactionid: "",
    pricetype: "platinum",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleOpenEditModal = (booking: Booking) => {
    setIsSidebarOpen(false);
    setEditingBooking(booking);
    setEditForm({
      fullname: booking.fullname || "",
      email: booking.email || "",
      phone: booking.phone || "",
      whatsapp: booking.whatsapp || "",
      occupation: booking.occupation || "",
      gender: booking.gender || "Male",
      age: booking.age || 0,
      city: booking.city || "",
      state: booking.state || "",
      country: booking.country || "India",
      adultcount: booking.adultcount || 1,
      childrencount: booking.childrencount || 0,
      participants: booking.participants || 1,
      totalamount: booking.totalamount || "0",
      bookingdate: booking.bookingdate || "",
      bookingtime: booking.bookingtime || "",
      remarks: booking.remarks || "",
      paymentstatus: booking.paymentstatus || "pending",
      bookingstatus: booking.bookingstatus || "pending",
      transactionid: booking.transactionid || "",
      pricetype: (booking.pricetype as string) || "platinum",
    });
    setIsEditModalOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    setSavingEdit(true);
    try {
      const response = await api.post("/booking/edit", {
        id: editingBooking.id,
        ...editForm,
      });

      if (response.data?.success) {
        const updated = response.data.data?.booking || {
          ...editingBooking,
          ...editForm,
        };

        setOnlineBookings((prev) =>
          prev.map((b) => (b.id === editingBooking.id ? { ...b, ...updated } : b)),
        );
        setOfflineBookings((prev) =>
          prev.map((b) => (b.id === editingBooking.id ? { ...b, ...updated } : b)),
        );

        if (selectedBooking?.id === editingBooking.id) {
          setSelectedBooking((prev) => (prev ? { ...prev, ...updated } : null));
        }

        setIsEditModalOpen(false);
        setEditingBooking(null);
        alert("Booking updated successfully!");
      } else {
        alert(response.data?.data || "Failed to update booking.");
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      alert("Failed to update booking. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await api.post("/booking/delete", { id });
      if (response.data?.success) {
        setOnlineBookings((prev) => prev.filter((b) => b.id !== id));
        setOfflineBookings((prev) => prev.filter((b) => b.id !== id));

        if (selectedBooking?.id === id) {
          setIsSidebarOpen(false);
          setSelectedBooking(null);
        }

        alert("Booking deleted successfully!");
      } else {
        alert(response.data?.data || "Failed to delete booking.");
      }
    } catch (error) {
      console.error("Failed to delete booking:", error);
      alert("Failed to delete booking. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (selectedBooking) {
      setSidebarStatus(selectedBooking.bookingstatus);
    }
  }, [selectedBooking]);

  const handleSidebarStatusUpdate = async () => {
    if (!selectedBooking) return;

    setUpdatingStatusId(selectedBooking.id);
    try {
      const response = await api.post("/booking/update-bookingstatus", {
        id: selectedBooking.id,
        bookingstatus: sidebarStatus,
      });

      if (response.data?.success) {
        setOnlineBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id
              ? { ...b, bookingstatus: sidebarStatus }
              : b,
          ),
        );
        setOfflineBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id
              ? { ...b, bookingstatus: sidebarStatus }
              : b,
          ),
        );

        setSelectedBooking({
          ...selectedBooking,
          bookingstatus: sidebarStatus,
        });
        alert("Booking status updated successfully!");
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update booking status", error);
      alert("Failed to update booking status. Please try again.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingStatusId(id);
    try {
      const response = await api.post("/booking/update-bookingstatus", {
        id,
        bookingstatus: newStatus,
      });

      if (response.data?.success) {
        setOnlineBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, bookingstatus: newStatus } : b,
          ),
        );
        setOfflineBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, bookingstatus: newStatus } : b,
          ),
        );

        setPendingBookingStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });

        if (selectedBooking?.id === id) {
          setSelectedBooking({ ...selectedBooking, bookingstatus: newStatus });
        }
      }
    } catch (error) {
      console.error("Failed to update booking status", error);
      alert("Failed to update booking status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const [events, setEvents] = useState<
    { id: number; title: string; city: string; deliverymode: string }[]
  >([]);

  const [onlineEventId, setOnlineEventId] = useState<string>("");
  const [onlineStartDate, setOnlineStartDate] = useState<string>("");
  const [onlineEndDate, setOnlineEndDate] = useState<string>("");

  const [offlineEventId, setOfflineEventId] = useState<string>("");
  const [offlineStartDate, setOfflineStartDate] = useState<string>("");
  const [offlineEndDate, setOfflineEndDate] = useState<string>("");

  useEffect(() => {
    fetchEventsList();
  }, []);

  useEffect(() => {
    fetchOnlineBookings();
    fetchOfflineBookings();
  }, []);

  const fetchEventsList = async () => {
    try {
      const response = await api.post("/event/get", { deliverymode: "" });
      if (response.data?.success) {
        setEvents(response.data.data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch events for dropdown", error);
    }
  };

  const fetchOnlineBookings = async () => {
    setLoadingOnline(true);
    try {
      const response = await api.post("/booking/get", {
        eventid: onlineEventId ? Number(onlineEventId) : null,
        startdate: onlineStartDate || null,
        enddate: onlineEndDate || null,
        deliverymode: "online",
      });
      if (response.data?.success) {
        setOnlineBookings(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch online bookings", error);
    } finally {
      setLoadingOnline(false);
    }
  };

  const fetchOfflineBookings = async () => {
    setLoadingOffline(true);
    try {
      const response = await api.post("/booking/get", {
        eventid: offlineEventId ? Number(offlineEventId) : null,
        startdate: offlineStartDate || null,
        enddate: offlineEndDate || null,
        deliverymode: "offline",
      });
      if (response.data?.success) {
        setOfflineBookings(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch offline bookings", error);
    } finally {
      setLoadingOffline(false);
    }
  };

  const filteredOnlineBookings = onlineBookings.filter(
    (b) =>
      b.fullname.toLowerCase().includes(onlineSearchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(onlineSearchTerm.toLowerCase()) ||
      b.phone.includes(onlineSearchTerm),
  );

  const filteredOfflineBookings = offlineBookings.filter(
    (b) =>
      b.fullname.toLowerCase().includes(offlineSearchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(offlineSearchTerm.toLowerCase()) ||
      b.phone.includes(offlineSearchTerm),
  );

  const totalOnlineItems = filteredOnlineBookings.length;
  const totalOnlinePages = Math.max(1, Math.ceil(totalOnlineItems / pageSize));

  const totalOfflineItems = filteredOfflineBookings.length;
  const totalOfflinePages = Math.max(
    1,
    Math.ceil(totalOfflineItems / pageSize),
  );

  useEffect(() => {
    if (currentPageOnline > totalOnlinePages && totalOnlinePages > 0) {
      setCurrentPageOnline(totalOnlinePages);
    }
  }, [totalOnlinePages, currentPageOnline]);

  useEffect(() => {
    if (currentPageOffline > totalOfflinePages && totalOfflinePages > 0) {
      setCurrentPageOffline(totalOfflinePages);
    }
  }, [totalOfflinePages, currentPageOffline]);

  const paginatedOnlineBookings = filteredOnlineBookings.slice(
    (currentPageOnline - 1) * pageSize,
    currentPageOnline * pageSize,
  );

  const paginatedOfflineBookings = filteredOfflineBookings.slice(
    (currentPageOffline - 1) * pageSize,
    currentPageOffline * pageSize,
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
      case "confirmed":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const renderFilters = (
    type: string,
    searchTerm: string,
    setSearchTerm: (v: string) => void,
    eventId: string,
    setEventId: (v: string) => void,
    startDate: string,
    setStartDate: (v: string) => void,
    endDate: string,
    setEndDate: (v: string) => void,
    onFetch: () => void,
    setCurrentPage: (v: number) => void,
  ) => (
    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row flex-wrap justify-between items-center gap-4 bg-gray-50/50 mt-4 first:mt-0">
      <div className="relative w-full md:max-w-xs">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${type} by name, email, or phone...`}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all text-sm"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
        >
          <option value="">All Events</option>
          {events
            .filter((ev) =>
              type === "Online"
                ? ev.deliverymode === "online"
                : ev.deliverymode !== "online",
            )
            .map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} - {ev.city == "" ? "Online" : ev.city}
              </option>
            ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
          title="Start Date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
          title="End Date"
        />
        <button
          onClick={onFetch}
          className="w-full sm:w-auto px-6 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium transition-colors shadow-sm text-sm cursor-pointer"
        >
          Fetch
        </button>
      </div>
    </div>
  );

  const renderTable = (
    title: string,
    paginatedData: Booking[],
    totalItems: number,
    currentPage: number,
    totalPages: number,
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  ) => (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 px-4">
        {title} Bookings
      </h2>
      <div className="overflow-x-auto relative min-h-[300px]">
        {((title === "Online" && loadingOnline) ||
          (title === "Offline" && loadingOffline)) && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
              <th className="px-6 py-4 font-medium">S.No</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
              <th className="px-6 py-4 font-medium">Booking Status</th>
              <th className="px-6 py-4 font-medium">Participant</th>
              <th className="px-6 py-4 font-medium">Eventname</th>
              <th className="px-6 py-4 font-medium">Count</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">
                {title === "Online" ? "Booking Date" : "Date"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 &&
              !(
                (title === "Online" && loadingOnline) ||
                (title === "Offline" && loadingOffline)
              ) ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No bookings found.
                </td>
              </tr>
            ) : (
              paginatedData.map((booking, index) => (
                <tr
                  key={booking.id}
                  className="hover:bg-saffron-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 ring-orange-200">
                      {(currentPage - 1) * pageSize + index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsSidebarOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(booking)}
                        className="p-2 text-gray-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg cursor-pointer transition-colors"
                        title="Edit Booking"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={deletingId === booking.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                        title="Delete Booking"
                      >
                        {deletingId === booking.id ? (
                          <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <select
                        className={`text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-saffron-500 capitalize bg-white min-w-[100px] cursor-pointer ${pendingBookingStatus[booking.id] ||
                          booking.bookingstatus === "success" ||
                          pendingBookingStatus[booking.id] ||
                          booking.bookingstatus === "completed" ||
                          pendingBookingStatus[booking.id] ||
                          booking.bookingstatus === "confirmed"
                          ? "text-emerald-600"
                          : pendingBookingStatus[booking.id] ||
                            booking.bookingstatus === "pending"
                            ? "text-amber-600"
                            : "text-red-600"
                          }`}
                        value={
                          pendingBookingStatus[booking.id] ||
                          booking.bookingstatus
                        }
                        onChange={(e) =>
                          setPendingBookingStatus({
                            ...pendingBookingStatus,
                            [booking.id]: e.target.value,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending" className="text-amber-600">
                          Pending
                        </option>
                        <option value="confirmed" className="text-emerald-600">
                          Confirmed
                        </option>
                        <option value="cancelled" className="text-red-600">
                          Cancelled
                        </option>
                      </select>
                      {pendingBookingStatus[booking.id] &&
                        pendingBookingStatus[booking.id] !==
                        booking.bookingstatus && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(
                                booking.id,
                                pendingBookingStatus[booking.id],
                              );
                            }}
                            disabled={updatingStatusId === booking.id}
                            className="text-[10px] uppercase font-bold tracking-wider bg-saffron-500 text-white px-2 py-1 rounded-md hover:bg-saffron-600 transition-colors shadow-sm w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            {updatingStatusId === booking.id ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Wait
                              </>
                            ) : (
                              "Confirm"
                            )}
                          </button>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800 text-md">
                      {booking.fullname}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[150px]">
                        {booking.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{booking.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-[200px]">
                    <p className="w-[180px] text-sm font-semibold text-gray-800 line-clamp-3 break-words">
                      {booking.eventname}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {booking.deliverymode && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${booking.deliverymode === "online" ? "bg-pink-100 text-pink-700 border border-pink-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}
                        >
                          {booking.deliverymode}
                        </span>
                      )}
                      {booking.leveltype && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${booking.leveltype === "level2" ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`}
                        >
                          {booking.leveltype === "level2" ? "Level 2" : "Level 1"}
                        </span>
                      )}
                      {booking.isofferprice && booking.pricetype && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            booking.pricetype?.toLowerCase() === "platinum"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : booking.pricetype?.toLowerCase() === "gold"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {booking.pricetype}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">
                        {booking.participants}
                      </span>{" "}
                      Total
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ({booking.adultcount} Adults, {booking.childrencount}{" "}
                      Children)
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    ₹{booking.totalamount}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-saffron-500 shrink-0" />
                      <span className="whitespace-nowrap">
                        {(
                          title === "Online"
                            ? booking.bookingdate
                            : booking.createdAt
                        )
                          ? new Date(
                            (title === "Online"
                              ? booking.bookingdate
                              : booking.createdAt) as string,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "-"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 bg-gray-50/50">
          <p>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
            entries
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
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${pageNum === currentPage ? "bg-saffron-500 text-white shadow-sm" : "border border-gray-200 hover:bg-gray-100"}`}
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
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditModalOpen ? "Edit Booking" : "Event Bookings"}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditModalOpen
              ? `Update details for booking #${editingBooking?.id || ""}`
              : "Manage all event registrations and payments."}
          </p>
        </div>
        {isEditModalOpen && (
          <button
            type="button"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingBooking(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>
        )}
      </div>

      {isEditModalOpen && editingBooking ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6 md:p-8"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Edit Booking #{editingBooking.id}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {editingBooking.eventname} ({editingBooking.deliverymode})
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingBooking(null);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Participant Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullname}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fullname: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editForm.whatsapp}
                    onChange={(e) =>
                      setEditForm({ ...editForm, whatsapp: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Gender
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editForm.age}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        age: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={editForm.occupation}
                    onChange={(e) =>
                      setEditForm({ ...editForm, occupation: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Address / Location
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm({ ...editForm, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) =>
                      setEditForm({ ...editForm, state: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) =>
                      setEditForm({ ...editForm, country: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Participant Counts & Fees */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Participants & Amount
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Adults Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.adultcount}
                    onChange={(e) => {
                      const adults = parseInt(e.target.value) || 0;
                      setEditForm({
                        ...editForm,
                        adultcount: adults,
                        participants: adults + editForm.childrencount,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Children Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.childrencount}
                    onChange={(e) => {
                      const children = parseInt(e.target.value) || 0;
                      setEditForm({
                        ...editForm,
                        childrencount: children,
                        participants: editForm.adultcount + children,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Total Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.participants}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        participants: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="text"
                    value={editForm.totalamount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, totalamount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Status & Payment */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Status & Dates
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Booking Status
                  </label>
                  <select
                    value={editForm.bookingstatus}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bookingstatus: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white capitalize"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editForm.paymentstatus}
                    onChange={(e) =>
                      setEditForm({ ...editForm, paymentstatus: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white capitalize"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                {editingBooking.isofferprice && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Package / Price Type
                    </label>
                    <select
                      value={editForm.pricetype}
                      onChange={(e) =>
                        setEditForm({ ...editForm, pricetype: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white capitalize"
                    >
                      <option value="platinum">Platinum</option>
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                    </select>
                  </div>
                )}
                {editingBooking.deliverymode === "online" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Booking Date (Online)
                      </label>
                      <input
                        type="date"
                        value={editForm.bookingdate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bookingdate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Booking Time
                      </label>
                      <input
                        type="time"
                        value={editForm.bookingtime}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            bookingtime: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
                      />
                    </div>
                  </>
                )}
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Remarks / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.remarks}
                    onChange={(e) =>
                      setEditForm({ ...editForm, remarks: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm"
                    placeholder="Additional remarks..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBooking(null);
                }}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {savingEdit ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
            {renderFilters(
              "Offline",
              offlineSearchTerm,
              setOfflineSearchTerm,
              offlineEventId,
              setOfflineEventId,
              offlineStartDate,
              setOfflineStartDate,
              offlineEndDate,
              setOfflineEndDate,
              fetchOfflineBookings,
              setCurrentPageOffline,
            )}
            {renderTable(
              "Offline",
              paginatedOfflineBookings,
              totalOfflineItems,
              currentPageOffline,
              totalOfflinePages,
              setCurrentPageOffline,
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden mt-8">
            {renderFilters(
              "Online",
              onlineSearchTerm,
              setOnlineSearchTerm,
              onlineEventId,
              setOnlineEventId,
              onlineStartDate,
              setOnlineStartDate,
              onlineEndDate,
              setOnlineEndDate,
              fetchOnlineBookings,
              setCurrentPageOnline,
            )}
            {renderTable(
              "Online",
              paginatedOnlineBookings,
              totalOnlineItems,
              currentPageOnline,
              totalOnlinePages,
              setCurrentPageOnline,
            )}
          </div>
        </>
      )}

      {/* Right Sidebar for Booking Details */}
      <AnimatePresence>
        {isSidebarOpen && selectedBooking && (
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
                  Booking #{selectedBooking.id}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(selectedBooking)}
                    className="p-2 text-gray-400 hover:text-saffron-600 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200"
                    title="Edit Booking"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBooking(selectedBooking.id)}
                    disabled={deletingId === selectedBooking.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 disabled:opacity-50"
                    title="Delete Booking"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-gray-400 hover:bg-white hover:text-gray-800 rounded-full transition-colors shadow-sm border border-transparent hover:border-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="bg-saffron-50 rounded-2xl p-6 border border-saffron-100/50 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-saffron-600 font-bold text-2xl mx-auto shadow-sm mb-3">
                    {selectedBooking.fullname.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedBooking.fullname}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {selectedBooking.gender}, {selectedBooking.age} yrs
                  </p>

                  <div className="flex flex-col gap-2 mt-4 items-center">
                    <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 w-full justify-center">
                      <Mail className="w-4 h-4 text-saffron-500" />{" "}
                      {selectedBooking.email}
                    </p>
                    <div className="flex gap-2 w-full justify-center">
                      <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 flex-1 justify-center">
                        <Phone className="w-4 h-4 text-saffron-500" />{" "}
                        {selectedBooking.phone}
                      </p>
                    </div>
                    <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 w-full justify-center">
                      <MapPin className="w-4 h-4 text-saffron-500 shrink-0" />{" "}
                      {[selectedBooking.city, selectedBooking.state, selectedBooking.country]
                        .filter(Boolean)
                        .join(", ") || "Location not specified"}
                    </p>
                    <p className="text-gray-600 text-sm text-center mt-2">
                      Occupation: {selectedBooking.occupation}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                        Event ID
                      </p>
                      <p className="text-gray-800 font-bold text-lg">
                        #{selectedBooking.eventid}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                        {selectedBooking.deliverymode === "online"
                          ? "Booking Date"
                          : "Date"}
                      </p>
                      <p className="text-gray-800 font-medium">
                        {(
                          selectedBooking.deliverymode === "online"
                            ? selectedBooking.bookingdate
                            : selectedBooking.createdAt
                        )
                          ? new Date(
                            (selectedBooking.deliverymode === "online"
                              ? selectedBooking.bookingdate
                              : selectedBooking.createdAt) as string,
                          ).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                      Participants ({selectedBooking.participants})
                    </p>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100 text-center">
                        <p className="text-2xl font-bold text-gray-800">
                          {selectedBooking.adultcount}
                        </p>
                        <p className="text-xs text-gray-500">Adults</p>
                      </div>
                      <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100 text-center">
                        <p className="text-2xl font-bold text-gray-800">
                          {selectedBooking.childrencount}
                        </p>
                        <p className="text-xs text-gray-500">Children</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                      Payment Details
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-bold text-gray-800 text-lg">
                          ₹{selectedBooking.totalamount}
                        </span>
                      </div>
                      {selectedBooking.leveltype === "level2" && (
                        <div className="flex justify-between items-center py-1.5 border-t border-gray-200/60">
                          <span className="text-gray-600 text-sm">Selected Package</span>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                              selectedBooking.pricetype?.toLowerCase() === "platinum"
                                ? "bg-purple-100 text-purple-800 border border-purple-300"
                                : selectedBooking.pricetype?.toLowerCase() === "gold"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : selectedBooking.pricetype?.toLowerCase() === "silver"
                                ? "bg-slate-100 text-slate-800 border border-slate-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                            }`}
                          >
                            {selectedBooking.pricetype || "Standard"}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Status</span>
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-xs font-semibold capitalize ${getStatusColor(selectedBooking.paymentstatus)}`}
                        >
                          {selectedBooking.paymentstatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Booking Status</span>
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-xs font-semibold capitalize ${getStatusColor(selectedBooking.bookingstatus)}`}
                        >
                          {selectedBooking.bookingstatus}
                        </span>
                      </div>
                      {selectedBooking.screenshot && (
                        <div className="pt-3 border-t border-gray-200 mt-2">
                          <p className="text-gray-600 text-sm mb-2 font-medium">
                            Payment Screenshot
                          </p>
                          <a
                            href={`${api.defaults.baseURL?.replace("/api", "")}${selectedBooking.screenshot}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg overflow-hidden border border-gray-200 hover:border-saffron-300 transition-colors shadow-sm"
                          >
                            <img
                              src={`${api.defaults.baseURL?.replace("/api", "")}${selectedBooking.screenshot}`}
                              alt="Payment Proof"
                              className="w-full h-auto max-h-48 object-cover"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                      Event Details
                    </p>
                    <div className="space-y-3 text-sm text-gray-700">
                      {selectedBooking.eventname && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">Event Name</p>
                          <p className="font-bold text-gray-900 text-base">
                            {selectedBooking.eventname}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            selectedBooking.leveltype === "level2"
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {selectedBooking.leveltype === "level2" ? "Level 2 Event" : "Level 1 Event"}
                        </span>

                        {selectedBooking.programtype && (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                            {selectedBooking.programtype}
                          </span>
                        )}

                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            selectedBooking.deliverymode === "online"
                              ? "bg-pink-100 text-pink-700 border border-pink-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {selectedBooking.deliverymode}
                        </span>
                      </div>

                      {/* Booking Pricing & Tier Details */}
                      {selectedBooking.isofferprice ? (
                        <div className="pt-2 border-t border-gray-200 space-y-2.5">
                          <p className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-600">Event From:</span>
                            <span className="font-semibold text-gray-800">{selectedBooking.eventdate || "-"}</span>
                          </p>
                          {selectedBooking.eventtodate && (
                            <p className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-600">Event To:</span>
                              <span className="font-semibold text-gray-800">{selectedBooking.eventtodate}</span>
                            </p>
                          )}

                          {/* Selected Package Tier Box */}
                          <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2.5 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Booked Package</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  selectedBooking.pricetype?.toLowerCase() === "platinum"
                                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                                    : selectedBooking.pricetype?.toLowerCase() === "gold"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : selectedBooking.pricetype?.toLowerCase() === "silver"
                                    ? "bg-slate-100 text-slate-800 border border-slate-300"
                                    : "bg-gray-100 text-gray-700 border border-gray-300"
                                }`}
                              >
                                {selectedBooking.pricetype || "Standard"}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Tier Unit Price:</span>
                              <span className="font-bold text-gray-900">
                                {selectedBooking.pricetype?.toLowerCase() === "platinum" && selectedBooking.platinumprice
                                  ? `₹${selectedBooking.platinumprice} / person`
                                  : selectedBooking.pricetype?.toLowerCase() === "gold" && selectedBooking.goldprice
                                  ? `₹${selectedBooking.goldprice} / person`
                                  : selectedBooking.pricetype?.toLowerCase() === "silver" && selectedBooking.silverprice
                                  ? `₹${selectedBooking.silverprice} / person`
                                  : selectedBooking.registrationfee
                                  ? `₹${selectedBooking.registrationfee} / person`
                                  : "-"}
                              </span>
                            </div>

                            {(selectedBooking.platinumprice || selectedBooking.goldprice || selectedBooking.silverprice) && (
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                  Tier Rates
                                </p>
                                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                                  {selectedBooking.platinumprice && (
                                    <div className={`p-1.5 rounded-lg border ${selectedBooking.pricetype?.toLowerCase() === "platinum" ? "bg-purple-50 border-purple-300 font-bold" : "bg-gray-50 border-gray-200"}`}>
                                      <p className="text-[10px] text-purple-700 font-semibold uppercase">Platinum</p>
                                      <p className="text-gray-800">₹{selectedBooking.platinumprice}</p>
                                    </div>
                                  )}
                                  {selectedBooking.goldprice && (
                                    <div className={`p-1.5 rounded-lg border ${selectedBooking.pricetype?.toLowerCase() === "gold" ? "bg-amber-50 border-amber-300 font-bold" : "bg-gray-50 border-gray-200"}`}>
                                      <p className="text-[10px] text-amber-700 font-semibold uppercase">Gold</p>
                                      <p className="text-gray-800">₹{selectedBooking.goldprice}</p>
                                    </div>
                                  )}
                                  {selectedBooking.silverprice && (
                                    <div className={`p-1.5 rounded-lg border ${selectedBooking.pricetype?.toLowerCase() === "silver" ? "bg-slate-50 border-slate-300 font-bold" : "bg-gray-50 border-gray-200"}`}>
                                      <p className="text-[10px] text-slate-700 font-semibold uppercase">Silver</p>
                                      <p className="text-gray-800">₹{selectedBooking.silverprice}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedBooking.lastofferdate && (
                              <p className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded border border-red-200 text-center font-medium">
                                Offer Ends: {new Date(selectedBooking.lastofferdate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Standard Registration Specific Details (When isofferprice is false) */
                        <div className="pt-2 border-t border-gray-200 space-y-2">
                          <p className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-600">Event Date:</span>
                            <span className="font-semibold text-gray-800">{selectedBooking.eventdate || "-"}</span>
                          </p>
                          {selectedBooking.eventtodate && (
                            <p className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-600">Event To:</span>
                              <span className="font-semibold text-gray-800">{selectedBooking.eventtodate}</span>
                            </p>
                          )}
                          <p className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-600">Registration Fee (per person):</span>
                            <span className="font-bold text-gray-900">₹{selectedBooking.registrationfee || 0}</span>
                          </p>
                        </div>
                      )}

                      {selectedBooking.deliverymode === "online" && selectedBooking.bookingdate && (
                        <p className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm">
                          <span className="font-medium text-gray-600">Booking Date (Online):</span>
                          <span className="font-semibold text-gray-800">
                            {selectedBooking.bookingdate} {selectedBooking.bookingtime ? `@ ${selectedBooking.bookingtime}` : ""}
                          </span>
                        </p>
                      )}

                      <div className="pt-2 border-t border-gray-200 text-sm">
                        <span className="font-medium text-gray-600 block mb-0.5">Venue:</span>
                        <span className="text-gray-800 font-medium">
                          {selectedBooking.address || "Online / Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.ishealthissue &&
                    selectedBooking.healthissues?.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="text-sm font-semibold text-red-600 mb-2 uppercase tracking-wider">
                          Health Issues
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-sm text-red-800">
                          {selectedBooking.healthissues.map((hi, i) => (
                            <li key={i}>
                              <span className="font-medium">{hi.name}:</span>{" "}
                              {hi.issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {selectedBooking.remarks && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                        Remarks
                      </p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                        {selectedBooking.remarks}
                      </p>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mt-6">
                    <p className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wider border-b border-gray-100 pb-2">
                      Update Booking Status
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Select Status
                        </label>
                        <select
                          value={sidebarStatus}
                          onChange={(e) => setSidebarStatus(e.target.value)}
                          disabled={updatingStatusId === selectedBooking.id}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-gray-50 capitalize"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <button
                        onClick={handleSidebarStatusUpdate}
                        disabled={updatingStatusId === selectedBooking.id}
                        className="w-full py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingStatusId === selectedBooking.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Updating...
                          </>
                        ) : (
                          "Update Status"
                        )}
                      </button>
                    </div>
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
