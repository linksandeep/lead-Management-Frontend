import { useEffect, useState, useCallback } from "react";
import { 
  X, Calendar, Clock, UserCheck, TrendingUp, 
  Target, Filter, BarChart3, Moon, RefreshCcw 
} from "lucide-react";
import { performance } from "../lib/api";

interface Props {
  userId: string | null;
  onClose: () => void;
  // Add this line to fix the error
  dateRange: { from: string; to: string }; 
}

const EmployeeReportDrawer = ({ userId, onClose }: Props) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Performance');
  
  // 1. Internal state for input fields (Drafts)
  const [tempFilters, setTempFilters] = useState({
    range: 'month',
    from: '',
    to: ''
  });

  // 2. State that actually triggers the API fetch
  const [activeFilters, setActiveFilters] = useState({
    range: 'month',
    from: '',
    to: ''
  });

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Passes userId and the active filter object to your API library
      const res = await performance.getUserPerformance(userId, activeFilters);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, activeFilters]);

  // Re-fetch only when userId or applied filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilters = () => {
    setActiveFilters({ ...tempFilters });
  };

  const handleQuickRange = (range: string) => {
    const newFilters = { range, from: '', to: '' };
    setTempFilters(newFilters);
    setActiveFilters(newFilters); // Quick ranges apply immediately
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-gray-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Section */}
        <div className="bg-white p-6 border-b flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {data?.userDetails?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{data?.userDetails?.name || 'Loading...'}</h2>
              <p className="text-sm text-gray-500 font-medium">{data?.userDetails?.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- ADVANCED FILTER BAR --- */}
        <div className="bg-white px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Quick Range Selector */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              {['week', 'month', 'year'].map((r) => (
                <button
                  key={r}
                  onClick={() => handleQuickRange(r)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    tempFilters.range === r ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200 hidden md:block" />

            {/* Date Inputs */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
              <Calendar size={14} className="text-gray-400" />
              <input 
                type="date" 
                value={tempFilters.from}
                className="text-xs border-none bg-transparent focus:ring-0 font-medium p-0 w-28" 
                onChange={(e) => setTempFilters({...tempFilters, from: e.target.value, range: ''})}
              />
              <span className="text-gray-300 font-bold">→</span>
              <input 
                type="date" 
                value={tempFilters.to}
                className="text-xs border-none bg-transparent focus:ring-0 font-medium p-0 w-28" 
                onChange={(e) => setTempFilters({...tempFilters, to: e.target.value, range: ''})}
              />
            </div>
          </div>

          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100"
          >
            <Filter size={14} />
            Apply Filter
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white px-6 border-b">
          {['Performance', 'Attendance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-8 text-sm font-bold border-b-2 transition-all ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <RefreshCcw className="animate-spin text-blue-600" size={32} />
              <p className="text-sm text-gray-400 font-medium">Analyzing data...</p>
            </div>
          ) : !data ? (
            <div className="h-full flex items-center justify-center text-gray-400">No data available for this range</div>
          ) : (
            <>
              {activeTab === 'Performance' ? (
                <div className="space-y-6">
                  {/* Performance Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <MetricCard icon={Target} label="Assigned" value={data.leadPerformance?.totalAssigned || 0} color="blue" />
                    <MetricCard icon={UserCheck} label="Closed" value={data.leadPerformance?.totalClosed || 0} color="green" />
                    <MetricCard icon={BarChart3} label="Conversion" value={data.leadPerformance?.conversionRate || '0%'} color="purple" />
                  </div>

                  {/* Pipeline Breakdown Progress Bars */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wider">
                      <TrendingUp size={16} className="text-blue-500" /> Pipeline Status
                    </h3>
                    <div className="space-y-5">
                      {data.leadPerformance?.statuses?.map((s: any, i: number) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="font-bold text-gray-600 uppercase tracking-tighter">{s.status}</span>
                            <span className="font-black text-gray-900">{s.count}</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out" 
                              style={{ width: `${(s.count / (data.leadPerformance.totalAssigned || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                   {/* Attendance Summary HUD */}
                   <div className="grid grid-cols-2 gap-4">
                    <MetricCard icon={Clock} label="Working Hours" value={`${data.attendanceReport?.totalWorkingHours || '0.00'}h`} color="orange" />
                    <MetricCard icon={UserCheck} label="Days Present" value={data.attendanceReport?.presentDays || 0} color="green" />
                  </div>

                  {/* Monthly Logs Table */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 bg-gray-50/50 border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-widest">Attendance Logs</div>
                    <div className="divide-y divide-gray-50">
                      {data.attendanceReport?.logs?.length > 0 ? data.attendanceReport.logs.map((log: any, i: number) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors group">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                               <Calendar size={16}/>
                             </div>
                             <span className="text-sm font-bold text-gray-700">{log.date}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black px-3 py-1 bg-green-100 text-green-700 rounded-lg">{log.hours}h</span>
                          </div>
                        </div>
                      )) : (
                        <div className="p-16 text-center text-gray-400 flex flex-col items-center gap-2">
                          <Moon size={32} className="text-gray-200" />
                          <p className="text-sm font-medium">No logs found for this period</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Internal Metric Card Component
const MetricCard = ({ icon: Icon, label, value, color }: any) => {
  const styles: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md">
      <div className={`p-3 rounded-2xl mb-3 ${styles[color]}`}><Icon size={20} /></div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  );
};

export default EmployeeReportDrawer;