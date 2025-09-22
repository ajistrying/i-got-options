<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Manage Subreddits</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Add, edit, or remove subreddits to search for stock discussions
        </p>
      </div>

      <!-- Main Content -->
      <div class="w-full max-w-5xl mx-auto space-y-6">
        <!-- Add New Subreddit -->
        <UCard class="shadow-lg">
          <template #header>
            <h2 class="text-lg font-semibold">Add New Subreddit</h2>
          </template>
          
          <div class="flex gap-3">
            <UInput
              v-model="newSubreddit"
              placeholder="Enter subreddit name (without r/)"
              size="md"
              class="flex-1"
              :error="addError"
              @keyup.enter="addSubreddit"
            />
            <UButton
              @click="addSubreddit"
              :loading="adding"
              :disabled="!newSubreddit || adding"
              color="primary"
            >
              Add Subreddit
            </UButton>
          </div>
          
          <UAlert v-if="addError" color="red" variant="subtle" class="mt-3">
            {{ addError }}
          </UAlert>
          
          <UAlert v-if="addSuccess" color="green" variant="subtle" class="mt-3">
            Subreddit added successfully!
          </UAlert>
        </UCard>

        <!-- Subreddit List -->
        <UCard class="shadow-lg">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Current Subreddits</h2>
              <UButton
                size="sm"
                variant="soft"
                @click="loadSubreddits"
                :loading="loading"
                icon="i-heroicons-arrow-path"
              >
                Refresh
              </UButton>
            </div>
          </template>

          <div v-if="loading && !subreddits.length" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl" />
          </div>

          <div v-else-if="!subreddits.length" class="text-center text-gray-500 py-8">
            No subreddits found. Add your first subreddit above.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-3 px-4 font-semibold text-sm">Subreddit</th>
                  <th class="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th class="text-left py-3 px-4 font-semibold text-sm">Created</th>
                  <th class="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="sub in subreddits"
                  :key="sub.id"
                  class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td class="py-3 px-4">
                    <div v-if="editingId === sub.id" class="flex items-center gap-2">
                      <UInput
                        v-model="editingName"
                        size="sm"
                        @keyup.enter="saveEdit(sub.id)"
                        @keyup.escape="cancelEdit"
                      />
                    </div>
                    <div v-else class="font-medium">
                      r/{{ sub.subreddit_name }}
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <UBadge
                      :color="sub.active ? 'green' : 'gray'"
                      variant="subtle"
                      size="sm"
                    >
                      {{ sub.active ? 'Active' : 'Inactive' }}
                    </UBadge>
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDate(sub.created_at) }}
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex justify-end gap-2">
                      <template v-if="editingId === sub.id">
                        <UButton
                          size="xs"
                          color="green"
                          variant="soft"
                          icon="i-heroicons-check"
                          @click="saveEdit(sub.id)"
                        />
                        <UButton
                          size="xs"
                          color="gray"
                          variant="soft"
                          icon="i-heroicons-x-mark"
                          @click="cancelEdit"
                        />
                      </template>
                      <template v-else>
                        <UButton
                          size="xs"
                          variant="ghost"
                          icon="i-heroicons-pencil"
                          @click="startEdit(sub)"
                        />
                        <UButton
                          size="xs"
                          variant="ghost"
                          :icon="sub.active ? 'i-heroicons-pause' : 'i-heroicons-play'"
                          @click="toggleStatus(sub)"
                        />
                        <UButton
                          size="xs"
                          color="red"
                          variant="ghost"
                          icon="i-heroicons-trash"
                          @click="deleteSubreddit(sub)"
                        />
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const loading = ref(false);
const adding = ref(false);
const subreddits = ref([]);
const newSubreddit = ref('');
const addError = ref('');
const addSuccess = ref(false);
const editingId = ref(null);
const editingName = ref('');

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const loadSubreddits = async () => {
  loading.value = true;
  try {
    const data = await $fetch('/api/subreddits');
    subreddits.value = data;
  } catch (error) {
    console.error('Failed to load subreddits:', error);
  } finally {
    loading.value = false;
  }
};

const addSubreddit = async () => {
  if (!newSubreddit.value.trim()) return;
  
  adding.value = true;
  addError.value = '';
  addSuccess.value = false;
  
  try {
    await $fetch('/api/subreddits', {
      method: 'POST',
      body: {
        name: newSubreddit.value.trim().replace(/^r\//, '') // Remove r/ prefix if present
      }
    });
    
    newSubreddit.value = '';
    addSuccess.value = true;
    await loadSubreddits();
    
    setTimeout(() => {
      addSuccess.value = false;
    }, 3000);
  } catch (error: any) {
    addError.value = error.data?.statusMessage || 'Failed to add subreddit';
  } finally {
    adding.value = false;
  }
};

const startEdit = (sub: any) => {
  editingId.value = sub.id;
  editingName.value = sub.subreddit_name;
};

const cancelEdit = () => {
  editingId.value = null;
  editingName.value = '';
};

const saveEdit = async (id: string) => {
  if (!editingName.value.trim()) {
    cancelEdit();
    return;
  }
  
  try {
    await $fetch(`/api/subreddits/${id}`, {
      method: 'PUT',
      body: {
        name: editingName.value.trim()
      }
    });
    await loadSubreddits();
    cancelEdit();
  } catch (error) {
    console.error('Failed to update subreddit:', error);
  }
};

const toggleStatus = async (sub: any) => {
  try {
    await $fetch(`/api/subreddits/${sub.id}/toggle`, {
      method: 'PATCH'
    });
    await loadSubreddits();
  } catch (error) {
    console.error('Failed to toggle status:', error);
  }
};

const deleteSubreddit = async (sub: any) => {
  if (!confirm(`Are you sure you want to delete r/${sub.subreddit_name}?`)) return;
  
  try {
    await $fetch(`/api/subreddits/${sub.id}`, {
      method: 'DELETE'
    });
    await loadSubreddits();
  } catch (error) {
    console.error('Failed to delete subreddit:', error);
  }
};

onMounted(() => {
  loadSubreddits();
});
</script>