// --- usuario.js: Lógica del Módulo de Registro de Usuario y Mascota ---

// ======================================================================
// 0. SIMULACIÓN DE DATOS (Normalmente estaría en data.js)
// ======================================================================

// Inicializar la lista de Propietarios si aún no existe
if (typeof window.clientOwners === 'undefined') {
    window.clientOwners = [
        { username: 'propietario1@email.com', password: 'password', role: 'Cliente', name: 'Carlos', lastname: 'Ruiz', phone: '+57 300 123 4567', age: 45, isEnabled: true }
    ];
}

// Inicializar la lista de Mascotas si aún no existe
if (typeof window.pets === 'undefined') {
    window.pets = [
        { id: 'P001', name: 'Rocky', ownerUsername: 'propietario1@email.com', species: 'Canino', age: 3, color: 'Marrón' }
    ];
}

// Simulación de generadores de ID
const getNextOwnerId = () => {
    return 'O' + (window.clientOwners.length + 1).toString().padStart(3, '0');
};
const getNextPetId = () => {
    return 'P' + (window.pets.length + 1).toString().padStart(3, '0');
};

// Lógica de Modal (Reutilizada de portal_propietario.js)
const showModal = (title, message, isSuccess = true, callback = null) => {
    const modal = document.getElementById('notification-modal');
    const titleElement = document.getElementById('modal-title');
    const messageElement = document.getElementById('modal-message');
    const iconElement = document.getElementById('modal-icon');
    const closeBtn = document.getElementById('modal-close-btn');

    titleElement.textContent = title;
    messageElement.textContent = message;

    closeBtn.textContent = 'Aceptar';
    closeBtn.style.backgroundColor = isSuccess ? 'var(--arya-secondary)' : 'var(--danger-color)';

    if (isSuccess) {
        iconElement.className = 'icon-large fas fa-check-circle';
        iconElement.style.color = 'var(--arya-secondary)';
    } else {
        iconElement.className = 'icon-large fas fa-times-circle';
        iconElement.style.color = 'var(--danger-color)';
    }

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


// ======================================================================
// 1. MANEJO DEL FORMULARIO
// ======================================================================

const handleFullRegistration = (e) => {
    e.preventDefault();

    // 1. Recolección de datos del Propietario
    const name = document.getElementById('reg-name').value.trim();
    const lastname = document.getElementById('reg-lastname').value.trim();
    const age = document.getElementById('reg-age').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    // 2. Recolección de datos de la Mascota
    const petName = document.getElementById('pet-name').value.trim();
    const petType = document.getElementById('pet-type').value;
    const petAge = document.getElementById('pet-age').value.trim();
    const petColor = document.getElementById('pet-color').value.trim();

    // 3. Validaciones
    if (password.length < 6) {
        showModal(
            'Error de Contraseña', 
            'La contraseña debe tener al menos 6 caracteres.', 
            false
        );
        return;
    }
    
    if (window.clientOwners.find(c => c.username === email)) {
        showModal(
            'Usuario Duplicado', 
            `❌ Ya existe una cuenta registrada con el correo: ${email}.`, 
            false
        );
        return;
    }

    // 4. Lógica de Registro (Simulación de guardar en DB/localStorage)
    
    // Crear objeto Propietario
    const newOwner = {
        id: getNextOwnerId(),
        username: email, // El email es el username de login
        password: password,
        role: 'Cliente',
        name: name,
        lastname: lastname,
        age: parseInt(age),
        email: email,
        phone: phone,
        isEnabled: true
    };

    // Crear objeto Mascota
    const newPet = {
        id: getNextPetId(),
        name: petName,
        ownerUsername: email, // Se vincula al propietario por su username
        species: petType,
        age: parseInt(petAge),
        color: petColor
    };

    // Guardar los datos simulados
    window.clientOwners.push(newOwner);
    window.pets.push(newPet);

    // 5. Redirección y Notificación de Éxito
    const redirectToLogin = () => {
        closeModal();
        window.location.href = 'login.html'; 
    };

    showModal(
        '¡Registro Exitoso!', 
        `🎉 ¡Bienvenido **${name}**! Tu cuenta y tu mascota **${petName}** han sido registradas. Usa tu correo (${email}) para acceder.`, 
        true,
        redirectToLogin
    );
}

// ======================================================================
// 2. INICIALIZACIÓN
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('full-registration-form').addEventListener('submit', handleFullRegistration);
    
    // Configurar el botón de cerrar modal
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
});