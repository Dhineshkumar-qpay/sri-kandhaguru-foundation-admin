import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, UploadCloud, ChevronLeft, ChevronRight } from "lucide-react";
import api, { BASEURL } from "../services/api";

interface Banner {
  id: number;
  image: string;
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      // Trying GET first. If backend uses POST, it will need to be updated.
      let response = await api.get("/banner/get").catch(() => null);
      if (!response || !response.data?.success) {
         response = await api.post("/banner/get");
      }
      
      if (response.data?.success) {
        setBanners(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await api.post("/banner/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success || response.status === 200 || response.status === 201) {
        setShowForm(false);
        setSelectedFile(null);
        setPreview(null);
        fetchBanners();
      } else {
        alert("Failed to add banner");
      }
    } catch (error) {
      console.error("Error adding banner:", error);
      alert("Error adding banner");
    } finally {
      setUploading(false);
    }
  };

  const deleteBanner = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    try {
      const response = await api.post("/banner/delete", { id });
      if (response.data?.success) {
        fetchBanners();
      } else {
        alert("Failed to delete banner");
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      alert("Error deleting banner");
    }
  };

  const totalPages = Math.ceil(banners.length / itemsPerPage);
  const currentBanners = banners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-elegant border border-saffron-50/50">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Banners Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your homepage banners ({banners.length} total)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-saffron-200 flex items-center gap-2 cursor-pointer"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? "Cancel" : "Add Banner"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-elegant border border-saffron-50/50">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Banner</h2>
          <form onSubmit={handleAddBanner} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Banner Image
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 hover:border-saffron-500 hover:bg-saffron-50/50 transition-all cursor-pointer group"
              >
                <div className="text-center">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="mx-auto h-48 object-cover rounded-lg shadow-sm"
                    />
                  ) : (
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-300 group-hover:text-saffron-500 transition-colors" />
                  )}
                  <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                    <span className="relative font-semibold text-saffron-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-saffron-600 focus-within:ring-offset-2 hover:text-saffron-500">
                      Upload a file
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="bg-saffron-500 hover:bg-saffron-600 text-white px-8 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-saffron-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Uploading...
                  </>
                ) : (
                  "Save Banner"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
        <div className="overflow-x-auto relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">S.No</th>
                <th className="px-6 py-4 font-medium">Banner Preview</th>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentBanners.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No banners found.
                  </td>
                </tr>
              ) : (
                currentBanners.map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-saffron-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <h1 className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 ring-orange-200">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </h1>
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={
                          banner.image
                            ? banner.image.startsWith("http")
                              ? banner.image
                              : `${BASEURL}${banner.image}`
                            : "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&q=80&w=200&h=200"
                        }
                        alt="Banner"
                        className="w-48 h-24 object-cover rounded-lg shadow-sm bg-gray-100"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                        ID: {banner.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteBanner(banner.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, banners.length)}</span> of <span className="font-medium">{banners.length}</span> results
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white hover:border-saffron-300 hover:text-saffron-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    currentPage === i + 1
                      ? "bg-saffron-500 text-white shadow-md shadow-saffron-200"
                      : "border border-gray-200 hover:bg-white hover:border-saffron-300 hover:text-saffron-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white hover:border-saffron-300 hover:text-saffron-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
