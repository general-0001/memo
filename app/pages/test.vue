<template>
  <main class="space-y-8 p-6">
    <section class="space-y-4">
      <h1 class="text-3xl font-bold">Nuxt UI 動作確認</h1>
      <p class="text-neutral-600">
        以下のコンポーネントが正しく描画されればセットアップ成功です。
      </p>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">ボタン</h2>
        </template>
        <div class="flex flex-wrap gap-3">
          <UButton color="primary">Primary</UButton>
          <UButton color="secondary" variant="soft">Secondary</UButton>
          <UButton color="error" variant="outline">Danger</UButton>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">フォーム</h2>
        </template>
        <form class="space-y-3">
          <UFormGroup label="メールアドレス" name="email">
            <UInput placeholder="you@example.com" type="email" />
          </UFormGroup>
          <UFormGroup label="プラン" name="plan">
            <USelect :options="plans" placeholder="選択してください" />
          </UFormGroup>
          <UButton type="submit">送信</UButton>
        </form>
      </UCard>
    </section>

    <section>
      <UAlert
        title="確認"
        description="このページが表示されていれば Nuxt UI が有効です。"
        icon="heroicons-outline:information-circle"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
const plans = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
]
</script>
