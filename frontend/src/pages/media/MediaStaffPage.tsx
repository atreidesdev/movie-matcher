import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getMediaTitle } from '@/utils/localizedText'
import { getPersonDisplayName } from '@/utils/personUtils'
import { mediaApi } from '@/api/media'
import { getMediaAssetUrl, getMediaPath, type MediaTypeForPath } from '@/utils/mediaPaths'
import type { Media, Cast, Person, MediaStaff } from '@/types'
import type { Profession } from '@/constants/enums'

const CREW_ORDER: { key: string; professions: Profession[] }[] = [
  { key: 'media.directors', professions: ['director'] },
  { key: 'media.screenwriters', professions: ['writer'] },
  { key: 'media.animators', professions: ['animator'] },
  { key: 'media.producers', professions: ['producer'] },
  { key: 'media.composers', professions: ['composer'] },
  { key: 'media.cinematographers', professions: ['cinematographer'] },
  { key: 'media.editors', professions: ['editor'] },
  { key: 'media.authors', professions: ['author'] },
  { key: 'media.illustrators', professions: ['illustrator'] },
  { key: 'media.artists', professions: ['artist'] },
  { key: 'media.gameDesigners', professions: ['gameDesigner'] },
  { key: 'media.levelDesigners', professions: ['levelDesigner'] },
  { key: 'media.translators', professions: ['translator'] },
  { key: 'media.literaryEditors', professions: ['literaryEditor'] },
]

function groupCrewByRole(castList: Cast[]): Record<string, Cast[]> {
  const crew = castList.filter((c) => !c.characterId && c.person)
  const groups: Record<string, Cast[]> = {}
  for (const entry of crew) {
    const profs = entry.person?.profession ?? []
    for (const { key, professions } of CREW_ORDER) {
      if (professions.some((p) => profs.includes(p))) {
        if (!groups[key]) groups[key] = []
        groups[key].push(entry)
      }
    }
  }
  return groups
}

function uniquePersonsFromCasts(entries: Cast[]): Person[] {
  const seen = new Set<number>()
  return entries
    .filter((e) => e.person && !seen.has(e.person.id) && seen.add(e.person.id))
    .map((e) => e.person!) as Person[]
}

interface MediaStaffPageProps {
  type: MediaTypeForPath
}

export default function MediaStaffPage({ type }: MediaStaffPageProps) {
  const { id } = useParams<{ id: string }>()
  const [media, setMedia] = useState<Media | null>(null)
  const [loading, setLoading] = useState(true)
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id, type])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    setMedia(null)
    setLoading(true)
    mediaApi
      .getMediaByType(type, parseInt(id, 10))
      .then(setMedia)
      .catch(() => setMedia(null))
      .finally(() => setLoading(false))
  }, [id, type])

  if (loading) {
    return (
      <div className="animate-pulse max-w-4xl">
        <div className="h-8 w-48 bg-[var(--theme-bg-alt)] rounded mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[var(--theme-bg-alt)] rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!media) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="inline-flex items-center gap-2 link-underline-animate text-sm shrink-0">
            <ArrowLeft className="w-3.5 h-2.5" />
            {t('common.back')}
          </Link>
          <h1 className="text-xl font-semibold text-[var(--theme-text)]">{t('media.staffLink')}</h1>
        </div>
        <p className="text-[var(--theme-text-muted)] mb-4">{t('common.noResults')}</p>
      </div>
    )
  }

  const fullCastList = ('cast' in media && Array.isArray(media.cast) ? (media.cast as Cast[]) : []).filter(
    (c) => c != null
  )
  const crewByRole = groupCrewByRole(fullCastList)
  const staffList = 'staff' in media && Array.isArray(media.staff) ? (media.staff as MediaStaff[]) : []
  const staffByProfession: Record<string, MediaStaff[]> = {}
  for (const s of staffList) {
    const key =
      CREW_ORDER.find(({ professions }) => professions.includes(s.profession as Profession))?.key ??
      `profession:${s.profession}`
    if (!staffByProfession[key]) staffByProfession[key] = []
    staffByProfession[key].push(s)
  }
  const authors = ('authors' in media && Array.isArray(media.authors) ? media.authors : []) as Person[]
  const illustrators = (
    'illustrators' in media && Array.isArray(media.illustrators) ? media.illustrators : []
  ) as Person[]

  const hasAny =
    CREW_ORDER.some(({ key }) => (crewByRole[key]?.length ?? 0) + (staffByProfession[key]?.length ?? 0) > 0) ||
    authors.length > 0 ||
    illustrators.length > 0
  const mediaPath = getMediaPath(type, media.id, getMediaTitle(media, locale) || media.title)

  if (!hasAny) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to={mediaPath} className="inline-flex items-center gap-2 link-underline-animate text-sm shrink-0">
            <ArrowLeft className="w-3.5 h-2.5" />
            {t('common.back')}
          </Link>
          <h1 className="text-xl font-semibold text-[var(--theme-text)]">{t('media.staffLink')}</h1>
        </div>
        <p className="text-[var(--theme-text-muted)]">{t('common.noResults')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={mediaPath} className="inline-flex items-center gap-2 link-underline-animate text-sm shrink-0">
          <ArrowLeft className="w-3.5 h-2.5" />
          {t('common.back')}
        </Link>
        <h1 className="text-xl font-semibold text-[var(--theme-text)]">{t('media.staffLink')}</h1>
      </div>

      <div className="space-y-8">
        {CREW_ORDER.map(({ key }) => {
          const castEntries = crewByRole[key] ?? []
          const staffEntries = staffByProfession[key] ?? []
          const personsFromCast = uniquePersonsFromCasts(castEntries)
          const personsFromStaff = staffEntries
            .filter((s): s is MediaStaff & { person: Person } => !!s.person)
            .map((s) => s.person)
          const seen = new Set<number>()
          const persons = [...personsFromCast, ...personsFromStaff].filter((p) => !seen.has(p.id) && !!seen.add(p.id))
          if (persons.length === 0) return null
          return (
            <section key={key}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t(key)}</h2>
              <ul className="flex flex-wrap gap-5">
                {persons.map((person) => (
                  <li key={person.id}>
                    <Link to={`/persons/${person.id}`} className="block w-36 group">
                      <div className="relative w-36 h-48 rounded-xl overflow-hidden bg-gray-200">
                        {person.avatar ? (
                          <img
                            src={getMediaAssetUrl(person.avatar)}
                            alt=""
                            className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">—</div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm py-2.5 px-2">
                          <span className="text-white text-sm font-medium line-clamp-2 block text-center title-hover-theme">
                            {getPersonDisplayName(person, locale)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        {authors.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('media.authors')}</h2>
            <ul className="flex flex-wrap gap-5">
              {authors.map((person) => (
                <li key={person.id}>
                  <Link to={`/persons/${person.id}`} className="block w-36 group">
                    <div className="relative w-36 h-48 rounded-xl overflow-hidden bg-gray-200">
                      {person.avatar ? (
                        <img
                          src={getMediaAssetUrl(person.avatar)}
                          alt=""
                          className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">—</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm py-2.5 px-2">
                        <span className="text-white text-sm font-medium line-clamp-2 block text-center title-hover-theme">
                          {getPersonDisplayName(person, locale)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {illustrators.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('media.illustrators')}</h2>
            <ul className="flex flex-wrap gap-5">
              {illustrators.map((person) => (
                <li key={person.id}>
                  <Link to={`/persons/${person.id}`} className="block w-36 group">
                    <div className="relative w-36 h-48 rounded-xl overflow-hidden bg-gray-200">
                      {person.avatar ? (
                        <img
                          src={getMediaAssetUrl(person.avatar)}
                          alt=""
                          className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">—</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm py-2.5 px-2">
                        <span className="text-white text-sm font-medium line-clamp-2 block text-center title-hover-theme">
                          {getPersonDisplayName(person, locale)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
