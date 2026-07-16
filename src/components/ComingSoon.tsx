import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-elegant border border-saffron-50 max-w-md w-full"
      >
        <div className="w-16 h-16 bg-saffron-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-saffron-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-500">
          This module is currently under development. Check back soon for updates.
        </p>
      </motion.div>
    </div>
  );
}
