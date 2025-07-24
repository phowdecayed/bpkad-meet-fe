<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

defineProps<{
  chartData: {
    labels: string[]
    datasets: {
      label: string
      borderColor: string
      backgroundColor: string
      data: number[]
    }[]
  }
}>()

const options = {
  responsive: true,
  maintainAspectRatio: false,
}
</script>

<template>
  <div class="relative h-64">
    <Line :data="chartData" :options="options" />
  </div>
</template>
