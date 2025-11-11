// --- data.js: Simulación de Base de Datos y Utilidades ---

// SIMULACIÓN DE DATOS BASE E INICIALIZACIÓN
// Inicializa o recupera el contador de facturas
let invoiceCounter = parseInt(localStorage.getItem('invoiceCounter')) || 1000;

// Catálogo de Productos/Servicios (Para Módulos de Facturación y HC)
const catalog = [
    { id: 'S001', name: 'Consulta General', type: 'Service', price: 50.00, taxRate: 0.19, duration: 30 },
    { id: 'S002', name: 'Vacunación', type: 'Service', price: 30.00, taxRate: 0.19, duration: 15 },
    { id: 'S003', name: 'Cirugía', type: 'Service', price: 120.00, taxRate: 0.19, duration: 120 },
    { id: 'P001', name: 'Concentrado Premium 5kg', type: 'Product', price: 45.00, taxRate: 0.19, stock: 50 },
    { id: 'P002', name: 'Juguete Dental', type: 'Product', price: 10.00, taxRate: 0.19, stock: 120 }
];

// Listado de Veterinarios (Para Módulo de Agendamiento)
const veterinarians = ['Dr. Smith', 'Dra. García', 'Dr. López'];

// --- FUNCIONES DE ALMACENAMIENTO (Simulación de DB) ---

const getAppointments = () => {
    return JSON.parse(localStorage.getItem('vetAppointments')) || [];
};

const saveAppointments = (appointments) => {
    localStorage.setItem('vetAppointments', JSON.stringify(appointments));
};

const getInvoices = () => {
    return JSON.parse(localStorage.getItem('invoices')) || [];
};

const saveInvoices = (invoices) => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
};

// --- FUNCIONES DE UTILIDAD ---

// Genera un ID único (Criterio 5 - Agendamiento)
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Calcula el tiempo de fin de la cita basado en el tipo de consulta
const getDurationMinutes = (consultationType) => {
    const item = catalog.find(p => p.type === 'Service' && p.name.includes(consultationType));
    return item ? item.duration : 30; // 30 minutos por defecto
};

const getEndTime = (date, time, duration) => {
    const [h, m] = time.split(':').map(Number);
    const datetime = new Date(`${date}T${h}:${m}:00`);
    datetime.setMinutes(datetime.getMinutes() + duration);
    
    const endHour = String(datetime.getHours()).padStart(2, '0');
    const endMinute = String(datetime.getMinutes()).padStart(2, '0');
    return `${endHour}:${endMinute}`;
};