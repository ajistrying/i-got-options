<template>
  <UDrawer v-model:open="isOpen" direction="bottom" :ui="{ width: 'max-w-full', body: { base: 'overflow-visible' } }">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-primary-600" />
          <div>
            <h2 class="text-xl font-semibold">{{ ticker }} Journal</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ formattedEntryDate }}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <UButton
            v-if="hasUnsavedChanges"
            @click="saveEntry"
            :loading="saving"
            icon="i-heroicons-check"
            size="sm"
          >
            Save
          </UButton>
          <span v-if="lastSaved" class="text-xs text-gray-500">
            Saved {{ formatRelativeTime(lastSaved) }}
          </span>
        </div>
      </div>
    </template>

    <template #body>
      <div class="flex flex-col h-[60vh] max-h-[600px]">
        <!-- Entry Navigation -->
        <div class="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <UButton
            @click="createNewEntry"
            :disabled="isToday"
            icon="i-heroicons-plus"
            size="sm"
            variant="outline"
          >
            Today
          </UButton>
          <div class="flex-1 overflow-x-auto">
            <div class="flex space-x-2">
              <UButton
                v-for="entry in journals"
                :key="entry.id"
                @click="selectEntry(entry)"
                :variant="selectedEntry?.id === entry.id ? 'solid' : 'soft'"
                size="sm"
              >
                <div class="flex flex-col items-start">
                  <span class="text-xs">{{ formatEntryDate(entry.entry_date) }}</span>
                  <span class="text-[10px] text-gray-500 dark:text-gray-400">
                    Updated {{ formatRelativeTime(entry.updated_at) }}
                  </span>
                </div>
              </UButton>
            </div>
          </div>
        </div>

        <!-- Journal Editor -->
        <div class="flex-1 overflow-y-auto">
          <UTextarea
            v-model="currentContent"
            :rows="15"
            placeholder="Write your thoughts, observations, and analysis here..."
            autoresize
            :ui="{ base: 'w-full min-h-full resize-none', wrapper: 'h-full' }"
            @input="handleContentChange"
          />
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
interface Journal {
  id: string;
  ticker: string;
  entry_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const props = defineProps<{
  ticker: string;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
});

const journals = ref<Journal[]>([]);
const selectedEntry = ref<Journal | null>(null);
const currentContent = ref('');
const hasUnsavedChanges = ref(false);
const saving = ref(false);
const lastSaved = ref<string | null>(null);
const loading = ref(false);

// Load journals when drawer opens
watch(() => props.open, async (newValue) => {
  if (newValue) {
    await loadJournals();
    await loadTodaysEntry();
  }
});

// Check if current entry is today
const isToday = computed(() => {
  if (!selectedEntry.value) return false;
  const today = new Date().toISOString().split('T')[0];
  return selectedEntry.value.entry_date === today;
});

const formattedEntryDate = computed(() => {
  if (!selectedEntry.value) return 'New Entry';
  return formatEntryDate(selectedEntry.value.entry_date);
});

const loadJournals = async () => {
  try {
    const response = await $fetch(`/api/ticker/${props.ticker}/journals`);
    journals.value = response.journals || [];
  } catch (error) {
    console.error('Failed to load journals:', error);
    journals.value = [];
  }
};

const loadTodaysEntry = async () => {
  try {
    const response = await $fetch(`/api/ticker/${props.ticker}/journals/today`);
    if (response.journal) {
      selectedEntry.value = response.journal;
      currentContent.value = response.journal.content;
      lastSaved.value = response.journal.updated_at;
    } else {
      // Create a new entry for today
      createNewEntry();
    }
  } catch (error) {
    console.error('Failed to load today\'s entry:', error);
    createNewEntry();
  }
};

const createNewEntry = () => {
  const today = new Date().toISOString().split('T')[0];
  selectedEntry.value = {
    id: '',
    ticker: props.ticker,
    entry_date: today,
    content: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  currentContent.value = '';
  hasUnsavedChanges.value = false;
  lastSaved.value = null;
};

const selectEntry = (entry: Journal) => {
  if (hasUnsavedChanges.value) {
    if (!confirm('You have unsaved changes. Do you want to discard them?')) {
      return;
    }
  }
  selectedEntry.value = entry;
  currentContent.value = entry.content;
  hasUnsavedChanges.value = false;
  lastSaved.value = entry.updated_at;
};

const handleContentChange = () => {
  hasUnsavedChanges.value = true;
};

const saveEntry = async () => {
  if (!selectedEntry.value) return;

  saving.value = true;
  try {
    const response = await $fetch(`/api/ticker/${props.ticker}/journals`, {
      method: 'POST',
      body: {
        content: currentContent.value,
        entry_date: selectedEntry.value.entry_date
      }
    });

    if (response.success) {
      hasUnsavedChanges.value = false;
      lastSaved.value = new Date().toISOString();
      selectedEntry.value = response.journal;

      // Reload journals to update the list
      await loadJournals();
    }
  } catch (error) {
    console.error('Failed to save journal entry:', error);
  } finally {
    saving.value = false;
  }
};

// Auto-save functionality (debounced)
let saveTimeout: NodeJS.Timeout | null = null;
watch(currentContent, () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  if (hasUnsavedChanges.value) {
    saveTimeout = setTimeout(() => {
      saveEntry();
    }, 2000); // Auto-save after 2 seconds of inactivity
  }
});

const formatEntryDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = date.toISOString().split('T')[0];
  const todayOnly = today.toISOString().split('T')[0];
  const yesterdayOnly = yesterday.toISOString().split('T')[0];

  if (dateOnly === todayOnly) {
    return 'Today';
  } else if (dateOnly === yesterdayOnly) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d ago`;
  }
};

// Cleanup timeout on unmount
onUnmounted(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
});
</script>
