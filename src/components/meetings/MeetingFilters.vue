<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, RefreshCw } from 'lucide-vue-next'

defineProps<{
  searchQuery: string
  selectedType: string | undefined
  selectedLocation: string
  startDate: string
  endDate: string
  perPage: string
  hasActiveFilters: boolean
  activeFilterCount: number
  availableLocations: string[]
  locationsCount: number
  isLoading: boolean
}>()

const emit = defineEmits([
  'update:searchQuery',
  'update:selectedType',
  'update:selectedLocation',
  'update:startDate',
  'update:endDate',
  'update:perPage',
  'clear',
  'retry',
])
</script>

<template>
  <div class="space-y-4">
    <!-- Search Bar - Full width -->
    <div class="flex-1 space-y-2">
      <Label for="search">Search meetings</Label>
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="search"
          :model-value="searchQuery"
          @update:model-value="emit('update:searchQuery', $event)"
          placeholder="Search by topic or description..."
          class="pl-10"
          :class="{ 'border-primary': searchQuery.trim() !== '' }"
        />
      </div>
    </div>

    <!-- Filters - Responsive grid -->
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="flex-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="space-y-2">
            <Label for="type">Type</Label>
            <Select
              :model-value="selectedType"
              @update:model-value="emit('update:selectedType', $event)"
            >
              <SelectTrigger
                id="type"
                :class="{
                  'border-primary': selectedType !== undefined && selectedType !== 'all',
                }"
              >
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="location">Location ({{ locationsCount }} available)</Label>
            <Select
              :model-value="selectedLocation"
              @update:model-value="emit('update:selectedLocation', $event)"
            >
              <SelectTrigger
                id="location"
                :class="{ 'border-primary': selectedLocation !== 'all' }"
              >
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                <SelectItem
                  v-for="locationName in availableLocations"
                  :key="locationName"
                  :value="locationName"
                >
                  {{ locationName }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="start-date">From</Label>
            <Input
              id="start-date"
              :model-value="startDate"
              @update:model-value="emit('update:startDate', $event)"
              type="date"
              :class="{ 'border-primary': startDate !== '' }"
            />
          </div>

          <div class="space-y-2">
            <Label for="end-date">To</Label>
            <Input
              id="end-date"
              :model-value="endDate"
              @update:model-value="emit('update:endDate', $event)"
              type="date"
              :class="{ 'border-primary': endDate !== '' }"
            />
          </div>

          <div class="space-y-2">
            <Label for="per-page">Per Page</Label>
            <Select :model-value="perPage" @update:model-value="emit('update:perPage', $event)">
              <SelectTrigger id="per-page">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <!-- Action Buttons - Align to bottom on large screens -->
      <div class="flex flex-col lg:flex-row gap-2 lg:items-end lg:self-end">
        <Button
          variant="outline"
          @click="emit('clear')"
          size="sm"
          :class="{ 'border-primary text-primary': hasActiveFilters }"
        >
          Clear
          <Badge v-if="hasActiveFilters" variant="secondary" class="ml-2 h-4 px-1 text-xs">
            {{ activeFilterCount }}
          </Badge>
        </Button>
        <Button variant="outline" @click="emit('retry')" size="sm" :disabled="isLoading">
          <RefreshCw :class="['h-4 w-4', isLoading && 'animate-spin']" />
        </Button>
      </div>
    </div>
  </div>
</template>
