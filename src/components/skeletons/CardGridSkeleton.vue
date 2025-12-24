<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div v-for="i in 4" :key="i" class="p-6 border rounded-lg space-y-3">
      <div class="flex items-center justify-between">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-8 w-8 rounded-full" />
      </div>
      <Skeleton class="h-8 w-16" />
      <Skeleton class="h-3 w-32" />
    </div>
  </div>
</template>
