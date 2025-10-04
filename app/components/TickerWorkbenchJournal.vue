<template>
  <UDrawer v-model:open="isOpen" direction="right">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center space-x-3">
          <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-primary-600" />
          <div>
            <h2 class="text-xl font-semibold">{{ ticker }} Journal</h2>
          </div>
        </div>
        <UButton
          @click="createNewEntry"
          :disabled="isToday"
          icon="i-heroicons-plus"
          variant="outline"
        >
          New Entry
        </UButton>
      </div>
    </template>

    <template #body>
      <div class="flex flex-col h-full min-w-96">
        <!-- Journal Editor -->
        <div class="mb-4">
          <UTextarea
            v-model="currentContent"
            :rows="10"
            placeholder="Write your thoughts, observations, and analysis here..."
            autoresize
            class="w-full"
            @input="handleContentChange"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-2">
            <UButton
              @click="saveEntry"
              :loading="saving"
              :disabled="!hasUnsavedChanges"
              icon="i-heroicons-check"
              color="primary"
            >
              Save
            </UButton>
            <span v-if="lastSaved" class="text-xs text-gray-500">
              Saved {{ formatRelativeTime(lastSaved) }}
            </span>
          </div>
          <UButton
            v-if="selectedEntry?.id"
            @click="deleteEntry"
            :loading="deleting"
            color="neutral"
            variant="outline"
            icon="i-heroicons-trash"
            class="text-red-600 hover:text-red-800 cursor-pointer"
          >
            Delete
          </UButton>
        </div>

        <!-- Previous Entries List -->
        <div class="flex-1 overflow-y-auto mt-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Previous Entries</h3>
            <span class="text-xs text-gray-500">{{ journals.length }} total</span>
          </div>
          <div v-if="paginatedJournals.length === 0" class="text-sm text-gray-500 text-center py-8">
            No previous entries
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="entry in paginatedJournals"
              :key="entry.id"
              @click="selectEntry(entry)"
              :class="[
                'p-3 rounded-lg border cursor-pointer transition-all',
                selectedEntry?.id === entry.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              ]"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium">{{ formatEntryDate(entry.entry_date) }}</span>
                <span class="text-xs text-gray-500">{{ formatRelativeTime(entry.updated_at) }}</span>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ entry.content || 'Empty entry' }}
              </p>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-center space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <UButton
              @click="currentPage--"
              :disabled="currentPage === 1"
              icon="i-heroicons-chevron-left"
              size="sm"
              variant="outline"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <UButton
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              icon="i-heroicons-chevron-right"
              size="sm"
              variant="outline"
            />
          </div>
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
const deleting = ref(false);
const lastSaved = ref<string | null>(null);
const loading = ref(false);

// Pagination
const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => Math.ceil(journals.value.length / itemsPerPage));

const paginatedJournals = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return journals.value.slice(start, end);
});

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

const loadJournals = async () => {
  try {
    const response = await $fetch(`/api/ticker/${props.ticker}/journals`);
    journals.value = response.journals || [];
    // Reset to first page if current page is out of bounds
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = 1;
    }
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

const deleteEntry = async () => {
  if (!selectedEntry.value?.id) return;

  if (!confirm('Are you sure you want to delete this journal entry?')) {
    return;
  }

  deleting.value = true;
  try {
    const response = await $fetch(`/api/ticker/${props.ticker}/journals/${selectedEntry.value.id}`, {
      method: 'DELETE'
    });

    if (response.success) {
      // Reload journals list
      await loadJournals();
      // Load today's entry or create a new one
      await loadTodaysEntry();
    }
  } catch (error) {
    console.error('Failed to delete journal entry:', error);
  } finally {
    deleting.value = false;
  }
};

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
</script>
