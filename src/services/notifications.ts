import api from '../lib/api';
import { ENDPOINTS } from '../constants/api';
import type { ApiResponse } from '../types';

export interface RegisterDevicePayload {
  token: string;
  platform: 'ios' | 'android';
  device_name?: string | null;
}

export async function registerDevice(payload: RegisterDevicePayload): Promise<void> {
  await api.post(ENDPOINTS.notifications.registerDevice, payload);
}

export async function unregisterDevice(token: string): Promise<void> {
  await api.delete(ENDPOINTS.notifications.unregisterDevice, { data: { token } });
}

export interface BroadcastPayload {
  title: string;
  body: string;
  url?: string;
}

/** Admin only: broadcast an announcement to all users. Returns recipient count. */
export async function broadcastAnnouncement(payload: BroadcastPayload): Promise<number> {
  const res = await api.post<ApiResponse<{ recipients: number }>>(
    ENDPOINTS.admin.broadcast,
    payload,
  );
  return res.data.data.recipients;
}
