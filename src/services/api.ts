import { z } from 'zod'
import type { BusinessConfig, BusinessRecord } from '../types/config'
import { getRecords, saveConfig, upsertRecord, deleteRecord } from './demoStore'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const apiRouteUrl = (path: string) => `${API_BASE_URL ?? ''}${API_BASE_URL?.endsWith('/api') ? '' : '/api'}${path}`
const configurationValidator = z.object({
  version: z.literal('1.0'),
  domain: z.enum(['retail', 'healthcare', 'warehouse', 'hospitality']),
  title: z.string().trim().min(1).max(100),
  industry: z.string().trim().min(1).max(80),
  entities: z.array(z.object({
    key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/).max(40),
    label: z.string().trim().min(1).max(80),
    singular: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(200),
    fields: z.array(z.object({
      key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/).max(40),
      label: z.string().trim().min(1).max(80),
      type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
      required: z.boolean().optional(),
      options: z.array(z.string().min(1).max(60)).max(20).optional(),
    }).strict()).min(1).max(12).superRefine((fields, ctx) => {
      const keys = new Set<string>()
      fields.forEach((field, index) => {
        if (keys.has(field.key)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'key'], message: 'Field keys must be unique.' })
        keys.add(field.key)
        if (field.type === 'select' && !field.options?.length) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'options'], message: 'Select fields need at least one option.' })
        }
        if (field.type !== 'select' && field.options?.length) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'options'], message: 'Only select fields can have options.' })
        }
      })
    }),
  }).strict()).min(1).max(8),
  dashboard: z.object({
    widgets: z.array(z.object({
      key: z.string().regex(/^[a-z][a-zA-Z0-9-]*$/).max(40),
      type: z.enum(['count', 'sum', 'low-stock', 'recent']),
      entity: z.string().regex(/^[a-z][a-zA-Z0-9]*$/).max(40),
      label: z.string().trim().min(1).max(80),
      field: z.string().max(40).optional(),
    }).strict()).min(1).max(8),
  }).strict(),
}).strict().superRefine((config, ctx) => {
  const entityKeys = new Set(config.entities.map((entity) => entity.key))
  if (entityKeys.size !== config.entities.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Entity keys must be unique.' })
  }
  for (const widget of config.dashboard.widgets) {
    if (!entityKeys.has(widget.entity)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Widget references unknown entity: ${widget.entity}` })
    }
  }
})

function validateConfiguration(value: unknown): BusinessConfig {
  const parsed = configurationValidator.safeParse(value)
  if (!parsed.success) throw new Error('The workspace configuration is invalid and could not be saved.')
  return parsed.data as BusinessConfig
}

export function validateBusinessRecord(config: BusinessConfig, entityKey: string, record: BusinessRecord): Record<string, string | number | boolean> {
  const entity = config.entities.find((item) => item.key === entityKey)
  if (!entity) throw new Error('This record does not belong to an entity in the active configuration.')
  const allowedKeys = new Set(entity.fields.map((field) => field.key))
  for (const key of Object.keys(record)) {
    if (key !== 'id' && !allowedKeys.has(key)) throw new Error(`The record contains an unsupported field: ${key}.`)
  }
  const values: Record<string, string | number | boolean> = {}
  for (const field of entity.fields) {
    const value = record[field.key]
    if (value === undefined || value === '') {
      if (field.required) throw new Error(`${field.label} is required.`)
      continue
    }
    if (field.type === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${field.label} must be a valid number.`)
    } else if (field.type === 'boolean') {
      if (typeof value !== 'boolean') throw new Error(`${field.label} must be enabled or disabled.`)
    } else {
      if (typeof value !== 'string') throw new Error(`${field.label} must be text.`)
      if (field.type === 'date' && Number.isNaN(Date.parse(value))) throw new Error(`${field.label} must be a valid date.`)
      if (field.type === 'select' && !field.options?.includes(value)) throw new Error(`Choose a valid option for ${field.label}.`)
    }
    values[field.key] = value
  }
  return values
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error('API mode is not configured.')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) throw new Error(`API request failed (${response.status}).`)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const isApiConfigured = Boolean(API_BASE_URL)
export const isCloudDataConfigured = Boolean(supabase)

export interface GenerateConfigurationInput {
  businessName: string
  description: string
  domain: BusinessConfig['domain']
}

export class ConfigurationRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ConfigurationRequestError'
  }
}

export interface SpreadsheetPreview {
  filename: string
  worksheetNames: string[]
  selectedWorksheet: string
  headers: string[]
  rows: Record<string, string | number | boolean>[]
  rowNumbers: number[]
}

export async function previewSpreadsheet(file: File, worksheet?: string): Promise<SpreadsheetPreview> {
  if (!supabase) throw new Error('Spreadsheet imports require Supabase authentication.')
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw new Error(`Could not verify your sign-in session: ${error.message}`)
  if (!session?.access_token) throw new Error('Sign in again before uploading a spreadsheet.')
  const body = new FormData()
  body.append('file', file)
  if (worksheet) body.append('worksheet', worksheet)
  let response: Response
  try {
    response = await fetch(apiRouteUrl('/imports/preview'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body,
    })
  } catch {
    throw new Error('Could not reach the AdaptAI server to preview this spreadsheet.')
  }
  const result = await response.json().catch(() => null) as (SpreadsheetPreview & { error?: string }) | null
  if (!response.ok) throw new Error(result?.error ?? `Spreadsheet preview failed (${response.status}).`)
  if (!result || !Array.isArray(result.headers) || !Array.isArray(result.rows) || !Array.isArray(result.worksheetNames) || !Array.isArray(result.rowNumbers) || result.rows.length !== result.rowNumbers.length) {
    throw new Error('The AdaptAI server returned an invalid spreadsheet preview.')
  }
  return result
}

export async function generateConfiguration(input: GenerateConfigurationInput): Promise<BusinessConfig> {
  let response: Response
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 20_000)
  try {
    response = await fetch(apiRouteUrl('/configurations/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
  } catch (error) {
    const message = error instanceof DOMException && error.name === 'AbortError'
      ? 'AI generation took too long.'
      : 'Could not reach the AdaptAI server.'
    throw new ConfigurationRequestError(`${message} You can use an industry template instead.`, 0)
  } finally {
    window.clearTimeout(timeout)
  }
  const body = await response.json().catch(() => null) as { error?: string } | null
  if (!response.ok) {
    throw new ConfigurationRequestError(body?.error ?? `Configuration generation failed (${response.status}).`, response.status)
  }
  if (!body || typeof body !== 'object' || !('domain' in body)) {
    throw new ConfigurationRequestError('The AdaptAI server returned an invalid configuration response.', response.status)
  }
  return validateConfiguration(body)
}

async function getWorkspaceId(): Promise<string> {
  if (!supabase) throw new Error('Cloud data is not configured.')

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(`Could not verify the signed-in user: ${userError.message}`)
  if (!user) throw new Error('Sign in to access workspace data.')

  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
  if (workspaceError) throw new Error(`Could not load your workspace: ${workspaceError.message}`)
  if (workspaces?.[0]) return workspaces[0].id

  const fullName = String(user.user_metadata?.full_name ?? '').trim()
  const accountName = fullName || user.email?.split('@')[0] || 'My'
  const { data: workspace, error: createError } = await supabase
    .from('workspaces')
    .insert({ owner_id: user.id, name: `${accountName}'s workspace` })
    .select('id')
    .single()
  if (createError) throw new Error(`Could not create your workspace: ${createError.message}`)
  return workspace.id
}

async function ensureConfiguration(config: BusinessConfig, workspaceId: string): Promise<string> {
  if (!supabase) throw new Error('Cloud data is not configured.')
  const validatedConfig = validateConfiguration(config)
  const { data, error } = await supabase
    .from('domain_configurations')
    .upsert({
      workspace_id: workspaceId,
      domain: validatedConfig.domain,
      config: validatedConfig,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,domain' })
    .select('id')
    .single()
  if (error) throw new Error(`Could not save the workspace configuration: ${error.message}`)
  return data.id
}

async function loadCloudRecords(config: BusinessConfig, entity: string): Promise<BusinessRecord[]> {
  if (!supabase) throw new Error('Cloud data is not configured.')
  const workspaceId = await getWorkspaceId()
  const { data: savedConfiguration, error: configurationError } = await supabase
    .from('domain_configurations')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('domain', config.domain)
    .maybeSingle()
  if (configurationError) throw new Error(`Could not load the workspace configuration: ${configurationError.message}`)
  const configurationId = savedConfiguration?.id ?? await ensureConfiguration(config, workspaceId)
  const { data, error } = await supabase
    .from('business_records')
    .select('id,data')
    .eq('workspace_id', workspaceId)
    .eq('configuration_id', configurationId)
    .eq('entity_key', entity)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Could not load ${entity} records: ${error.message}`)
  return (data ?? []).map((row) => ({ ...row.data, id: row.id }))
}

export const dataService = {
  async loadConfiguration(domain: BusinessConfig['domain']): Promise<BusinessConfig | null> {
    if (!supabase) return null
    const workspaceId = await getWorkspaceId()
    const { data, error } = await supabase
      .from('domain_configurations')
      .select('config')
      .eq('workspace_id', workspaceId)
      .eq('domain', domain)
      .maybeSingle()
    if (error) throw new Error(`Could not load the workspace configuration: ${error.message}`)
    if (!data?.config) return null
    const config = validateConfiguration(data.config)
    if (config.domain !== domain) throw new Error('The saved configuration domain does not match its workspace record.')
    return config
  },
  async listRecords(config: BusinessConfig, entity: string): Promise<BusinessRecord[]> {
    if (supabase) return loadCloudRecords(config, entity)
    if (API_BASE_URL) return request(`/configurations/${config.domain}/records/${entity}`)
    return getRecords(config.domain)[entity] ?? []
  },
  async saveConfiguration(config: BusinessConfig): Promise<void> {
    const validatedConfig = validateConfiguration(config)
    if (supabase) {
      const workspaceId = await getWorkspaceId()
      await ensureConfiguration(validatedConfig, workspaceId)
      return
    }
    if (API_BASE_URL) {
      await request('/configurations', { method: 'POST', body: JSON.stringify(validatedConfig) })
      return
    }
    saveConfig(validatedConfig)
  },
  async saveRecord(config: BusinessConfig, entity: string, record: BusinessRecord): Promise<void> {
    if (supabase) {
      const workspaceId = await getWorkspaceId()
      const configurationId = await ensureConfiguration(config, workspaceId)
      const id = record.id
      const recordData = validateBusinessRecord(config, entity, record)
      if (id && UUID_PATTERN.test(String(id))) {
        const { data, error } = await supabase.from('business_records')
          .update({ data: recordData, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('workspace_id', workspaceId)
          .eq('configuration_id', configurationId)
          .eq('entity_key', entity)
          .select('id')
          .maybeSingle()
        if (error) throw new Error(`Could not update this record: ${error.message}`)
        if (!data) throw new Error('This record no longer exists or you do not have permission to update it.')
      } else {
        const { error } = await supabase.from('business_records').insert({
          workspace_id: workspaceId,
          configuration_id: configurationId,
          entity_key: entity,
          data: recordData,
        })
        if (error) throw new Error(`Could not save this record: ${error.message}`)
      }
      return
    }
    if (API_BASE_URL) {
      const id = record.id
      const path = `/configurations/${config.domain}/records/${entity}${id ? `/${encodeURIComponent(String(id))}` : ''}`
      await request(path, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(record) })
      return
    }
    upsertRecord(config.domain, entity, record)
  },
  async importRecords(
    config: BusinessConfig,
    entity: string,
    rows: { rowNumber: number; data: BusinessRecord }[],
    rowErrors: { rowNumber: number; error: string }[],
    importKey: string,
    filename: string,
  ): Promise<{ imported: number; skipped: number; alreadyImported: boolean }> {
    if (!supabase) throw new Error('Spreadsheet imports require Supabase persistence.')
    if (rows.length + rowErrors.length > 500) throw new Error('An import cannot contain more than 500 spreadsheet rows.')
    if (!config.entities.some((item) => item.key === entity)) throw new Error('Choose a valid entity for this import.')
    if (!UUID_PATTERN.test(importKey)) throw new Error('This import has an invalid idempotency key.')
    const preparedRows = rows.map(({ rowNumber, data }) => ({
      rowNumber,
      data: validateBusinessRecord(config, entity, data),
    }))
    const workspaceId = await getWorkspaceId()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw new Error(`Could not verify the signed-in user: ${userError.message}`)
    if (!user) throw new Error('Sign in before importing records.')
    const configurationId = await ensureConfiguration(config, workspaceId)
    const existing = await supabase.from('spreadsheet_import_jobs')
      .select('id,status,imported_rows,skipped_rows')
      .eq('workspace_id', workspaceId)
      .eq('idempotency_key', importKey)
      .maybeSingle()
    if (existing.error) throw new Error(`Could not check import status: ${existing.error.message}`)
    if (existing.data?.status === 'completed') {
      return { imported: existing.data.imported_rows, skipped: existing.data.skipped_rows, alreadyImported: true }
    }

    let jobId = existing.data?.id
    if (!jobId) {
      const created = await supabase.from('spreadsheet_import_jobs').insert({
        workspace_id: workspaceId,
        configuration_id: configurationId,
        entity_key: entity,
        idempotency_key: importKey,
        source_name: filename.slice(0, 255),
        status: 'processing',
        total_rows: rows.length + rowErrors.length,
        imported_rows: 0,
        skipped_rows: rowErrors.length,
        error_report: rowErrors,
        created_by: user.id,
      }).select('id').single()
      if (created.error) {
        if (created.error.code === '23505') throw new Error('This import was submitted already. Refresh the import page to check its status.')
        throw new Error(`Could not start the import: ${created.error.message}`)
      }
      jobId = created.data.id
    } else {
      const { error } = await supabase.from('spreadsheet_import_jobs')
        .update({ status: 'processing', configuration_id: configurationId, entity_key: entity, source_name: filename.slice(0, 255), total_rows: rows.length + rowErrors.length, skipped_rows: rowErrors.length, error_report: rowErrors })
        .eq('id', jobId)
        .eq('workspace_id', workspaceId)
      if (error) throw new Error(`Could not resume the import: ${error.message}`)
    }

    const validatedRows = preparedRows.map(({ rowNumber, data }) => ({
      import_job_id: jobId,
      source_row: rowNumber,
      workspace_id: workspaceId,
      configuration_id: configurationId,
      entity_key: entity,
      data,
    }))
    try {
      for (let offset = 0; offset < validatedRows.length; offset += 100) {
        const batch = validatedRows.slice(offset, offset + 100)
        const { error } = await supabase.from('business_records')
          .upsert(batch, { onConflict: 'import_job_id,source_row' })
        if (error) throw new Error(error.message)
      }
      const { error } = await supabase.from('spreadsheet_import_jobs')
        .update({ status: 'completed', imported_rows: rows.length, skipped_rows: rowErrors.length, error_report: rowErrors, completed_at: new Date().toISOString() })
        .eq('id', jobId)
        .eq('workspace_id', workspaceId)
      if (error) throw new Error(error.message)
    } catch (error) {
      const failureMessage = error instanceof Error ? error.message : 'Unknown persistence error.'
      const failedStatus = await supabase.from('spreadsheet_import_jobs')
        .update({
          status: 'failed',
          imported_rows: 0,
          error_report: [...rowErrors, { rowNumber: 0, error: `Import persistence failed: ${failureMessage}` }],
        })
        .eq('id', jobId)
        .eq('workspace_id', workspaceId)
      if (failedStatus.error) {
        throw new Error(`Import failed (${failureMessage}) and its status could not be updated (${failedStatus.error.message}).`)
      }
      throw new Error(`Import did not complete: ${failureMessage}`)
    }
    return { imported: rows.length, skipped: rowErrors.length, alreadyImported: false }
  },
  async removeRecord(config: BusinessConfig, entity: string, id: string): Promise<void> {
    if (supabase) {
      if (!UUID_PATTERN.test(id)) throw new Error('This record has an invalid identifier.')
      const workspaceId = await getWorkspaceId()
      const configurationId = await ensureConfiguration(config, workspaceId)
      const { data, error } = await supabase.from('business_records')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .eq('configuration_id', configurationId)
        .eq('entity_key', entity)
        .select('id')
        .maybeSingle()
      if (error) throw new Error(`Could not delete this record: ${error.message}`)
      if (!data) throw new Error('This record no longer exists or you do not have permission to delete it.')
      return
    }
    if (API_BASE_URL) {
      await request(`/configurations/${config.domain}/records/${entity}/${encodeURIComponent(id)}`, { method: 'DELETE' })
      return
    }
    deleteRecord(config.domain, entity, id)
  },
}
