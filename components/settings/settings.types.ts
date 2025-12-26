/**
 * Types for Settings Components
 * Piano Emotion Manager
 */

export type BusinessMode = 'individual' | 'team';
export type EInvoicingCountry = 'ES' | 'IT' | 'DE' | 'FR' | 'PT' | 'DK' | 'BE' | 'GB' | 'none';
export type StockAlertFrequency = 'immediate' | 'daily' | 'weekly';
export type FiscalCountry = 'ES' | 'DE' | 'FR' | 'IT' | 'PT' | 'GB' | 'MX' | 'AR' | 'CO' | 'CL';

export interface ExternalStore {
  name: string;
  url: string;
  apiKey?: string;
}

export interface AppSettings {
  // Business mode
  businessMode: BusinessMode;
  organizationName?: string;
  
  // E-Invoicing
  eInvoicingEnabled: boolean;
  eInvoicingCountry: EInvoicingCountry;
  eInvoicingCredentials: Record<string, string>;
  
  // Active modules
  activeModules: string[];
  
  // Inventory
  defaultMinStock: number;
  stockAlertEmail: boolean;
  stockAlertWhatsApp: boolean;
  stockAlertFrequency: StockAlertFrequency;
  stockAlertEmailAddress?: string;
  stockAlertPhone?: string;
  
  // Shop
  shopEnabled: boolean;
  externalStores: ExternalStore[];
  purchaseApprovalThreshold: number;
  
  // Notifications
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  
  // Calendar
  googleCalendarSync: boolean;
  outlookCalendarSync: boolean;
  
  // AI
  aiRecommendationsEnabled: boolean;
  aiAssistantEnabled: boolean;
  
  // Accounting
  fiscalCountry: FiscalCountry;
}

export const defaultSettings: AppSettings = {
  businessMode: 'individual',
  eInvoicingEnabled: false,
  eInvoicingCountry: 'none',
  eInvoicingCredentials: {},
  activeModules: ['clients', 'pianos', 'services', 'calendar', 'invoicing'],
  defaultMinStock: 5,
  stockAlertEmail: false,
  stockAlertWhatsApp: false,
  stockAlertFrequency: 'immediate',
  stockAlertEmailAddress: '',
  stockAlertPhone: '',
  shopEnabled: false,
  externalStores: [],
  purchaseApprovalThreshold: 100,
  notificationsEnabled: true,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  googleCalendarSync: false,
  outlookCalendarSync: false,
  aiRecommendationsEnabled: true,
  aiAssistantEnabled: true,
  fiscalCountry: 'ES',
};

export interface SettingsSectionProps {
  settings: AppSettings;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
  colors: {
    text: string;
    background: string;
    tint: string;
    border: string;
    cardBackground: string;
    success: string;
    warning: string;
    error: string;
  };
}
