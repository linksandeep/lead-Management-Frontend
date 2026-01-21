import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import socket from '../lib/socket';
import toast from 'react-hot-toast';
import { reminderApi } from '../lib/reminderApi';
interface Reminder {
  _id?: string;
  title: string;
  leadId?: string;
  reminderAt?: string;
  createdAt?: string;
}

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await reminderApi.getMyReminders();
  
        if (res.success && Array.isArray(res.data)) {
          const normalized = res.data.map((r: any) => ({
            ...r,
            reminderAt: r.remindAt, // 🔥 FIX HERE
          }));
  
          setReminders(normalized);
        }
      } catch (err) {
        console.error('Failed to fetch reminders', err);
      }
    };
  
    if (isAuthenticated) {
      fetchReminders();
    }
  }, [isAuthenticated]);
  
  
  /* ================= 🔔 SOCKET REMINDER LISTENER ================= */
  useEffect(() => {
    if (!user?._id) return;
  
    console.log('🟢 Connecting socket for user:', user._id);
  
    socket.connect();
  
    socket.emit('join', user._id);
  
    socket.on('reminder', (data) => {
      console.log('🔔 Reminder received:', data);
  
      new Audio('/notification.mp3').play();
      setReminders(prev => [data, ...prev]);
  
      toast(`⏰ Reminder: ${data.title}`);
    });
  
    return () => {
      socket.off('reminder');
      socket.disconnect();
    };
  }, [user]);
  

  /* ================= LOADING ================= */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-8 h-8 text-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  /* ================= PUBLIC ROUTES ================= */
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  /* ================= MAIN LAYOUT ================= */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleCloseSidebar}
        />
      )}

      {/* Header (PASS REMINDERS) */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        reminders={reminders}
      />

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
