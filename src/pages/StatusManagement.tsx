import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statusApi, leadApi } from '../lib/api';
import type { Status } from '../types';
import { Plus, Trash2, AlertTriangle, Tag, RefreshCw, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const StatusManagement: React.FC = () => {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [newStatusName, setNewStatusName] = useState('');
  const [addingStatus, setAddingStatus] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<Status | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const [statusResponse, leadsResponse] = await Promise.all([
        statusApi.getStatuses(),
        leadApi.getLeads({}, 1, 100000) // Fetch all leads to count statuses
      ]);
      
      if (statusResponse.success && statusResponse.data) {
        setStatuses(statusResponse.data);
      } else {
        toast.error('Failed to fetch statuses');
      }

      // Count leads per status
      if (leadsResponse.success && leadsResponse.data) {
        const counts: Record<string, number> = {};
        leadsResponse.data.forEach(lead => {
          counts[lead.status] = (counts[lead.status] || 0) + 1;
        });
        setStatusCounts(counts);
      }
    } catch (error) {
      toast.error('Failed to fetch statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStatusName.trim()) {
      toast.error('Please enter a status name');
      return;
    }

    try {
      setAddingStatus(true);
      const response = await statusApi.createStatus(newStatusName.trim());
      
      if (response.success) {
        toast.success('Status created successfully');
        setNewStatusName('');
        fetchStatuses();
      } else {
        toast.error(response.message || 'Failed to create status');
      }
    } catch (error) {
      toast.error('Failed to create status');
    } finally {
      setAddingStatus(false);
    }
  };

  const handleDeleteStatus = async () => {
    if (!deleteStatus) return;

    try {
      setDeleting(true);
      const response = await statusApi.deleteStatus(deleteStatus._id);
      
      if (response.success) {
        toast.success('Status deleted successfully');
        setDeleteStatus(null);
        fetchStatuses();
      } else {
        toast.error(response.message || 'Failed to delete status');
      }
    } catch (error) {
      toast.error('Failed to delete status');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Status Management</h1>
          <p className="text-gray-600 mt-2">
            Manage custom lead statuses for your CRM
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="btn btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Leads
          </button>
          <button
            onClick={fetchStatuses}
            className="btn btn-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Add New Status Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Add New Status</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleAddStatus} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter status name (e.g., 'Pending Review')"
                className="form-input"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                maxLength={50}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addingStatus || !newStatusName.trim()}
            >
              {addingStatus ? (
                <>
                  <div className="loading-spinner w-4 h-4 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Status
                </>
              )}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-2">
            Status names should be concise and descriptive (max 50 characters)
          </p>
        </div>
      </div>

      {/* Statuses List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Statuses ({statuses.length})</h2>
        </div>
        <div className="card-body">
          {statuses.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No statuses found</h3>
              <p className="text-gray-500">Add your first custom status to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statuses.map((status) => {
                const leadCount = statusCounts[status.name] || 0;
                const canDelete = leadCount === 0;
                
                return (
                  <div
                    key={status._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Tag className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {status.name} <span className="text-gray-500 font-normal">({leadCount})</span>
                          </h3>
                          {status.isDefault && (
                            <span className="text-xs text-gray-500 mt-1 inline-block">
                              Default Status
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => canDelete ? setDeleteStatus(status) : toast.error(`Cannot delete status with ${leadCount} lead${leadCount !== 1 ? 's' : ''}`)}
                        className={`p-1 ${
                          canDelete 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={canDelete ? 'Delete status' : `Cannot delete: ${leadCount} lead${leadCount !== 1 ? 's' : ''} using this status`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Important Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Statuses can only be deleted if no leads are using them</li>
                <li>• The number in brackets shows how many leads have that status</li>
                <li>• Once created, statuses will be available across all lead forms</li>
                <li>• Status changes are tracked in lead history</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Status
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete the status "<strong>{deleteStatus.name}</strong>"? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteStatus(null)}
                    className="btn btn-secondary"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStatus}
                    className="btn btn-danger"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <div className="loading-spinner w-4 h-4 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusManagement;
