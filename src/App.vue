<!--
@file This is the root component of the application.
@author BPKAD
@version 1.0.0
-->

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
</script>

<template>
  <!-- The RouterView component renders the component for the current route. -->
  <RouterView />
  <!-- The Toaster component is used to display notifications. -->
  <Teleport to="body">
    <Toaster rich-colors position="top-right" />
  </Teleport>
</template>

<style scoped></style>
