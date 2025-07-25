import type { User } from '@/types/user'

export interface MeetingLocation {
  id: number
  name: string
  address: string
  room_name: string | null
  capacity: number | null
  created_at: string
  updated_at: string
}

export interface ZoomMeeting {
  id: number
  zoom_id: number
  uuid: string
  join_url: string | null
  start_url: string | null
  password: string | null
  [key: string]: unknown // For other Zoom-specific properties
}

export interface Meeting {
  id: number
  organizer: User
  topic: string
  description: string | null
  start_time: string
  duration: number
  type: 'online' | 'offline' | 'hybrid'
  location_id: number | null
  zoom_meeting_id: string | null
  host_key: string | null
  location: MeetingLocation | null
  zoom_meeting: ZoomMeeting | null
  participants?: User[]
  created_at: string
  updated_at: string
}
