<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
</script>

<template>
  <RouterView />
  <Teleport to="body">
    <Toaster rich-colors position="top-right" />
  </Teleport>
</template>

<style scoped>
</style>
