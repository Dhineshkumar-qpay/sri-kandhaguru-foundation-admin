import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Image as ImageIcon,
  X,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";

interface GalleryImage {
  id: number;
  title: string;
  image: string;
  categoryid: number;
  categoryname: string;
  userid: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Category {
  categoryid: number;
  categoryname: string;
}

export default function Gallery() {
  const [showForm, setShowForm] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (showForm) {
      fetchCategories();
    } else {
      setImagePreview(null);
    }
  }, [showForm]);

  const fetchGallery = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.post("/gallery/get", {
        categoryid: null,
        page,
      });
      if (response.data?.success) {
        setImages(response.data.data.images || []);
        setMeta(response.data.data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.post("/category/get");
      if (response.data?.success) {
        const fetchedData = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data?.categories || [];
        setCategories(fetchedData);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleCreateImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const categoryid = formData.get("categoryid") as string;
    const file = formData.get("imageFile") as File;

    if (!title || !categoryid || !file || file.size === 0) {
      alert("Please fill all required fields and select an image.");
      return;
    }

    const selectedCat = categories.find(
      (c) => c.categoryid.toString() === categoryid,
    );
    const categoryname = selectedCat ? selectedCat.categoryname : "";

    const uploadData = new FormData();
    uploadData.append("image", file);
    uploadData.append("title", title);
    uploadData.append("categoryid", categoryid);
    uploadData.append("categoryname", categoryname);

    setLoading(true);
    try {
      const response = await api.post("/gallery/add", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data?.success) {
        setShowForm(false);
        setCurrentPage(1);
        fetchGallery(1);
      } else {
        alert("Failed to add image.");
      }
    } catch (error) {
      console.error("Error adding image:", error);
      alert("An error occurred while adding.");
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      setLoading(true);
      try {
        const response = await api.post("/gallery/delete", { id });
        if (response.data?.success) {
          fetchGallery(currentPage);
        } else {
          alert("Failed to delete image.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        alert("An error occurred while deleting.");
        setLoading(false);
      }
    }
  };

  const filteredImages = images.filter(
    (img) =>
      img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.categoryname.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gallery Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage spiritual images and event photos.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-saffron-500/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add New Image
        </button>
      </div>

      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Upload New Image
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <form className="space-y-4" onSubmit={handleCreateImage}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image Title *
                </label>
                <input
                  name="title"
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="e.g. Guru Purnima 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="categoryid"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 bg-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryid} value={cat.categoryid}>
                      {cat.categoryname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image File *
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-saffron-200 rounded-xl cursor-pointer bg-saffron-50/30 hover:bg-saffron-50/80 transition-colors overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 text-saffron-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold text-saffron-600">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </p>
                      </div>
                    )}
                    <input
                      name="imageFile"
                      required
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImagePreview(URL.createObjectURL(file));
                        } else {
                          setImagePreview(null);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium shadow-md shadow-saffron-500/20 cursor-pointer ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {loading ? "Uploading..." : "Save Image"}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search gallery by title or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">S.No</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                  <th className="px-6 py-4 font-medium">Image</th>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Date Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredImages.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No images found.
                    </td>
                  </tr>
                ) : (
                  filteredImages.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-saffron-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <h1 className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600  ring-orange-200">
                          {index + 1}
                        </h1>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-0 transition-opacity">
                          <button
                            onClick={() => deleteImage(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <img
                          src={
                            item.image.startsWith("http")
                              ? item.image
                              : `http://localhost:3003${item.image}`
                          }
                          alt={item.title}
                          className="w-10 h-10 rounded-lg object-cover shadow-sm border border-gray-100 bg-gray-100"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {item.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium text-xs whitespace-nowrap">
                          {item.categoryname}
                        </span>
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
                                  },
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
          {meta && meta.totalItems > 0 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 bg-gray-50/50">
              <p>
                Showing {(meta.currentPage - 1) * meta.pageSize + 1} to{" "}
                {Math.min(meta.currentPage * meta.pageSize, meta.totalItems)} of{" "}
                {meta.totalItems} entries
              </p>
              <div className="flex gap-1 overflow-x-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!meta.hasPreviousPage}
                  className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  Prev
                </button>

                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        pageNum === meta.currentPage
                          ? "bg-saffron-500 text-white shadow-sm"
                          : "border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={!meta.hasNextPage}
                  className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
