export interface MeetingTrendByType {
  type: string
  count: number
}

export interface MeetingsByMonth {
  year: number
  month: string
  count: number
}

export interface LeaderboardItem {
  name: string
  meetings_count: number
}

export interface DashboardStatistics {
  overview: {
    total_meetings: number
    average_duration_minutes: number
    meetings_this_month: number
  }
  meeting_trends: {
    by_type: MeetingTrendByType[]
  }
  charts: {
    meetings_by_month: MeetingsByMonth[]
  }
  leaderboards: {
    top_organizers: LeaderboardItem[]
    top_locations: LeaderboardItem[]
  }
}
