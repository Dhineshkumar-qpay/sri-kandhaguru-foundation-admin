import React from 'react';
import { Save, Globe, Shield, Bell, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-500 mt-1">Manage global website settings and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {['General', 'Security', 'Notifications', 'Database Backup'].map((tab, i) => (
            <button 
              key={tab}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${i === 0 ? 'border-saffron-500 text-saffron-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8 space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Globe className="w-5 h-5 text-saffron-500" />
              Website Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Website Name</label>
                <input 
                  type="text" 
                  defaultValue="Sri Kandhaguru Foundation"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contact Email</label>
                <input 
                  type="email" 
                  defaultValue="contact@srikandhaguru.org"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">SEO Meta Description</label>
                <textarea 
                  rows={3}
                  defaultValue="Sri Kandhaguru Foundation is a spiritual organization dedicated to spreading the teachings of..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-saffron-500/30 transition-all active:scale-95">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
