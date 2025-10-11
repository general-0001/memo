import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import IndexPage from '~/pages/index.vue'

describe('IndexPage', () => {
  it('見出しを描画できる', () => {
    const wrapper = mount(IndexPage)
    expect(wrapper.text()).toContain('Nuxt 開発基盤')
  })
})
