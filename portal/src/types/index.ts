// Tipos del Portal del Cliente

export interface ClientUser {
  id: string;
  clientId: string;
  email: string;
  lastLogin: string | null;
  createdAt: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName1: string;
  lastName2?: string;
  email?: string;
  phone: string;
  type: ClientType;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
}

export type ClientType = 
  | 'particular'
  | 'student'
  | 'professional'
  | 'school'
  | 'conservatory'
  | 'concert_hall';

export interface Piano {
  id: string;
  clientId: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  year?: number;
  category: 'vertical' | 'grand';
  subtype?: string;
  size?: number;
  condition: 'tunable' | 'needs_repair' | 'unknown';
  location?: string;
  notes?: string;
  photo?: string;
  lastMaintenanceDate?: string;
  maintenanceIntervalMonths?: number;
  nextMaintenanceDate?: string;
}

export interface Service {
  id: string;
  pianoId: string;
  clientId: string;
  date: string;
  type: ServiceType;
  tasks?: ServiceTask[];
  cost: number;
  duration?: number;
  notes?: string;
  technicalNotes?: string;
  photosBefore?: string[];
  photosAfter?: string[];
  signature?: string;
  conditionAfter?: 'tunable' | 'needs_repair' | 'unknown';
  rating?: ServiceRating;
}

export type ServiceType = 
  | 'tuning'
  | 'repair'
  | 'regulation'
  | 'maintenance_basic'
  | 'maintenance_complete'
  | 'maintenance_premium'
  | 'inspection'
  | 'restoration'
  | 'other';

export interface ServiceTask {
  id: string;
  name: string;
  completed: boolean;
  notes?: string;
}

export interface ServiceRating {
  id: string;
  serviceId: string;
  clientUserId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  pdfUrl?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  pianoId?: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  serviceType?: ServiceType;
  status: AppointmentStatus;
  address?: string;
  notes?: string;
}

export type AppointmentStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface AppointmentRequest {
  id: string;
  clientUserId: string;
  clientId: string;
  pianoId?: string;
  serviceType: ServiceType;
  preferredDates: string[];
  preferredTimeSlot: 'morning' | 'afternoon' | 'any';
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  responseNotes?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'client' | 'technician';
  content: string;
  attachments?: string[];
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  clientId: string;
  technicianId: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkVerify {
  token: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: ClientUser;
  token?: string;
}
