import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Edit2, Plus, Search, Trash2, X } from "lucide-react";
import api from "../services/api";

interface OfflineProduct {
  id: number;
  productname: string;
  price: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const pageSize = 10;

const formatCurrency = (value: number | string) => {
  const amount = Number(value);
  return `₹${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function OfflineProducts() {
  const [products, setProducts] = useState<OfflineProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<OfflineProduct | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const response =
        await api.post<ApiResponse<OfflineProduct[]>>("/offline-product/get");
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to load products.");
      }
      const nextProducts = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setProducts(nextProducts);
      setCurrentPage((page) =>
        Math.min(
          page,
          Math.max(1, Math.ceil(nextProducts.length / pageSize)),
        ),
      );
    } catch (requestError) {
      console.error("Failed to load offline products", requestError);
      setError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : "Unable to load products. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        product.productname?.toLowerCase().includes(query) ||
        String(product.id).includes(query),
    );
  }, [products, search]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / pageSize),
  );
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setProductName("");
    setProductPrice("");
    setError("");
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
    setEditingProduct(null);
  };

  const openEditForm = (product: OfflineProduct) => {
    setError("");
    setShowForm(true);
    setEditingProduct(product);
    setProductName(product.productname);
    setProductPrice(String(product.price));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = productName.trim();
    const price = Number(productPrice);
    if (!normalizedName || !Number.isFinite(price) || price < 0) {
      setError("Enter a product name and a valid non-negative price.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const isEditing = editingProduct !== null;
      const response = await api.post<ApiResponse<{ message?: string }>>(
        isEditing ? "/offline-product/update" : "/offline-product/add",
        {
          ...(isEditing ? { id: editingProduct.id } : {}),
          productname: normalizedName,
          price,
        },
      );
      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            `Unable to ${isEditing ? "update" : "add"} product.`,
        );
      }
      resetForm();
      await fetchProducts();
    } catch (requestError) {
      console.error("Failed to save offline product", requestError);
      setError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : "Unable to save product. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: OfflineProduct) => {
    if (!window.confirm(`Delete "${product.productname}"?`)) return;
    setDeletingId(product.id);
    setError("");
    try {
      const response = await api.post<ApiResponse<unknown>>(
        "/offline-product/delete",
        { id: product.id },
      );
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to delete product.");
      }
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      setCurrentPage((page) =>
        Math.min(
          page,
          Math.max(1, Math.ceil((filteredProducts.length - 1) / pageSize)),
        ),
      );
    } catch (requestError) {
      console.error("Failed to delete offline product", requestError);
      setError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : "Unable to delete product. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Offline Products</h1>
          <p className="mt-1 text-gray-500">
            Manage the products available for offline sales.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-saffron-500 px-5 py-2.5 font-medium text-white shadow-md shadow-saffron-500/20 transition-colors hover:bg-saffron-600"
        >
          <Plus className="h-5 w-5" />
          Add Offline Product
        </button>
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

      {showForm && (
        <section className="rounded-2xl border border-saffron-50/50 bg-white p-6 shadow-elegant">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {editingProduct ? "Edit Offline Product" : "Add Offline Product"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Close product form"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form className="space-y-5" onSubmit={(event) => void handleSave(event)}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="offline-product-name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Product Name *
                </label>
                <input
                  id="offline-product-name"
                  required
                  maxLength={150}
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label
                  htmlFor="offline-product-price"
                  className="mb-1 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-200 px-5 py-2 font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-saffron-500 px-5 py-2 font-medium text-white hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingProduct
                    ? "Update Product"
                    : "Add Product"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-saffron-50/50 bg-white shadow-elegant">
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by product name or ID"
              className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
            />
          </div>
          <span className="text-sm text-gray-500">
            {filteredProducts.length} product
            {filteredProducts.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="relative min-h-[300px] overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron-500 border-t-transparent" />
            </div>
          )}
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">S.No</th>
                <th className="px-6 py-4 font-medium">Actions</th>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleProducts.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No offline products found.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-saffron-50/30"
                  >
                    <td className="px-6 py-4">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          className="rounded-lg p-2 text-saffron-600 hover:bg-saffron-50"
                          title="Edit product"
                          aria-label={`Edit ${product.productname}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(product)}
                          disabled={deletingId === product.id}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                          title="Delete product"
                          aria-label={`Delete ${product.productname}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-medium text-gray-800">
                        {product.productname}
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {product.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatCurrency(product.price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 p-4 text-sm text-gray-500">
            <p>
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredProducts.length)} of{" "}
              {filteredProducts.length} entries
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="cursor-pointer rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                className="cursor-pointer rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
