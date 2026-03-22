import { Mark, mergeAttributes } from '@tiptap/core'

export const SpoilerMark = Mark.create({
  name: 'spoiler',
  inclusive: false,

  parseHTML() {
    return [{ tag: 'span[data-rich-spoiler]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-rich-spoiler': 'true',
      }),
      0,
    ]
  },
})
