// ARCHIVO TEMPORAL - Solo para generar capturas de pantalla
// Este archivo será eliminado después de generar las capturas

export const DEMO_MODE = process.env.DEMO_MODE === 'true';

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@pianoemotion.com',
  firstName: 'Demo',
  lastName: 'User',
  imageUrl: 'https://via.placeholder.com/150',
};

export const DEMO_DATA = {
  clients: [
    { id: '1', name: 'Cliente 1', email: 'client1@example.com', phone: '+34 123 456 789' },
    { id: '2', name: 'Cliente 2', email: 'client2@example.com', phone: '+34 987 654 321' },
    { id: '3', name: 'Cliente 3', email: 'client3@example.com', phone: '+34 555 666 777' },
  ],
  pianos: [
    { id: '1', brand: 'Steinway', model: 'D', serialNumber: '123456' },
    { id: '2', brand: 'Yamaha', model: 'C7', serialNumber: '789012' },
  ],
  services: [
    { id: '1', type: 'tuning', date: new Date(), status: 'completed' },
    { id: '2', type: 'repair', date: new Date(), status: 'pending' },
  ],
};
