// --- login.js: Manejo de autenticación con MODAL ---

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Configurar el botón de cerrar modal para errores/mensajes simples
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
});

// Función para mostrar el modal con el contenido dinámico (Reutilizable)
const showModal = (title, message, isSuccess = true, callback = null) => {
    const modal = document.getElementById('notification-modal');
    const titleElement = document.getElementById('modal-title');
    const messageElement = document.getElementById('modal-message');
    const iconElement = document.getElementById('modal-icon');
    const contentElement = modal.querySelector('.modal-content');
    const closeBtn = document.getElementById('modal-close-btn');

    titleElement.textContent = title;
    messageElement.textContent = message;

    // Resetear el botón
    closeBtn.textContent = 'Aceptar';
    closeBtn.style.backgroundColor = 'var(--arya-secondary)'; // Color predeterminado de éxito

    if (isSuccess) {
        iconElement.className = 'icon-large fas fa-check-circle';
        iconElement.style.color = 'var(--arya-secondary)';
        contentElement.style.borderTopColor = 'var(--arya-secondary)';
    } else {
        iconElement.className = 'icon-large fas fa-times-circle';
        iconElement.style.color = 'var(--danger-color)';
        contentElement.style.borderTopColor = 'var(--danger-color)';
    }

    // Configurar el callback (lo que sucede al presionar el botón)
    closeBtn.onclick = null; // Limpiar listener anterior
    if (callback) {
        closeBtn.onclick = callback;
    } else {
        closeBtn.onclick = closeModal;
    }

    modal.style.display = 'flex'; // Muestra el modal
}

// Función para cerrar el modal (Reutilizable)
const closeModal = () => {
    document.getElementById('notification-modal').style.display = 'none';
}


const handleLogin = (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // OBTENER LA LISTA DE USUARIOS (FUNCIÓN AHORA DEFINIDA EN data.js)
    const users = getUsers(); 
    
    // Buscar al usuario
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Función de redirección para el callback del modal
        const redirectToDashboard = () => {
            closeModal();
            window.location.href = 'index.html';
        };

        // Autenticación exitosa
        sessionStorage.setItem('userRole', user.role); 
        
        // Mostrar modal de éxito 
        showModal(
            '¡Acceso Exitoso!', 
            `Bienvenido(a) al Dashboard de ${user.role}.`, 
            true,
            redirectToDashboard // Redirigir al presionar Aceptar
        );

    } else {
        // Autenticación fallida
        // Mostrar modal de error
        showModal('Error de Acceso', 'Usuario o contraseña incorrectos. Por favor, intente de nuevo.', false);
    }
};