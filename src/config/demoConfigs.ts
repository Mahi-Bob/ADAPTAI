import type { BusinessConfig } from '../types/config'

export const demoConfigs: Record<BusinessConfig['domain'], BusinessConfig> = {
  retail: {
    version: '1.0',
    domain: 'retail',
    title: 'Retail workspace',
    industry: 'Retail & E-commerce',
    entities: [
      {
        key: 'products',
        label: 'Products',
        singular: 'Product',
        description: 'Manage your catalog and keep an eye on stock.',
        fields: [
          { key: 'name', label: 'Product name', type: 'text', required: true },
          { key: 'category', label: 'Category', type: 'select', options: ['Apparel', 'Accessories', 'Home', 'Footwear'], required: true },
          { key: 'price', label: 'Price (₹)', type: 'number', required: true },
          { key: 'quantity', label: 'Stock quantity', type: 'number', required: true },
          { key: 'reorderLevel', label: 'Reorder level', type: 'number', required: true },
          { key: 'supplier', label: 'Supplier', type: 'text' },
        ],
      },
      {
        key: 'sales',
        label: 'Sales',
        singular: 'Sale',
        description: 'Review recent transactions and order status.',
        fields: [
          { key: 'reference', label: 'Order reference', type: 'text', required: true },
          { key: 'customer', label: 'Customer', type: 'text', required: true },
          { key: 'date', label: 'Date', type: 'date', required: true },
          { key: 'amount', label: 'Amount (₹)', type: 'number', required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['Completed', 'Processing', 'Refunded'], required: true },
        ],
      },
      {
        key: 'suppliers',
        label: 'Suppliers',
        singular: 'Supplier',
        description: 'Keep supplier contact information together.',
        fields: [
          { key: 'name', label: 'Company', type: 'text', required: true },
          { key: 'contact', label: 'Contact name', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'text', required: true },
          { key: 'phone', label: 'Phone', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending'], required: true },
        ],
      },
    ],
    dashboard: { widgets: [
      { key: 'products', type: 'count', entity: 'products', label: 'Total products' },
      { key: 'sales', type: 'sum', entity: 'sales', field: 'amount', label: 'Total sales' },
      { key: 'low-stock', type: 'low-stock', entity: 'products', label: 'Low stock' },
      { key: 'inventory-value', type: 'sum', entity: 'products', field: 'price', label: 'Inventory value' },
    ] },
  },
  healthcare: {
    version: '1.0',
    domain: 'healthcare',
    title: 'Care workspace',
    industry: 'Healthcare',
    entities: [
      {
        key: 'patients',
        label: 'Patients',
        singular: 'Patient',
        description: 'Organize patient records with synthetic demo information.',
        fields: [
          { key: 'name', label: 'Patient name', type: 'text', required: true },
          { key: 'recordId', label: 'Record ID', type: 'text', required: true },
          { key: 'provider', label: 'Doctor', type: 'text' },
          { key: 'visitDate', label: 'Next appointment', type: 'date' },
          { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Checked in', 'Follow-up'], required: true },
        ],
      },
      {
        key: 'appointments',
        label: 'Appointments',
        singular: 'Appointment',
        description: 'Track upcoming visits and their status.',
        fields: [
          { key: 'patient', label: 'Patient', type: 'text', required: true },
          { key: 'doctor', label: 'Doctor', type: 'text', required: true },
          { key: 'date', label: 'Date', type: 'date', required: true },
          { key: 'type', label: 'Visit type', type: 'select', options: ['Consultation', 'Follow-up', 'Check-up'], required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'Cancelled'], required: true },
        ],
      },
      {
        key: 'doctors',
        label: 'Doctors',
        singular: 'Doctor',
        description: 'View your care team.',
        fields: [
          { key: 'name', label: 'Doctor name', type: 'text', required: true },
          { key: 'specialty', label: 'Specialty', type: 'text', required: true },
          { key: 'email', label: 'Work email', type: 'text' },
          { key: 'available', label: 'Accepting appointments', type: 'boolean' },
        ],
      },
    ],
    dashboard: { widgets: [
      { key: 'patients', type: 'count', entity: 'patients', label: 'Patient records' },
      { key: 'appointments', type: 'count', entity: 'appointments', label: 'Appointments' },
      { key: 'doctors', type: 'count', entity: 'doctors', label: 'Care team' },
      { key: 'today', type: 'recent', entity: 'appointments', label: 'Upcoming visits' },
    ] },
  },
  warehouse: {
    version: '1.0',
    domain: 'warehouse',
    title: 'Warehouse workspace',
    industry: 'Warehouse & Logistics',
    entities: [
      {
        key: 'stock',
        label: 'Stock',
        singular: 'Stock item',
        description: 'Track quantities and locations across your warehouse.',
        fields: [
          { key: 'name', label: 'Item name', type: 'text', required: true },
          { key: 'sku', label: 'SKU', type: 'text', required: true },
          { key: 'location', label: 'Storage location', type: 'text', required: true },
          { key: 'quantity', label: 'Quantity', type: 'number', required: true },
          { key: 'reorderLevel', label: 'Reorder level', type: 'number', required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['In stock', 'Reserved', 'Inbound'], required: true },
        ],
      },
      {
        key: 'dispatches',
        label: 'Dispatches',
        singular: 'Dispatch',
        description: 'Keep outbound orders moving.',
        fields: [
          { key: 'reference', label: 'Dispatch reference', type: 'text', required: true },
          { key: 'destination', label: 'Destination', type: 'text', required: true },
          { key: 'date', label: 'Dispatch date', type: 'date', required: true },
          { key: 'items', label: 'Items', type: 'number', required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['Preparing', 'In transit', 'Delivered'], required: true },
        ],
      },
      {
        key: 'locations',
        label: 'Locations',
        singular: 'Location',
        description: 'Manage warehouse storage locations.',
        fields: [
          { key: 'name', label: 'Location name', type: 'text', required: true },
          { key: 'zone', label: 'Zone', type: 'text', required: true },
          { key: 'capacity', label: 'Capacity', type: 'number' },
          { key: 'active', label: 'Active', type: 'boolean' },
        ],
      },
    ],
    dashboard: { widgets: [
      { key: 'stock', type: 'count', entity: 'stock', label: 'Stock items' },
      { key: 'dispatches', type: 'count', entity: 'dispatches', label: 'Dispatches' },
      { key: 'low-stock', type: 'low-stock', entity: 'stock', label: 'Reorder alerts' },
      { key: 'locations', type: 'count', entity: 'locations', label: 'Storage locations' },
    ] },
  },
  hospitality: {
    version: '1.0',
    domain: 'hospitality',
    title: 'Hospitality workspace',
    industry: 'Hospitality',
    entities: [
      {
        key: 'rooms',
        label: 'Rooms',
        singular: 'Room',
        description: 'Keep room availability and housekeeping status in view.',
        fields: [
          { key: 'name', label: 'Room', type: 'text', required: true },
          { key: 'type', label: 'Room type', type: 'select', options: ['Standard', 'Deluxe', 'Suite'], required: true },
          { key: 'rate', label: 'Nightly rate (₹)', type: 'number', required: true },
          { key: 'available', label: 'Available', type: 'boolean' },
          { key: 'status', label: 'Status', type: 'select', options: ['Ready', 'Occupied', 'Cleaning'], required: true },
        ],
      },
      {
        key: 'bookings',
        label: 'Bookings',
        singular: 'Booking',
        description: 'Track guest stays and booking status.',
        fields: [
          { key: 'reference', label: 'Booking reference', type: 'text', required: true },
          { key: 'guest', label: 'Guest', type: 'text', required: true },
          { key: 'checkIn', label: 'Check-in', type: 'date', required: true },
          { key: 'nights', label: 'Nights', type: 'number', required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'Checked in', 'Checked out'], required: true },
        ],
      },
      {
        key: 'staff',
        label: 'Staff',
        singular: 'Staff member',
        description: 'Keep the hospitality team organized.',
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'role', label: 'Role', type: 'select', options: ['Front desk', 'Housekeeping', 'Kitchen'], required: true },
          { key: 'shift', label: 'Shift', type: 'text' },
          { key: 'active', label: 'On shift', type: 'boolean' },
        ],
      },
    ],
    dashboard: { widgets: [
      { key: 'rooms', type: 'count', entity: 'rooms', label: 'Rooms' },
      { key: 'bookings', type: 'count', entity: 'bookings', label: 'Bookings' },
      { key: 'staff', type: 'count', entity: 'staff', label: 'Staff members' },
      { key: 'available', type: 'count', entity: 'rooms', label: 'Room inventory' },
    ] },
  },
}

export function isBusinessDomain(value: string | null): value is BusinessConfig['domain'] {
  return value === 'retail' || value === 'healthcare' || value === 'warehouse' || value === 'hospitality'
}
