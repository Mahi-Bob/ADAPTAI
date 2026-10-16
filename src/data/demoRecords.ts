import type { BusinessConfig, BusinessRecord } from '../types/config'

export type RecordsByEntity = Record<string, BusinessRecord[]>

export const initialRecords: Record<BusinessConfig['domain'], RecordsByEntity> = {
  retail: {
    products: [
      { id: 'p1', name: 'Everyday Tote', category: 'Accessories', price: 1299, quantity: 42, reorderLevel: 12, supplier: 'North & Co.' },
      { id: 'p2', name: 'Linen Shirt', category: 'Apparel', price: 2499, quantity: 8, reorderLevel: 10, supplier: 'Studio Thread' },
      { id: 'p3', name: 'Cloud Sneakers', category: 'Footwear', price: 3899, quantity: 24, reorderLevel: 8, supplier: 'North & Co.' },
      { id: 'p4', name: 'Ceramic Cup Set', category: 'Home', price: 899, quantity: 5, reorderLevel: 10, supplier: 'Clay House' },
      { id: 'p5', name: 'Weekend Backpack', category: 'Accessories', price: 3199, quantity: 31, reorderLevel: 9, supplier: 'Studio Thread' },
    ],
    sales: [
      { id: 's1', reference: 'ORD-2084', customer: 'Aarav Mehta', date: '2026-10-14', amount: 5198, status: 'Completed' },
      { id: 's2', reference: 'ORD-2083', customer: 'Ananya Rao', date: '2026-10-14', amount: 2499, status: 'Processing' },
      { id: 's3', reference: 'ORD-2082', customer: 'Kabir Shah', date: '2026-10-13', amount: 3899, status: 'Completed' },
      { id: 's4', reference: 'ORD-2081', customer: 'Diya Nair', date: '2026-10-12', amount: 2198, status: 'Completed' },
    ],
    suppliers: [
      { id: 'c1', name: 'North & Co.', contact: 'Nisha Patel', email: 'nisha@example.demo', phone: '+91 90000 10001', status: 'Active' },
      { id: 'c2', name: 'Studio Thread', contact: 'Rohan Das', email: 'rohan@example.demo', phone: '+91 90000 10002', status: 'Active' },
      { id: 'c3', name: 'Clay House', contact: 'Mira Sen', email: 'mira@example.demo', phone: '+91 90000 10003', status: 'Pending' },
    ],
  },
  healthcare: {
    patients: [
      { id: 'h1', name: 'Demo Patient A', recordId: 'PT-1042', provider: 'Dr. Isha Rao', visitDate: '2026-10-16', status: 'Scheduled' },
      { id: 'h2', name: 'Demo Patient B', recordId: 'PT-1043', provider: 'Dr. Arjun Mehta', visitDate: '2026-10-17', status: 'Follow-up' },
      { id: 'h3', name: 'Demo Patient C', recordId: 'PT-1044', provider: 'Dr. Isha Rao', visitDate: '2026-10-18', status: 'Checked in' },
    ],
    appointments: [
      { id: 'ha1', patient: 'Demo Patient A', doctor: 'Dr. Isha Rao', date: '2026-10-16', type: 'Consultation', status: 'Scheduled' },
      { id: 'ha2', patient: 'Demo Patient B', doctor: 'Dr. Arjun Mehta', date: '2026-10-17', type: 'Follow-up', status: 'Scheduled' },
    ],
    doctors: [
      { id: 'hd1', name: 'Dr. Isha Rao', specialty: 'Family medicine', email: 'isha@example.demo', available: true },
      { id: 'hd2', name: 'Dr. Arjun Mehta', specialty: 'Pediatrics', email: 'arjun@example.demo', available: true },
    ],
  },
  warehouse: {
    stock: [
      { id: 'w1', name: 'Shipping cartons', sku: 'PKG-104', location: 'A-01-02', quantity: 240, reorderLevel: 80, status: 'In stock' },
      { id: 'w2', name: 'Packing tape', sku: 'PKG-205', location: 'A-02-04', quantity: 24, reorderLevel: 40, status: 'In stock' },
      { id: 'w3', name: 'Label rolls', sku: 'LBL-018', location: 'B-01-01', quantity: 61, reorderLevel: 30, status: 'In stock' },
    ],
    dispatches: [
      { id: 'wd1', reference: 'DSP-8301', destination: 'Mumbai hub', date: '2026-10-15', items: 18, status: 'In transit' },
      { id: 'wd2', reference: 'DSP-8300', destination: 'Pune hub', date: '2026-10-14', items: 12, status: 'Delivered' },
    ],
    locations: [
      { id: 'wl1', name: 'A-01-02', zone: 'A', capacity: 400, active: true },
      { id: 'wl2', name: 'B-01-01', zone: 'B', capacity: 250, active: true },
    ],
  },
  hospitality: {
    rooms: [
      { id: 'r1', name: 'Room 101', type: 'Standard', rate: 4200, available: true, status: 'Ready' },
      { id: 'r2', name: 'Room 204', type: 'Deluxe', rate: 6800, available: false, status: 'Occupied' },
      { id: 'r3', name: 'Suite 301', type: 'Suite', rate: 10500, available: true, status: 'Ready' },
    ],
    bookings: [
      { id: 'b1', reference: 'BK-4102', guest: 'Demo Guest A', checkIn: '2026-10-16', nights: 2, status: 'Confirmed' },
      { id: 'b2', reference: 'BK-4101', guest: 'Demo Guest B', checkIn: '2026-10-15', nights: 1, status: 'Checked in' },
    ],
    staff: [
      { id: 'st1', name: 'Demo Staff A', role: 'Front desk', shift: 'Morning', active: true },
      { id: 'st2', name: 'Demo Staff B', role: 'Housekeeping', shift: 'Evening', active: true },
    ],
  },
}
