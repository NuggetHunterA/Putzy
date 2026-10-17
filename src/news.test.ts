import { describe, expect, it } from 'vitest'
import { unread } from './news'

describe('Was ist neu', () => {
  const news = [
    { id: 1, title: 'A', text: '' },
    { id: 2, title: 'B', text: '' },
    { id: 3, title: 'C', text: '' },
  ]

  it('zeigt alles seit dem letzten Stand, neueste oben', () => {
    expect(unread(1, news).map((n) => n.id)).toEqual([3, 2])
    expect(unread(3, news)).toEqual([])
  })

  it('zeigt einer Person ohne Stand nichts', () => {
    expect(unread(undefined, news)).toEqual([])
  })
})
