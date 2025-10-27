<template>
  <div class="flex min-h-screen flex-col">
    <header class="flex justify-center p-2">
      <NuxtLink to="/" class="text-xl font-semibold"> Nuxt Starter </NuxtLink>
    </header>
    <main class="w-[calc(100vw-2rem)] h-full max-w-2xl max-h-[calc(100dvh-2rem)] bg-slate-100 flex flex-col fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg rounded-lg ring ring-slate-200 overflow-hidden">
      <slot />
    </main>
    <footer class="p-4 text-center text-neutral-500">
      <span>&copy; {{ currentYear }} Nuxt Starter</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
const now = useNow()
const currentYear = useDateFormat(now, 'yyyy')
</script>
