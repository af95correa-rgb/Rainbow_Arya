// --- index.js: Gestión de Sesión, Roles y Dinamismo ARYA con Modal ---

// --- LÓGICA DE MODAL (REUTILIZADA) ---
const showModal = (title, message, isSuccess = true, callback = null) => {
    const modal = document.getElementById('notification-modal');
    const titleElement = document.getElementById('modal-title');
    const messageElement = document.getElementById('modal-message');
    const iconElement = document.getElementById('modal-icon');
    const contentElement = modal.querySelector('.modal-content');
    const closeBtn = document.getElementById('modal-close-btn');

    titleElement.textContent = title;
    messageElement.textContent = message;

    // Resetear el botón (importante para el botón de Logout)
    closeBtn.textContent = 'Aceptar';
    closeBtn.style.backgroundColor = 'var(--arya-secondary)'; // Color predeterminado

    if (isSuccess) {
        iconElement.className = 'icon-large fas fa-check-circle';
        iconElement.style.color = 'var(--arya-secondary)';
        contentElement.style.borderTopColor = 'var(--arya-secondary)';
    } else {
        iconElement.className = 'icon-large fas fa-times-circle';
        iconElement.style.color = 'var(--danger-color)';
        contentElement.style.borderTopColor = 'var(--danger-color)';
    }

    // Configurar el callback
    closeBtn.onclick = null;
    if (callback) {
        closeBtn.onclick = callback;
    } else {
        closeBtn.onclick = closeModal;
    }
    
    modal.style.display = 'flex';
}

const closeModal = () => {
    document.getElementById('notification-modal').style.display = 'none';
}
// --------------------------------------------------------------------


document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupDashboardLinks();
    setupLogout();

    // Listener para cerrar el modal al hacer clic fuera
    document.getElementById('notification-modal').addEventListener('click', (e) => {
        if (e.target.id === 'notification-modal') {
            closeModal();
        }
    });
});

const checkAuthentication = () => {
    const userRole = sessionStorage.getItem('userRole');
    const welcomeMessage = document.getElementById('welcome-message');

    if (!userRole) {
        window.location.href = 'login.html';
        return;
    }

    // El mensaje de bienvenida ahora se inyecta en el Header
    welcomeMessage.innerHTML = `Rol: ${userRole}`;
    
    applyRolePermissions(userRole);
    renderSummaryCards(userRole); // Cargar resumen de datos
};

// Modificación: Usa el modal para confirmar y ejecutar el cierre de sesión
const setupLogout = () => {
    document.getElementById('logout-btn').addEventListener('click', () => {
        
        const performLogout = () => {
            sessionStorage.removeItem('userRole');
            closeModal();
            window.location.href = 'login.html';
        };

        // Mostrar modal de confirmación antes de cerrar sesión
        showModal(
            'Cierre de Sesión', 
            '¿Está seguro de que desea cerrar la sesión de gestión interna?', 
            false // Usar false/danger color para indicar acción crítica
        );
        
        // Sobrescribir el botón de cerrar para ejecutar el logout
        const modalCloseBtn = document.getElementById('modal-close-btn');
        modalCloseBtn.textContent = 'Sí, Cerrar Sesión';
        modalCloseBtn.style.backgroundColor = 'var(--danger-color)';
        modalCloseBtn.onclick = performLogout;
    });
};

// =========================================================
// DINAMISMO Y DATOS VIVOS EN EL DASHBOARD (Requiere data.js)
// =========================================================

const renderSummaryCards = (role) => {
    const summaryContainer = document.getElementById('summary-dashboard');
    summaryContainer.innerHTML = '';
    
    // Obtener datos vivos usando las funciones de data.js
    const today = new Date().toISOString().split('T')[0];
    const appointments = getAppointments(); 
    const catalog = getCatalog(); // <-- OBTENIENDO DATOS DEL CATÁLOGO
    const todayAppointments = appointments.filter(a => a.date === today);
    const lowStockItems = catalog.filter(item => item.type === 'Product' && item.stock < 20);
    const totalClients = getOwners().length; // <-- OBTENIENDO PROPIETARIOS

    let cards = [];
    
    // Tarjeta 1: Citas Pendientes (Relevante para todos)
    cards.push({
        icon: 'fas fa-calendar-alt',
        title: 'Citas Hoy',
        value: todayAppointments.length,
        colorClass: 'blue',
        detail: `Citas agendadas para hoy.`
    });

    // Tarjeta 2: Stock Bajo (Relevante para Admin/Auxiliar)
    if (['Administrador', 'Auxiliar'].includes(role)) {
        cards.push({
            icon: 'fas fa-exclamation-triangle',
            title: 'Stock Crítico',
            value: lowStockItems.length,
            colorClass: lowStockItems.length > 0 ? 'orange' : 'green',
            detail: `${lowStockItems.length} ítems bajo el umbral de 20.`
        });
    }

    // Tarjeta 3: Clientes Registrados (Relevante para Recepcionista/Admin)
    if (['Administrador', 'Recepcionista'].includes(role)) {
        cards.push({
            icon: 'fas fa-users',
            title: 'Propietarios',
            value: totalClients,
            colorClass: 'purple',
            detail: `Total de clientes en el sistema.`
        });
    }

    cards.forEach(card => {
        // Se usa data-color para el borde izquierdo definido en styles.css
        const html = `
            <div class="summary-card" data-color="${card.colorClass}">
                <i class="${card.icon}" style="font-size: 2em; color: var(--arya-dark);"></i>
                <p style="font-weight: 600; margin-top: 5px;">${card.title}</p>
                <div class="value">${card.value}</div>
                <p class="detail">${card.detail}</p>
            </div>
        `;
        summaryContainer.innerHTML += html;
    });
};

const applyRolePermissions = (role) => {
    // Definición de permisos (misma lógica que antes)
    const permissions = {
        'Administrador': ['Registro Rapido','Citas', 'Facturación', 'Historia Clínica', 'Inventario', 'Portal Propietario', 'Administrativo','Calificaciones'],
        'Recepcionista': ['Registro Rapido','Citas', 'Facturación', 'Portal Propietario','Calificaciones'],
        'Veterinario': ['Historia Clínica', 'Citas'],
        'Auxiliar': ['Inventario', 'Facturación'],
        'Usuario': ['Calificaciones', 'Facturación']
    };
    
    const allowedModules = permissions[role] || [];
    const roleAlert = document.getElementById('role-alert');
    roleAlert.innerHTML = `⚠️ Rol Activo: <strong>${role}</strong>. Los módulos con baja opacidad están inhabilitados por su rol.`;
    
    document.querySelectorAll('.module-card').forEach(card => {
        const moduleName = card.getAttribute('data-module');
        const link = card.querySelector('a');

        if (allowedModules.some(name => moduleName.includes(name))) {
            card.style.opacity = '1';
            link.style.pointerEvents = 'auto';
            link.style.color = 'var(--arya-blue)'; 
            card.style.borderBottomColor = 'var(--arya-secondary)'; // Resaltar borde
        } else {
            card.style.opacity = '0.3'; 
            link.style.pointerEvents = 'none';
            link.style.color = '#888'; 
            card.style.borderBottomColor = '#ccc';
        }
    });
};

const setupDashboardLinks = () => {
    document.querySelectorAll('.module-card').forEach(card => {
        card.style.transition = 'transform 0.3s, box-shadow 0.3s, opacity 0.3s';
    });
};