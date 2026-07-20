import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, Eye, X, MapPin, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

interface Booking {
  id: number;
  eventid: number;
  fullname: string;
  phone: string;
  whatsapp: string;
  email: string;
  gender: string;
  age: number;
  city: string;
  state: string;
  participants: number;
  adultcount: number;
  childrencount: number;
  remarks: string;
  amount: string;
  paymentstatus: string;
  paymentid: string | null;
  bookingstatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sidebar state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.post("/booking/get");
      if (response.data?.success) {
        setBookings(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => 
    b.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone.includes(searchTerm)
  );

  const totalItems = filteredBookings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedBookings = filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Event Bookings</h1>
          <p className="text-gray-500 mt-1">Manage all event registrations and payments.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all text-sm" 
            />
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">S.No</th>
                <th className="px-6 py-4 font-medium">Participant</th>
                <th className="px-6 py-4 font-medium">Count</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Payment Status</th>
                <th className="px-6 py-4 font-medium">Booking Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBookings.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking, index) => (
                  <tr key={booking.id} className="hover:bg-saffron-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 ring-orange-200">
                        {(currentPage - 1) * pageSize + index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 text-md">{booking.fullname}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[150px]">{booking.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{booking.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{booking.participants}</span> Total
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ({booking.adultcount} Adults, {booking.childrencount} Children)
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ₹{booking.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(booking.paymentstatus)}`}>
                        {booking.paymentstatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(booking.bookingstatus)}`}>
                        {booking.bookingstatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-saffron-500 shrink-0" />
                        <span className="whitespace-nowrap">
                          {new Date(booking.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setSelectedBooking(booking); setIsSidebarOpen(true); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalItems > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 bg-gray-50/50">
            <p>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
            </p>
            <div className="flex gap-1 overflow-x-auto">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    pageNum === currentPage
                      ? "bg-saffron-500 text-white shadow-sm"
                      : "border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
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
                <h2 className="text-xl font-bold text-gray-800">Booking #{selectedBooking.id}</h2>
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
                  <h3 className="text-xl font-bold text-gray-800">{selectedBooking.fullname}</h3>
                  <p className="text-gray-500 text-sm mt-1">{selectedBooking.gender}, {selectedBooking.age} yrs</p>
                  
                  <div className="flex flex-col gap-2 mt-4 items-center">
                    <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 w-full justify-center">
                      <Mail className="w-4 h-4 text-saffron-500" /> {selectedBooking.email}
                    </p>
                    <div className="flex gap-2 w-full justify-center">
                      <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 flex-1 justify-center">
                        <Phone className="w-4 h-4 text-saffron-500" /> {selectedBooking.phone}
                      </p>
                    </div>
                    <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 w-full justify-center">
                      <MapPin className="w-4 h-4 text-saffron-500" /> {selectedBooking.city}, {selectedBooking.state}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Event ID</p>
                      <p className="text-gray-800 font-bold text-lg">#{selectedBooking.eventid}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Date</p>
                      <p className="text-gray-800 font-medium">
                        {new Date(selectedBooking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Participants ({selectedBooking.participants})</p>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100 text-center">
                        <p className="text-2xl font-bold text-gray-800">{selectedBooking.adultcount}</p>
                        <p className="text-xs text-gray-500">Adults</p>
                      </div>
                      <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100 text-center">
                        <p className="text-2xl font-bold text-gray-800">{selectedBooking.childrencount}</p>
                        <p className="text-xs text-gray-500">Children</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Payment Details</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-bold text-gray-800 text-lg">₹{selectedBooking.amount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Status</span>
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold capitalize ${getStatusColor(selectedBooking.paymentstatus)}`}>
                          {selectedBooking.paymentstatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Booking Status</span>
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold capitalize ${getStatusColor(selectedBooking.bookingstatus)}`}>
                          {selectedBooking.bookingstatus}
                        </span>
                      </div>
                      {selectedBooking.paymentid && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                          <span className="text-gray-600 text-sm">Payment ID</span>
                          <span className="font-mono text-xs bg-white px-2 py-1 border border-gray-200 rounded">{selectedBooking.paymentid}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedBooking.remarks && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Remarks</p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                        {selectedBooking.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
