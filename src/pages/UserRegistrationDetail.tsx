import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Ticket,
  UserRound,
  WalletCards,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";

interface UserDetails {
  id: number;
  fullname: string;
  email?: string | null;
  pannumber?: string | null;
  aadhaarnumber?: string | null;
  occupation?: string | null;
  mobile: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  registrationHistory: {
    id: number;
    eventid: number;
    evenetname: string;
    registerid: number;
    registrationfee: number;
    advanceamount: number;
    discountamount?: number | null;
    upiamount?: number | null;
    cashamount?: number | null;
    balanceamount: number;
    paymentstatus: string;
    createdAt: string;
    updatedAt: string;
  }[];
  purchaseHistory: {
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
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

type CustomerActivity =
  | {
      id: string;
      type: "event";
      title: string;
      date: string;
      amount: number;
      detail: string;
      completed: boolean;
    }
  | {
      id: string;
      type: "purchase";
      title: string;
      date: string;
      amount: number;
      detail: string;
      completed: true;
    };

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
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

export default function UserRegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const eventRegistrations = user?.registrationHistory ?? [];
  const purchases = user?.purchaseHistory ?? [];
  const totalEventFees = eventRegistrations.reduce(
    (total, history) => total + Number(history.registrationfee || 0),
    0,
  );
  const totalEventDiscount = eventRegistrations.reduce(
    (total, history) => total + Number(history.discountamount || 0),
    0,
  );
  const totalEventPaid = eventRegistrations.reduce(
    (total, history) =>
      total +
      Number(history.advanceamount || 0) +
      Number(history.cashamount || 0) +
      Number(history.upiamount || 0),
    0,
  );
  const totalEventBalance = eventRegistrations.reduce(
    (total, history) => total + Number(history.balanceamount || 0),
    0,
  );
  const totalPurchaseAmount = purchases.reduce(
    (total, purchase) => total + Number(purchase.totalamount || 0),
    0,
  );
  const totalPurchasedItems = purchases.reduce(
    (total, purchase) =>
      total +
      purchase.products.reduce(
        (itemCount, item) => itemCount + Number(item.quantity || 0),
        0,
      ),
    0,
  );
  const recentActivity: CustomerActivity[] = [
    ...eventRegistrations.map((history) => ({
      id: `event-${history.id}`,
      type: "event" as const,
      title: history.evenetname || `Event #${history.eventid}`,
      date: history.createdAt,
      amount:
        Number(history.advanceamount || 0) +
        Number(history.cashamount || 0) +
        Number(history.upiamount || 0),
      detail:
        history.paymentstatus.toLowerCase() === "completed"
          ? "Payment completed"
          : `Balance due ${formatCurrency(history.balanceamount)}`,
      completed: history.paymentstatus.toLowerCase() === "completed",
    })),
    ...purchases.map((purchase) => ({
      id: `purchase-${purchase.id}`,
      type: "purchase" as const,
      title: `Purchase #${purchase.id}`,
      date: purchase.createdAt,
      amount: Number(purchase.totalamount || 0),
      detail: `${purchase.products.reduce(
        (quantity, item) => quantity + Number(item.quantity || 0),
        0,
      )} item${
        purchase.products.reduce(
          (quantity, item) => quantity + Number(item.quantity || 0),
          0,
        ) === 1
          ? ""
          : "s"
      }`,
      completed: true as const,
    })),
  ]
    .sort((first, second) => {
      const firstDate = new Date(first.date).getTime();
      const secondDate = new Date(second.date).getTime();
      return (
        (Number.isNaN(secondDate) ? 0 : secondDate) -
        (Number.isNaN(firstDate) ? 0 : firstDate)
      );
    })
    .slice(0, 5);

  useEffect(() => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Invalid customer ID.");
      setLoading(false);
      return;
    }

    let active = true;
    const fetchUserDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.post<ApiResponse<UserDetails>>(
          "/registration/details",
          { id: userId },
        );
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to load customer details.",
          );
        }
        if (active) {
          setUser({
            ...response.data.data,
            registrationHistory: response.data.data.registrationHistory ?? [],
            purchaseHistory: response.data.data.purchaseHistory ?? [],
          });
        }
      } catch (requestError) {
        console.error("Failed to fetch customer details", requestError);
        if (active) {
          setError(
            requestError instanceof Error && requestError.message
              ? requestError.message
              : "Unable to load customer details. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchUserDetails();
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/user-registration"
          className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
          aria-label="Back to user registrations"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Details</h1>
          <p className="mt-1 text-gray-500">
            User registration, event registrations, and sales history.
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
      ) : user ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <section className="relative overflow-hidden rounded-2xl border border-saffron-100 bg-gradient-to-br from-white via-white to-orange-50 p-6 shadow-elegant md:p-8">
            <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-saffron-100/50 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-orange-500 text-2xl font-bold uppercase text-white shadow-lg shadow-saffron-500/20">
                {user.fullname.trim().charAt(0) || (
                  <UserRound className="h-8 w-8" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-saffron-600">
                  Registered Customer
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {user.fullname}
                </h2>
                <p className="mt-1 text-gray-600">
                  Customer ID: {user.id}
                  {user.mobile ? ` · ${user.mobile}` : ""}
                </p>
                {user.email && (
                  <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-saffron-100 bg-white/80 px-3 py-1 text-xs font-semibold text-saffron-700">
                  {eventRegistrations.length} event
                  {eventRegistrations.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700">
                  {purchases.length} purchase{purchases.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </section>

          <section
            aria-label="Customer activity summary"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-elegant">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-saffron-50 p-2.5 text-saffron-600">
                  <Ticket className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Events
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-gray-900">
                {eventRegistrations.length}
              </p>
              <p className="mt-1 text-sm text-gray-500">Event registrations</p>
              <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                Fees:{" "}
                <span className="font-semibold text-gray-700">
                  {formatCurrency(totalEventFees)}
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-elegant">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-green-50 p-2.5 text-green-600">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Event payments
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-green-700">
                {formatCurrency(totalEventPaid)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Total received (advance, cash &amp; UPI)
              </p>
              <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>
                  Discount:{" "}
                  <span className="font-semibold text-purple-700">
                    {formatCurrency(totalEventDiscount)}
                  </span>
                </span>
                <span className="ml-3">
                  Balance due:{" "}
                  <span className="font-semibold text-amber-700">
                    {formatCurrency(totalEventBalance)}
                  </span>
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-elegant">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Purchases
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-gray-900">
                {purchases.length}
              </p>
              <p className="mt-1 text-sm text-gray-500">Purchase records</p>
              <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                {totalPurchasedItems} item
                {totalPurchasedItems === 1 ? "" : "s"} purchased
              </p>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-elegant">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                  <WalletCards className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Purchase total
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-purple-700">
                {formatCurrency(totalPurchaseAmount)}
              </p>
              <p className="mt-1 text-sm text-gray-500">Total Sales value</p>
              <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                Latest:{" "}
                <span className="font-semibold text-gray-700">
                  {purchases.length > 0
                    ? formatDate(purchases[0].createdAt)
                    : "No purchases"}
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Recent Activity
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Latest events and purchases for this customer.
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                Last {recentActivity.length}
              </span>
            </div>
            {recentActivity.length > 0 ? (
              <ol className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        activity.type === "event"
                          ? "bg-saffron-50 text-saffron-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {activity.type === "event" ? (
                        <Ticket className="h-5 w-5" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-800">
                        {activity.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {activity.type === "event"
                          ? "Event registration"
                          : "Product purchase"}{" "}
                        · {activity.detail}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(activity.amount)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                No event or purchase activity yet.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant">
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-700">
              Contact Information
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
                    {user.fullname}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Mobile
                  </p>
                  {user.mobile ? (
                    <a
                      href={`tel:${user.mobile}`}
                      className="mt-1 block font-semibold text-gray-800 hover:text-saffron-700"
                    >
                      {user.mobile}
                    </a>
                  ) : (
                    <p className="mt-1 font-semibold text-gray-800">—</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Email
                  </p>
                  <p className="mt-1 break-all font-semibold text-gray-800">
                    {user.email || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Occupation
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {user.occupation || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    PAN Number
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {user.pannumber || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Aadhaar Number
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {user.aadhaarnumber || "—"}
                  </p>
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
                    {user.address || "No address provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Registered On
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Last Updated
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
            <div className="border-b border-gray-100 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Event Registration History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">Event</th>
                    <th className="px-6 py-4 font-medium">Event ID</th>
                    <th className="px-6 py-4 font-medium">Fee</th>
                    <th className="px-6 py-4 font-medium">Discount</th>
                    <th className="px-6 py-4 font-medium">Advance</th>
                    <th className="px-6 py-4 font-medium">Cash</th>
                    <th className="px-6 py-4 font-medium">UPI</th>
                    <th className="px-6 py-4 font-medium">Balance</th>
                    <th className="px-6 py-4 font-medium">Payment Status</th>
                    <th className="px-6 py-4 font-medium">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {user.registrationHistory.map((history) => (
                    <tr key={history.id}>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {history.evenetname || `Event #${history.eventid}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        #{history.eventid}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(history.registrationfee)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(history.discountamount ?? 0)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(history.advanceamount)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(history.cashamount ?? 0)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(history.upiamount ?? 0)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(history.balanceamount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                            history.paymentstatus.toLowerCase() === "completed"
                              ? "border-green-200 bg-green-100 text-green-700"
                              : "border-yellow-200 bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {history.paymentstatus.toLowerCase() ===
                          "completed" ? (
                            <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                          )}
                          {history.paymentstatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(history.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {user.registrationHistory.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No event registrations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
            <div className="flex flex-col gap-2 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Sales History
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {purchases.length} record{purchases.length === 1 ? "" : "s"} ·{" "}
                  {totalPurchasedItems} item
                  {totalPurchasedItems === 1 ? "" : "s"}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 self-start rounded-xl bg-saffron-50 px-3 py-2 text-sm font-bold text-saffron-700 sm:self-auto">
                <Package className="h-4 w-4" />
                {formatCurrency(totalPurchaseAmount)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">Purchase</th>
                    <th className="px-6 py-4 font-medium">Products</th>
                    <th className="px-6 py-4 font-medium">Quantity</th>
                    <th className="px-6 py-4 font-medium">Updated</th>
                    <th className="px-6 py-4 font-medium">Total</th>
                    <th className="px-6 py-4 font-medium">Purchased On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {user.purchaseHistory.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        #{purchase.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {purchase.products.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-5"
                            >
                              <span className="text-gray-700">
                                {item.product?.productname ||
                                  `Product #${item.productid}`}
                              </span>
                              <span className="whitespace-nowrap text-xs text-gray-500">
                                {item.quantity} × {formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                          {purchase.products.length === 0 && (
                            <span className="text-gray-400">No items</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {purchase.products.reduce(
                          (total, item) => total + Number(item.quantity || 0),
                          0,
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(purchase.updatedAt)}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatCurrency(purchase.totalamount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(purchase.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {user.purchaseHistory.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No purchases found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-saffron-50/50 bg-white p-8 text-center text-gray-500 shadow-elegant">
          Customer not found.
        </div>
      )}
    </div>
  );
}
