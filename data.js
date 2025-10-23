// --- data.js: Simulación de Base de Datos y Utilidades Centralizadas ---

// =================================================================
// 0. USUARIOS Y ROLES DEL SISTEMA (LOGIN FIX)
// =================================================================
// Los roles definidos son: Administrador, Recepcionista, Veterinario, Auxiliar, Usuario
const users = [
    { username: 'admin', password: '123', role: 'Administrador' },
    { username: 'recepcionista', password: '123456', role: 'Recepcionista' },
    { username: 'veterinario', password: 'password', role: 'Veterinario' },
    { username: 'auxiliar', password: 'pass', role: 'Auxiliar' },
    { username: 'usuario', password: 'usuario', role: 'Usuario' } // 🔧 NUEVO (corregido campo 'rol' → 'role')
];

function getUsers() {
    return users;
}

// =================================================================
// 🔒 NUEVA SECCIÓN DE PERMISOS POR ROL (para restricción de vistas)
// =================================================================
const rolePermissions = { // 🔧 NUEVO
    Administrador: {
        vistasBloqueadas: [],
        modulosPermitidos: ['*'] // todos
    },
    Recepcionista: {
        vistasBloqueadas: [],
        modulosPermitidos: ['Agendamiento', 'Clientes', 'Facturación']
    },
    Veterinario: {
        vistasBloqueadas: [],
        modulosPermitidos: ['Historia Clínica', 'Citas', 'Calificaciones']
    },
    Auxiliar: {
        vistasBloqueadas: [],
        modulosPermitidos: ['Inventario', 'Citas']
    },
    Usuario: { // 🔧 NUEVO ROL
        vistasBloqueadas: ['Resumen Rápido', 'Prioridades'], // 🔥 vistas restringidas
        modulosPermitidos: ['Gestionar Citas', 'Calificaciones'] // 🔥 solo estos módulos visibles
    }
};

// Devuelve los permisos del rol actual
function getRolePermissions(role) { // 🔧 NUEVO
    return rolePermissions[role] || { vistasBloqueadas: [], modulosPermitidos: [] };
}

// =================================================================
// 1. SIMULACIÓN DE DATOS BASE E INICIALIZACIÓN
// =================================================================

const catalog = [
    { id: 'S001', name: 'Consulta General', type: 'Service', price: 20.000, taxRate: 0.19, duration: 30 },
    { id: 'S002', name: 'Vacunación', type: 'Service', price: 30.000, taxRate: 0.19, duration: 15 },
    { id: 'S003', name: 'Cirugía', type: 'Service', price: 150.000, taxRate: 0.19, duration: 120 },
    { id: 'P001', name: 'Concentrado Premium 5kg', type: 'Product', price: 45.000, taxRate: 0.19, stock: 50 },
    { id: 'P002', name: 'Juguete Dental', type: 'Product', price: 10.000, taxRate: 0.19, stock: 120 },
    { id: 'P003', name: 'Pipeta Antipulgas', type: 'Product', price: 25.000, taxRate: 0.19, stock: 80 }
];

const veterinarians = ['Dr. Smith', 'Dra. García', 'Dr. López'];
let invoiceCounter = parseInt(localStorage.getItem('invoiceCounter')) || 1000;

// =================================================================
// 2. FUNCIONES DE PERSISTENCIA
// =================================================================

const getAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const defaultAppointments = [
        { id: 'a1', date: today, time: '16:30', owner: 'Carlos G.', pet: 'Fido', type: 'Consulta General', veterinarian: 'Dr. Smith', estado: 'Pendiente' },
        { id: 'a2', date: today, time: '17:00', owner: 'Ana L.', pet: 'Mishi', type: 'Vacunación', veterinarian: 'Dra. García', estado: 'Confirmada' },
        { id: 'a3', date: tomorrow, time: '10:00', owner: 'Javier P.', pet: 'Rex', type: 'Cirugía', veterinarian: 'Dr. López', estado: 'Pendiente' }
    ];
    return JSON.parse(localStorage.getItem('vetAppointments')) || defaultAppointments;
};

const saveAppointments = (appointments) => {
    localStorage.setItem('vetAppointments', JSON.stringify(appointments));
};

const getInvoices = () => JSON.parse(localStorage.getItem('invoices')) || [];
const saveInvoices = (invoices) => localStorage.setItem('invoices', JSON.stringify(invoices));

const getMedicalRecords = () => JSON.parse(localStorage.getItem('medicalRecords')) || [];
const saveMedicalRecords = (records) => localStorage.setItem('medicalRecords', JSON.stringify(records));

const getOwners = () => {
    const defaultOwners = [
        { id: 'O101', name: 'Carlos', lastname: 'García', age: 35, email: 'carlos@mail.com', phone: '3001112233', username: 'carlos@mail.com', password: 'carlos', role: 'Cliente', registeredDate: '2024-10-15', isEnabled: true },
        { id: 'O102', name: 'Ana', lastname: 'López', age: 28, email: 'ana@mail.com', phone: '3104445566', username: 'ana@mail.com', password: 'ana', role: 'Cliente', registeredDate: '2024-10-18', isEnabled: true },
        { id: 'O103', name: 'Javier', lastname: 'Pérez', age: 50, email: 'javier@mail.com', phone: '3207778899', username: 'javier@mail.com', password: 'javier', role: 'Cliente', registeredDate: '2024-10-20', isEnabled: true },
        { id: 'O104', name: 'María', lastname: 'Rodríguez', age: 40, email: 'maria@mail.com', phone: '3159990011', username: 'maria@mail.com', password: 'maria', role: 'Cliente', registeredDate: '2024-10-22', isEnabled: true },
    ];
    return JSON.parse(localStorage.getItem('owners')) || defaultOwners;
};

const saveOwners = (owners) => localStorage.setItem('owners', JSON.stringify(owners));

const getInventario = () => {
    const defaultInventory = [
        { id: 'V001', nombre: 'Vacuna Triple Felina', categoria: 'Vacunas', cantidad: 35, precio: 35.000, proveedor: 'MedVet Pharma', caducidad: '2026-05-10' },
        { id: 'A002', nombre: 'Alimento Royal Canin 1kg', categoria: 'Alimentos', cantidad: 120, precio: 15.500, proveedor: 'Royal Feed S.A.', caducidad: '2025-12-30' },
        { id: 'M003', nombre: 'Analgésico Vet-Dolo 10mg', categoria: 'Medicamentos', cantidad: 58, precio: 9.000, proveedor: 'PharmaVet', caducidad: '2024-11-20' },
        { id: 'S004', nombre: 'Collar Antipulgas L', categoria: 'Suministros', cantidad: 75, precio: 12.000, proveedor: 'Pet Supplies Co.', caducidad: 'N/A' }
    ];
    return JSON.parse(localStorage.getItem('vetInventario')) || defaultInventory;
};

const saveInventario = (inventory) => localStorage.setItem('vetInventario', JSON.stringify(inventory));

const getCatalog = () => catalog;

// =================================================================
// 3. FUNCIONES DE UTILIDAD
// =================================================================

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const getDurationMinutes = (consultationType) => {
    const item = catalog.find(p => p.type === 'Service' && p.name === consultationType);
    return item ? item.duration : 30;
};

const getEndTime = (date, time, duration) => {
    const [h, m] = time.split(':').map(Number);
    const datetime = new Date(`${date}T${h}:${m}:00`);
    datetime.setMinutes(datetime.getMinutes() + duration);
    const endHour = String(datetime.getHours()).padStart(2, '0');
    const endMinute = String(datetime.getMinutes()).padStart(2, '0');
    return `${endHour}:${endMinute}`;
};

const getProprietarios = () => getOwners();

const saveProprietario = (ownerData) => {
    let owners = getOwners();
    if (ownerData.id) {
        const index = owners.findIndex(o => o.id === ownerData.id);
        if (index !== -1) owners[index] = ownerData;
        else owners.push(ownerData);
    } else {
        const newId = getNextOwnerId();
        ownerData.id = newId;
        owners.push(ownerData);
    }
    saveOwners(owners);
    return ownerData;
};

const getNextOwnerId = () => {
    let nextId = parseInt(localStorage.getItem('nextOwnerId')) || 105;
    localStorage.setItem('nextOwnerId', nextId + 1);
    return 'O' + nextId.toString();
};

const getProximasCitas = () => {
    const appointments = getAppointments();
    const ahora = new Date('2025-10-20T17:00:00');
    const citasFuturas = appointments.filter(cita => {
        const horaStr = cita.time || '00:00';
        const citaDateTime = new Date(`${cita.date}T${horaStr}:00`);
        const isFinalized = cita.estado === 'Completada' || cita.estado === 'Cancelada';
        return citaDateTime > ahora && !isFinalized;
    });
    citasFuturas.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    return citasFuturas;
};

const CATEGORIAS_PRODUCTO = ['Medicamentos', 'Alimentos', 'Suministros', 'Vacunas'];
const getCategorias = () => CATEGORIAS_PRODUCTO;

// =================================================================
// 5. MODAL DE SISTEMA
// =================================================================
const showSystemModal = (title, message, isConfirm = false, color = 'var(--arya-primary)', callback) => {
    return new Promise(resolve => {
        const backdrop = document.getElementById('system-modal-backdrop');
        const modal = document.getElementById('system-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalActions = document.getElementById('modal-actions');

        if (!backdrop || !modal) {
            console.error("Error: Elementos del modal no encontrados en el DOM.");
            if (isConfirm) resolve(window.confirm(message));
            else { alert(message); resolve(true); }
            if (callback) callback();
            return;
        }

        modalActions.innerHTML = '';
        modalTitle.textContent = title;
        modalMessage.innerHTML = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        modal.style.borderTop = `5px solid ${color}`;

        const btnAccept = document.createElement('button');
        btnAccept.className = 'button primary';
        btnAccept.textContent = isConfirm ? 'Aceptar' : 'Cerrar';
        btnAccept.addEventListener('click', () => {
            backdrop.style.display = 'none';
            resolve(true);
            if (callback) callback();
        }, { once: true });
        modalActions.appendChild(btnAccept);

        if (isConfirm) {
            const btnCancel = document.createElement('button');
            btnCancel.className = 'button danger';
            btnCancel.textContent = 'Cancelar';
            btnCancel.addEventListener('click', () => {
                backdrop.style.display = 'none';
                resolve(false);
            }, { once: true });
            modalActions.prepend(btnCancel);
        }
        backdrop.style.display = 'flex';
    });
};

// =================================================================
// 6. DATOS DE CITAS Y MASCOTAS
// =================================================================
let citas = [
    { id: 'A3', fecha: '2025-10-20', hora: '20:20', veterinario: 'Dr. Smith', mascota: 'Roocky', propietario: 'Ana L.', servicio: 'Consulta General', estado: 'Pendiente' },
    { id: 'B4', fecha: '2025-10-21', hora: '10:00', veterinario: 'Dr. López', mascota: 'Rex', propietario: 'Javier P.', servicio: 'Cirugía', estado: 'Pendiente' },
];

let veterinarios = [
    { id: 'V1', nombre: 'Dr. Smith', especialidad: 'General' },
    { id: 'V2', nombre: 'Dr. López', especialidad: 'Cirugía' }
];

let servicios = [
    { id: 'S1', nombre: 'Consulta General', duracion: '30 min' },
    { id: 'S2', nombre: 'Vacunación', duracion: '15 min' },
    { id: 'S3', nombre: 'Cirugía', duracion: '120 min' }
];

const getPets = () => {
    const defaultPets = [
        { id: 'P101', name: 'Fido', ownerUsername: 'carlos@mail.com', species: 'Canino', age: 4, color: 'Marrón', breed: 'Labrador', birthDate: '2020-05-15' },
        { id: 'P102', name: 'Mishi', ownerUsername: 'ana@mail.com', species: 'Felino', age: 2, color: 'Blanco', breed: 'Siamés', birthDate: '2021-08-20' },
        { id: 'P103', name: 'Rex', ownerUsername: 'javier@mail.com', species: 'Canino', age: 7, color: 'Negro', breed: 'Pastor Alemán', birthDate: '2017-01-01' },
        { id: 'P104', name: 'Pipo', ownerUsername: 'maria@mail.com', species: 'Ave', age: 1, color: 'Verde', breed: 'Periquito', birthDate: '2023-12-01' },
    ];
    let pets = JSON.parse(localStorage.getItem('pets')) || defaultPets;
    if (pets.length > 0 && !localStorage.getItem('pets')) localStorage.setItem('pets', JSON.stringify(pets));
    return pets;
};

const savePets = (pets) => localStorage.setItem('pets', JSON.stringify(pets));
const getNextPetId = () => {
    let nextId = parseInt(localStorage.getItem('nextPetId')) || 105;
    localStorage.setItem('nextPetId', nextId + 1);
    return 'P' + nextId.toString();
};

// =================================================================
// 7. SISTEMA DE CALIFICACIONES
// =================================================================
const getCalificaciones = () => {
    const defaultCalificaciones = [
        {
            id: 'CAL001',
            usuario: 'Carlos García',
            usuarioEmail: 'carlos@mail.com',
            servicio: 'Consulta General',
            mascota: 'Fido',
            personaAtendio: 'Dr. Smith',
            calificacion: 5,
            comentario: 'Excelente atención, muy profesional y cariñoso con mi mascota.',
            fecha: '2025-10-20',
            citaId: 'a1'
        },
        {
            id: 'CAL002',
            usuario: 'Ana López',
            usuarioEmail: 'ana@mail.com',
            servicio: 'Vacunación',
            mascota: 'Mishi',
            personaAtendio: 'Dra. García',
            calificacion: 4,
            comentario: 'Muy buena experiencia, aunque tuve que esperar un poco.',
            fecha: '2025-10-19',
            citaId: 'a2'
        },
        {
            id: 'CAL003',
            usuario: 'Javier Pérez',
            usuarioEmail: 'javier@mail.com',
            servicio: 'Cirugía',
            mascota: 'Rex',
            personaAtendio: 'Dr. López',
            calificacion: 5,
            comentario: 'Cirugía exitosa, excelente seguimiento postoperatorio. Muy agradecido.',
            fecha: '2025-10-18',
            citaId: 'a3'
        },
        {
            id: 'CAL004',
            usuario: 'María Rodríguez',
            usuarioEmail: 'maria@mail.com',
            servicio: 'Consulta General',
            mascota: 'Pipo',
            personaAtendio: 'Dr. Smith',
            calificacion: 3,
            comentario: 'Buena atención pero el diagnóstico tomó más tiempo del esperado.',
            fecha: '2025-10-17',
            citaId: 'a4'
        }
    ];
    return JSON.parse(localStorage.getItem('vetCalificaciones')) || defaultCalificaciones;
};

const saveCalificaciones = (calificaciones) => localStorage.setItem('vetCalificaciones', JSON.stringify(calificaciones));

const saveCalificacion = (calificacionData) => {
    let calificaciones = getCalificaciones();
    if (calificacionData.id) {
        const index = calificaciones.findIndex(c => c.id === calificacionData.id);
        if (index !== -1) calificaciones[index] = calificacionData;
        else calificaciones.push(calificacionData);
    } else {
        const newId = 'CAL' + String(calificaciones.length + 1).padStart(3, '0');
        calificacionData.id = newId;
        calificacionData.fecha = new Date().toISOString().split('T')[0];
        calificaciones.push(calificacionData);
    }
    saveCalificaciones(calificaciones);
    return calificacionData;
};

const getCalificacionesByOwner = (ownerEmail) => getCalificaciones().filter(c => c.usuarioEmail === ownerEmail);

const getPromedioGeneralCalificaciones = () => {
    const calificaciones = getCalificaciones();
    if (calificaciones.length === 0) return 0;
    const suma = calificaciones.reduce((acc, c) => acc + c.calificacion, 0);
    return (suma / calificaciones.length).toFixed(1);
};
