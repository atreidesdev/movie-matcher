import { RICH_TEXT_MAX_COMMENT_HTML, isRichTextEmpty } from '@/utils/richText'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  EyeOff,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
  TextQuote,
  Underline as UnderlineIcon,
} from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SpoilerMark } from './spoilerExtension'
import './rich-text.css'

export type RichTextEditorRef = {
  focus: () => void
}

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Для связи с <label htmlFor> */
  id?: string
  maxHtmlLength?: number
  minHeight?: string
  maxHeight?: string
  showExtendedToolbar?: boolean
  /**
   * Комментарии: компактное поле как однострочный инпут, панель форматирования снизу под текстом.
   * Поле + панель участвуют в flex вместе с кнопкой отправки (см. comments-form__footer).
   */
  variant?: 'default' | 'comment'
  /** Только для variant=comment: блок справа от иконок в нижнем ряду (кнопка отправки и т.д.) */
  commentFooter?: ReactNode
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(function RichTextEditor(
  {
    value,
    onChange,
    placeholder,
    disabled,
    className,
    id,
    maxHtmlLength = RICH_TEXT_MAX_COMMENT_HTML,
    minHeight = '88px',
    maxHeight = '220px',
    showExtendedToolbar = true,
    variant = 'default',
    commentFooter,
  },
  ref,
) {
  const { t } = useTranslation()
  const isComment = variant === 'comment'
  /** В комментариях тоже показываем списки, цитату и ссылку — иначе формат не виден и недоступен */
  const showExtended = isComment ? true : showExtendedToolbar

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'rich-text-link',
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      SpoilerMark,
    ],
    content: value || '<p></p>',
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      if (html.length > maxHtmlLength) {
        ed.commands.undo()
        return
      }
      onChange(html)
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const incoming = value && value.trim() !== '' ? value : '<p></p>'
    const cur = editor.getHTML()
    if (incoming === cur) return
    editor.commands.setContent(incoming, { emitUpdate: false })
  }, [value, editor])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        editor?.chain().focus('end').run()
      },
    }),
    [editor],
  )

  if (!editor) {
    return (
      <div
        id={id}
        className={
          isComment
            ? `rich-text-editor-wrap--comment flex flex-col flex-1 min-w-0 ${className ?? ''}`
            : `rich-text-editor-wrap ${className ?? ''}`
        }
        style={
          isComment
            ? undefined
            : ({
                '--rich-text-editor-min-h': minHeight,
                '--rich-text-editor-max-h': maxHeight,
              } as React.CSSProperties)
        }
      >
        <div className="rich-text-editor p-3 text-sm text-[var(--theme-text-muted)]">{t('common.loading')}</div>
      </div>
    )
  }

  const style = (
    isComment
      ? undefined
      : {
          '--rich-text-editor-min-h': minHeight,
          '--rich-text-editor-max-h': maxHeight,
        }
  ) as React.CSSProperties | undefined

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt(t('media.richTextLinkPrompt'), prev ?? 'https://')
    if (url === null) return
    const u = url.trim()
    if (u === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: u }).run()
  }

  const Btn = ({
    onClick,
    isActive,
    title,
    children,
  }: {
    onClick: () => void
    isActive?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rich-text-toolbar__btn ${isComment ? 'rich-text-toolbar__btn--comment' : ''} ${isActive ? 'rich-text-toolbar__btn--active' : ''}`}
    >
      {children}
    </button>
  )

  const toolbar = (
    <div
      className={`rich-text-toolbar ${isComment ? 'rich-text-toolbar--comment-below' : ''}`}
      aria-label={t('media.richTextToolbar')}
    >
      <Btn
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title={t('media.richTextBold')}
      >
        <Bold className={isComment ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title={t('media.richTextItalic')}
      >
        <Italic className={isComment ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title={t('media.richTextUnderline')}
      >
        <UnderlineIcon className={isComment ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title={t('media.richTextStrike')}
      >
        <Strikethrough className={isComment ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleMark('spoiler').run()}
        isActive={editor.isActive('spoiler')}
        title={t('media.richTextSpoiler')}
      >
        <EyeOff className={isComment ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </Btn>
      {showExtended && (
        <>
          <Btn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title={t('media.richTextBulletList')}
          >
            <List className="w-4 h-4" />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title={t('media.richTextOrderedList')}
          >
            <ListOrdered className="w-4 h-4" />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title={t('media.richTextQuote')}
          >
            <TextQuote className="w-4 h-4" />
          </Btn>
          <Btn onClick={setLink} isActive={editor.isActive('link')} title={t('media.richTextLink')}>
            <LinkIcon className="w-4 h-4" />
          </Btn>
        </>
      )}
    </div>
  )

  if (isComment) {
    return (
      <div
        id={id}
        className={`rich-text-editor-wrap--comment flex flex-col flex-1 min-w-0 ${disabled ? 'rich-text-editor-wrap--disabled' : ''} ${className ?? ''}`}
      >
        <div className="rich-text-editor rich-text-editor--comment">
          <EditorContent editor={editor} />
        </div>
        <div className="rich-text-editor-comment-footer">
          <div className="rich-text-editor-comment-footer__toolbar">{toolbar}</div>
          {commentFooter ? (
            <div className="rich-text-editor-comment-footer__actions">{commentFooter}</div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      id={id}
      className={`rich-text-editor-wrap ${disabled ? 'rich-text-editor-wrap--disabled' : ''} ${className ?? ''}`}
      style={style}
    >
      {toolbar}
      <div className="rich-text-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
})

export function richEditorIsSubmittable(html: string): boolean {
  return !isRichTextEmpty(html)
}
