export interface MeetingLocation {
  id: number;
  name: string;
  address: string;
  room_name: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
}
