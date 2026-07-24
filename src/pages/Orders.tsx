import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  X,
  MapPin,
  ShoppingBag,
  IndianRupee,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface OrderItem {
  productname: string;
  productimage: string;
  price: number;
  sellingprice: number | null;
  quantity?: number;
  totalprice?: number;
}

interface Order {
  id: number;
  userid: number;
  addressid: number;
  totalamount: number;
  orderstatus: string;
  items: OrderItem[];
}

interface OrderDetail {
  order: {
    id: number;
    userid: number;
    addressid: number;
    screenshot: string | null;
    totalamount: number;
    paymentstatus: string;
    orderstatus: string;
    createdAt: string;
    updatedAt: string;
  };
  address: {
    id: number;
    contactname: string;
    contactnumber: string;
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: number;
    country: string;
    place: string;
  };
  items: OrderItem[];
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.post("/admin/order/get", {
        startdate: startDate || null,
        enddate: endDate || null,
        orderstatus: orderStatus || null,
        paymentstatus: paymentStatus || null,
      });
      if (response.data?.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "completed":
      case "delivered":
      case "success":
        return "bg-green-100 text-green-700 border-green-200";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toString().includes(searchTerm) ||
      order.orderstatus.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and view product orders.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row flex-wrap justify-between items-center gap-4 bg-gray-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Status..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all text-sm bg-white"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
            >
              <option value="">All Order Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
              title="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-sm bg-white"
              title="End Date"
            />
            <button
              onClick={fetchOrders}
              className="px-6 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium transition-colors shadow-sm text-sm cursor-pointer"
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
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-saffron-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="flex h-9 w-12 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 ring-orange-200">
                        #{order.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <img
                              src={
                                item.productimage
                                  ? item.productimage.startsWith("http")
                                    ? item.productimage
                                    : `http://localhost:3003${item.productimage}`
                                  : "https://via.placeholder.com/40"
                              }
                              alt={item.productname}
                              className="w-10 h-10 rounded object-cover border border-gray-200"
                            />
                            <p className="text-sm text-gray-800 font-medium line-clamp-1">
                              {item.productname}
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-gray-800">
                        <IndianRupee className="w-4 h-4 text-gray-500" />
                        {order.totalamount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 border rounded-full text-xs font-semibold capitalize ${getStatusColor(
                          order.orderstatus
                        )}`}
                      >
                        {order.orderstatus}
                      </span>
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
