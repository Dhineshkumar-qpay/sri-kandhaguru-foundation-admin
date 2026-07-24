import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  ShoppingBag,
  IndianRupee,
  Phone,
  ArrowLeft,
  Check,
} from "lucide-react";
import api from "../services/api";

interface OrderItem {
  productname: string;
  productimage: string;
  price: number;
  sellingprice: number | null;
  quantity?: number;
  totalprice?: number;
  items?: OrderItem[];
}

interface OrderDetailData {
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
    items?: OrderItem[];
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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailData | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(true);
  const [pendingStatus, setPendingStatus] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(Number(id));
    }
  }, [id]);

  const fetchOrderDetails = async (orderId: number) => {
    setDetailLoading(true);
    try {
      const response = await api.post("/admin/order/details", {
        orderid: orderId,
      });
      if (response.data?.success) {
        setSelectedOrder(response.data.data);
        setPendingStatus(response.data.data.order.orderstatus);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !pendingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const response = await api.post("/admin/order/update-status", {
        orderid: selectedOrder.order.id,
        orderstatus: pendingStatus,
      });
      if (response.data?.success) {
        // Update local state to reflect the change immediately
        setSelectedOrder({
          ...selectedOrder,
          order: { ...selectedOrder.order, orderstatus: pendingStatus },
        });
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "packed":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "shipped":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "delivered":
      case "success":
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (detailLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!selectedOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-500">Order details not found.</p>
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-saffron-600 hover:text-saffron-700 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/orders")}
          className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          title="Back to Orders"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Order Id : {selectedOrder.order.id}
          </h1>
          <p className="text-gray-500 mt-1">
            Review full order details and payment information.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-white p-6 rounded-2xl shadow-elegant border border-saffron-50/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-saffron-500"></div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Order Placed</p>
              <p className="text-gray-800 font-medium mt-1">
                {new Date(selectedOrder.order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500 font-medium mb-1">
                Order Status
              </p>
              <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                <select
                  value={pendingStatus}
                  onChange={(e) => setPendingStatus(e.target.value)}
                  disabled={["delivered", "cancelled"].includes(
                    selectedOrder.order.orderstatus.toLowerCase(),
                  )}
                  className={`px-3 py-1.5 border rounded-[0px] text-sm font-bold uppercase tracking-wider outline-none cursor-pointer hover:ring-2 ring-offset-1 ring-saffron-300 transition-all shadow-sm disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:ring-0 ${getStatusColor(
                    pendingStatus,
                  )}`}
                >
                  <option value="pending" className="bg-white text-gray-800">
                    Pending
                  </option>
                  <option value="confirmed" className="bg-white text-gray-800">
                    Confirmed
                  </option>
                  <option value="packed" className="bg-white text-gray-800">
                    Packed
                  </option>
                  <option value="shipped" className="bg-white text-gray-800">
                    Shipped
                  </option>
                  <option value="delivered" className="bg-white text-gray-800">
                    Delivered
                  </option>
                  <option value="cancelled" className="bg-white text-gray-800">
                    Cancelled
                  </option>
                </select>
                {pendingStatus !== selectedOrder.order.orderstatus && (
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isUpdatingStatus ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Confirm
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address details */}
          <div className="bg-white p-6 rounded-2xl shadow-elegant border border-saffron-50/50 flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <MapPin className="w-4 h-4 text-saffron-500" />
              Shipping Address
            </h3>
            {selectedOrder.address ? (
              <div className="text-sm text-gray-600 flex-1 space-y-3">
                <p className="font-semibold text-gray-800 text-lg">
                  {selectedOrder.address.contactname}
                </p>
                <p className="flex items-center gap-2 text-gray-600 bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {selectedOrder.address.contactnumber}
                </p>
                <p className="text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                  {selectedOrder.address.address},<br />
                  {selectedOrder.address.city}, {selectedOrder.address.district}
                  ,<br />
                  {selectedOrder.address.state} -{" "}
                  {selectedOrder.address.pincode},<br />
                  {selectedOrder.address.country}
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-saffron-50/50 text-saffron-700 rounded-lg text-xs font-bold capitalize border border-saffron-200/50">
                  {selectedOrder.address.place}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic flex-1 flex items-center justify-center bg-gray-50 rounded-xl">
                No address provided.
              </p>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-200 pb-3">
              Payment Summary
            </h3>
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                <span className="text-gray-600 font-medium">Total Amount</span>
                <span className="font-bold text-saffron-600 text-xl flex items-center gap-0.5">
                  <IndianRupee className="w-5 h-5 text-saffron-600" />
                  {selectedOrder.order.totalamount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm font-medium">
                  Payment Status
                </span>
                <span
                  className={`inline-block px-3 py-1 border rounded-md text-xs font-bold uppercase tracking-wider ${getStatusColor(
                    selectedOrder.order.paymentstatus,
                  )}`}
                >
                  {selectedOrder.order.paymentstatus}
                </span>
              </div>

              {selectedOrder.order.screenshot && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Payment Screenshot
                  </p>
                  <a
                    href={
                      selectedOrder.order.screenshot.startsWith("http")
                        ? selectedOrder.order.screenshot
                        : `http://localhost:3003${selectedOrder.order.screenshot}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-gray-200 hover:ring-2 ring-saffron-500 ring-offset-2 transition-all shadow-sm bg-white"
                  >
                    <img
                      src={
                        selectedOrder.order.screenshot.startsWith("http")
                          ? selectedOrder.order.screenshot
                          : `http://localhost:3003${selectedOrder.order.screenshot}`
                      }
                      alt="Payment Screenshot"
                      className="w-full h-auto max-h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white p-6 rounded-2xl shadow-elegant border border-saffron-50/50">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
            <ShoppingBag className="w-4 h-4 text-saffron-500" />
            Order Items (
            {(selectedOrder.items || selectedOrder.order?.items || []).length})
          </h3>
          <div className="space-y-4">
            {(selectedOrder.items || selectedOrder.order?.items || []).map(
              (item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-6 p-4 rounded-xl border border-gray-100 hover:border-saffron-200 hover:bg-saffron-50/20 transition-colors"
                >
                  <img
                    src={
                      item.productimage
                        ? item.productimage.startsWith("http")
                          ? item.productimage
                          : `http://localhost:3003${item.productimage}`
                        : "https://via.placeholder.com/80"
                    }
                    alt={item.productname}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-200 shadow-sm"
                  />
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-base font-bold text-gray-800 line-clamp-2">
                        {item.productname}
                      </p>
                      <p className="text-sm text-gray-500 font-medium mt-1">
                        Qty:{" "}
                        <span className="text-gray-800 font-bold">
                          {item.quantity || 1}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {item.sellingprice && item.price !== item.sellingprice ? (
                        <p className="text-sm text-gray-500 mb-1 line-through flex items-center justify-end gap-0.5">
                          <IndianRupee className="w-3 h-3" />
                          {item.price * (item.quantity || 1)}
                        </p>
                      ) : null}
                      <p className="text-lg font-bold text-gray-900 flex items-center justify-end gap-0.5">
                        <IndianRupee className="w-4 h-4 text-gray-500" />
                        {item.totalprice || item.sellingprice || item.price}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
