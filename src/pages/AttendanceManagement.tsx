import React, { useEffect, useState } from "react";
import { attendanceApi } from "../lib/api";
import { 
  Users, Calendar, ChevronLeft, ChevronRight, Eye, 
  Clock, UserCheck, AlertCircle, LogIn, LogOut, Filter, Download, XCircle, TrendingUp,
  CalendarDays, Moon
} from 'lucide-react';
import EmployeeReportDrawer from "./EmployeeReportDrawer";

const AttendanceManagement: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];

  const [_loading, setLoading] = useState(false);
  const [_reportData, setReportData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null); // Add summary state
  const [records, setRecords] = useState<any[]>([]);
  const [userGrandTotals, setUserGrandTotals] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '2026-02-11',
    to: today,
  });
  const [_selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
// Inside AttendanceManagement component
const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  // Fetch data with admin report API
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getAdminReport(dateRange.from, dateRange.to, page, limit);
      
      console.log("API Response:", res);
      
      if (res.success && res.report) {
        setReportData(res);
        
        // Use the summary directly from API response
        setSummary(res.summary);
        
        // Set user grand totals for top performers
        setUserGrandTotals(res.userGrandTotals || []);
        
        // Flatten records for table display with date information
        const flatRecords: any[] = [];
        Object.entries(res.report).forEach(([date, records]: [string, any]) => {
          (records as any[]).forEach((record) => {
            flatRecords.push({
              ...record,
              displayDate: date,
              dateObj: new Date(date),
              formattedDate: formatDisplayDate(date),
              firstSession: record.sessions?.[0] || {},
              lastSession: record.sessions?.[record.sessions.length - 1] || {},
            });
          });
        });
        
        // Sort by date (newest first)
        flatRecords.sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());
        
        setRecords(flatRecords);
        
        // Set pagination
        setPagination(res.pagination || {
          currentPage: page,
          totalPages: 1,
          totalDates: Object.keys(res.report).length,
          limit: limit
        });
        
      } else {
        setReportData(null);
        setSummary(null);
        setRecords([]);
        setUserGrandTotals([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setReportData(null);
      setSummary(null);
      setRecords([]);
      setUserGrandTotals([]);
      setPagination(null);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchData();
  }, [page, limit]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchData();
  };

  const handleFromDateChange = (value: string) => {
    setDateRange((d) => ({ ...d, from: value }));
  };

  const handleToDateChange = (value: string) => {
    setDateRange((d) => ({ ...d, to: value }));
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const toggleDateExpand = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };



  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString([], { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (record: any) => {
    if (record.status === "Active" || record.lastCheckOut === "Active") {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active
      </span>;
    }
    if (record.status === "Auto-logout" || record.lastCheckOut?.includes("Auto")) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
        <Moon size={12} /> Auto Logout
      </span>;
    }
    if (record.status === "Present") {
      return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
        <UserCheck size={12} /> Present
      </span>;
    }
    if (record.status === "Late") {
      return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
        <AlertCircle size={12} /> Late
      </span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
      <XCircle size={12} /> Absent
    </span>;
  };

  const getCheckOutDisplay = (record: any) => {
    const lastCheckOut = record.lastCheckOut;
    
    if (!lastCheckOut) return null;
    if (lastCheckOut === "Active") {
      return <span className="text-green-600 font-medium">Active Session</span>;
    }
    if (lastCheckOut.includes("Auto")) {
      return <span className="text-orange-600 font-medium flex items-center gap-1">
        <Moon size={12} /> Auto-closed
      </span>;
    }
    return formatTime(lastCheckOut);
  };

  const uniqueDates = [...new Set(records.map(r => r.displayDate))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Attendance Management</h1>
                <p className="text-xs text-gray-500 mt-0.5">Track employee attendance in real-time</p>
              </div>
            </div>
            
            {/* Date Range Display */}
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
              <CalendarDays size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {formatDisplayDate(dateRange.from)} - {formatDisplayDate(dateRange.to)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">From Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.from}
                  max={dateRange.to}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">To Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.to}
                  min={dateRange.from}
                  max={today}
                  onChange={(e) => handleToDateChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="w-32">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Show</label>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} entries
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleApplyFilters}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 font-medium text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Top Summary Cards - Using API summary */}
        {summary && (
          <>
            <div className="grid grid-cols-5 gap-5 mb-8">
              <StatCard 
                title="Total Employees" 
                value={summary.totalEmployees || 0} 
                icon={Users}
                color="blue"
              />
              <StatCard 
                title="Present Today" 
                value={summary.presentToday || 0} 
                icon={UserCheck}
                color="green"
                subtitle={`${Math.round(((summary.presentToday || 0) / (summary.totalEmployees || 1)) * 100)}% of total`}
              />
              <StatCard 
                title="Present Now" 
                value={summary.presentRightNow || 0} 
                icon={Clock}
                color="purple"
                subtitle="Currently active"
              />
              <StatCard 
                title="Late Arrivals" 
                value={summary.lateToday || 0} 
                icon={AlertCircle}
                color="orange"
                subtitle="Auto-logout or late"
              />
              <StatCard 
                title="Absent" 
                value={summary.absentToday || 0} 
                icon={XCircle}
                color="red"
                subtitle="No show today"
              />
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-5 mb-8">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Attendance Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(((summary.presentToday || 0) / (summary.totalEmployees || 1)) * 100)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-blue-600" size={24} />
                  </div>
                </div>
                <div className="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                    style={{ width: `${Math.round(((summary.presentToday || 0) / (summary.totalEmployees || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">On-Time Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.presentToday > 0 
                        ? Math.round(((summary.presentToday - (summary.lateToday || 0)) / summary.presentToday) * 100) 
                        : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Clock className="text-green-600" size={24} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {(summary.presentToday - (summary.lateToday || 0))} out of {summary.presentToday} on time
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Absentee Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(((summary.absentToday || 0) / (summary.totalEmployees || 1)) * 100)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <XCircle className="text-red-600" size={24} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {summary.absentToday || 0} employees absent
                </p>
              </div>
            </div>
          </>
        )}

        {/* Top Performers Section */}
        {userGrandTotals.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Top Performers (Total Hours)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userGrandTotals.slice(0, 4).map((user, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {user.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                    <p className="text-xs text-gray-500">{user.totalHoursInRange}h total • {user.autoLogoutHours}h auto</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Navigation */}
        {uniqueDates.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <span className="text-xs font-medium text-gray-500">Jump to date:</span>
            {uniqueDates.map((date) => (
              <button
                key={date}
                onClick={() => {
                  const element = document.getElementById(`date-${date}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-blue-50 hover:border-blue-200 transition-colors whitespace-nowrap"
              >
                {formatDisplayDate(date)}
              </button>
            ))}
          </div>
        )}

        {/* Attendance Records by Date */}
        {uniqueDates.map((date) => {
          const dateRecords = records.filter(r => r.displayDate === date);
          const isExpanded = expandedDates.has(date);
          const displayRecords = isExpanded ? dateRecords : dateRecords.slice(0, 3);
          
          return (
            <div key={date} id={`date-${date}`} className="mb-8 scroll-mt-20">
              {/* Date Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <CalendarDays size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{formatDisplayDate(date)}</h2>
                    <p className="text-xs text-gray-500">{date} • {dateRecords.length} records</p>
                  </div>
                </div>
                {dateRecords.length > 3 && (
                  <button
                    onClick={() => toggleDateExpand(date)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {isExpanded ? 'Show Less' : `Show All (${dateRecords.length})`}
                  </button>
                )}
              </div>

              {/* Records Table for this Date */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <LogIn size={12} />
                            Check In
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <LogOut size={12} />
                            Check Out
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {_loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          </td>
                        </tr>
                      ) : displayRecords.map((record, idx) => (
                        <tr key={`${record.userEmail}-${date}-${idx}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
  <div 
    className="flex items-center gap-3 cursor-pointer group"
    onClick={() => setSelectedEmployeeId(record.userId)}
  >
    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm">
      {record.userName?.charAt(0).toUpperCase()}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{record.userName}</p>
      <p className="text-xs text-gray-500">{record.userEmail}</p>
    </div>
  </div>
</td>
                          <td className="px-6 py-4">
                            {getStatusBadge(record)}
                          </td>
                          <td className="px-6 py-4">
                            {record.firstSession?.checkIn ? (
                              <span className="text-sm text-gray-900">{formatTime(record.firstSession.checkIn)}</span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {getCheckOutDisplay(record) || <span className="text-sm text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{record.totalWorkHours || 0}h</span>
                              <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${Math.min(((record.totalWorkHours || 0) / 8) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedUserId(record.userId)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}

        {/* Global Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
              <span className="font-medium">{pagination.totalPages}</span> • 
              <span className="ml-1">{pagination.totalDates} total dates</span>
            </p>

            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium">
                Page {page}
              </span>

              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Export Button */}
        {records.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Download size={16} />
              Export Report
            </button>
          </div>
        )}
      </div>
      {/* ADD THIS AT THE BOTTOM OF YOUR MAIN DIV */}
      {selectedEmployeeId && (
        <EmployeeReportDrawer 
          userId={selectedEmployeeId} 
          onClose={() => setSelectedEmployeeId(null)} 
          dateRange={dateRange}
        />
      )}
    </div>
  );
};

// Enhanced Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => {
  const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100' },
  };

  const selectedColor = colors[color] || colors.blue;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
        </div>
        <div className={`${selectedColor.iconBg} p-3 rounded-xl`}>
          <Icon className={selectedColor.text} size={20} />
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;