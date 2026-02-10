import React, { useEffect, useState } from 'react';
import { Lock, Clock, X } from 'lucide-react';

const RestrictedPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 📍 Listen for the event dispatched from handleError
    const handleShow = (event: any) => {
      setMessage(event.detail.message);
      setIsOpen(true);
    };

    window.addEventListener('showRestrictedAccess', handleShow);
    return () => window.removeEventListener('showRestrictedAccess', handleShow);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-orange-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setIsOpen(false);
                // 📍 Trigger your Clock In logic here (e.g., scroll to header)
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center justify-center gap-2 w-full py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
            >
              <Clock className="w-5 h-5" />
              Go to Clock In
            </button>
            
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestrictedPopup;