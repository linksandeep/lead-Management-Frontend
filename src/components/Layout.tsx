import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import socket from '../lib/socket';
import toast from 'react-hot-toast';
import { reminderApi } from '../lib/reminderApi';
import ReminderNotification from '../pages/ReminderNotification';

interface Reminder {
  _id: string;
  title: string;
  note?: string;
  reminderAt?: string;
  createdAt?: string;
  lead?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggeredReminder, setTriggeredReminder] = useState<Reminder | null>(null);
  const [showReminderPopup, setShowReminderPopup] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  /* ================= FETCH REMINDERS ================= */
  const fetchReminders = async () => {
    if (!isAuthenticated) return;
    
    setIsRefreshing(true);
    try {
      const res = await reminderApi.getMyReminders();
  
      if (res.success && Array.isArray(res.data)) {
        const normalized = res.data.map((r: any) => ({
          _id: r._id,
          title: r.title,
          note: r.note,
          reminderAt: r.remindAt || r.reminderAt,
          createdAt: r.createdAt,
          lead: r.lead
        }));
  
        setReminders(normalized);
      }
    } catch (err) {
      console.error('Failed to fetch reminders', err);
      toast.error('Failed to load reminders');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReminders();
    }
  }, [isAuthenticated]);

  //add from here

  /* ================= HANDLE REMINDER POPUP ================= */
  const handleMarkDoneFromPopup = async (reminderId: string) => {
    try {
      const res = await reminderApi.updateReminder(reminderId, { action: 'done' } as const);
      if (res.success) {
        toast.success('Reminder marked as done');
        setShowReminderPopup(false);
        setTriggeredReminder(null);
        fetchReminders(); // Refresh the list
      }
    } catch (error) {
      console.error('Error marking reminder as done:', error);
      toast.error('Failed to mark reminder as done');
    }
  };

  const handleSocketReminder = (data: any) => {
    console.log('🔔 Reminder received via socket:', data);

    // Play notification sound
    try {
      new Audio('/notification.mp3').play();
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
    console.log("tgis is ren by Play notification sound" , data)

    // Set the triggered reminder and show popup
    const newReminder: Reminder = {
      _id: data.reminderId,
      title: data.title,
      note: data.note,
      reminderAt: data.reminderAt,
      createdAt: data.createdAt,
      lead: data.lead
    };
     console.log("tgis is ren by 2" , newReminder)

    setTriggeredReminder(newReminder);
    setShowReminderPopup(true);

    // Also add to reminders list
    setReminders(prev => {
      const exists = prev.find(r => r._id === data._id);
      if (exists) return prev;
      return [newReminder, ...prev];
    });

    // Show toast too
    toast.success(`🔔 ${data.title}`, {
      duration: 5000,
      icon: '⏰',
    });
  };
// to here 


  /* ================= 🔔 SOCKET REMINDER LISTENER ================= */
  useEffect(() => {
    if (!user?._id) return;
  
    if (!socket.connected) {
      socket.connect();
    }
  
    const handleConnect = () => {
      socket.emit('join', user._id);
      console.log(' Socket connected & joined user room:', user._id);
    };

    const handleReminderUpdate = (data: any) => {
      console.log('🔄 Reminder updated:', data);
      
      // Update the specific reminder in the list
      setReminders(prev => prev.map(r => {
        if (r._id === data._id) {
          const updatedReminderAt = data.remindAt || data.reminderAt || r.reminderAt;
          
          return {
            ...r,
            title: data.title || r.title,
            note: data.note !== undefined ? data.note : r.note,
            reminderAt: updatedReminderAt,
            lead: data.lead || r.lead
          };
        }
        return r;
      }));
    };

    const handleReminderDelete = (reminderId: string) => {
      console.log('🗑️ Reminder deleted via socket:', reminderId);
      
      // Remove the deleted reminder from the list
      setReminders(prev => prev.filter(r => r._id !== reminderId));
    };

    // Socket event listeners
    socket.on('connect', handleConnect);
    socket.on('reminder', handleSocketReminder); // Changed to handleSocketReminder
    socket.on('reminder:update', handleReminderUpdate);
    socket.on('reminder:delete', handleReminderDelete);
    socket.on('reminder:done', (data) => {
      console.log('✅ Reminder marked as done:', data);
      setReminders(prev => prev.filter(r => r._id !== data._id));
    });
    socket.on('reminder:snooze', (data) => {
      console.log('⏰ Reminder snoozed via socket:', data);
      
      // Update the reminder with new snooze time
      setReminders(prev => prev.map(r => {
        if (r._id === data._id) {
          const newReminderTime = data.snoozeUntil || data.remindAt || data.reminderAt;
          return {
            ...r,
            reminderAt: newReminderTime || r.reminderAt
          };
        }
        return r;
      }));
    });
    
    // Join user's room
    socket.emit('join', user._id);

    return () => {
      // Clean up all socket listeners
      socket.off('connect', handleConnect);
      socket.off('reminder', handleSocketReminder);
      socket.off('reminder:update', handleReminderUpdate);
      socket.off('reminder:delete', handleReminderDelete);
      socket.off('reminder:done');
      socket.off('reminder:snooze');
      
      // Leave room when component unmounts
      socket.emit('leave', user._id);
    };
  }, [user?._id]);
console.log(reminders , "ren by sokeit")
  /* ================= HANDLE REFRESH ================= */
  const handleRefreshReminders = () => {
    fetchReminders();
    toast.success('Reminders refreshed');
  };

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

      {/* Header with refresh functionality */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        reminders={reminders}
        refreshReminders={handleRefreshReminders}
      />

      {/* Reminder Notification Popup */}
      {showReminderPopup && triggeredReminder && (
      
        <ReminderNotification
          reminder={triggeredReminder}
          onClose={() => {
            setShowReminderPopup(false);
            setTriggeredReminder(null);
          }}
          onMarkDone={handleMarkDoneFromPopup}
        />
      )}

      {/* Optional: Show refreshing indicator */}
      {isRefreshing && (
        <div className="fixed top-16 right-4 z-30 bg-blue-500 text-white px-3 py-1 rounded-full text-xs animate-pulse">
          Refreshing reminders...
        </div>
      )}

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;