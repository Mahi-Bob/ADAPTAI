export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select'

export interface ConfigField {
  key: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
}

export interface ConfigEntity {
  key: string
  label: string
  singular: string
  description: string
  fields: ConfigField[]
}

export interface DashboardWidget {
  key: string
  type: 'count' | 'sum' | 'low-stock' | 'recent'
  entity: string
  label: string
  field?: string
}

export interface BusinessConfig {
  version: '1.0'
  domain: 'retail' | 'healthcare' | 'warehouse' | 'hospitality'
  title: string
  industry: string
  entities: ConfigEntity[]
  dashboard: { widgets: DashboardWidget[] }
}

export type BusinessRecord = Record<string, string | number | boolean>
