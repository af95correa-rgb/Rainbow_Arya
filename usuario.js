// --- usuario.js: Lógica del Módulo de Registro de Usuario y Mascota ---

// ======================================================================
// 1. LÓGICA DE MODAL
// ======================================================================

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
// 2. MANEJO DEL FORMULARIO DE REGISTRO
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
    
    // Obtener propietarios actuales desde localStorage
    let owners = getOwners();
    
    // Verificar si ya existe el usuario
    if (owners.find(c => c.username === email)) {
        showModal(
            'Usuario Duplicado', 
            `Ya existe una cuenta registrada con el correo: ${email}.`, 
            false
        );
        return;
    }

    // 4. Crear objeto Propietario
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
        registeredDate: new Date().toLocaleDateString('es-CO'),
        isEnabled: true
    };

    // 5. Crear objeto Mascota
    const newPet = {
        id: getNextPetId(),
        name: petName,
        ownerUsername: email, // Se vincula al propietario por su username
        species: petType,
        age: parseInt(petAge),
        color: petColor,
        breed: '',
        birthDate: '',
        historialClinico: [] // Campo para historial clínico
    };

    // 6. Guardar los datos en localStorage
    owners.push(newOwner);
    saveOwners(owners);
    
    let pets = getPets();
    pets.push(newPet);
    savePets(pets);

    console.log('✅ Registro exitoso:', { owner: newOwner, pet: newPet });

    // 7. Redirección y Notificación de Éxito
    const redirectToLogin = () => {
        closeModal();
        window.location.href = 'login.html'; 
    };

    showModal(
        '¡Registro Exitoso!', 
        `🎉 ¡Bienvenido ${name}! Tu cuenta y tu mascota ${petName} han sido registradas. Usa tu correo (${email}) para acceder.`, 
        true,
        redirectToLogin
    );
}

// ======================================================================
// 3. INICIALIZACIÓN
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar que data.js esté cargado
    if (typeof getOwners !== 'function') {
        console.error('❌ ERROR: data.js no se ha cargado correctamente');
        alert('Error: No se pudo cargar el sistema de datos. Por favor recarga la página.');
        return;
    }
    
    console.log('✅ Sistema de registro inicializado correctamente');
    
    // Configurar el formulario
    const form = document.getElementById('full-registration-form');
    if (form) {
        form.addEventListener('submit', handleFullRegistration);
    } else {
        console.error('❌ No se encontró el formulario de registro');
    }
    
    // Configurar el botón de cerrar modal
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
});
