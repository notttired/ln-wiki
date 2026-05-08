export interface GraphEntity {
  id: string
  name: string
  importance: number
  short_description: string
  chapter_mentions: { chapter: number; context: string }[]
}

export interface GraphRelation {
  id: string
  entity_id_a: string
  entity_id_b: string
  relation_type: string
  description: string
  importance: number
}
