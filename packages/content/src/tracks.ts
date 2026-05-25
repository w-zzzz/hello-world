import type { TrackId, TrackMeta } from './schema'

export const TRACKS: TrackMeta[] = [
  { id: 'A', titleKey: 'tracks.A.title', descriptionKey: 'tracks.A.desc', color: 'sky', order: 1 },
  {
    id: 'B',
    titleKey: 'tracks.B.title',
    descriptionKey: 'tracks.B.desc',
    color: 'violet',
    order: 2,
  },
  {
    id: 'C',
    titleKey: 'tracks.C.title',
    descriptionKey: 'tracks.C.desc',
    color: 'fuchsia',
    order: 3,
  },
  {
    id: 'D',
    titleKey: 'tracks.D.title',
    descriptionKey: 'tracks.D.desc',
    color: 'amber',
    order: 4,
  },
  {
    id: 'E',
    titleKey: 'tracks.E.title',
    descriptionKey: 'tracks.E.desc',
    color: 'emerald',
    order: 5,
  },
  { id: 'F', titleKey: 'tracks.F.title', descriptionKey: 'tracks.F.desc', color: 'rose', order: 6 },
  { id: 'G', titleKey: 'tracks.G.title', descriptionKey: 'tracks.G.desc', color: 'cyan', order: 7 },
  {
    id: 'H',
    titleKey: 'tracks.H.title',
    descriptionKey: 'tracks.H.desc',
    color: 'indigo',
    order: 8,
  },
]

export function getTrack(id: TrackId): TrackMeta | undefined {
  return TRACKS.find((t) => t.id === id)
}
