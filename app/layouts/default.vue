<template>
  <div class="flex min-h-screen flex-col">
    <header class="flex justify-center px-4 py-6">
      <NuxtLink to="/" class="text-xl font-semibold"> Nuxt Starter </NuxtLink>
    </header>
    <main class="flex-1">
      <slot />
    </main>
    <footer class="mt-16 px-4 py-8 text-center text-neutral-500">
      <span>&copy; {{ currentYear }} Nuxt Starter</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
const now = useNow()
const currentYear = useDateFormat(now, 'yyyy')
</script>
