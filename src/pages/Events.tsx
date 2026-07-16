import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Maha Shivaratri Celebration',
    date: '2026-02-17',
    location: 'Main Ashram, Coimbatore',
    status: 'Upcoming',
    attendees: 1250,
    image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 2,
    title: 'Shiva Kriya Yogam Workshop',
    date: '2026-03-05',
    location: 'Online / Zoom',
    status: 'Published',
    attendees: 450,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 3,
    title: 'Annual Spiritual Retreat',
    date: '2026-04-12',
    location: 'Himalayas Base Camp',
    status: 'Draft',
    attendees: 0,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 4,
    title: 'Guru Purnima Darshan',
    date: '2026-07-21',
    location: 'Main Ashram, Coimbatore',
    status: 'Upcoming',
    attendees: 3000,
    image: 'https://images.unsplash.com/photo-1604160450925-0eecf561563f?auto=format&fit=crop&q=80&w=200&h=200'
  }
];

export default function Events() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Upcoming': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Published': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Event Management</h1>
          <p className="text-gray-500 mt-1">Create and manage spiritual events and retreats.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-saffron-500/30 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Create New Event
        </button>
      </div>

      {showForm ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Create New Event</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50" placeholder="e.g. Maha Shivaratri" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50" placeholder="e.g. Main Ashram" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input type="url" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50" placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium shadow-md shadow-saffron-500/20">Save Event</button>
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
              placeholder="Search events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">Event Details</th>
                <th className="px-6 py-4 font-medium">Date & Location</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Attendees</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_EVENTS.map((event, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={event.id} 
                  className="hover:bg-saffron-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={event.image} alt={event.title} className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                      <div>
                        <p className="font-semibold text-gray-800">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: #{event.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 text-saffron-500" />
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      {event.attendees.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50">
          <p>Showing 1 to 4 of 24 entries</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 bg-saffron-500 text-white rounded-md shadow-sm">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100">2</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100">3</button>
            <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-100">Next</button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
