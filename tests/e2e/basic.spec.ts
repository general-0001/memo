import { describe, expect, it } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

const isE2E = process.env.VITEST_E2E === '1'
const describeE2E = isE2E ? describe : describe.skip

describeE2E('トップページ', async () => {
  await setup({
    browser: false,
  })

  it('200 ステータスで応答する', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Nuxt 開発基盤')
  })
})
