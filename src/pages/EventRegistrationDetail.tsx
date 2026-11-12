import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import api from "../services/api";

interface RegistrationRecord {
  id: number;
  eventid: number;
  evenetname: string;
  registerid: number;
  registrationfee: number;
  advanceamount: number;
  balanceamount: number;
  discountamount?: number | null;
  cashamount?: number | null;
  upiamount?: number | null;
  sessiontype?: string | null;
  notes?: string | null;
  paymentstatus: "pending" | "completed" | string;
  createdAt: string;
  updatedAt: string;
  registration: {
    id: number;
    fullname: string;
    mobile: string;
    address: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const registrationUpiOptions = [
  { label: "HDFC", value: "9842023346-2@ibl" },
  { label: "SBI", value: "9842023346@SBI" },
] as const;

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function RegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const registrationId = Number(id);
  const [registration, setRegistration] = useState<RegistrationRecord | null>(
    null,
  );
  const [qrCode, setQrCode] = useState("");
  const [selectedUpiId, setSelectedUpiId] = useState<string>(
    registrationUpiOptions[0].value,
  );
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAmounts, setUpdatingAmounts] = useState(false);
  const [updatingSessionDetails, setUpdatingSessionDetails] = useState(false);
  const [discountAmountInput, setDiscountAmountInput] = useState("");
  const [cashAmountInput, setCashAmountInput] = useState("");
  const [sessionType, setSessionType] = useState("attended");
  const [notesInput, setNotesInput] = useState("");
  const [showPaymentQr, setShowPaymentQr] = useState(false);
  const [error, setError] = useState("");
  const [statusConfirmation, setStatusConfirmation] = useState("");
  const isPaymentCompleted =
    registration?.paymentstatus.toLowerCase() === "completed";
  const registrationFee = Number(registration?.registrationfee) || 0;
  const discountAmount = Number(registration?.discountamount) || 0;
  const advanceAmount = Number(registration?.advanceamount) || 0;
  const cashAmount = Number(registration?.cashamount) || 0;
  const upiAmount = Number(registration?.upiamount) || 0;
  const amountPaid = advanceAmount + cashAmount + upiAmount;
  const outstandingBalance = isPaymentCompleted
    ? 0
    : Math.max(
        0,
        (Number(registration?.balanceamount) || 0) - cashAmount,
      );
  const payableAmount = Math.max(0, registrationFee - discountAmount);
  const paymentProgress =
    payableAmount > 0
      ? Math.min(100, Math.round((amountPaid / payableAmount) * 100))
      : isPaymentCompleted
        ? 100
        : 0;

  useEffect(() => {
    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      setError("Invalid registration ID.");
      setLoading(false);
      return;
    }

    let active = true;
    const fetchRegistration = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.post<ApiResponse<RegistrationRecord>>(
          "/registration-history/details",
          { id: registrationId },
        );
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to load registration details.",
          );
        }
        if (active) {
          const nextRegistration = response.data.data;
          setRegistration(nextRegistration);
          setSessionType(
            nextRegistration.sessiontype && nextRegistration.sessiontype.trim()
              ? nextRegistration.sessiontype.toLowerCase()
              : "attended",
          );
          setNotesInput(nextRegistration.notes ?? "");
        }
      } catch (requestError) {
        console.error("Failed to fetch registration details", requestError);
        if (active) {
          setError("Unable to load registration details. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchRegistration();
    return () => {
      active = false;
    };
  }, [registrationId]);

  const upiPaymentLink = useMemo(() => {
    if (
      !registration ||
      registration.paymentstatus.toLowerCase() !== "pending" ||
      !showPaymentQr ||
      outstandingBalance <= 0
    ) {
      return "";
    }
    const params = new URLSearchParams({
      pa: selectedUpiId,
      pn: "Sri Kandhaguru Foundation",
      am: outstandingBalance.toFixed(2),
      cu: "INR",
      tn: `Event registration ${registration.id} - ${registration.registration.fullname}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [registration, showPaymentQr, outstandingBalance, selectedUpiId]);

  useEffect(() => {
    let active = true;
    if (!upiPaymentLink) {
      setQrCode("");
      return;
    }

    setQrCode("");
    QRCode.toDataURL(upiPaymentLink, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
      color: { dark: "#1f2937", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (active) setQrCode(dataUrl);
      })
      .catch((qrError: unknown) => {
        console.error("Failed to generate registration payment QR code", qrError);
        if (active) setError("Unable to generate the UPI payment QR code.");
      });

    return () => {
      active = false;
    };
  }, [upiPaymentLink]);

  const normalizeSessionType = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (normalized === "postponed" || normalized === "postponded") {
      return "postponded";
    }
    if (normalized === "absent") {
      return "absent";
    }
    return "attended";
  };

  const updateSessionDetails = async () => {
    if (!registration) return false;

    const nextSessionType = normalizeSessionType(sessionType);
    const trimmedNotes = notesInput.trim();
    setUpdatingSessionDetails(true);
    setError("");
    setStatusConfirmation("");

    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(
        "/registration-history/update",
        {
          id: registration.id,
          registerid: registration.registerid,
          eventid: registration.eventid,
          evenetname: registration.evenetname,
          registrationfee: registrationFee,
          advanceamount: Number(registration.advanceamount) || 0,
          balanceamount: Number(registration.balanceamount) || 0,
          discountamount: Number(registration.discountamount) || 0,
          cashamount: Number(registration.cashamount) || 0,
          upiamount: Number(registration.upiamount) || 0,
          sessiontype: nextSessionType,
          notes: trimmedNotes,
          paymentstatus: registration.paymentstatus,
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update session details.",
        );
      }

      setRegistration((current) =>
        current
          ? {
              ...current,
              sessiontype: nextSessionType,
              notes: trimmedNotes,
            }
          : current,
      );
      setStatusConfirmation(
        response.data.data?.message || "Session details updated successfully.",
      );
      return true;
    } catch (requestError) {
      console.error("Failed to update session details", requestError);
      setError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : "Unable to update session details. Please try again.",
      );
      return false;
    } finally {
      setUpdatingSessionDetails(false);
    }
  };

  const updatePaymentAmounts = async (
    nextDiscountAmount: number,
    nextCashAmount: number,
  ) => {
    if (!registration) return false;
    if (
      !Number.isFinite(nextDiscountAmount) ||
      !Number.isFinite(nextCashAmount) ||
      nextDiscountAmount < 0 ||
      nextCashAmount < 0
    ) {
      setError("Discount and cash amounts must be valid non-negative amounts.");
      return false;
    }

    const nextBalance = Math.max(
      0,
      registrationFee -
        nextDiscountAmount -
        (Number(registration.advanceamount) || 0),
    );
    setUpdatingAmounts(true);
    setError("");
    setStatusConfirmation("");
    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(
        "/registration-history/update",
        {
          id: registration.id,
          registerid: registration.registerid,
          eventid: registration.eventid,
          evenetname: registration.evenetname,
          registrationfee: registrationFee,
          advanceamount: Number(registration.advanceamount) || 0,
          balanceamount: nextBalance,
          discountamount: nextDiscountAmount,
          cashamount: nextCashAmount,
          upiamount: 0,
          sessiontype: normalizeSessionType(sessionType),
          notes: notesInput.trim(),
          paymentstatus:
            nextBalance === 0 ? "completed" : registration.paymentstatus,
        },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update payment amounts.",
        );
      }

      setRegistration((current) =>
        current
          ? {
              ...current,
              discountamount: nextDiscountAmount,
              cashamount: nextCashAmount,
              upiamount: 0,
              balanceamount: nextBalance,
              sessiontype: normalizeSessionType(sessionType),
              notes: notesInput.trim(),
              paymentstatus:
                nextBalance === 0 ? "completed" : current.paymentstatus,
            }
          : current,
      );
      setDiscountAmountInput("");
      setCashAmountInput("");
      setStatusConfirmation(
        response.data.data?.message || "Payment amounts updated successfully.",
      );
      return true;
    } catch (requestError) {
      console.error("Failed to update event registration payment amounts", requestError);
      setError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : "Unable to update payment amounts. Please try again.",
      );
      return false;
    } finally {
      setUpdatingAmounts(false);
    }
  };

  const handleDiscountSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const existingDiscount = Number(registration?.discountamount) || 0;
    const discount = existingDiscount + Number(discountAmountInput || 0);
    const cash =
      cashAmountInput === "" ? Number(registration?.cashamount) || 0 : Number(cashAmountInput);
    if (discount > registrationFee) {
      setError("Discount cannot be greater than the registration fee.");
      return;
    }
    if (discount + cash + (Number(registration?.advanceamount) || 0) > registrationFee) {
      setError("Discount and received amounts cannot exceed the registration fee.");
      return;
    }
    await updatePaymentAmounts(discount, cash);
  };

  const handleCashAmountSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const existingDiscount = Number(registration?.discountamount) || 0;
    const discount =
      discountAmountInput === ""
        ? existingDiscount
        : existingDiscount + Number(discountAmountInput || 0);
    const cash = Number(cashAmountInput);
    if (discount + cash + (Number(registration?.advanceamount) || 0) > registrationFee) {
      setError("Discount and received amounts cannot exceed the registration fee.");
      return;
    }
    const updated = await updatePaymentAmounts(discount, cash);
    if (
      updated &&
      registrationFee -
        discount -
        (Number(registration?.advanceamount) || 0) -
        cash >
        0
    ) {
      setShowPaymentQr(true);
    }
  };

  const handlePaymentStatusChange = async () => {
    if (!registration || isPaymentCompleted) return;
    if (
      !window.confirm(
        "Are you sure you want to update this payment status to Completed?",
      )
    ) {
      return;
    }

    const existingDiscount = Number(registration.discountamount) || 0;
    const nextDiscountAmount =
      discountAmountInput === ""
        ? existingDiscount
        : existingDiscount + Number(discountAmountInput || 0);
    const nextCashAmount =
      cashAmountInput === ""
        ? Number(registration.cashamount) || 0
        : Number(cashAmountInput);
    const nextBalanceAmount = Math.max(
      0,
      registrationFee -
        nextDiscountAmount -
        (Number(registration.advanceamount) || 0) -
        nextCashAmount,
    );

    setUpdatingStatus(true);
    setError("");
    setStatusConfirmation("");
    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(
        "/registration-history/update",
        {
          id: registration.id,
          registerid: registration.registerid,
          eventid: registration.eventid,
          evenetname: registration.evenetname,
          registrationfee: registrationFee,
          advanceamount: Number(registration.advanceamount) || 0,
          balanceamount: 0,
          discountamount: nextDiscountAmount,
          cashamount: nextCashAmount,
          upiamount: nextBalanceAmount,
          sessiontype: normalizeSessionType(sessionType),
          notes: notesInput.trim(),
          paymentstatus: "completed",
        },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update payment status.",
        );
      }

      setRegistration((current) =>
        current
          ? {
              ...current,
              advanceamount: Number(registration.advanceamount) || 0,
              balanceamount: 0,
              discountamount: nextDiscountAmount,
              cashamount: nextCashAmount,
              upiamount: nextBalanceAmount,
              sessiontype: normalizeSessionType(sessionType),
              notes: notesInput.trim(),
              paymentstatus: "completed",
            }
          : current,
      );
      setDiscountAmountInput("");
      setCashAmountInput("");
      setStatusConfirmation(
        response.data.data?.message || "Payment status updated to completed.",
      );
    } catch (requestError) {
      console.error("Failed to update event registration payment status", requestError);
      setError("Unable to update payment status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/registration"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:border-saffron-200 hover:bg-saffron-50 hover:text-saffron-700 focus:outline-none focus:ring-2 focus:ring-saffron-500/40"
          aria-label="Back to registrations"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 sm:text-3xl">
            Event Registration Details
          </h1>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            View participant and payment information.
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
      {statusConfirmation && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{statusConfirmation}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
        </div>
      ) : registration ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-7"
        >
          <section className="relative overflow-hidden rounded-3xl border border-saffron-100 bg-gradient-to-br from-white via-white to-orange-50 p-6 shadow-elegant md:p-8">
            <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-saffron-100/50 blur-3xl" />
            <div className="absolute -bottom-28 right-1/3 h-48 w-48 rounded-full bg-orange-100/40 blur-3xl" />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-orange-500 text-2xl font-bold uppercase text-white shadow-lg shadow-saffron-500/20 ring-4 ring-white">
                {registration.registration.fullname.trim().charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-saffron-600">
                  Registration #{registration.id}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
                  {registration.registration.fullname}
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-600 md:text-base">
                  {registration.evenetname}
                </p>
              </div>
              <div className="flex flex-row items-center gap-3 md:flex-col md:items-end">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize shadow-sm ${
                    isPaymentCompleted
                      ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                      : "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                  }`}
                >
                  {isPaymentCompleted && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {registration.paymentstatus}
                </span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <section className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant sm:p-7">
                <div className="mb-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                    Participant Information
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Contact and registration details for this participant.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-saffron-100 hover:bg-saffron-50/30">
                    <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm ring-1 ring-gray-100">
                      <UserRound className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Full Name
                      </p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {registration.registration.fullname}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-saffron-100 hover:bg-saffron-50/30">
                    <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm ring-1 ring-gray-100">
                      <Phone className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Phone Number
                      </p>
                      <a
                        href={`tel:${registration.registration.mobile}`}
                        className="mt-1 block font-semibold text-gray-800 hover:text-saffron-700"
                      >
                        {registration.registration.mobile || "Not provided"}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-saffron-100 hover:bg-saffron-50/30 md:col-span-2">
                    <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm ring-1 ring-gray-100">
                      <MapPin className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Address
                      </p>
                      <p className="mt-1 font-medium leading-relaxed text-gray-800">
                        {registration.registration.address || "No address provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-saffron-100 hover:bg-saffron-50/30">
                    <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm ring-1 ring-gray-100">
                      <CalendarDays className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Registered On
                      </p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {new Date(registration.createdAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-saffron-100 hover:bg-saffron-50/30">
                    <span className="rounded-lg bg-white p-2 text-saffron-600 shadow-sm ring-1 ring-gray-100">
                      <Clock3 className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Last Updated
                      </p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {new Date(registration.updatedAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant sm:p-7">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                      Payment Summary
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Track the amount received and remaining balance.
                    </p>
                  </div>
                  <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-bold text-saffron-700 ring-1 ring-saffron-100">
                    {paymentProgress}% paid
                  </span>
                </div>
                <div
                  className="h-3 w-full overflow-hidden rounded-full bg-gray-100 p-0.5"
                  role="progressbar"
                  aria-label="Registration payment progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={paymentProgress}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      paymentProgress === 100
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-saffron-500 to-orange-400"
                    }`}
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500">
                      Registration Fee
                    </p>
                    <p className="mt-1 font-bold text-gray-800">
                      {formatCurrency(registrationFee)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500">
                      Discount
                    </p>
                    <p className="mt-1 font-bold text-purple-700">
                      {formatCurrency(discountAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-green-100 bg-green-50/60 p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500">
                      Advance Paid
                    </p>
                    <p className="mt-1 font-bold text-green-700">
                      {formatCurrency(advanceAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500">
                      Cash Received
                    </p>
                    <p className="mt-1 font-bold text-blue-700">
                      {formatCurrency(cashAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500">
                      UPI Amount
                    </p>
                    <p className="mt-1 font-bold text-indigo-700">
                      {formatCurrency(upiAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-saffron-100 bg-saffron-50/60 p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-500">
                      Balance Due
                    </p>
                    <p className="mt-1 font-bold text-saffron-700">
                      {formatCurrency(outstandingBalance)}
                    </p>
                  </div>
                </div>
                {!isPaymentCompleted && (
                  <form
                    onSubmit={(event) => void handleDiscountSubmit(event)}
                    className="mt-6 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1">
                      <label
                        htmlFor="registration-discount-amount"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Discount Amount
                      </label>
                      <input
                        id="registration-discount-amount"
                        type="number"
                        min="0"
                        max={registrationFee}
                        step="0.01"
                        required
                        value={discountAmountInput}
                        onChange={(event) => {
                          setDiscountAmountInput(event.target.value);
                          setShowPaymentQr(false);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm transition-shadow focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={updatingAmounts}
                      className="rounded-xl bg-saffron-500 px-5 py-2.5 font-semibold text-white shadow-md shadow-saffron-500/20 transition-colors hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingAmounts ? "Updating..." : "Update Discount"}
                    </button>
                  </form>
                )}
              </section>

              <section className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant sm:p-7">
                <div className="mb-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                    Session Details
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update attendance status and notes for this registration.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Session Type
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: "attended", label: "Attended" },
                        { value: "postponded", label: "Postponded" },
                        { value: "absent", label: "Absent" },
                        { value: "upcoming", label: "Upcoming" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-saffron-200 hover:bg-saffron-50"
                        >
                          <input
                            type="radio"
                            name="sessionType"
                            value={option.value}
                            checked={sessionType === option.value}
                            onChange={(event) => setSessionType(event.target.value)}
                            className="h-4 w-4 border-gray-300 text-saffron-500 focus:ring-saffron-500"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="registration-notes"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Notes
                    </label>
                    <textarea
                      id="registration-notes"
                      rows={4}
                      value={notesInput}
                      onChange={(event) => setNotesInput(event.target.value)}
                      placeholder="Add any notes for this registration..."
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-shadow focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void updateSessionDetails()}
                    disabled={updatingSessionDetails}
                    className="w-full rounded-xl bg-saffron-500 px-5 py-2.5 font-semibold text-white shadow-md shadow-saffron-500/20 transition-colors hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updatingSessionDetails
                      ? "Updating..."
                      : "Update Session Details"}
                  </button>
                </div>
              </section>

            </div>

            <aside className="sticky top-6 flex h-fit flex-col items-center rounded-2xl border border-saffron-100 bg-white p-6 text-center shadow-elegant">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-50 to-orange-100 text-saffron-600 shadow-sm">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-gray-800">
              {isPaymentCompleted
                ? "Payment Completed"
                : "Pay Balance"}
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
              {isPaymentCompleted
                ? "This registration is marked as paid."
                : "Scan with GPay, PhonePe, or another UPI app."}
              </p>
              {isPaymentCompleted ? (
                <div className="mt-6 w-full rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-6">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                  <p className="mt-2 font-semibold text-green-800">
                    Payment confirmed
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    No further payment is expected.
                  </p>
                </div>
              ) : outstandingBalance > 0 ? (
                <>
                  {!showPaymentQr ? (
                    <form
                      onSubmit={(event) => void handleCashAmountSubmit(event)}
                      className="mt-6 w-full space-y-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-left"
                    >
                      <div>
                        <label
                          htmlFor="registration-cash-amount"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Cash Amount
                        </label>
                        <input
                          id="registration-cash-amount"
                          type="number"
                          min="0"
                          max={Math.max(
                            0,
                            registrationFee -
                              discountAmount -
                              (Number(registration.advanceamount) || 0),
                          )}
                          step="0.01"
                          required
                          value={cashAmountInput}
                          onChange={(event) => {
                            setCashAmountInput(event.target.value);
                            setShowPaymentQr(false);
                          }}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm transition-shadow focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={updatingAmounts}
                        className="w-full rounded-xl bg-saffron-500 px-5 py-3 font-semibold text-white shadow-md shadow-saffron-500/20 transition-colors hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {updatingAmounts
                          ? "Updating..."
                          : "Submit and Show Payment QR"}
                      </button>
                      <p className="text-xs leading-relaxed text-gray-500">
                        Enter any cash received. The QR code will show the
                        remaining balance to pay.
                      </p>
                    </form>
                  ) : (
                    <>
                      <p className="mt-5 text-3xl font-bold text-saffron-600">
                        {formatCurrency(outstandingBalance)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Outstanding registration balance
                      </p>
                      <div className="mt-4 w-full text-left">
                        <label
                          htmlFor="registration-upi-id"
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          UPI Account
                        </label>
                        <select
                          id="registration-upi-id"
                          value={selectedUpiId}
                          onChange={(event) =>
                            setSelectedUpiId(event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                        >
                          {registrationUpiOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} — {option.value}
                            </option>
                          ))}
                        </select>
                      </div>
                      {qrCode ? (
                        <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-3 shadow-lg shadow-gray-200/50">
                          <img
                            src={qrCode}
                            alt={`UPI payment QR for ${formatCurrency(outstandingBalance)}`}
                            className="h-64 w-64 rounded-xl"
                          />
                        </div>
                      ) : (
                        <div className="mt-5 flex h-64 w-64 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-sm text-gray-500">
                          Preparing payment QR...
                        </div>
                      )}
                      <p className="mt-4 text-xs text-gray-500">
                        UPI ID:{" "}
                        <span className="font-semibold text-gray-700">
                          {selectedUpiId}
                        </span>
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        Scan with GPay, PhonePe, or another UPI app.
                      </p>
                    </>
                  )}
                </>
              ) : (
                <div className="mt-6 w-full rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-6">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                  <p className="mt-2 font-semibold text-green-800">
                    No balance due
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    The registration fee has been fully covered.
                  </p>
                </div>
              )}
              {showPaymentQr && !isPaymentCompleted && (
                <section className="mt-6 w-full rounded-2xl border border-green-100 bg-gradient-to-br from-white to-green-50/60 p-5 text-left shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                    Update Payment Status
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    Confirm payment after receiving the outstanding balance.
                  </p>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => void handlePaymentStatusChange()}
                    className="mt-4 w-full rounded-xl border border-green-600 bg-green-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updatingStatus ? "Updating..." : "Mark Completed"}
                  </button>
                </section>
              )}
            </aside>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-saffron-50/50 bg-white p-10 text-center text-gray-500 shadow-elegant">
          Registration not found.
        </div>
      )}
    </div>
  );
}
