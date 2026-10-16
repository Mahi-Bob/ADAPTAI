import { demoConfigs } from '../config/demoConfigs'
import { initialRecords, type RecordsByEntity } from '../data/demoRecords'
import type { BusinessConfig, BusinessRecord } from '../types/config'

const CONFIG_KEY = 'adaptai.demo.config'
const RECORDS_KEY = 'adaptai.demo.records'
let userScope: string | null = null

export function setDemoUserScope(userId: string | null): void {
  userScope = userId
}

function scopedKey(key: string): string {
  return userScope ? `${key}.${userScope}` : key
}

function readStored<T>(key: string): T | undefined {
  const raw = localStorage.getItem(key)
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch (error) {
    throw new Error(`Could not read saved demo data (${key}). Clear this browser's AdaptAI demo data and try again.`)
  }
}

function writeStored(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getActiveConfig(): BusinessConfig {
  const saved = readStored<BusinessConfig>(scopedKey(CONFIG_KEY))
  if (saved && saved.domain in demoConfigs) return saved
  return demoConfigs.retail
}

export function saveConfig(config: BusinessConfig): void {
  writeStored(scopedKey(CONFIG_KEY), config)
  window.dispatchEvent(new Event('adaptai:config-changed'))
}

export function getRecords(domain: BusinessConfig['domain']): RecordsByEntity {
  const saved = readStored<Record<string, RecordsByEntity>>(scopedKey(RECORDS_KEY))
  return saved?.[domain] ?? structuredClone(initialRecords[domain])
}

function persistDomain(domain: BusinessConfig['domain'], records: RecordsByEntity) {
  const key = scopedKey(RECORDS_KEY)
  const all = readStored<Record<string, RecordsByEntity>>(key) ?? {}
  all[domain] = records
  writeStored(key, all)
}

export function upsertRecord(domain: BusinessConfig['domain'], entity: string, record: BusinessRecord): void {
  const records = getRecords(domain)
  const items = records[entity] ?? []
  const id = String(record.id ?? crypto.randomUUID())
  const next = items.some((item) => item.id === id)
    ? items.map((item) => item.id === id ? { ...record, id } : item)
    : [{ ...record, id }, ...items]
  persistDomain(domain, { ...records, [entity]: next })
}

export function deleteRecord(domain: BusinessConfig['domain'], entity: string, id: string): void {
  const records = getRecords(domain)
  persistDomain(domain, { ...records, [entity]: (records[entity] ?? []).filter((record) => record.id !== id) })
}
