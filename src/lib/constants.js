export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer'
}

export const CUSTOMER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
}

export const DOMAIN_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  PENDING_RENEWAL: 'pending_renewal',
  CANCELLED: 'cancelled'
}

export const HOSTING_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled'
}

export const HOSTING_TYPES = {
  SHARED: 'shared',
  VPS: 'vps',
  DEDICATED: 'dedicated',
  CLOUD: 'cloud'
}

export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
}

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_CUSTOMER: 'waiting_customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
}

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

export const NOTIFICATION_TYPES = {
  DOMAIN_EXPIRY: 'domain_expiry',
  HOSTING_EXPIRY: 'hosting_expiry',
  INVOICE_DUE: 'invoice_due',
  TICKET_UPDATE: 'ticket_update',
  PAYMENT_RECEIVED: 'payment_received'
}
