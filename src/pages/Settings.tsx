import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';
import { 
  User,
  Save,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Password visibility states
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile if name changed
      if (profileData.name !== user?.name) {
        const response = await authApi.updateProfile({
          name: profileData.name
        });
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to update profile');
        }
        
        toast.success('Profile updated successfully');
      }
      
      // Change password if provided
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          toast.error('New passwords do not match');
          return;
        }
        
        if (!profileData.currentPassword) {
          toast.error('Current password is required');
          return;
        }
        
        const response = await authApi.changePassword({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        });
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to change password');
        }
        
        toast.success('Password changed successfully');
        
        // Clear password fields
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDangerReset = async () => {
    if (resetConfirmText !== 'RESET') {
      toast.error('Please type "RESET" to confirm');
      return;
    }

    setResetLoading(true);
    try {
      const response = await authApi.dangerReset();
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset system');
      }
      
      toast.success('System reset successfully! All leads and users (except the current user) have been removed.');
      setShowResetConfirm(false);
      setResetConfirmText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset system');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Profile Information</h3>
          </div>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input bg-gray-50"
                value={profileData.email}
                disabled
                title="Email cannot be changed"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    className="form-input pr-10"
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    className="form-input pr-10"
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    className="form-input pr-10"
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {profileData.newPassword && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Password must be at least 6 characters long. You will need to sign in again after changing your password.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone - Admin Only */}
      {user?.role === 'admin' && (
        <div className="card border-red-200">
          <div className="card-header border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Danger Zone</h3>
            </div>
            <p className="text-sm text-red-600 mt-1">
              These actions cannot be undone. Please proceed with caution.
            </p>
          </div>
          
          <div className="card-body">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">Reset System Data</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This will permanently delete all leads and remove all users except the current user. 
                    This action cannot be undone.
                  </p>
                  
                  {!showResetConfirm ? (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Reset System Data
                    </button>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-red-900 mb-2">
                          Type "RESET" to confirm:
                        </label>
                        <input
                          type="text"
                          value={resetConfirmText}
                          onChange={(e) => setResetConfirmText(e.target.value)}
                          className="form-input max-w-xs"
                          placeholder="Type RESET"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleDangerReset}
                          disabled={resetLoading || resetConfirmText !== 'RESET'}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {resetLoading ? (
                            <>
                              <div className="loading-spinner mr-2"></div>
                              Resetting...
                            </>
                          ) : (
                            'Confirm Reset'
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowResetConfirm(false);
                            setResetConfirmText('');
                          }}
                          disabled={resetLoading}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;