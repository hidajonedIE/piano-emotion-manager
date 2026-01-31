/**
 * Hooks de Datos basados en tRPC
 * Piano Emotion Manager
 * 
 * Estos hooks reemplazan los hooks basados en AsyncStorage
 * para usar tRPC como fuente única de datos.
 */

export { useClientsData } from './use-clients-data';
export { usePianosData } from './use-pianos-data';
export { useServicesData } from './use-services-data';
export { useInventoryData } from './use-inventory-data';
export { useAppointmentsData } from './use-appointments-data';
export { useInvoicesData } from './use-invoices-data';
export { useQuotesData } from './use-quotes-data';
