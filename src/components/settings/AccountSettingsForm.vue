<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoaderCircle, Trash2 } from 'lucide-vue-next'
import RecursiveFormField from './RecursiveFormField.vue'

const props = defineProps<{
  setting: any
  isSaving: boolean
}>()

const emit = defineEmits(['update', 'delete'])

const form = ref<any>(null)

watch(() => props.setting, (newSetting) => {
  form.value = JSON.parse(JSON.stringify(newSetting))
}, { immediate: true, deep: true })

function onUpdate() {
  emit('update', form.value)
}

function onDelete() {
  emit('delete', form.value)
}
</script>

<template>
  <form v-if="form && form.payload" class="space-y-4 pt-4" @submit.prevent="onUpdate">
    <div class="grid gap-2">
      <Label :for="`${form.id}-name`">Account Name</Label>
      <Input :id="`${form.id}-name`" v-model="form.name" />
    </div>

    <RecursiveFormField
      :id="form.id"
      field-key="payload"
      v-model="form.payload"
      :is-root="true"
    />

    <div class="flex justify-between pt-4">
      <Button type="submit" :disabled="isSaving">
        <LoaderCircle v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
        Save Changes
      </Button>
      <Button type="button" variant="destructive" size="icon" @click="onDelete">
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </form>
  <div v-else class="text-muted-foreground pt-4">
    This setting has no configurable payload.
  </div>
</template>
