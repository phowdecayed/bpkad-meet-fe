import type { User } from '@/types/user'

export interface MeetingLocation {
  id: number;
  name: string;
  address: string;
  room_name: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface ZoomMeeting {
  id: number;
  zoom_id: number;
  uuid: string;
  [key: string]: any; // For other Zoom-specific properties
}

export interface Meeting {
  id: number;
  organizer: User;
  topic: string;
  description: string | null;
  start_time: string;
  duration: number;
  type: 'online' | 'offline' | 'hybrid';
  host_key: string | null;
  location: MeetingLocation | null;
  zoom_meeting: ZoomMeeting | null;
  participants?: User[];
}