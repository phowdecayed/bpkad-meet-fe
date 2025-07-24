<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const authStore = useAuthStore()
const user = ref(authStore.user)

onMounted(async () => {
  if (!authStore.user) {
    await authStore.getProfile()
    user.value = authStore.user
  }
})
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">
      Profile
    </h1>
    <Card v-if="user">
      <CardHeader>
        <div class="flex items-center gap-4">
          <Avatar class="h-16 w-16">
            <AvatarImage v-if="user.avatar" :src="user.avatar" :alt="user.name" />
            <AvatarFallback class="text-2xl">
              {{ user.name?.charAt(0).toUpperCase() }}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle class="text-xl">
              {{ user.name }}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="grid gap-2">
          <div>
            <p class="font-semibold">
              Email
            </p>
            <p>{{ user.email }}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <div v-else>
      Loading profile...
    </div>
  </div>
</template>
