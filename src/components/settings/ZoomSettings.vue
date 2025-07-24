<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { toast } from 'vue-sonner'
import { LoaderCircle, Trash2, PlusCircle, Settings, ChevronRight } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import AccountSettingsForm from './AccountSettingsForm.vue'

const settingsStore = useSettingsStore()
const { settings: storeSettings, isLoading } = storeToRefs(settingsStore)

const isSaving = ref<Record<number, boolean>>({})
const isCreating = ref(false)
const isAddDialogOpen = ref(false)
const selectedAccountId = ref<number | null>(null)

const newAccountForm = ref({
  name: '',
  group: 'zoom',
  payload: {
    client_id: '',
    client_secret: '',
    account_id: '',
    host_key: '',
  },
})

onMounted(() => {
  settingsStore.fetchSettingsByGroup('zoom')
})

const selectedSetting = computed(() => {
  if (!selectedAccountId.value) return null
  return storeSettings.value.find(s => s.id === selectedAccountId.value) || null
})

function selectAccount(id: number) {
  selectedAccountId.value = id
}

async function handleUpdate(setting: any) {
  isSaving.value[setting.id] = true
  try {
    await settingsStore.updateSetting(setting.id, setting.payload)
    await settingsStore.fetchSettingsByGroup('zoom')
    toast.success('Settings Saved', {
      description: `${setting.name} has been updated successfully.`,
    })
  }
  catch (error: any) {
    toast.error('Save Failed', {
      description: error.message,
    })
  }
  finally {
    isSaving.value[setting.id] = false
  }
}

async function handleDelete(setting: any) {
  if (confirm(`Are you sure you want to delete "${setting.name}"?`)) {
    try {
      await settingsStore.deleteSetting(setting.id)
      toast.success('Setting Deleted', {
        description: `${setting.name} has been deleted.`,
      })
      if (selectedAccountId.value === setting.id) {
        selectedAccountId.value = null
      }
    }
    catch (error: any) {
      toast.error('Delete Failed', {
        description: error.message,
      })
    }
  }
}

async function handleCreate() {
  isCreating.value = true
  try {
    await settingsStore.createSetting(newAccountForm.value)
    await settingsStore.fetchSettingsByGroup('zoom')
    toast.success('Account Added', {
      description: `${newAccountForm.value.name} has been created.`,
    })
    isAddDialogOpen.value = false
    newAccountForm.value = {
      name: '',
      group: 'zoom',
      payload: { client_id: '', client_secret: '', account_id: '', host_key: '' },
    }
  }
  catch (error: any) {
    toast.error('Creation Failed', {
      description: error.message,
    })
  }
  finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
       <div class="space-y-1">
        <h1 class="text-3xl font-bold">Zoom Account Integrations</h1>
        <p class="text-sm text-muted-foreground">
          Manage the Zoom accounts used to create meetings.
        </p>
      </div>
      <Dialog v-model:open="isAddDialogOpen">
        <Button @click="isAddDialogOpen = true">
          <PlusCircle class="mr-2 h-4 w-4" />
          Add New Account
        </Button>
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
              <Input id="new-name" v-model="newAccountForm.name" placeholder="e.g., 'Secondary Zoom Account'" />
            </div>
            <div class="grid gap-2">
              <Label for="new-client-id">Client ID</Label>
              <Input id="new-client-id" v-model="newAccountForm.payload.client_id" />
            </div>
            <div class="grid gap-2">
              <Label for="new-client-secret">Client Secret</Label>
              <Input id="new-client-secret" v-model="newAccountForm.payload.client_secret" type="password" />
            </div>
            <div class="grid gap-2">
              <Label for="new-account-id">Account ID</Label>
              <Input id="new-account-id" v-model="newAccountForm.payload.account_id" />
            </div>
            <div class="grid gap-2">
              <Label for="new-host-key">Host Key</Label>
              <Input id="new-host-key" v-model="newAccountForm.payload.host_key" />
            </div>
            <DialogFooter>
              <DialogClose as-child>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" :disabled="isCreating">
                <LoaderCircle v-if="isCreating" class="mr-2 h-4 w-4 animate-spin" />
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
      <!-- Left Column: Account List -->
      <div class="md:col-span-1">
        <div v-if="isLoading" class="space-y-2">
          <Skeleton class="h-12 w-full" />
          <Skeleton class="h-12 w-full" />
          <Skeleton class="h-12 w-full" />
        </div>
        <div v-else-if="storeSettings && storeSettings.length > 0" class="space-y-2">
          <button
            v-for="setting in storeSettings"
            :key="setting.id"
            class="w-full text-left p-3 rounded-lg transition-colors"
            :class="{
              'bg-primary text-primary-foreground': selectedAccountId === setting.id,
              'hover:bg-muted': selectedAccountId !== setting.id
            }"
            @click="selectAccount(setting.id)"
          >
            <div class="flex justify-between items-center">
              <span class="font-medium">{{ setting.name }}</span>
              <ChevronRight class="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
        </div>
        <div v-else class="text-center text-muted-foreground py-8 border rounded-lg">
          <h3 class="text-lg font-semibold">
            No Zoom Accounts
          </h3>
          <p class="text-sm">Click "Add New Account" to get started.</p>
        </div>
      </div>

      <!-- Right Column: Settings Form -->
      <div class="md:col-span-2">
        <div v-if="selectedSetting" class="p-6 border rounded-lg">
           <AccountSettingsForm
              :key="selectedSetting.id"
              :setting="selectedSetting"
              :is-saving="isSaving[selectedSetting.id] || false"
              @update="handleUpdate"
              @delete="handleDelete"
            />
        </div>
        <div v-else class="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border rounded-lg h-full">
          <Settings class="h-12 w-12 mb-4" />
          <h3 class="text-lg font-semibold">
            Select an Account
          </h3>
          <p class="text-sm">Choose an account from the list to view and edit its settings.</p>
        </div>
      </div>
    </div>
  </div>
</template>
