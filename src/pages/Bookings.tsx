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
              <th className="px-6 py-4 font-medium text-center">Screenshot</th>
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
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <select
                        className={`text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-saffron-500 capitalize bg-white min-w-[100px] cursor-pointer ${
                          pendingBookingStatus[booking.id] ||
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
                    {booking.deliverymode && (
                      <p className="mt-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${booking.deliverymode === "online" ? "bg-pink-100 text-pink-700 border border-pink-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}
                        >
                          {booking.deliverymode}
                        </span>
                      </p>
                    )}
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
                  <td className="px-6 py-4 text-center">
                    {booking.screenshot ? (
                      <a
                        href={`${api.defaults.baseURL?.replace("/api", "")}${booking.screenshot}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center p-1.5 text-saffron-500 hover:text-saffron-700 bg-saffron-50 hover:bg-saffron-100 rounded-md transition-colors"
                        title="View Screenshot"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
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
          <h1 className="text-3xl font-bold text-gray-800">Event Bookings</h1>
          <p className="text-gray-500 mt-1">
            Manage all event registrations and payments.
          </p>
        </div>
      </div>

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
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:bg-white hover:text-gray-800 rounded-full transition-colors shadow-sm border border-transparent hover:border-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
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
                      <MapPin className="w-4 h-4 text-saffron-500" />{" "}
                      {selectedBooking.city}, {selectedBooking.state},{" "}
                      {selectedBooking.country}
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
                      {selectedBooking.transactionid && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                          <span className="text-gray-600 text-sm">
                            Transaction ID
                          </span>
                          <span className="font-mono text-xs bg-white px-2 py-1 border border-gray-200 rounded">
                            {selectedBooking.transactionid}
                          </span>
                        </div>
                      )}
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
                    <div className="space-y-2 text-sm text-gray-700">
                      {selectedBooking.programtype && (
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Program Type:</span>{" "}
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                            {selectedBooking.programtype}
                          </span>
                        </p>
                      )}

                      {selectedBooking.leveltype === "level2" ? (
                        <>
                          <p>
                            <span className="font-medium">
                              Event From Date:
                            </span>{" "}
                            {selectedBooking.eventdate}
                          </p>
                          <p>
                            <span className="font-medium">Event To Date:</span>{" "}
                            {selectedBooking.eventtodate}
                          </p>
                        </>
                      ) : (
                        <p>
                          <span className="font-medium">Event Date:</span>{" "}
                          {selectedBooking.eventdate}
                        </p>
                      )}

                      <p className="flex items-center gap-2">
                        <span className="font-medium">Delivery Mode:</span>{" "}
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            selectedBooking.deliverymode === "online"
                              ? "bg-pink-100 text-pink-700 border border-pink-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {selectedBooking.deliverymode}
                        </span>
                      </p>

                      {selectedBooking.deliverymode === "online" &&
                        selectedBooking.bookingdate && (
                          <p>
                            <span className="font-medium">
                              Booking Date (Online):
                            </span>{" "}
                            {selectedBooking.bookingdate}
                          </p>
                        )}

                      <p>
                        <span className="font-medium">Venue:</span>{" "}
                        {selectedBooking.address}
                      </p>
                      <p>
                        <span className="font-medium">Fee (per person):</span> ₹
                        {selectedBooking.registrationfee}
                      </p>
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
