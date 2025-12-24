<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

defineProps<{
  rows?: number
  columns?: number
}>()
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Table Header Skeleton -->
    <div class="flex gap-4 p-4 border-b">
      <Skeleton v-for="col in columns || 4" :key="`header-${col}`" class="h-4 flex-1" />
    </div>

    <!-- Table Rows Skeleton -->
    <div v-for="row in rows || 5" :key="row" class="flex gap-4 p-4 border-b">
      <Skeleton v-for="col in columns || 4" :key="`${row}-${col}`" class="h-4 flex-1" />
    </div>
  </div>
</template>
