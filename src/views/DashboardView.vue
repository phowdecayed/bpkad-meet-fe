<script setup lang="ts">
import { watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useStatisticsStore } from '@/stores/statistics'
import { PERMISSIONS } from '@/constants/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import MeetingTypeChart from '@/components/charts/MeetingTypeChart.vue'
import MeetingsByMonthChart from '@/components/charts/MeetingsByMonthChart.vue'

const authStore = useAuthStore()
const statisticsStore = useStatisticsStore()

const canViewMeetings = computed(() => authStore.hasPermission(PERMISSIONS.MEETINGS.VIEW))
const stats = computed(() => statisticsStore.dashboardStats)

const meetingTypeChartData = computed(() => {
  if (!stats.value) return null
  const labels = stats.value.meeting_trends.by_type.map((item) => item.type)
  const data = stats.value.meeting_trends.by_type.map((item) => item.count)

  return {
    labels,
    datasets: [
      {
        label: 'Meeting Count',
        backgroundColor: ['#41B883', '#E46651', '#00D8FF'],
        data,
      },
    ],
  }
})

const meetingsByMonthChartData = computed(() => {
  if (!stats.value?.charts?.meetings_by_month) return null
  const labels = stats.value.charts.meetings_by_month.map((item) => `${item.month} ${item.year}`)
  const data = stats.value.charts.meetings_by_month.map((item) => item.count)

  return {
    labels,
    datasets: [
      {
        label: 'Meetings per Month',
        borderColor: '#41B883',
        backgroundColor: 'rgba(65, 184, 131, 0.2)',
        data,
        fill: true,
      },
    ],
  }
})

watch(
  canViewMeetings,
  (hasPermission) => {
    if (hasPermission) {
      statisticsStore.fetchDashboardStats()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex-1 space-y-4 p-4 pt-6 md:p-8">
    <div v-if="canViewMeetings">
      <div v-if="statisticsStore.isLoading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton class="h-24" />
        <Skeleton class="h-24" />
        <Skeleton class="h-24" />
      </div>
      <div v-else-if="stats" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ stats.overview.total_meetings }}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stats.overview.average_duration_minutes }} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Meetings This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ stats.overview.meetings_this_month }}
            </div>
          </CardContent>
        </Card>
      </div>

      <div v-if="stats" class="mt-8 grid gap-8 md:grid-cols-2">
        <Card class="md:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingsByMonthChart
              v-if="meetingsByMonthChartData"
              :chart-data="meetingsByMonthChartData"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Meeting Types</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingTypeChart v-if="meetingTypeChartData" :chart-data="meetingTypeChartData" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Organizers</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="item in stats.leaderboards.top_organizers"
                :key="item.name"
                class="flex justify-between"
              >
                <span>{{ item.name }}</span>
                <Badge variant="secondary">
                  {{ item.meetings_count }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card class="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="item in stats.leaderboards.top_locations"
                :key="item.name"
                class="flex justify-between"
              >
                <span>{{ item.name }}</span>
                <Badge variant="secondary">
                  {{ item.meetings_count }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    <div v-else class="text-center">
      <h1 class="text-2xl font-bold">Welcome, {{ authStore.user?.name }}!</h1>
      <p class="text-muted-foreground">You do not have permission to view dashboard statistics.</p>
    </div>
  </div>
</template>
