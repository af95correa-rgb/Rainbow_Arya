// --- historia_clinica.js: Lógica del Módulo Historia Clínica ---

// Variables globales para mantener el estado de la mascota seleccionada
let selectedPet = null;
let allPets = [];
let allOwners = [];

// =================================================================
// 1. INICIALIZACIÓN
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales
    allPets = getPets();
    allOwners = getOwners();
    
    // Renderizar historial (vacío al inicio)
    renderRecords();

    // Evento: Abrir modal de nuevo paciente y propietario
    document.getElementById('open-new-patient-modal-btn').addEventListener('click', () => {
        openModal('patient-modal-backdrop');
    });

    // Evento: Registrar nuevo paciente y propietario
    document.getElementById('new-patient-form').addEventListener('submit', handleNewPatientSubmit);

    // Evento: Búsqueda de pacientes
    document.getElementById('search-form').addEventListener('submit', handleSearchSubmit);

    // Evento: Limpiar búsqueda
    document.getElementById('reset-search-btn').addEventListener('click', handleResetSearch);

    // Evento: Agregar entrada al historial clínico
    document.getElementById('historial-entry-form').addEventListener('submit', handleHistorialEntrySubmit);
});

// =================================================================
// 2. UTILIDADES DE MODALES (CENTRADO FIJO + CLICK FUERA + ESC)
// =================================================================

const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;

    // Forzar centrado absoluto
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.padding = '0'; // eliminar padding que empuja modal hacia abajo

    // Agregar listener ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal(id);
        }
    };
    modal.dataset.escHandler = escHandler;
    document.addEventListener('keydown', escHandler);
};

const closeModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.style.display = 'none';

    // Remover listener ESC
    const escHandler = modal.dataset.escHandler;
    if (escHandler) {
        document.removeEventListener('keydown', escHandler);
        delete modal.dataset.escHandler;
    }

    // Limpiar formularios
    if (id === 'patient-modal-backdrop') document.getElementById('new-patient-form').reset();
    if (id === 'historial-modal-backdrop') document.getElementById('historial-entry-form').reset();
};

// Cerrar modal al hacer click fuera del contenido
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay.id);
        }
    });
});



// =================================================================
// 3. REGISTRO DE PACIENTE Y PROPIETARIO
// =================================================================

const handleNewPatientSubmit = async (event) => {
    event.preventDefault();

    // DATOS DEL PROPIETARIO
    const ownerName = document.getElementById('owner-name').value.trim();
    const ownerLastname = document.getElementById('owner-lastname').value.trim();
    const ownerAge = parseInt(document.getElementById('owner-age').value);
    const ownerPhone = document.getElementById('owner-phone').value.trim();
    const ownerEmail = document.getElementById('owner-email').value.trim();
    const ownerPassword = document.getElementById('owner-password').value.trim();

    // DATOS DE LA MASCOTA
    const petName = document.getElementById('patient-name').value.trim();
    const species = document.getElementById('patient-species').value;
    const breed = document.getElementById('patient-breed').value.trim();
    const age = parseInt(document.getElementById('patient-age').value) || 0;
    const color = document.getElementById('patient-color').value.trim();
    const birthDate = document.getElementById('patient-birthdate').value;

    // Validación básica
    if (!ownerName || !ownerLastname || !ownerEmail || !ownerPassword || !petName || !species) {
        await showSystemModal(
            'Error de Formulario', 
            "Por favor, complete todos los campos obligatorios del propietario y la mascota.", 
            false, 
            'var(--danger-color)'
        );
        return;
    }

    // Verificar si el email ya existe
    const existingOwner = allOwners.find(o => o.email === ownerEmail);
    if (existingOwner) {
        await showSystemModal(
            'Email Duplicado', 
            `El correo **${ownerEmail}** ya está registrado. Use otro correo o busque al propietario existente.`, 
            false, 
            'var(--danger-color)'
        );
        return;
    }

    // Crear nuevo propietario
    const newOwner = {
        id: getNextOwnerId(),
        name: ownerName,
        lastname: ownerLastname,
        age: ownerAge,
        phone: ownerPhone,
        email: ownerEmail,
        username: ownerEmail,
        password: ownerPassword,
        role: 'Cliente',
        registeredDate: new Date().toISOString().split('T')[0],
        isEnabled: true
    };

    // Crear nueva mascota
    const newPet = {
        id: getNextPetId(),
        name: petName,
        ownerUsername: newOwner.username,
        species: species,
        breed: breed || 'N/A',
        age: age,
        color: color || 'N/A',
        birthDate: birthDate || 'Desconocida',
        historialClinico: []
    };

    // Guardar en localStorage
    allOwners.push(newOwner);
    allPets.push(newPet);
    saveOwners(allOwners);
    savePets(allPets);

    // Limpiar y cerrar modal
    closeModal('patient-modal-backdrop');
    document.getElementById('new-patient-form').reset();
    
    await showSystemModal(
        'Registro Exitoso',
        `✅ El propietario **${newOwner.name} ${newOwner.lastname}** y su mascota **${newPet.name}** han sido registrados exitosamente.<br><br>Ahora puede buscarlos y agregar entradas al historial clínico.`,
        false, 
        'var(--arya-secondary)'
    );

    renderRecords();
};

// =================================================================
// 4. BÚSQUEDA Y RENDERIZACIÓN (CRUD: READ)
// =================================================================

const handleSearchSubmit = (event) => {
    event.preventDefault();
    renderRecords();
};

const handleResetSearch = () => {
    document.getElementById('pet-search').value = '';
    document.getElementById('owner-search').value = '';
    selectedPet = null;
    renderRecords();
};

const renderRecords = () => {
    const historyList = document.getElementById('records-history-list');
    const petSearchTerm = document.getElementById('pet-search').value.toLowerCase().trim();
    const ownerSearchTerm = document.getElementById('owner-search').value.toLowerCase().trim();
    
    allPets = getPets();
    allOwners = getOwners();

    if (!petSearchTerm && !ownerSearchTerm) {
        historyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>Utilice el panel izquierdo para buscar una mascota por nombre o propietario.</p>
            </div>
        `;
        return;
    }

    let filteredPets = allPets.filter(pet => {
        const petMatch = petSearchTerm === '' || 
                        pet.name.toLowerCase().includes(petSearchTerm) || 
                        pet.id.toLowerCase().includes(petSearchTerm);
        
        const owner = allOwners.find(o => o.username === pet.ownerUsername);
        const ownerMatch = ownerSearchTerm === '' || 
                          (owner && (
                              owner.name.toLowerCase().includes(ownerSearchTerm) ||
                              owner.lastname.toLowerCase().includes(ownerSearchTerm) ||
                              owner.id.toLowerCase().includes(ownerSearchTerm)
                          ));
        
        return petMatch && ownerMatch;
    });

    historyList.innerHTML = '';

    if (filteredPets.length === 0) {
        historyList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #777; border: 1px dashed var(--danger-color); border-radius: 8px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2em; color: var(--danger-color); margin-bottom: 10px;"></i>
                <p>No se encontraron mascotas que coincidan con los criterios de búsqueda.</p>
            </div>
        `;
        return;
    }

    filteredPets.forEach(pet => {
        const owner = allOwners.find(o => o.username === pet.ownerUsername);
        const ownerName = owner ? `${owner.name} ${owner.lastname}` : 'Propietario Desconocido';

        const card = document.createElement('div');
        card.className = 'record-card';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s ease';
        
        card.innerHTML = `
            <h4>🐾 ${pet.name} (${pet.species})</h4>
            <p><strong>ID:</strong> ${pet.id}</p>
            <p><strong>Propietario:</strong> ${ownerName}</p>
            <p><strong>Raza:</strong> ${pet.breed || 'N/A'} | <strong>Edad:</strong> ${pet.age} años</p>
            <p><strong>Color:</strong> ${pet.color || 'N/A'}</p>
            <p><strong>Entradas en Historial:</strong> ${pet.historialClinico ? pet.historialClinico.length : 0}</p>
            <div style="margin-top: 10px;">
                <button class="button primary small" onclick="viewPetHistory('${pet.id}')" style="margin-right: 5px;">
                    <i class="fas fa-clipboard-list"></i> Ver Historial
                </button>
                <button class="button primary small" onclick="openAddHistorialModal('${pet.id}')" style="background-color: var(--arya-accent) !important;">
                    <i class="fas fa-plus"></i> Agregar Entrada
                </button>
            </div>
        `;
        
        historyList.appendChild(card);
    });
};

// =================================================================
// 5. HISTORIAL CLÍNICO
// =================================================================

window.viewPetHistory = (petId) => {
    const pet = allPets.find(p => p.id === petId);
    if (!pet) return;

    const owner = allOwners.find(o => o.username === pet.ownerUsername);
    const ownerName = owner ? `${owner.name} ${owner.lastname}` : 'Propietario Desconocido';
    
    selectedPet = pet;
    const historyList = document.getElementById('records-history-list');
    historyList.innerHTML = '';

    const headerCard = document.createElement('div');
    headerCard.className = 'record-card';
    headerCard.style.backgroundColor = 'var(--arya-blue)';
    headerCard.style.color = 'white';
    headerCard.innerHTML = `
        <h3>📋 Historial Clínico Completo</h3>
        <p><strong>Mascota:</strong> ${pet.name} (${pet.species})</p>
        <p><strong>Propietario:</strong> ${ownerName}</p>
        <p><strong>Raza:</strong> ${pet.breed} | <strong>Edad:</strong> ${pet.age} años</p>
        <button class="button secondary small" onclick="renderRecords()" style="margin-top: 10px; background-color: white; color: var(--arya-blue);">
            <i class="fas fa-arrow-left"></i> Volver a Búsqueda
        </button>
        <button class="button primary small" onclick="openAddHistorialModal('${pet.id}')" style="margin-top: 10px; margin-left: 5px;">
            <i class="fas fa-plus"></i> Agregar Nueva Entrada
        </button>
    `;
    historyList.appendChild(headerCard);

    if (!pet.historialClinico || pet.historialClinico.length === 0) {
        const emptyCard = document.createElement('div');
        emptyCard.className = 'record-card';
        emptyCard.innerHTML = `
            <p style="text-align: center; color: #777;">
                <i class="fas fa-info-circle"></i> 
                No hay entradas en el historial clínico de esta mascota.
            </p>
        `;
        historyList.appendChild(emptyCard);
        return;
    }

    const sortedHistory = [...pet.historialClinico].sort((a, b) => {
        const dateA = new Date(`${a.fecha}T${a.hora || '00:00'}`);
        const dateB = new Date(`${b.fecha}T${b.hora || '00:00'}`);
        return dateB - dateA;
    });

    sortedHistory.forEach(entry => {
        const entryCard = document.createElement('div');
        entryCard.className = 'record-card';
        entryCard.innerHTML = `
            <h4>📝 Consulta del ${entry.fecha} a las ${entry.hora || 'N/A'}</h4>
            <p><strong>Veterinario:</strong> ${entry.veterinario || 'No especificado'}</p>
            
            <div class="vitals" style="display: flex; gap: 15px; margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                <div><strong>Temp:</strong> ${entry.temperatura || 'N/A'}°C</div>
                <div><strong>Peso:</strong> ${entry.peso || 'N/A'} kg</div>
                <div><strong>FC:</strong> ${entry.frecuenciaCardiaca || 'N/A'} LPM</div>
            </div>

            <p><strong>Diagnóstico:</strong> ${entry.diagnostico || 'No especificado'}</p>
            <p><strong>Tratamiento:</strong> ${entry.tratamiento || 'No especificado'}</p>
            
            <button class="button primary small" style="background-color: var(--arya-accent) !important; padding: 5px 10px; font-size: 0.8em; margin-top: 5px;"
                    onclick="simulatePrintRecord('${pet.name}', '${entry.fecha}', '${entry.id}')">
                <i class="fas fa-print"></i> Imprimir Ficha
            </button>
        `;
        historyList.appendChild(entryCard);
    });
};

// =================================================================
// 6. AGREGAR ENTRADA HISTORIAL
// =================================================================

window.openAddHistorialModal = (petId) => {
    document.getElementById('historial-pet-id').value = petId;
    openModal('historial-modal-backdrop');
};

const handleHistorialEntrySubmit = async (event) => {
    event.preventDefault();

    const petId = document.getElementById('historial-pet-id').value;
    const veterinario = document.getElementById('historial-veterinario').value;
    const temperatura = document.getElementById('historial-temperatura').value;
    const peso = document.getElementById('historial-peso').value;
    const frecuenciaCardiaca = document.getElementById('historial-frecuencia').value;
    const diagnostico = document.getElementById('historial-diagnostico').value.trim();
    const tratamiento = document.getElementById('historial-tratamiento').value.trim();

    if (!diagnostico || !tratamiento) {
        await showSystemModal(
            'Error de Formulario', 
            "Por favor, complete el diagnóstico y el tratamiento.", 
            false, 
            'var(--danger-color)'
        );
        return;
    }

    const newEntry = {
        veterinario: veterinario,
        temperatura: parseFloat(temperatura),
        peso: parseFloat(peso),
        frecuenciaCardiaca: parseInt(frecuenciaCardiaca),
        diagnostico: diagnostico,
        tratamiento: tratamiento
    };

    const result = addHistorialEntry(petId, newEntry);

    if (result) {
        closeModal('historial-modal-backdrop');
        document.getElementById('historial-entry-form').reset();
        
        await showSystemModal(
            'Entrada Agregada',
            `✅ La entrada al historial clínico ha sido registrada exitosamente.`,
            false, 
            'var(--arya-secondary)'
        );

        if (selectedPet && selectedPet.id === petId) {
            viewPetHistory(petId);
        }
    } else {
        await showSystemModal(
            'Error',
            `❌ No se pudo agregar la entrada al historial. Verifique que la mascota existe.`,
            false, 
            'var(--danger-color)'
        );
    }
};

// =================================================================
// 7. SIMULAR IMPRESIÓN
// =================================================================

window.simulatePrintRecord = (petName, date, recordId) => {
    showSystemModal(
        `Imprimir Ficha Clínica`,
        `Se ha generado el PDF de la Ficha #${recordId} para **${petName}**, fecha ${date}. Enviando a impresora.`,
        false,
        'var(--arya-accent)'
    );
};
