import api from './api';
import type { ApiResponse } from '../types';

export interface CreateReminderPayload {
  leadId: string;
  title: string;
  note?: string;
  remindAt: string; // ISO string
}

export const reminderApi = {
  createReminder: async (
    payload: CreateReminderPayload
  ): Promise<ApiResponse> => {
    const response = await api.post('/leads/reminders', payload);
    return response.data;
  },

  getMyReminders: async () => {
    const response = await api.get('/leads/myreminders');
    return response.data;
  },
  };
  

