import api from './api';
import type { ApiResponse } from '../types';

export interface CreateReminderPayload {
  leadId: string;
  title: string;
  note?: string;
  remindAt: string; // ISO string
}

export interface UpdateReminderPayload {
  action: 'done' | 'snooze';
  snoozeUntil?: string; // optional, only for snooze
}

export interface UpdateReminderDetailsPayload {
  title: string;
  note?: string;
  reminderAt: string;
}

export const reminderApi = {
  /* ================= CREATE ================= */
  createReminder: async (
    payload: CreateReminderPayload
  ): Promise<ApiResponse> => {
    const response = await api.post('/reminders', payload);
    return response.data;
  },

  /* ================= GET ALL MY REMINDERS ================= */
  getMyReminders: async (): Promise<ApiResponse> => {
    const response = await api.get('/reminders/my');
    return response.data;
  },

  /* ================= DELETE ================= */
  deleteReminder: async (reminderId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/reminders/${reminderId}`);
    return response.data;
  },

  /* ================= UPDATE STATUS/SNOOZE ================= */
  updateReminder: async (
    reminderId: string,
    payload: UpdateReminderPayload
  ): Promise<ApiResponse> => {
    // Format based on your backend expectations
    const requestBody = payload.action === 'done' 
      ? { action: 'done' }
      : { action: 'snooze', snoozeUntil: payload.snoozeUntil };
    
    const response = await api.patch(`/reminders/${reminderId}`, requestBody);
    return response.data;
  },

  /* ================= UPDATE REMINDER DETAILS ================= */
  updateReminderDetails: async (
    reminderId: string,
    payload: UpdateReminderDetailsPayload
  ): Promise<ApiResponse> => {
    const response = await api.put(`/reminders/${reminderId}`, {
      title: payload.title,
      note: payload.note,
      reminderAt: payload.reminderAt
    });
    return response.data;
  },

  /* ================= GET SINGLE REMINDER ================= */
  getReminder: async (reminderId: string): Promise<ApiResponse> => {
    const response = await api.get(`/reminders/${reminderId}`);
    return response.data;
  },

  /* ================= TEST SNOOZE API ================= */
  testSnooze: async (reminderId: string): Promise<ApiResponse> => {
    try {
      console.log('Testing snooze for reminder:', reminderId);
      
      // First, get current reminder
      const current = await api.get(`/reminders/${reminderId}`);
      console.log('Current reminder:', current.data);
      
      // Calculate snooze time
      const currentTime = current.data.data?.reminderAt || current.data.data?.remindAt;
      const fromDate = currentTime ? new Date(currentTime) : new Date();
      const oneHourLater = new Date(fromDate.getTime() + 60 * 60 * 1000);
      oneHourLater.setSeconds(0, 0);
      const snoozeUntil = oneHourLater.toISOString();
      
      console.log('Snoozing from:', fromDate.toISOString());
      console.log('Snoozing to:', snoozeUntil);
      
      // Snooze it
      const response = await api.patch(`/reminders/${reminderId}`, {
        action: 'snooze',
        snoozeUntil
      });
      
      console.log('Snooze response:', response.data);
      
      // Get updated reminder
      const updated = await api.get(`/reminders/${reminderId}`);
      console.log('Updated reminder:', updated.data);
      
      return {
        success: true,
        message: 'Test completed',
        data: {
          before: current.data.data,
          after: updated.data.data
        }
      };
    } catch (error) {
      console.error('Snooze test error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        // Remove 'error' property if your ApiResponse doesn't support it
        // Or use 'errors' if that's what your type expects
      };
    }
  },
};