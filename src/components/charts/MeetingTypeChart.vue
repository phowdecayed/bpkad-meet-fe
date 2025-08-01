<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

defineProps<{
  chartData: {
    labels: string[]
    datasets: {
      label: string
      backgroundColor: string[]
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
    <Bar :data="chartData" :options="options" />
  </div>
</template>
