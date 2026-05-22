export const PERMISSIONS = {
  ORDERS_VIEW:        'orders.view',
  ORDERS_EDIT:        'orders.edit',
  MEDICINES_VIEW:     'medicines.view',
  MEDICINES_EDIT:     'medicines.edit',
  PRODUCTS_VIEW:      'products.view',
  PRODUCTS_EDIT:      'products.edit',
  USERS_VIEW:         'users.view',
  DOCTORS_VIEW:       'doctors.view',
  NOTIFICATIONS_VIEW: 'notifications.view',
  HOMEPAGE_EDIT:      'homepage.edit',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<Permission, string> = {
  'orders.view':        'View Orders',
  'orders.edit':        'Edit Orders',
  'medicines.view':     'View Medicines',
  'medicines.edit':     'Edit Medicines',
  'products.view':      'View Products',
  'products.edit':      'Edit Products',
  'users.view':         'View Users',
  'doctors.view':       'View Doctors',
  'notifications.view': 'View Notifications',
  'homepage.edit':      'Manage Homepage',
};

export const PERMISSION_GROUPS = [
  { label: 'Orders',        permissions: [PERMISSIONS.ORDERS_VIEW,        PERMISSIONS.ORDERS_EDIT] },
  { label: 'Medicines',     permissions: [PERMISSIONS.MEDICINES_VIEW,      PERMISSIONS.MEDICINES_EDIT] },
  { label: 'Products',      permissions: [PERMISSIONS.PRODUCTS_VIEW,       PERMISSIONS.PRODUCTS_EDIT] },
  { label: 'Users',         permissions: [PERMISSIONS.USERS_VIEW] },
  { label: 'Doctors',       permissions: [PERMISSIONS.DOCTORS_VIEW] },
  { label: 'Notifications', permissions: [PERMISSIONS.NOTIFICATIONS_VIEW] },
  { label: 'Homepage',      permissions: [PERMISSIONS.HOMEPAGE_EDIT] },
] as const;

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
