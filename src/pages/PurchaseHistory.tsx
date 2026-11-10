import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  Eye,
  IndianRupee,
  Pencil,
  Plus,
  ShoppingBag,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { exportToExcel } from "../utils/exportToExcel";

interface Product {
  id: number;
  productname: string;
  price: number;
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

interface PurchaseItemForm {
  productid: string;
  quantity: string;
}

interface PurchaseRecord {
  id: number;
  registerid: number;
  totalamount: number;
  createdAt: string;
  registration?: RegisteredUser;
}

interface PurchaseDetailRecord extends PurchaseRecord {
  updatedAt: string;
  products: {
    id: number;
    purchaseid: number;
    productid: number;
    quantity: number;
    amount: number;
    totalamount: number;
    product: Product;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
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

export default function PurchaseHistory() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [staffs, setStaffs] = useState<StaffOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemForm[]>([
    { productid: "", quantity: "1" },
  ]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [userResults, setUserResults] = useState<RegisteredUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formMode, setFormMode] = useState<"purchase" | "product" | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [purchaseQrCode, setPurchaseQrCode] = useState("");
  const [qrError, setQrError] = useState("");
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(
    null,
  );
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState(getCurrentMonthDateRange);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const response = await api.post<ApiResponse<{ userType: string }>>(
          "/admin/get",
        );
        if (!response.data?.success || !response.data.data) {
          throw new Error(
            response.data?.message || "Unable to load signed-in profile.",
          );
        }
        if (active) {
          setIsAdmin(response.data.data.userType?.toLowerCase() === "admin");
        }
      } catch (requestError) {
        console.error("Failed to load purchase history permissions", requestError);
      }
    };

    void fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  const fetchOfflineProducts = async () => {
    const response = await api.post<ApiResponse<Product[]>>(
      "/offline-product/get",
    );
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Unable to load products.");
    }
    setProducts(Array.isArray(response.data.data) ? response.data.data : []);
  };

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const productsResponse =
          await api.post<ApiResponse<Product[]>>("/offline-product/get");

        if (!productsResponse.data?.success) {
          throw new Error(
            productsResponse.data?.message || "Unable to load products.",
          );
        }
        setProducts(
          Array.isArray(productsResponse.data.data)
            ? productsResponse.data.data
            : [],
        );
      } catch (error) {
        console.error("Failed to load offline purchase products", error);
        setLoadError(
          "Unable to load products. Please refresh the page.",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchOptions();
  }, []);

  const fetchPurchases = async (
    fromDate: string,
    toDate: string,
    staffId = selectedStaffId,
  ) => {
    setLoading(true);
    setLoadError("");
    if (!fromDate || !toDate || fromDate > toDate) {
      setPurchases([]);
      setLoadError("Choose a valid date range.");
      setLoading(false);
      return;
    }
    try {
      const response = await api.post<ApiResponse<PurchaseRecord[]>>(
        "/purchase/get",
        {
          fromDate,
          toDate,
          ...(isAdmin ? { userid: staffId ? Number(staffId) : null } : {}),
        },
      );
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to load purchases.");
      }
      setPurchases(Array.isArray(response.data.data) ? response.data.data : []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch purchases", error);
      setLoadError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to load purchases. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPurchases(dateRange.fromDate, dateRange.toDate, selectedStaffId);
  }, [dateRange.fromDate, dateRange.toDate, selectedStaffId, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    const fetchStaffs = async () => {
      setLoadingStaffs(true);
      try {
        const response = await api.post<ApiResponse<StaffOption[]>>(
          "/admin/get-staffs",
        );
        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Unable to load staff members.",
          );
        }
        if (active) {
          setStaffs(Array.isArray(response.data.data) ? response.data.data : []);
        }
      } catch (requestError) {
        console.error("Failed to load staff for purchase history filter", requestError);
        if (active) {
          setLoadError(
            requestError instanceof Error && requestError.message
              ? requestError.message
              : "Unable to load staff members. Please try again.",
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
    const query = userSearch.trim();
    if (formMode !== "purchase" || selectedUser || query.length < 3) {
      setUserResults([]);
      setSearchingUsers(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setSearchingUsers(true);
      setFormError("");
      try {
        const response = await api.post<ApiResponse<RegisteredUser[]>>(
          "/registration/search",
          { search: query },
        );
        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Unable to search registered users.",
          );
        }
        if (active) {
          setUserResults(
            Array.isArray(response.data.data) ? response.data.data : [],
          );
        }
      } catch (error) {
        console.error("Failed to search registered users for purchase", error);
        if (active) {
          setFormError(
            "Unable to search registered users. Please try again.",
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
  }, [formMode, selectedUser, userSearch]);

  const totalAmount = purchaseItems.reduce((total, item) => {
    const product = products.find(
      (availableProduct) => String(availableProduct.id) === item.productid,
    );
    return (
      total +
      (Number(product?.price) || 0) * (Number(item.quantity) || 0)
    );
  }, 0);
  const purchasePaymentLink = useMemo(() => {
    if (formMode !== "purchase" || totalAmount <= 0) return "";
    const params = new URLSearchParams({
      pa: "9345405549@ybl",
      pn: "Sri Kandhaguru Foundation",
      am: totalAmount.toFixed(2),
      cu: "INR",
      tn: selectedUser
        ? `Purchase - ${selectedUser.fullname}`
        : "Purchase",
    });
    return `upi://pay?${params.toString()}`;
  }, [formMode, selectedUser, totalAmount]);

  useEffect(() => {
    let active = true;
    setQrError("");
    if (!purchasePaymentLink) {
      setPurchaseQrCode("");
      return;
    }

    QRCode.toDataURL(purchasePaymentLink, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
      color: { dark: "#1f2937", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (active) setPurchaseQrCode(dataUrl);
      })
      .catch((qrGenerationError: unknown) => {
        console.error("Failed to generate purchase payment QR code", qrGenerationError);
        if (active) {
          setPurchaseQrCode("");
          setQrError("Unable to generate the UPI payment QR code.");
        }
      });

    return () => {
      active = false;
    };
  }, [purchasePaymentLink]);
  const filteredPurchases = purchases.filter((purchase) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      purchase.id.toString().includes(query) ||
      purchase.registerid.toString().includes(query) ||
      purchase.registration?.fullname.toLowerCase().includes(query) ||
      (purchase.registration?.mobile ?? "").includes(query)
    );
  });
  const totalPurchaseAmount = filteredPurchases.reduce(
    (total, purchase) => total + (Number(purchase.totalamount) || 0),
    0,
  );
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize));
  const currentPurchases = filteredPurchases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const handleExport = () => {
    exportToExcel(
      `purchase-history-${dateRange.fromDate}-to-${dateRange.toDate}`,
      filteredPurchases.map((purchase) => ({
        ID: purchase.id,
        "User ID": purchase.registerid,
        "Full Name":
          purchase.registration?.fullname || `User #${purchase.registerid}`,
        Mobile: purchase.registration?.mobile || "",
        "Purchase Date": purchase.createdAt
          ? new Date(purchase.createdAt).toLocaleDateString("en-IN")
          : "",
        "Total Amount": Number(purchase.totalamount) || 0,
      })),
    );
  };

  const resetPurchaseForm = () => {
    setFormMode(null);
    setEditingPurchaseId(null);
    setPurchaseItems([{ productid: "", quantity: "1" }]);
    setUserSearch("");
    setSelectedUser(null);
    setUserResults([]);
    setFormError("");
  };

  const openAddPurchaseForm = () => {
    resetPurchaseForm();
    setFormMode("purchase");
  };

  const openEditPurchaseForm = async (purchaseId: number) => {
    setLoadingEditId(purchaseId);
    setFormError("");
    try {
      const response = await api.post<ApiResponse<PurchaseDetailRecord>>(
        "/purchase/details",
        { id: purchaseId },
      );
      if (!response.data?.success || !response.data.data) {
        throw new Error(
          response.data?.message || "Unable to load purchase details.",
        );
      }

      const detail = response.data.data;
      const selectedProducts = detail.products.map((item) => item.product);
      setProducts((current) => {
        const productsById = new Map(current.map((product) => [product.id, product]));
        selectedProducts.forEach((product) => productsById.set(product.id, product));
        return Array.from(productsById.values());
      });
      setEditingPurchaseId(detail.id);
      setSelectedUser(
        detail.registration ?? {
          id: detail.registerid,
          fullname: `User #${detail.registerid}`,
        },
      );
      setUserSearch(
        detail.registration?.fullname ?? `User #${detail.registerid}`,
      );
      setPurchaseItems(
        detail.products.map((item) => ({
          productid: String(item.productid),
          quantity: String(item.quantity),
        })),
      );
      setUserResults([]);
      setFormMode("purchase");
    } catch (error) {
      console.error("Failed to load purchase for editing", error);
      setLoadError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to load purchase details. Please try again.",
      );
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleDeletePurchase = async (purchaseId: number) => {
    if (!window.confirm("Are you sure you want to delete this purchase?")) {
      return;
    }
    setDeletingId(purchaseId);
    setLoadError("");
    try {
      const response = await api.post<ApiResponse<string>>(
        "/purchase/delete",
        { id: purchaseId },
      );
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to delete purchase.");
      }
      await fetchPurchases(dateRange.fromDate, dateRange.toDate);
    } catch (error) {
      console.error("Failed to delete purchase", error);
      setLoadError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to delete purchase. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handlePurchaseSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError("");
    if (!selectedUser) {
      setFormError("Search for and select a registered user.");
      return;
    }
    if (
      purchaseItems.length === 0 ||
      purchaseItems.some(
        (item) =>
          !item.productid ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1,
      )
    ) {
      setFormError("Select a product and valid quantity for each item.");
      return;
    }

    setSavingPurchase(true);
    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(
        editingPurchaseId === null ? "/purchase/add" : "/purchase/update",
        {
          ...(editingPurchaseId === null ? {} : { id: editingPurchaseId }),
          registerid: selectedUser.id,
          products: purchaseItems.map((item) => ({
            productid: Number(item.productid),
            quantity: Number(item.quantity),
          })),
        },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            `Unable to ${editingPurchaseId === null ? "add" : "update"} purchase.`,
        );
      }
      resetPurchaseForm();
      await fetchPurchases(dateRange.fromDate, dateRange.toDate);
    } catch (error) {
      console.error(
        `Failed to ${editingPurchaseId === null ? "add" : "update"} purchase`,
        error,
      );
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : `Unable to ${editingPurchaseId === null ? "add" : "update"} purchase. Please try again.`,
      );
    } finally {
      setSavingPurchase(false);
    }
  };

  const handleProductSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError("");
    setSavingProduct(true);
    try {
      const response = await api.post<ApiResponse<{ message?: string }>>(
        "/offline-product/add",
        {
          productname: productName.trim(),
          price: Number(productPrice),
        },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to add product.",
        );
      }
      await fetchOfflineProducts();
      setProductName("");
      setProductPrice("");
      setFormMode(null);
    } catch (error) {
      console.error("Failed to add offline product", error);
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to add product. Please try again.",
      );
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Purchase History
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and view product purchases.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setFormMode("product");
            }}
            className="border border-saffron-200 text-saffron-700 hover:bg-saffron-50 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
          <button
            type="button"
            onClick={openAddPurchaseForm}
            className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-saffron-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add Purchase
          </button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {formMode === "product" ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Add Offline Product</h2>
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close add product form"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {formError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <form className="space-y-5" onSubmit={handleProductSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="offline-product-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Name *
                </label>
                <input
                  id="offline-product-name"
                  required
                  maxLength={150}
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  className={fieldClassName}
                  placeholder="Product name"
                />
              </div>
              <div>
                <label
                  htmlFor="offline-product-price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price *
                </label>
                <input
                  id="offline-product-price"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={productPrice}
                  onChange={(event) => setProductPrice(event.target.value)}
                  className={fieldClassName}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setFormMode(null)}
                className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="px-6 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium disabled:opacity-60 cursor-pointer"
              >
                {savingProduct ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>
        </motion.section>
      ) : formMode === "purchase" ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingPurchaseId === null ? "Add Purchase" : "Edit Purchase"}
            </h2>
            <button
              type="button"
              onClick={resetPurchaseForm}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close purchase form"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <form className="space-y-5" onSubmit={handlePurchaseSubmit}>

          <div className="relative">
            <label
              htmlFor="purchase-user"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Selected User *
            </label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="purchase-user"
                required
                type="search"
                autoComplete="off"
                value={userSearch}
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  setSelectedUser(null);
                  setFormError("");
                }}
                className={`${fieldClassName} pl-10`}
                placeholder="Type at least 3 characters to search"
              />
            </div>

            {searchingUsers && (
              <p
                role="status"
                className="mt-2 flex items-center gap-2 text-sm text-gray-500"
              >
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-saffron-500 border-t-transparent" />
                Searching registered users...
              </p>
            )}
            {userSearch.trim().length > 0 && userSearch.trim().length < 3 && (
              <p className="mt-2 text-sm text-gray-500">
                Enter at least 3 characters to search.
              </p>
            )}
            {userResults.length > 0 && !selectedUser && (
              <ul
                role="listbox"
                aria-label="Matching registered users"
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
            {!searchingUsers &&
              userSearch.trim().length >= 3 &&
              userResults.length === 0 &&
              !selectedUser && (
                <p className="mt-2 text-sm text-gray-500">
                  No matching registered users found.
                </p>
              )}
            {selectedUser && (
              <p className="mt-1 text-xs text-green-700">
                Selected: {selectedUser.fullname} (#{selectedUser.id})
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Products *
              </h3>
              <button
                type="button"
                onClick={() =>
                  setPurchaseItems((items) => [
                    ...items,
                    { productid: "", quantity: "1" },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 px-3 py-2 text-sm font-medium text-saffron-700 hover:bg-saffron-50"
              >
                <Plus className="h-4 w-4" />
                Add another product
              </button>
            </div>
            {purchaseItems.map((item, index) => {
              const product = products.find(
                (availableProduct) =>
                  String(availableProduct.id) === item.productid,
              );
              return (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] gap-4 items-end rounded-xl border border-gray-100 p-4"
                >
                  <div>
                    <label
                      htmlFor={`purchase-product-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Product *
                    </label>
                    <select
                      id={`purchase-product-${index}`}
                      required
                      value={item.productid}
                      onChange={(event) =>
                        setPurchaseItems((items) =>
                          items.map((currentItem, itemIndex) =>
                            itemIndex === index
                              ? { ...currentItem, productid: event.target.value }
                              : currentItem,
                          ),
                        )
                      }
                      disabled={loading || products.length === 0}
                      className={fieldClassName}
                    >
                      <option value="">
                        {loading ? "Loading products..." : "Select a product"}
                      </option>
                      {products.map((availableProduct) => (
                        <option
                          key={availableProduct.id}
                          value={availableProduct.id}
                        >
                          {availableProduct.productname} — ₹
                          {Number(availableProduct.price).toLocaleString(
                            "en-IN",
                          )}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={`purchase-quantity-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Quantity *
                    </label>
                    <input
                      id={`purchase-quantity-${index}`}
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) =>
                        setPurchaseItems((items) =>
                          items.map((currentItem, itemIndex) =>
                            itemIndex === index
                              ? { ...currentItem, quantity: event.target.value }
                              : currentItem,
                          ),
                        )
                      }
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </span>
                    <p className="rounded-xl bg-gray-50 px-4 py-2.5 font-medium text-gray-700">
                      ₹
                      {(
                        (Number(product?.price) || 0) *
                        (Number(item.quantity) || 0)
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPurchaseItems((items) =>
                        items.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    disabled={purchaseItems.length === 1}
                    className="mb-1 rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Remove product"
                    aria-label={`Remove product ${index + 1}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <div className="w-full sm:w-64">
              <label
                htmlFor="purchase-total"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Total Amount
              </label>
              <input
                id="purchase-total"
                type="text"
                value={`₹${totalAmount.toLocaleString("en-IN")}`}
                readOnly
                className={`${fieldClassName} bg-gray-50 text-gray-600`}
              />
            </div>
          </div>

          {totalAmount > 0 && (
            <section className="flex flex-col items-center rounded-2xl border border-saffron-100 bg-orange-50/40 p-6 text-center">
              <h3 className="text-lg font-bold text-gray-800">
                Scan to Pay
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Pay {`₹${totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`} using GPay, PhonePe, or another UPI app.
              </p>
              {purchaseQrCode ? (
                <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <img
                    src={purchaseQrCode}
                    alt={`UPI payment QR for ₹${totalAmount.toFixed(2)}`}
                    className="h-50 w-50 rounded-xl"
                  />
                </div>
              ) : qrError ? (
                <p role="alert" className="mt-4 text-sm text-red-600">
                  {qrError}
                </p>
              ) : (
                <div
                  role="status"
                  className="mt-4 flex h-64 w-64 items-center justify-center rounded-2xl bg-white text-sm text-gray-500"
                >
                  Preparing payment QR...
                </div>
              )}
              <p className="mt-3 text-xs text-gray-500">
                UPI ID:{" "}
                <span className="font-semibold text-gray-700">
                  9345405549@ybl
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Verify the amount in your UPI app before paying.
              </p>
            </section>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={resetPurchaseForm}
              className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPurchase || loading || products.length === 0}
              className="px-6 py-2 bg-saffron-500 text-white rounded-xl font-medium shadow-md shadow-saffron-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPurchase
                ? "Saving..."
                : editingPurchaseId === null
                  ? "Save Purchase"
                  : "Update Purchase"}
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
                  Purchase Count
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                  {filteredPurchases.length.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Matching purchases
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-700 ring-1 ring-saffron-200/70">
                <ShoppingBag className="h-6 w-6" />
              </span>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-white via-white to-green-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-green-100/50" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Total Purchase Amount
                </p>
                <p className="mt-2 truncate text-2xl font-bold tracking-tight text-green-800 sm:text-3xl">
                  {formatCurrency(totalPurchaseAmount)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Total for matching purchases
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700 ring-1 ring-green-200/70">
                <IndianRupee className="h-6 w-6" />
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all text-sm"
              />
            </div>
            <input
              type="date"
              aria-label="Filter purchases from date"
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
              aria-label="Filter purchases to date"
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
                aria-label="Filter purchases by staff"
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
              disabled={loading || filteredPurchases.length === 0}
              title="Download filtered purchases as an Excel-compatible CSV"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto relative min-h-[300px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">S.No</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                  <th className="px-6 py-4 font-medium">Registered User</th>
                  <th className="px-6 py-4 font-medium">Mobile</th>
                  <th className="px-6 py-4 font-medium">Purchase Date</th>
                  <th className="px-6 py-4 font-medium">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentPurchases.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No purchases found.
                    </td>
                  </tr>
                ) : (
                  currentPurchases.map((purchase, index) => (
                    <tr
                      key={purchase.id}
                      className="hover:bg-saffron-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/purchase-history/${purchase.id}`)
                            }
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            title="View purchase details"
                            aria-label={`View purchase ${purchase.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void openEditPurchaseForm(purchase.id)
                                }
                                disabled={loadingEditId === purchase.id}
                                className="rounded-lg p-2 text-saffron-600 hover:bg-saffron-50 disabled:opacity-50"
                                title="Edit purchase"
                                aria-label={`Edit purchase ${purchase.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeletePurchase(purchase.id)}
                                disabled={deletingId === purchase.id}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                                title="Delete purchase"
                                aria-label={`Delete purchase ${purchase.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-medium text-gray-800">
                          {purchase.registration?.fullname ||
                            `User #${purchase.registerid}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: #{purchase.registerid}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {purchase.registration?.mobile || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(purchase.createdAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </td>
                      <td className="px-6 py-4">
                        ₹{Number(purchase.totalamount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredPurchases.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-4 text-sm text-gray-500 bg-gray-50/50">
              <p>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredPurchases.length)} of{" "}
                {filteredPurchases.length} entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
