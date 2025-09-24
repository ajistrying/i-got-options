<template>
  <nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <div class="container mx-auto px-6">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-8">
          <div class="hidden md:flex space-x-4">
            <NuxtLink
              to="/"
              class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'text-primary-600 dark:text-primary-400': $route.path === '/' }"
            >
              Search
            </NuxtLink>
            <NuxtLink
              to="/subreddits"
              class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'text-primary-600 dark:text-primary-400': $route.path === '/subreddits' }"
            >
              Manage Subreddits
            </NuxtLink>
          </div>
        </div>
        
        <!-- Mobile menu button -->
        <div class="md:hidden">
          <UButton
            @click="mobileMenuOpen = !mobileMenuOpen"
            variant="ghost"
            size="sm"
            :icon="mobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
          />
        </div>
      </div>
      
      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="md:hidden pb-4">
        <div class="space-y-1">
          <NuxtLink
            to="/"
            @click="mobileMenuOpen = false"
            class="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-base font-medium"
            :class="{ 'text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-800': $route.path === '/' }"
          >
            Search
          </NuxtLink>
          <NuxtLink
            to="/subreddits"
            @click="mobileMenuOpen = false"
            class="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-base font-medium"
            :class="{ 'text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-800': $route.path === '/subreddits' }"
          >
            Manage Subreddits
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const mobileMenuOpen = ref(false);
</script>