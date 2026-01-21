import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  LogOut,
  ChevronDown,
  Bell
} from 'lucide-react';

/* ================= TYPES ================= */
interface Reminder {
  _id?: string;
  title: string;
  leadId?: string;
  reminderAt?: string;
  createdAt?: string;
}
interface HeaderProps {
  onToggleSidebar: () => void;
  reminders: Reminder[];
  refreshReminders?: () => void;
}



const now = new Date();

const isToday = (date: Date) =>
  date.toDateString() === now.toDateString();

const isPast = (date: Date) =>
  date.getTime() < now.getTime();

const groupReminders = (reminders: Reminder[]) => {
  const today: Reminder[] = [];
  const overdue: Reminder[] = [];
  const upcoming: Reminder[] = [];

  reminders.forEach(r => {
    if (!r.reminderAt) return;
    const date = new Date(r.reminderAt);

    if (isToday(date)) today.push(r);
    else if (isPast(date)) overdue.push(r);
    else upcoming.push(r);
  });

  return { today, overdue, upcoming };
};



/* ================= COMPONENT ================= */
const Header: React.FC<HeaderProps> = ({ onToggleSidebar, reminders }) => {
  const { today, overdue, upcoming } = groupReminders(reminders);

  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // const [showReminders, setShowReminders] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const reminderRef = useRef<HTMLDivElement>(null);

  /* ========== CLOSE DROPDOWNS ON OUTSIDE CLICK ========== */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }

    // ❌ remove reminderRef logic completely

    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ========== LOGOUT ========== */
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /* ================= UI ================= */
  return (
    <header className="header flex items-center justify-between">
  
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={onToggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* 🔔 REMINDER BELL */}
        <div className="relative" ref={reminderRef}>
          <button
            onClick={() => setShowReminderModal(true)}

            className="relative p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Bell className="w-5 h-5 text-gray-600" />

            {reminders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                {reminders.length}
              </span>
            )}
          </button>

     
        </div>

        {/* 👤 PROFILE */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            className="flex items-center gap-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsProfileOpen(prev => !prev)}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>

            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-400 capitalize mt-1">
                  {user?.role} Account
                </p>
              </div>

              <div className="border-t border-gray-100 py-1">
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setIsProfileOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      {showReminderModal && (
  <div
    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
    onClick={() => setShowReminderModal(false)}
  >
    <div
      className="bg-white w-full max-w-lg rounded-xl shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-gray-900">⏰ Reminders</h3>
        <button
          className="text-gray-500 hover:text-gray-800"
          onClick={() => setShowReminderModal(false)}
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="max-h-[70vh] overflow-y-auto">

        {/* OVERDUE */}
        {overdue.length > 0 && (
          <>
            <div className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50">
              ⛔ Overdue
            </div>
            {overdue.map((r, i) => (
              <ReminderItem key={`overdue-${i}`} reminder={r} />
            ))}
          </>
        )}

        {/* TODAY */}
        {today.length > 0 && (
          <>
            <div className="px-4 py-2 text-xs font-semibold text-orange-600 bg-orange-50">
              📅 Today
            </div>
            {today.map((r, i) => (
              <ReminderItem key={`today-${i}`} reminder={r} />
            ))}
          </>
        )}

        {/* UPCOMING */}
        {upcoming.length > 0 && (
          <>
            <div className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50">
              🔔 Upcoming
            </div>
            {upcoming.map((r, i) => (
              <ReminderItem key={`upcoming-${i}`} reminder={r} />
            ))}
          </>
        )}

        {reminders.length === 0 && (
          <div className="p-6 text-sm text-gray-500 text-center">
            No reminders
          </div>
        )}
      </div>
    </div>
  </div>
)}

</header>  );
};
export const ReminderItem: React.FC<{ reminder: Reminder }> = ({ reminder }) => {
  return (
    <div className="px-4 py-3 border-b hover:bg-gray-50">
      <div className="text-sm font-medium text-gray-900">
        {reminder.title}
      </div>

      <div className="text-xs text-gray-500">
        {reminder.reminderAt
          ? new Date(reminder.reminderAt).toLocaleString()
          : ''}
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 mt-2 text-xs">

        {/* ✅ Mark Done */}
        <button
          className="text-green-600 hover:underline"
          onClick={() => {
            console.log('Mark done', reminder._id);
          }}
        >
          ✅ Done
        </button>

        {/* 🔄 Repeat */}
        <button
          className="text-purple-600 hover:underline"
          onClick={() => {
            console.log('Repeat reminder', reminder._id);
          }}
        >
          🔄 Repeat
        </button>

      </div>
    </div>
  );
};


export default Header;
