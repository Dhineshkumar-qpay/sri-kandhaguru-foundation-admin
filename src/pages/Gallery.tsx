import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit2, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_GALLERY = [
  { id: 1, title: 'Temple Inauguration', subtitle: 'Auspicious opening ceremony.', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 2, title: 'Guru Purnima 2025', subtitle: 'Devotees gathering for blessings.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=200&h=200' }
];

export default function Gallery() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gallery Management</h1>
          <p className="text-gray-500 mt-1">Manage spiritual images and event photos.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-saffron-500/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add New Image
        </button>
      </div>

      {showForm ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Upload New Image</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Title</label>
                <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50" placeholder="e.g. Guru Purnima 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle / Caption</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50" placeholder="A brief description of the photo..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL / File</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-saffron-200 rounded-xl cursor-pointer bg-saffron-50/30 hover:bg-saffron-50/80 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-saffron-400 mb-2" />
                      <p className="text-sm text-gray-500"><span className="font-semibold text-saffron-600">Click to upload</span> or drag and drop</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 font-medium shadow-md shadow-saffron-500/20">Save Image</button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search gallery..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all text-sm" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">Image</th>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Subtitle</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_GALLERY.map((item, index) => (
                  <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} key={item.id} className="hover:bg-saffron-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover shadow-sm border border-gray-100" />
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{item.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[300px] truncate">{item.subtitle}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button className="p-2 text-gray-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
