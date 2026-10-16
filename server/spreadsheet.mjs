import Busboy from 'busboy'
import ExcelJS from 'exceljs'

export const MAX_SPREADSHEET_BYTES = 5 * 1024 * 1024
export const MAX_SPREADSHEET_ROWS = 500
export const MAX_SPREADSHEET_COLUMNS = 50

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        cell += character
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true
    } else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted value.')
  if (cell.length || row.length || rows.length === 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

function normalizeCell(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'object') {
    if ('result' in value) return normalizeCell(value.result)
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text ?? '').join('')
    if ('text' in value) return String(value.text ?? '')
  }
  return ''
}

function makePreview(rows, worksheetNames, selectedWorksheet) {
  const headers = rows[0]?.map((value) => String(value).trim()) ?? []
  if (!headers.length || headers.every((header) => !header)) throw new Error('The selected sheet has no header row.')
  if (headers.length > MAX_SPREADSHEET_COLUMNS) throw new Error(`Spreadsheets may have at most ${MAX_SPREADSHEET_COLUMNS} columns.`)
  const seenHeaders = new Set()
  for (const header of headers) {
    const normalized = header.toLocaleLowerCase()
    if (!header) throw new Error('Every column in the header row must have a name.')
    if (seenHeaders.has(normalized)) throw new Error('Column headers must be unique.')
    seenHeaders.add(normalized)
  }
  if (rows.length - 1 > MAX_SPREADSHEET_ROWS) throw new Error(`Spreadsheets may have at most ${MAX_SPREADSHEET_ROWS} data rows.`)
  const dataRows = rows.slice(1)
    .map((values, index) => ({ values, rowNumber: index + 2 }))
    .filter(({ values }) => values.some((value) => String(value ?? '').trim() !== ''))
  return {
    worksheetNames,
    selectedWorksheet,
    headers,
    rows: dataRows.map(({ values }) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))),
    rowNumbers: dataRows.map(({ rowNumber }) => rowNumber),
  }
}

export async function parseSpreadsheet(buffer, filename, requestedWorksheet) {
  const extension = filename.toLowerCase().split('.').pop()
  if (extension === 'csv') {
    let text
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^\uFEFF/, '')
    } catch {
      throw new Error('CSV files must use UTF-8 encoding.')
    }
    const rows = parseCsv(text)
    return makePreview(rows, [filename], filename)
  }
  if (extension !== 'xlsx') throw new Error('Upload an .xlsx or .csv file. Legacy .xls files are not supported.')
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new Error('The uploaded .xlsx file is not a valid workbook.')

  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(buffer)
  } catch {
    throw new Error('The uploaded .xlsx file could not be opened.')
  }
  const worksheetNames = workbook.worksheets.map((worksheet) => worksheet.name)
  if (!worksheetNames.length || worksheetNames.length > 10) throw new Error('Workbooks must contain between 1 and 10 worksheets.')
  const selectedWorksheet = requestedWorksheet || worksheetNames[0]
  const worksheet = workbook.getWorksheet(selectedWorksheet)
  if (!worksheet) throw new Error('Choose a worksheet from the uploaded workbook.')
  if (worksheet.rowCount > MAX_SPREADSHEET_ROWS + 1) throw new Error(`Spreadsheets may have at most ${MAX_SPREADSHEET_ROWS} data rows.`)
  if (worksheet.columnCount > MAX_SPREADSHEET_COLUMNS) throw new Error(`Spreadsheets may have at most ${MAX_SPREADSHEET_COLUMNS} columns.`)

  const rows = Array.from({ length: worksheet.rowCount }, (_, index) => {
    const worksheetRow = worksheet.getRow(index + 1)
    return Array.from({ length: worksheet.columnCount }, (_, columnIndex) => normalizeCell(worksheetRow.getCell(columnIndex + 1).value))
  })
  return makePreview(rows, worksheetNames, selectedWorksheet)
}

export async function receiveSpreadsheet(request) {
  return new Promise((resolve, reject) => {
    let parser
    try {
      parser = Busboy({
        headers: request.headers,
        limits: { files: 1, fileSize: MAX_SPREADSHEET_BYTES, fields: 2, fieldSize: 200 },
      })
    } catch {
      reject(new Error('Upload must use multipart form data with one spreadsheet file.'))
      return
    }

    let fileBuffer
    let filename = ''
    let worksheet = ''
    let fileSeen = false
    let uploadError
    parser.on('field', (name, value) => {
      if (name === 'worksheet') worksheet = value
    })
    parser.on('file', (name, stream, info) => {
      if (name !== 'file' || fileSeen) {
        uploadError = new Error('Upload exactly one spreadsheet file.')
        stream.resume()
        return
      }
      fileSeen = true
      filename = info.filename
      const chunks = []
      let size = 0
      stream.on('data', (chunk) => {
        size += chunk.length
        if (size <= MAX_SPREADSHEET_BYTES) chunks.push(chunk)
      })
      stream.on('limit', () => {
        uploadError = new Error('Spreadsheet uploads are limited to 5 MB.')
        uploadError.status = 413
      })
      stream.on('end', () => { fileBuffer = Buffer.concat(chunks) })
    })
    parser.on('filesLimit', () => { uploadError = new Error('Upload exactly one spreadsheet file.') })
    parser.on('fieldsLimit', () => { uploadError = new Error('Upload contains too many fields.') })
    parser.on('error', () => reject(new Error('Could not read the spreadsheet upload.')))
    parser.on('close', () => {
      if (uploadError) reject(uploadError)
      else if (!fileSeen || !fileBuffer?.length) reject(new Error('Choose a spreadsheet file to upload.'))
      else resolve({ buffer: fileBuffer, filename, worksheet })
    })
    request.pipe(parser)
  })
}
