import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  X,
  Power,
  PowerOff,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";

interface Event {
  id: number;
  image: string;
  title: string;
  eventdate: string;
  address: string;
  partcipants: number;
  city: string;
  state: string;
  eventtype: string;
  status: string;
}

interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const getEventStatusColor = (type: string) => {
  switch (type) {
    case "completed":
      return "text-green-600";
    case "ongoing":
      return "text-blue-600";
    case "upcoming":
      return "text-orange-500";
    case "cancelled":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents(currentPage);
  }, [currentPage]);

  const fetchEvents = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.post("/event/get", { page });
      if (response.data?.success) {
        setEvents(response.data.data.events);
        setMeta(response.data.data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    // Optimistic UI update
    setEvents(
      events.map((ev) => (ev.id === id ? { ...ev, status: newStatus } : ev)),
    );
    try {
      const response = await api.post("/event/update-status", {
        id,
        status: newStatus,
      });
      if (!response.data?.success) {
        // Revert on failure
        setEvents(
          events.map((ev) =>
            ev.id === id ? { ...ev, status: currentStatus } : ev,
          ),
        );
      }
    } catch (err) {
      setEvents(
        events.map((ev) =>
          ev.id === id ? { ...ev, status: currentStatus } : ev,
        ),
      );
      console.error("Failed to update status:", err);
    }
  };

  const deleteEvent = async (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    ) {
      try {
        const response = await api.post("/event/delete", { id });
        if (response.data?.success) {
          fetchEvents(currentPage);
        } else {
          alert("Failed to delete event.");
        }
      } catch (err) {
        console.error("Failed to delete event:", err);
        alert("An error occurred while deleting.");
      }
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("imageFile") as File;
    let imageUrl = "";

    setLoading(true);
    try {
      // 1. Upload Image
      if (file && file.size > 0) {
        const uploadData = new FormData();
        uploadData.append("image", file);
        const uploadRes = await api.post("/event/uploadimage", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (uploadRes.data?.success) {
          imageUrl = uploadRes.data.data;
        }
      }

      // 2. Add Event
      const eventPayload = {
        image: imageUrl,
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        eventdate: formData.get("eventdate"),
        starttime: formData.get("starttime"),
        endtime: formData.get("endtime"),
        partcipants: Number(formData.get("partcipants")),
        registrationfee: Number(formData.get("registrationfee")),
        venuename: formData.get("venuename"),
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        maplink: formData.get("maplink"),
        eventtype: formData.get("eventtype"),
      };

      const addRes = await api.post("/event/add", eventPayload);
      if (addRes.data?.success) {
        setShowForm(false);
        setCurrentPage(1);
        fetchEvents(1);
      }
    } catch (err) {
      console.error("Error creating event", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Event Management</h1>
          <p className="text-gray-500 mt-1">
            Create and manage spiritual events and retreats.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-saffron-500/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Create New Event
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
              Create New Event
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <form className="space-y-4" onSubmit={handleCreateEvent}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Image
                </label>
                <input
                  name="imageFile"
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div className="xl:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  name="title"
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="e.g. Maha Shivaratri"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  name="category"
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="e.g. Spiritual"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  name="eventdate"
                  required
                  type="date"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    name="starttime"
                    required
                    type="time"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    name="endtime"
                    required
                    type="time"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participants *
                </label>
                <input
                  name="partcipants"
                  required
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="e.g. 1500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Fee *
                </label>
                <input
                  name="registrationfee"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  name="eventtype"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 bg-white"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name *
                </label>
                <input
                  name="venuename"
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="e.g. VGP Convention Hall"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  name="address"
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="e.g. East Coast Road"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  name="city"
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  name="state"
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="State"
                />
              </div>

              <div className="xl:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Map Link
                </label>
                <input
                  name="maplink"
                  type="url"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="xl:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="Event description..."
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
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
                {loading ? "Saving..." : "Save Event"}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events by title or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Table */}
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
                  <th className="px-6 py-4 font-medium">Event Details</th>
                  <th className="px-6 py-4 font-medium">Date & Location</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium">Attendees</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEvents.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No events found.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event, index) => (
                    <tr
                      key={event.id}
                      className="hover:bg-saffron-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <h1 className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600  ring-orange-200">
                          {index + 1}
                        </h1>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              event.image
                                ? event.image.startsWith("http")
                                  ? event.image
                                  : `http://localhost:3003${event.image}`
                                : "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&q=80&w=200&h=200"
                            }
                            alt={event.title}
                            className="w-12 h-12 rounded-lg object-cover shadow-sm bg-gray-100"
                          />
                          <div>
                            <p
                              className="font-semibold text-gray-800 line-clamp-1"
                              title={event.title}
                            >
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Type:{" "}
                              <span
                                className={`capitalize ${getEventStatusColor(event.eventtype)}`}
                              >
                                {event.eventtype}
                              </span>{" "}
                              | ID: {event.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarIcon className="w-4 h-4 text-saffron-500 shrink-0" />
                            <span className="whitespace-nowrap">
                              {new Date(event.eventdate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 text-xs text-gray-500 line-clamp-1"
                            title={`${event.address}, ${event.city}`}
                          >
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {event.city}, {event.state}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div
                          className="flex items-center justify-center cursor-pointer"
                          onClick={() => toggleStatus(event.id, event.status)}
                        >
                          <div
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${event.status === "active" ? "bg-saffron-500" : "bg-gray-300"}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${event.status === "active" ? "translate-x-6" : "translate-x-1"}`}
                            />
                          </div>
                          <span
                            className={`ml-2 text-xs font-semibold capitalize ${event.status === "active" ? "text-saffron-600" : "text-gray-500"}`}
                          >
                            {event.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4 text-gray-400" />
                          {event.partcipants?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button
                            onClick={() => navigate(`/events/${event.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && (
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
