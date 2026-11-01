import { request } from './client';

export type LiveKitJoin = {
  ready: boolean;
  url?: string;
  token?: string;
  room?: string;
  videoRecording: boolean;
  egress: boolean;
};

export const callsApi = {
  livekit: (patient_id: string, appointment_id: string) => request<LiveKitJoin>('/api/calls/livekit', {
    method: 'POST',
    body: JSON.stringify({ patient_id, appointment_id }),
  }),
};
