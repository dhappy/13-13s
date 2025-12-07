export interface Point {
  x: number
  y: number
}

export interface Team {
  colors: string
  months: string
}

export type MetaInfo = (
  Partial<Record<keyof Team, Record<string, string>>>
  & Partial<Record<'closed', Record<keyof Team, boolean>>>
)

export interface Config {
  teams: Array<Team>
  meta: MetaInfo
}

export interface Data {
  groups?: Array<Record<string, string>>
  colors?: Record<string, string>
  realms?: Record<string, string>
  projects?: Record<string, string>
  months?: Record<string, string>
}
