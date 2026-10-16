import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { test } from 'node:test'
import { parseSpreadsheet } from './spreadsheet.mjs'

test('CSV parsing preserves quoted commas and embedded newlines', async () => {
  const csv = 'Name,Notes,Quantity\r\n"Corner Shop","sells, local goods",12\r\n"Second Shop","line one\nline two",5\r\n'
  const result = await parseSpreadsheet(Buffer.from(csv), 'stores.csv')
  assert.deepEqual(result.headers, ['Name', 'Notes', 'Quantity'])
  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.rowNumbers, [2, 3])
  assert.equal(result.rows[0].Notes, 'sells, local goods')
  assert.equal(result.rows[1].Notes, 'line one\nline two')
  assert.equal(result.rows[0].Quantity, '12')
})

test('XLSX parsing exposes worksheet names and selected sheet records', async () => {
  const workbook = new ExcelJS.Workbook()
  const first = workbook.addWorksheet('Products')
  first.addRow(['Name', 'Stock'])
  first.addRow(['Notebook', 14])
  const second = workbook.addWorksheet('Supplies')
  second.addRow(['Supplier', 'Active'])
  second.addRow(['Paper Co.', true])
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  const result = await parseSpreadsheet(buffer, 'inventory.xlsx', 'Supplies')
  assert.deepEqual(result.worksheetNames, ['Products', 'Supplies'])
  assert.equal(result.selectedWorksheet, 'Supplies')
  assert.deepEqual(result.rows, [{ Supplier: 'Paper Co.', Active: true }])
  assert.deepEqual(result.rowNumbers, [2])
})

test('CSV preview keeps source row numbers when blank lines are ignored', async () => {
  const result = await parseSpreadsheet(Buffer.from('Name,Quantity\nFirst,1\n\nSecond,3\n'), 'stock.csv')
  assert.deepEqual(result.rowNumbers, [2, 4])
})

test('spreadsheet parser rejects unsupported, malformed and ambiguous inputs', async () => {
  await assert.rejects(parseSpreadsheet(Buffer.from('Name\nItem'), 'legacy.xls'), /\.xlsx or \.csv/)
  await assert.rejects(parseSpreadsheet(Buffer.from('not a workbook'), 'bad.xlsx'), /not a valid workbook/)
  await assert.rejects(parseSpreadsheet(Buffer.from('Name,name\nA,B'), 'duplicate.csv'), /headers must be unique/)
  await assert.rejects(parseSpreadsheet(Buffer.from('"broken,header\nA,B'), 'broken.csv'), /unterminated quoted value/)
})
