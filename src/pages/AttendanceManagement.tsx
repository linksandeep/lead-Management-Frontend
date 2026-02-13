import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../lib/api';
import { Users, FileText, Search, UserCheck, Clock, AlertCircle, BarChart3, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const AttendanceManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'admin' | 'summary'>('admin');
  
  // Data States
  const [adminReport, setAdminReport] = useState<any>(null); // For /admin/report
  const [dailySummary, setDailySummary] = useState<any>(null); // For /report
  
  const [dateRange, setDateRange] = useState({
    from: '2026-02-11',
    to: '2026-02-12'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Admin Detailed Report (Grouped by Date)
      const adminRes = await attendanceApi.getAdminReport(dateRange.from, dateRange.to);
      if (adminRes.success) {
        setAdminReport(adminRes.report); // Mapping to "report" key from your JSON
      }

      // 2. Fetch Today's General Summary
      const summaryRes = await attendanceApi.getUserReport();
      if (summaryRes.success) {
        setDailySummary(summaryRes.data); // Mapping to "data" key from your JSON
      }
    } catch (error) {
      toast.error('Failed to sync with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to flatten the grouped report for the table
  const getFlattenedReport = () => {
    if (!adminReport) return [];
    return Object.entries(adminReport).flatMap(([date, records]: [string, any]) => 
      records.map((r: any) => ({ ...r, displayDate: date }))
    );
  };

  const flattenedData = getFlattenedReport();

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="text-blue-600" /> Attendance Control
          </h1>
          <p className="text-gray-500 text-sm">Managing {dailySummary?.summary?.totalEmployees || 0} employees</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-gray-50 border rounded-lg px-3 py-1">
            <Calendar size={16} className="text-gray-400 mr-2" />
            <input 
              type="date" value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="bg-transparent border-none text-sm focus:ring-0"
            />
            <span className="mx-2 text-gray-300">|</span>
            <input 
              type="date" value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="bg-transparent border-none text-sm focus:ring-0"
            />
            <button onClick={fetchData} className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS CARDS */}
      {dailySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Staff" value={dailySummary.summary.totalEmployees} icon={<Users />} color="blue" />
          <StatCard title="Present Now" value={dailySummary.summary.presentRightNow} icon={<Clock />} color="green" />
          <StatCard title="Late Today" value={dailySummary.summary.lateToday} icon={<AlertCircle />} color="orange" />
          <StatCard title="Absent" value={dailySummary.summary.absentToday} icon={<Users />} color="red" />
        </div>
      )}

      {/* MAIN DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Attendance Log</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setView('admin')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'admin' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              Admin Report
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Work Hours</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Last Check-Out</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center text-gray-400">Loading Report...</td></tr>
              ) : flattenedData.length > 0 ? (
                flattenedData.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                          {record.userName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{record.userName}</p>
                          <p className="text-xs text-gray-400">{record.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.displayDate}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">
                        {record.totalWorkHours}h
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${record.lastCheckOut.includes('Auto') ? 'text-orange-600' : 'text-gray-600'}`}>
                        {record.lastCheckOut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 transition-colors">
                        <BarChart3 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="py-20 text-center text-gray-400">No data found for these dates.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, icon, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default AttendanceManagement;