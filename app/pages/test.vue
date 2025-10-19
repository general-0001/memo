<template>
  <main class="space-y-8 p-6">
    <section class="space-y-4">
      <h1 class="text-3xl font-bold">Nuxt UI 動作確認</h1>
      <p class="text-neutral-600">
        以下のコンポーネントが正しく描画されればセットアップ成功です。
      </p>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <div class="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div class="border-b border-neutral-200 px-4 py-3">
          <h2 class="text-lg font-semibold">ボタン</h2>
        </div>
        <div class="flex flex-wrap gap-3 px-4 py-6">
          <button
            class="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-500"
            type="button"
          >
            Primary
          </button>
          <button
            class="rounded border border-blue-600 px-4 py-2 text-blue-600 transition hover:bg-blue-50"
            type="button"
          >
            Secondary
          </button>
          <button
            class="rounded border border-red-500 px-4 py-2 text-red-500 transition hover:bg-red-50"
            type="button"
          >
            Danger
          </button>
        </div>
      </div>

      <div class="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div class="border-b border-neutral-200 px-4 py-3">
          <h2 class="text-lg font-semibold">フォーム</h2>
        </div>
        <form class="space-y-4 px-4 py-6">
          <label class="block text-left">
            <span class="mb-1 block text-sm font-medium text-neutral-700">メールアドレス</span>
            <input
              class="w-full rounded border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
              placeholder="you@example.com"
              type="email"
            >
          </label>
          <label class="block text-left">
            <span class="mb-1 block text-sm font-medium text-neutral-700">プラン</span>
            <select
              v-model="selectedPlan"
              class="w-full rounded border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring"
            >
              <option value="" disabled>
                選択してください
              </option>
              <option
                v-for="plan in plans"
                :key="plan.value"
                :value="plan.value"
              >
                {{ plan.label }}
              </option>
            </select>
          </label>
          <button
            class="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500"
            type="submit"
          >
            送信
          </button>
        </form>
      </div>
    </section>

    <section class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-6 text-left text-blue-900">
      <div class="flex items-start gap-3">
        <span class="text-xl" aria-hidden="true">ℹ️</span>
        <div>
          <h2 class="text-lg font-semibold">確認</h2>
          <p class="text-sm">
            このページが表示されていれば Nuxt UI なしでもセットアップが機能しています。
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const plans = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
]

const selectedPlan = ref('')
</script>
