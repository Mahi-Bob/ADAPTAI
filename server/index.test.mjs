import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApiServer } from './index.mjs'

const requestBody = {
  businessName: 'Northside Distribution',
  description: 'Track incoming stock, storage locations, and outgoing dispatches.',
  domain: 'warehouse',
}

function generatedConfiguration({ includeDashboard = true } = {}) {
  return {
    version: '1.0',
    domain: 'warehouse',
    title: 'Northside Distribution',
    industry: 'Warehouse & Logistics',
    entities: [{
      key: 'stock',
      label: 'Stock',
      singular: 'Stock item',
      description: 'Items stored in the warehouse.',
      fields: [{ key: 'sku', label: 'SKU', type: 'text', required: true, options: [] }],
    }],
    ...(includeDashboard ? { dashboard: { widgets: [{ key: 'stock-count', type: 'count', entity: 'stock', label: 'Stock items', field: null }] } } : {}),
  }
}

let originalFetch
let originalApiKey
let originalNodeEnv
let server
let apiOrigin

before(async () => {
  originalFetch = globalThis.fetch
  originalApiKey = process.env.GROQ_API_KEY
  originalNodeEnv = process.env.NODE_ENV
  process.env.GROQ_API_KEY = 'test-key-never-printed'
  process.env.NODE_ENV = 'production'
  server = createApiServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  apiOrigin = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  globalThis.fetch = originalFetch
  if (originalApiKey === undefined) delete process.env.GROQ_API_KEY
  else process.env.GROQ_API_KEY = originalApiKey
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = originalNodeEnv
  if (server?.listening) await new Promise((resolve) => server.close(resolve))
})

async function withProvider(provider, action) {
  const calls = []
  globalThis.fetch = async (resource, init) => {
    const url = String(resource)
    if (url.startsWith('https://api.groq.com/')) {
      calls.push(JSON.parse(init.body).response_format?.type)
      return provider(url, init, calls)
    }
    return originalFetch(resource, init)
  }
  try {
    return await action(calls)
  } finally {
    globalThis.fetch = originalFetch
  }
}

async function postConfiguration(payload) {
  return originalFetch(`${apiOrigin}/api/configurations/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

test('valid warehouse request returns a compatible generated configuration', async () => {
  await withProvider(async () => new Response(JSON.stringify({
    choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(generatedConfiguration()) } }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }), async (calls) => {
    const response = await postConfiguration(requestBody)
    const config = await response.json()
    assert.equal(response.status, 200)
    assert.equal(config.domain, requestBody.domain)
    assert.equal(config.entities[0].key, 'stock')
    assert.equal(config.dashboard.widgets[0].entity, 'stock')
    assert.deepEqual(calls, ['json_schema'])
  })
})

test('health route identifies the current API process without exposing credentials', async () => {
  const response = await originalFetch(`${apiOrigin}/api/health`)
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-adaptai-api-version'), '2')
  assert.deepEqual(body, { service: 'AdaptAI API', apiVersion: 2, generator: 'groq', aiConfigured: true })
})

test('spreadsheet previews require an authenticated Supabase session', async () => {
  const response = await originalFetch(`${apiOrigin}/api/imports/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const body = await response.json()
  assert.equal(response.status, 401)
  assert.equal(body.error, 'Sign in to upload a spreadsheet.')
})

test('authenticated spreadsheet preview returns parsed CSV rows without logging their contents', async () => {
  const previousUrl = process.env.VITE_SUPABASE_URL
  const previousKey = process.env.VITE_SUPABASE_ANON_KEY
  process.env.VITE_SUPABASE_URL = 'https://adaptai-test.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
  globalThis.fetch = async (resource) => {
    assert.equal(String(resource), 'https://adaptai-test.supabase.co/auth/v1/user')
    return new Response(JSON.stringify({ id: 'user-id' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  try {
    const form = new FormData()
    form.append('file', new Blob(['Name,Quantity\nSample item,12\n'], { type: 'text/csv' }), 'stock.csv')
    const response = await originalFetch(`${apiOrigin}/api/imports/preview`, {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-test-session' },
      body: form,
    })
    const body = await response.json()
    assert.equal(response.status, 200)
    assert.equal(body.filename, 'stock.csv')
    assert.deepEqual(body.headers, ['Name', 'Quantity'])
    assert.deepEqual(body.rows, [{ Name: 'Sample item', Quantity: '12' }])
  } finally {
    globalThis.fetch = originalFetch
    if (previousUrl === undefined) delete process.env.VITE_SUPABASE_URL
    else process.env.VITE_SUPABASE_URL = previousUrl
    if (previousKey === undefined) delete process.env.VITE_SUPABASE_ANON_KEY
    else process.env.VITE_SUPABASE_ANON_KEY = previousKey
  }
})

test('invalid business details return 400 without calling Groq', async () => {
  await withProvider(async () => {
    throw new Error('Provider must not be called for invalid input.')
  }, async (calls) => {
    const response = await postConfiguration({ ...requestBody, description: 'Short' })
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.match(body.error, /business name, description, and selected industry/i)
    assert.equal(calls.length, 0)
  })
})

test('Groq schema rejection retries JSON mode and repairs a missing dashboard', async () => {
  await withProvider(async (_url, init, calls) => {
    const request = JSON.parse(init.body)
    if (calls.length === 1) {
      return new Response(JSON.stringify({ error: { message: 'Generated JSON does not match the expected schema: missing properties: dashboard' } }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({
      choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(generatedConfiguration({ includeDashboard: false })) } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }, async (calls) => {
    const response = await postConfiguration(requestBody)
    const config = await response.json()
    assert.equal(response.status, 200)
    assert.deepEqual(calls, ['json_schema', 'json_object'])
    assert.equal(config.domain, 'warehouse')
    assert.equal(config.dashboard.widgets[0].entity, 'stock')
    assert.equal(config.dashboard.widgets[0].type, 'count')
  })
})

test('AI provider failure returns a clear non-success response', async () => {
  await withProvider(async () => new Response(JSON.stringify({ error: { message: 'Rate limit reached.' } }), {
    status: 429, headers: { 'Content-Type': 'application/json' },
  }), async (calls) => {
    const response = await postConfiguration(requestBody)
    const body = await response.json()
    assert.equal(response.status, 503)
    assert.equal(body.error, 'Rate limit reached.')
    assert.equal(calls.length, 1)
  })
})
