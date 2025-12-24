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
import { LoaderCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useUsersStore } from '@/stores/users'
import type { Role, Permission } from '@/types/user'
import { roleSchema } from '@/lib/validation/role-schemas'
import { validateWithSchema, type ValidationResult } from '@/lib/validation/form-utils'

const props = defineProps<{
  open: boolean
  role: Role | null
  permissions: Permission[]
}>()

const emit = defineEmits(['update:open', 'saved'])

const usersStore = useUsersStore()
const isSaving = ref(false)
const selectedPermissions = ref<number[]>([])
const validationErrors = ref<Record<string, string>>({})

const form = ref({
  name: '',
})

const isEditing = computed(() => !!props.role)

const groupedPermissions = computed(() => {
  if (!props.permissions) return {}
  return props.permissions.reduce(
    (acc: Record<string, Permission[]>, permission: Permission) => {
      const group = permission.group_name || 'general'
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      validationErrors.value = {}
      if (props.role) {
        form.value = { name: props.role.name }
        selectedPermissions.value = props.role.permissions?.map((p) => p.id) || []
      } else {
        form.value = { name: '' }
        selectedPermissions.value = []
      }
    }
  },
)

async function handleSave() {
  const validationResult: ValidationResult = validateWithSchema(roleSchema, form.value)
  if (!validationResult.success) {
    validationErrors.value = validationResult.fieldErrors || {}
    return
  }
  validationErrors.value = {}

  isSaving.value = true
  try {
    const roleData = {
      name: form.value.name,
      permissions: selectedPermissions.value,
    }

    if (isEditing.value && props.role) {
      await usersStore.updateRole(props.role.id, roleData)
      toast.success('Role Updated', {
        description: `${roleData.name} has been updated successfully.`,
      })
    } else {
      await usersStore.createRole(roleData)
      toast.success('Role Created', {
        description: `${roleData.name} has been created successfully.`,
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

function handlePermissionChange(permissionId: number, checked: boolean) {
  const index = selectedPermissions.value.indexOf(permissionId)
  if (checked) {
    if (index === -1) selectedPermissions.value.push(permissionId)
  } else {
    if (index > -1) selectedPermissions.value.splice(index, 1)
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Edit Role' : 'Create Role' }}</DialogTitle>
        <DialogDescription>
          {{
            isEditing ? 'Update the details for this role.' : 'Enter the details for the new role.'
          }}
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSave">
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input
            id="name"
            v-model="form.name"
            :class="{ 'border-red-500': validationErrors.name }"
          />
          <p v-if="validationErrors.name" class="text-sm text-red-500">
            {{ validationErrors.name }}
          </p>
        </div>
        <div class="grid gap-2">
          <Label>Permissions</Label>
          <div class="space-y-2 rounded-md border p-4 max-h-[300px] overflow-y-auto">
            <div
              v-for="(permissionGroup, groupName) in groupedPermissions"
              :key="groupName"
              class="mb-4"
            >
              <h4 class="mb-2 font-semibold capitalize">
                {{ groupName }}
              </h4>
              <div class="space-y-2">
                <div
                  v-for="permission in permissionGroup"
                  :key="permission.id"
                  class="flex items-center space-x-2"
                >
                  <Checkbox
                    :id="`permission-${permission.id}`"
                    :checked="selectedPermissions.includes(permission.id)"
                    @update:checked="(val: boolean) => handlePermissionChange(permission.id, val)"
                  />
                  <Label :for="`permission-${permission.id}`" class="font-normal">{{
                    permission.name
                  }}</Label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
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
