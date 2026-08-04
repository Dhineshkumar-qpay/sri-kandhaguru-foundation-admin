import { useState, useEffect } from "react";
import { BASEURL } from "../services/api";
import {
  Search,
  Calendar,
  IndianRupee,
  FileText,
  Eye,
  X,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

interface DonorData {
  id: number;
  cause: string;
  fullname: string;
  mobile: string;
  email: string;
  address: string;
  country: string;
  pannumber: string | null;
  aadhaarnumber: string | null;
  passportnumber: string | null;
  amount: string;
  paymentid: string | null;
  screenshot: string | null;
  donortype: string;
  paymentstatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function Donations() {
  const [donations, setDonations] = useState<DonorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDonation, setSelectedDonation] = useState<DonorData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [donorType, setDonorType] = useState("");

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const response = await api.post("/donor/get", {
        startdate: startDate,
        enddate: endDate,
        donortype: donorType,
      });
      if (response.data?.success) {
        setDonations(response.data.data || []);
        setCurrentPage(1); // Reset page on new fetch
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

  const filteredDonations = donations.filter(
    (donor) =>
      donor.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.mobile.includes(searchTerm) ||
      donor.cause.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const currentDonations = filteredDonations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Donations</h1>
          <p className="text-gray-500 mt-1">
            Manage and view all foundation donations.
          </p>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select
              value={donorType}
              onChange={(e) => setDonorType(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
            >
              <option value="">All Types</option>
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
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
              onClick={fetchDonations}
              className="w-full sm:w-auto px-6 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium transition-colors shadow-sm text-sm cursor-pointer"
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
                      <button
                        onClick={() => {
                          setSelectedDonation(item);
                          setIsSidebarOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
                        <span className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={item.address}>
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
                          <span title="PAN"><span className="font-semibold">PAN:</span> {item.pannumber}</span>
                        )}
                        {item.aadhaarnumber && (
                          <span title="Aadhaar"><span className="font-semibold">AADHAAR:</span> {item.aadhaarnumber}</span>
                        )}
                        {item.passportnumber && (
                          <span title="Passport"><span className="font-semibold">PASSPORT:</span> {item.passportnumber}</span>
                        )}
                        {!item.pannumber && !item.aadhaarnumber && !item.passportnumber && (
                          <span className="text-gray-400 italic">Not Provided</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center font-bold text-gray-800">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {item.amount}
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium w-fit uppercase tracking-wider ${
                          item.paymentstatus === 'completed' || item.paymentstatus === 'success' 
                            ? 'bg-green-100 text-green-700'
                            : item.paymentstatus === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
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
                                }
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
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      pageNum === currentPage
                        ? "bg-saffron-500 text-white shadow-sm"
                        : "border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
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
                  className="p-2 text-gray-400 hover:bg-white hover:text-gray-800 rounded-full transition-colors shadow-sm border border-transparent hover:border-gray-200"
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
                    <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 w-full justify-center">
                      <Mail className="w-4 h-4 text-saffron-500" />{" "}
                      {selectedDonation.email}
                    </p>
                    <div className="flex gap-2 w-full justify-center">
                      <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 flex-1 justify-center">
                        <Phone className="w-4 h-4 text-saffron-500" />{" "}
                        {selectedDonation.mobile}
                      </p>
                    </div>
                    <p className="text-gray-600 text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-saffron-100 w-full justify-center">
                      <MapPin className="w-4 h-4 text-saffron-500" />{" "}
                      {selectedDonation.address}, {selectedDonation.country}
                    </p>
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
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold capitalize ${
                          selectedDonation.paymentstatus === 'completed' || selectedDonation.paymentstatus === 'success' 
                            ? 'bg-green-100 text-green-700'
                            : selectedDonation.paymentstatus === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
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
                        <span className="font-mono">{selectedDonation.pannumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Aadhaar:</span>
                        <span className="font-mono">{selectedDonation.aadhaarnumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Passport:</span>
                        <span className="font-mono">{selectedDonation.passportnumber || 'N/A'}</span>
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
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
