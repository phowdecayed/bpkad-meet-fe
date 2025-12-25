<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { LoaderCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useSettingsStore } from '@/stores/settings'
import { isApiError } from '@/lib/error-handling'

defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open', 'created'])

const settingsStore = useSettingsStore()
const isCreating = ref(false)

const form = ref({
  name: '',
  group: 'zoom',
  payload: {
    client_id: '',
    client_secret: '',
    account_id: '',
    host_key: '',
  },
})

async function handleCreate() {
  // Validate form data
  if (!form.value.name.trim()) {
    toast.error('Validation Error', {
      description: 'Account name is required.',
    })
    return
  }

  if (!form.value.payload.client_id.trim()) {
    toast.error('Validation Error', {
      description: 'Client ID is required.',
    })
    return
  }

  isCreating.value = true
  try {
    await settingsStore.createSetting(form.value)

    toast.success('Account Added', {
      description: `${form.value.name} has been created successfully.`,
    })

    // Reset form
    form.value = {
      name: '',
      group: 'zoom',
      payload: { client_id: '', client_secret: '', account_id: '', host_key: '' },
    }

    emit('created')
    emit('update:open', false)
  } catch (error: unknown) {
    let errorMessage = 'Failed to create account. Please try again.'
    if (isApiError(error) && error.response) {
      if (error.response?.status === 400) {
        errorMessage = 'Invalid account data. Please check your input and try again.'
      } else if (error.response?.status === 401) {
        errorMessage = 'You are not authorized to create settings. Please log in again.'
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create settings.'
      } else if (error.response?.status === 409) {
        errorMessage = 'An account with this name already exists. Please choose a different name.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
    }

    toast.error('Creation Failed', {
      description: errorMessage,
      action: {
        label: 'Retry',
        onClick: () => handleCreate(),
      },
    })
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Zoom Account</DialogTitle>
        <DialogDescription>
          Enter the details for the new Zoom account credentials.
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleCreate">
        <div class="grid gap-2">
          <Label for="new-name">Account Name</Label>
          <Input id="new-name" v-model="form.name" placeholder="e.g., 'Secondary Zoom Account'" />
        </div>
        <div class="grid gap-2">
          <Label for="new-client-id">Client ID</Label>
          <Input id="new-client-id" v-model="form.payload.client_id" />
        </div>
        <div class="grid gap-2">
          <Label for="new-client-secret">Client Secret</Label>
          <Input id="new-client-secret" v-model="form.payload.client_secret" type="password" />
        </div>
        <div class="grid gap-2">
          <Label for="new-account-id">Account ID</Label>
          <Input id="new-account-id" v-model="form.payload.account_id" />
        </div>
        <div class="grid gap-2">
          <Label for="new-host-key">Host Key</Label>
          <Input id="new-host-key" v-model="form.payload.host_key" />
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="secondary"> Cancel </Button>
          </DialogClose>
          <Button type="submit" :disabled="isCreating">
            <LoaderCircle v-if="isCreating" class="mr-2 h-4 w-4 animate-spin" />
            Create Account
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
