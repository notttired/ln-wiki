export interface StoryArc {
  title: string
  description: string
  chapter_start: number
  chapter_end: number
  main_characters: string[]
  supporting_characters: string[]
  key_events: string[]
}

export interface NovelSummary {
  overview: string
  arcs: StoryArc[]
}
