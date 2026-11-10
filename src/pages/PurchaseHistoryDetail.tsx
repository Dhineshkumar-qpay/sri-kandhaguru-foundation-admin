import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  MapPin,
  Phone,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";

interface PurchaseDetail {
  id: number;
  registerid: number;
  totalamount: number;
  createdAt: string;
  updatedAt: string;
  products: {
    id: number;
    purchaseid: number;
    productid: number;
    quantity: number;
    amount: number;
    totalamount: number;
    product: {
      id: number;
      productname: string;
      price: number;
    };
  }[];
  registration: {
    id: number;
    fullname: string;
    mobile: string;
    address: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

export default function PurchaseHistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const purchaseId = Number(id);
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
      setError("Invalid purchase ID.");
      setLoading(false);
      return;
    }

    let active = true;
    const fetchPurchase = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.post<ApiResponse<PurchaseDetail>>(
          "/purchase/details",
          { id: purchaseId },
        );
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to load purchase details.",
          );
        }
        if (active) setPurchase(response.data.data);
      } catch (requestError) {
        console.error("Failed to fetch purchase details", requestError);
        if (active) {
          setError(
            requestError instanceof Error && requestError.message
              ? requestError.message
              : "Unable to load purchase details. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchPurchase();
    return () => {
      active = false;
    };
  }, [purchaseId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/purchase-history"
          className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
          aria-label="Back to purchase history"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Purchase Details
          </h1>
          <p className="mt-1 text-gray-500">
            View purchase, customer, and product information.
          </p>
        </div>
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

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
        </div>
      ) : purchase ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <section className="relative overflow-hidden rounded-2xl border border-saffron-100 bg-gradient-to-br from-white via-white to-orange-50 p-6 shadow-elegant md:p-8">
            <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-saffron-100/50 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-orange-500 text-white shadow-lg shadow-saffron-500/20">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-saffron-600">
                  Purchase
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Purchase #{purchase.id}
                </h2>
                <p className="mt-1 text-gray-600">
                  {formatDate(purchase.createdAt)}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="mt-1 text-2xl font-bold text-saffron-700">
                  {formatCurrency(purchase.totalamount)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant">
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-700">
              Registered User
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Full Name
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {purchase.registration?.fullname || "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    User ID: #{purchase.registerid}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Phone Number
                  </p>
                  {purchase.registration?.mobile ? (
                    <a
                      href={`tel:${purchase.registration.mobile}`}
                      className="mt-1 block font-semibold text-gray-800 hover:text-saffron-700"
                    >
                      {purchase.registration.mobile}
                    </a>
                  ) : (
                    <p className="mt-1 font-semibold text-gray-800">—</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 md:col-span-2">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Address
                  </p>
                  <p className="mt-1 whitespace-pre-line font-medium leading-relaxed text-gray-800">
                    {purchase.registration?.address || "No address provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 md:col-span-2">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Last Updated
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formatDate(purchase.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
            <div className="border-b border-gray-100 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Purchased Products
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Unit Price</th>
                    <th className="px-6 py-4 font-medium">Quantity</th>
                    <th className="px-6 py-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchase.products.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {item.product?.productname || `Product #${item.productid}`}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {formatCurrency(item.totalamount)}
                      </td>
                    </tr>
                  ))}
                  {purchase.products.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No product details found.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50/50">
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-right font-semibold text-gray-700"
                    >
                      Purchase Total
                    </td>
                    <td className="px-6 py-4 font-bold text-saffron-700">
                      {formatCurrency(purchase.totalamount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-saffron-50/50 bg-white p-8 text-center text-gray-500 shadow-elegant">
          Purchase not found.
        </div>
      )}
    </div>
  );
}
