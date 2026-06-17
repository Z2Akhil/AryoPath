export const PERMISSIONS = {
  // Lab Products (offers, packages, tests)
  PRODUCTS_VIEW:      'products.view',
  PRODUCTS_EDIT:      'products.edit',

  // Medicines catalogue
  MEDICINES_VIEW:     'medicines.view',
  MEDICINES_EDIT:     'medicines.edit',

  // Users
  USERS_VIEW:         'users.view',

  // Doctors
  DOCTORS_VIEW:       'doctors.view',
  DOCTORS_EDIT:       'doctors.edit',

  // Homepage
  HOMEPAGE_EDIT:      'homepage.edit',

  // Notifications
  NOTIFICATIONS_VIEW: 'notifications.view',

  // Bookings — individual
  LAB_ORDERS_VIEW:    'lab_orders.view',
  LAB_ORDERS_EDIT:    'lab_orders.edit',
  MED_ORDERS_VIEW:    'med_orders.view',
  MED_ORDERS_EDIT:    'med_orders.edit',
  APPOINTMENTS_VIEW:  'appointments.view',
  APPOINTMENTS_EDIT:  'appointments.edit',

  // Services settings
  SERVICES_VIEW:      'services.view',

  // Lab Receipt generator (full access — single permission)
  LAB_RECEIPT_VIEW:   'lab_receipt.view',

  // Legacy — kept for backward compat, not shown in staff form
  ORDERS_VIEW:        'orders.view',
  ORDERS_EDIT:        'orders.edit',
  ANALYTICS_VIEW:     'analytics.view',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<Permission, string> = {
  'products.view':      'View Lab Products',
  'products.edit':      'Edit Lab Products',
  'medicines.view':     'View Medicines',
  'medicines.edit':     'Edit Medicines',
  'users.view':         'Full User Access',
  'doctors.view':       'View Doctors',
  'doctors.edit':       'Create & Update Doctors',
  'homepage.edit':      'Manage Homepage',
  'notifications.view': 'View & Send Notifications',
  'lab_orders.view':    'View Lab Orders',
  'lab_orders.edit':    'Edit Lab Orders',
  'med_orders.view':    'View Meds Orders',
  'med_orders.edit':    'Edit Meds Orders',
  'appointments.view':  'View Appointments',
  'appointments.edit':  'Edit Appointments',
  'services.view':      'View & Edit Services',
  'lab_receipt.view':   'Generate Lab Receipts',
  // legacy
  'orders.view':        'View Orders (legacy)',
  'orders.edit':        'Edit Orders (legacy)',
  'analytics.view':     'View Analytics (legacy)',
};

export const PERMISSION_GROUPS = [
  {
    label: 'Lab Products',
    description: 'Offers, packages & tests catalogue',
    permissions: [PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_EDIT],
  },
  {
    label: 'Medicines',
    description: 'Medicine catalogue & stock management',
    permissions: [PERMISSIONS.MEDICINES_VIEW, PERMISSIONS.MEDICINES_EDIT],
  },
  {
    label: 'Users',
    description: 'Full access to customer accounts & cart info',
    permissions: [PERMISSIONS.USERS_VIEW],
  },
  {
    label: 'Doctors',
    description: 'View = see profiles only; Edit = add & update doctors too',
    permissions: [PERMISSIONS.DOCTORS_VIEW, PERMISSIONS.DOCTORS_EDIT],
  },
  {
    label: 'Homepage',
    description: 'Featured items, banners & health concern sections',
    permissions: [PERMISSIONS.HOMEPAGE_EDIT],
  },
  {
    label: 'Notifications',
    description: 'View & send push/SMS notifications',
    permissions: [PERMISSIONS.NOTIFICATIONS_VIEW],
  },
  {
    label: 'Lab Orders',
    description: 'Lab test order list & status updates',
    permissions: [PERMISSIONS.LAB_ORDERS_VIEW, PERMISSIONS.LAB_ORDERS_EDIT],
  },
  {
    label: 'Meds Orders',
    description: 'Medicine order list & status updates',
    permissions: [PERMISSIONS.MED_ORDERS_VIEW, PERMISSIONS.MED_ORDERS_EDIT],
  },
  {
    label: 'Appointments',
    description: 'Consultation appointment list & status updates',
    permissions: [PERMISSIONS.APPOINTMENTS_VIEW, PERMISSIONS.APPOINTMENTS_EDIT],
  },
  {
    label: 'Services',
    description: 'Service settings & configuration',
    permissions: [PERMISSIONS.SERVICES_VIEW],
  },
  {
    label: 'Lab Receipt',
    description: 'Generate lab test receipts for customers',
    permissions: [PERMISSIONS.LAB_RECEIPT_VIEW],
  },
] as const;

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// Groups where checking grants ALL permissions in the group (no view/edit split shown)
export const FULL_ACCESS_SECTIONS = new Set(['Lab Orders', 'Meds Orders', 'Appointments']);
