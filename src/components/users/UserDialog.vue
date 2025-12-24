<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { LoaderCircle, Send } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useUsersStore } from '@/stores/users'
import type { User, UserCreationPayload, UserUpdatePayload } from '@/types/user'

import type { Role } from '@/types/user'

const props = defineProps<{
  open: boolean
  user: User | null
  roles: Role[]
}>()

const emit = defineEmits(['update:open', 'saved'])

const usersStore = useUsersStore()
const isSaving = ref(false)
const selectedRoles = ref<number[]>([])

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const isEditing = computed(() => !!props.user)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.user) {
        form.value = {
          name: props.user.name,
          email: props.user.email,
          password: '',
          password_confirmation: '',
        }
        selectedRoles.value = props.user.roles?.map((role) => role.id) || []
      } else {
        form.value = { name: '', email: '', password: '', password_confirmation: '' }
        selectedRoles.value = []
      }
    }
  },
)

async function handleSave() {
  isSaving.value = true
  try {
    if (isEditing.value && props.user) {
      const userData: UserUpdatePayload = {
        name: form.value.name,
        email: form.value.email,
        roles: selectedRoles.value,
      }
      await usersStore.updateUser(props.user.id, userData)
      toast.success('User Updated', {
        description: `${userData.name} has been updated successfully.`,
      })
    } else {
      const roleName = props.roles.find((r) => r.id === selectedRoles.value[0])?.name || 'user'
      const userData: UserCreationPayload = {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        password_confirmation: form.value.password_confirmation,
        role: roleName,
      }
      await usersStore.createUser(userData)
      toast.success('User Created', {
        description: `${userData.name} has been created successfully.`,
      })
    }
    emit('saved')
    emit('update:open', false)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    toast.error('Save Failed', { description: message })
  } finally {
    isSaving.value = false
  }
}

async function handleSendPasswordReset() {
  if (!props.user) return

  try {
    await usersStore.sendPasswordReset(props.user.email)
    toast.success('Password Reset Sent', {
      description: `A password reset link has been sent to ${props.user.email}.`,
    })
    emit('update:open', false)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    toast.error('Failed to Send', { description: message })
  }
}

function handleRoleChange(roleId: number, checked: boolean) {
  const index = selectedRoles.value.indexOf(roleId)
  if (checked) {
    if (index === -1) selectedRoles.value.push(roleId)
  } else {
    if (index > -1) selectedRoles.value.splice(index, 1)
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Edit User' : 'Create User' }}</DialogTitle>
        <DialogDescription>
          {{
            isEditing ? 'Update the details for this user.' : 'Enter the details for the new user.'
          }}
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSave">
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input id="name" v-model="form.name" />
        </div>
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" v-model="form.email" type="email" />
        </div>
        <template v-if="!isEditing">
          <div class="grid gap-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Enter User Password"
            />
          </div>
          <div class="grid gap-2">
            <Label for="password_confirmation">Confirm Password</Label>
            <Input
              id="password_confirmation"
              v-model="form.password_confirmation"
              type="password"
              placeholder="Enter User Confirmation Password"
            />
          </div>
        </template>
        <div class="grid gap-2">
          <Label>Roles</Label>
          <div class="space-y-2 rounded-md border p-4">
            <div v-for="role in roles" :key="role.id" class="flex items-center space-x-2">
              <Checkbox
                :id="`role-${role.id}`"
                :checked="selectedRoles.includes(role.id)"
                @update:checked="(val: boolean) => handleRoleChange(role.id, val)"
              />
              <Label :for="`role-${role.id}`" class="font-normal">{{ role.name }}</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            v-if="isEditing"
            type="button"
            variant="outline"
            class="mr-auto"
            @click="handleSendPasswordReset"
          >
            <Send class="mr-2 h-4 w-4" />
            Send Password Reset
          </Button>
          <DialogClose as-child>
            <Button type="button" variant="secondary" :disabled="isSaving"> Cancel </Button>
          </DialogClose>
          <Button type="submit" :disabled="isSaving">
            <LoaderCircle v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            Save
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
