import type { Discussion } from '@/api/discussions'
import CommentSectionV2 from '@/components/CommentSectionV2'
import { IconPlus } from '@/components/icons'

interface MediaDetailDiscussionsSectionProps {
  user: { id: number } | null
  discussions: Discussion[]
  discussionsLoading: boolean
  selectedDiscussion: Discussion | null
  onSelectDiscussion: (discussion: Discussion) => void
  onBackToList: () => void
  onOpenCreateDiscussion: () => void
  t: (key: string, params?: Record<string, unknown>) => string
}

export function MediaDetailDiscussionsSection({
  user,
  discussions,
  discussionsLoading,
  selectedDiscussion,
  onSelectDiscussion,
  onBackToList,
  onOpenCreateDiscussion,
  t,
}: MediaDetailDiscussionsSectionProps) {
  if (selectedDiscussion) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBackToList}
          className="text-sm text-[var(--theme-primary)] hover:underline self-start"
        >
          ← {t('media.discussionBackToList')}
        </button>
        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/50 p-4">
          <h2 className="text-xl font-semibold text-[var(--theme-text)] mb-2">{selectedDiscussion.title}</h2>
          {selectedDiscussion.description ? (
            <p className="text-[var(--theme-text-muted)] whitespace-pre-wrap">{selectedDiscussion.description}</p>
          ) : null}
          <p className="text-xs text-[var(--theme-text-muted)] mt-2">
            {selectedDiscussion.user?.name ?? selectedDiscussion.user?.username ?? 'User'} ·{' '}
            {selectedDiscussion.commentsCount ?? 0} {t('media.discussionCommentsCount')}
          </p>
        </div>
        <CommentSectionV2 discussionId={selectedDiscussion.id} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold text-[var(--theme-text)]">{t('media.discussions')}</h3>
        {user && (
          <button type="button" onClick={onOpenCreateDiscussion} className="btn-primary inline-flex items-center gap-2">
            <IconPlus className="w-4 h-4" />
            {t('media.discussionCreate')}
          </button>
        )}
      </div>
      <div>
        {discussionsLoading ? (
          <p className="text-[var(--theme-text-muted)] text-sm">{t('common.loading')}</p>
        ) : discussions.length === 0 ? (
          <p className="text-[var(--theme-text-muted)] text-sm">{t('media.discussionNoItems')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {discussions.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onSelectDiscussion(d)}
                  className="w-full text-left rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-surface)] p-4 transition-colors"
                >
                  <span className="font-medium text-[var(--theme-text)] block">{d.title}</span>
                  {d.description ? (
                    <span className="text-sm text-[var(--theme-text-muted)] line-clamp-2 mt-1 block">
                      {d.description}
                    </span>
                  ) : null}
                  <span className="text-xs text-[var(--theme-text-muted)] mt-2 block">
                    {d.user?.name ?? d.user?.username ?? 'User'} · {d.commentsCount ?? 0}{' '}
                    {t('media.discussionCommentsCount')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
