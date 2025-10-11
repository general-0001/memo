import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default [
  ...(await createConfigForNuxt({
    features: {
      stylistic: true,
      typescript: true,
    },
  })),
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': [
        'error',
        { singleline: 3, multiline: { max: 1 } },
      ],
      'vue/singleline-html-element-content-newline': [
        'error',
        {
          ignoreWhenNoAttributes: true,
          ignores: [
            'h1',
            'h2',
            'span',
            'NuxtLink',
            'UButton',
            'UFormGroup',
            'USelect',
          ],
        },
      ],
    },
  },
]
