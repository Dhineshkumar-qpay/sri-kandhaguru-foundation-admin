import React, { useState, useEffect } from "react";
import { User, Shield, Bell, Database } from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";

interface UserProfile {
  userid: number;
  username: string;
  email: string;
  userType: string;
  createdAt: string;
  updatedAt: string;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.post("/admin/get");
      if (response.data?.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage global website settings and view your profile.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-elegant border border-saffron-50/50 overflow-hidden">
        <div className="p-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-saffron-500" />
              User Profile
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : profile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Username</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {profile.username}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Email Address
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {profile.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">User Type</p>
                  <div className="inline-block px-3 py-1 bg-saffron-100 text-saffron-700 rounded-full text-sm font-semibold capitalize mt-1">
                    {profile.userType}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Account Created
                  </p>
                  <p className="text-md font-medium text-gray-800">
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Failed to load profile data.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
