// --- historia_clinica.js: Lógica del Módulo Historia Clínica ---

// Las funciones de data.js (getPets, savePets, getNextPetId, getOwners, getAppointments, showSystemModal)
// se asumen definidas y accesibles.

// =================================================================
// 1. INICIALIZACIÓN
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicialización de la sección de registro de visita y registro de paciente
    populateVisitSelects();
    populatePatientOwnerSelect();
    
    // Cargar historial
    renderRecords();

    // Eventos de formulario
    // 💡 CRITERIO 2: ELIMINAMOS EL FORMULARIO DE VISITA DENTRO DEL HTML, AHORA ES UN MODAL
    // document.getElementById('medical-record-form').addEventListener('submit', handleRecordSubmit); 
    
    // 💡 CRITERIO 1: EL BOTÓN ABRIR FORMULARIO AHORA ABRE EL MODAL DE NUEVO PACIENTE
    document.getElementById('open-new-patient-modal-btn').addEventListener('click', () => {
        openModal('patient-modal-backdrop');
    });

    // Evento de registro de nuevo paciente (dentro del modal)
    document.getElementById('new-patient-form').addEventListener('submit', handleNewPatientSubmit);

    // Búsqueda en el panel izquierdo (al enviar el formulario)
    document.getElementById('search-form').addEventListener('submit', handleSearchSubmit);

    // Limpiar Búsqueda
    document.getElementById('reset-search-btn').addEventListener('click', handleResetSearch);
});

// =================================================================
// 2. UTILIDADES DE MODALES
// =================================================================

const openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
    }
};

const closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
    }
    // Opcional: Limpiar el formulario al cerrar el modal de paciente
    if (id === 'patient-modal-backdrop') {
        document.getElementById('new-patient-form').reset();
    }
};

// =================================================================
// 3. REGISTRO DE PACIENTE (CRITERIO 3)
// =================================================================

/**
 * Rellena el select de Propietario en el modal de Nuevo Paciente.
 */
const populatePatientOwnerSelect = () => {
    const ownerSelect = document.getElementById('patient-owner');
    if (!ownerSelect) return;

    ownerSelect.innerHTML = '<option value="" disabled selected>Seleccione el Propietario</option>';
    
    const owners = typeof getOwners === 'function' ? getOwners() : [{ name: 'Propietario Demo', id: 'O001' }];
    
    owners.forEach(owner => {
        ownerSelect.innerHTML += `<option value="${owner.name}">${owner.name}</option>`;
    });
};

/**
 * Maneja el envío del formulario de registro de nuevo paciente.
 */
const handleNewPatientSubmit = async (event) => {
    event.preventDefault();

    const name = document.getElementById('patient-name').value.trim();
    const owner = document.getElementById('patient-owner').value;
    const species = document.getElementById('patient-species').value;
    const breed = document.getElementById('patient-breed').value.trim();
    const birthDate = document.getElementById('patient-birthdate').value;

    if (!name || !owner || !species) {
        await showSystemModal('Error de Formulario', "Por favor, complete al menos el Nombre, Propietario y Especie.", false, 'var(--danger-color)');
        return;
    }

    const newPet = {
        id: getNextPetId(), 
        name: name,
        owner: owner,
        species: species,
        breed: breed || 'N/A',
        birthDate: birthDate || 'Desconocida'
    };

    let pets = getPets();
    pets.push(newPet);
    savePets(pets);

    // Limpiar y cerrar
    closeModal('patient-modal-backdrop');
    document.getElementById('new-patient-form').reset();
    
    await showSystemModal(
        'Paciente Registrado',
        `✅ El paciente **${newPet.name}** (ID: ${newPet.id}) ha sido registrado con éxito.`,
        false, 
        'var(--arya-secondary)'
    );
};


// =================================================================
// 4. REGISTRO DE VISITA/HISTORIA CLÍNICA (CRUD: CREATE)
// =================================================================

/**
 * Rellena los selects de Mascota/Veterinario para el formulario de registro de visita.
 * NOTA: Este formulario se debe crear dentro del panel de la derecha al seleccionar un paciente
 * o se puede implementar como otro modal. Por ahora, lo dejamos en la función de inicialización,
 * aunque el HTML no tiene el formulario de visita.
 */
const populateVisitSelects = () => {
    // Si tienes un formulario de registro de visita en el HTML, esta función lo llenaría.
    // Por simplicidad, y siguiendo el HTML actual, asumimos que este formulario
    // es parte del flujo de "Búsqueda" y no está estáticamente en el HTML.
};

/**
 * Manejador del Formulario de Registro de Visita (Se omite la implementación
 * ya que el HTML no contiene el formulario de visita, solo la búsqueda y el nuevo paciente).
 * Si decides añadir el formulario de visita en otro modal o en el panel derecho,
 * esta lógica debe implementarse allí.
 */
// const handleRecordSubmit = (event) => { ... }


// =================================================================
// 5. BÚSQUEDA Y RENDERIZACIÓN (CRUD: READ)
// =================================================================

/**
 * Maneja el envío del formulario de búsqueda y llama a renderRecords con filtros.
 */
const handleSearchSubmit = (event) => {
    event.preventDefault();
    renderRecords();
};

/**
 * Limpia los campos de búsqueda y vuelve a renderizar todos los registros.
 */
const handleResetSearch = () => {
    document.getElementById('pet-search').value = '';
    document.getElementById('owner-search').value = '';
    renderRecords();
};


/**
 * Renderiza el historial médico con filtros.
 */
const renderRecords = () => {
    const historyList = document.getElementById('records-history-list');
    const petSearchTerm = document.getElementById('pet-search').value.toLowerCase().trim();
    const ownerSearchTerm = document.getElementById('owner-search').value.toLowerCase().trim();
    
    // Obtener y ordenar por fecha más reciente
    let records = typeof getMedicalRecords === 'function' ? getMedicalRecords() : [];

    // Si no hay registros médicos, mostrar el mensaje inicial o un mensaje vacío
    if (records.length === 0) {
        historyList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #777; border: 1px dashed #ccc; border-radius: 8px;">
                <i class="fas fa-info-circle" style="font-size: 2em; color: var(--arya-blue); margin-bottom: 10px;"></i>
                <p>No hay registros médicos en el sistema. Empiece a registrar visitas.</p>
            </div>
        `;
        return;
    }

    // Filtrar por los dos términos de búsqueda
    records = records.filter(record => {
        const petMatch = petSearchTerm === '' || record.pet.toLowerCase().includes(petSearchTerm);
        const ownerMatch = ownerSearchTerm === '' || record.owner.toLowerCase().includes(ownerSearchTerm);
        return petMatch && ownerMatch;
    }).sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));

    historyList.innerHTML = '';
    
    if (records.length === 0) {
        historyList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #777; border: 1px dashed var(--danger-color); border-radius: 8px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2em; color: var(--danger-color); margin-bottom: 10px;"></i>
                <p>No se encontraron registros médicos que coincidan con los criterios de búsqueda.</p>
            </div>
        `;
        return;
    }

    // Renderizar registros
    records.forEach(record => {
        const card = document.createElement('div');
        card.className = 'record-card';
        // 💡 CRITERIO 4: REEMPLAZAR alert() con showSystemModal() para "Imprimir Ficha"
        card.innerHTML = `
            <h4>📝 Consulta del ${record.date} a las ${record.time}</h4>
            <p><strong>Paciente:</strong> ${record.pet} | <strong>Propietario:</strong> ${record.owner}</p>
            <p><strong>Veterinario:</strong> ${record.veterinario}</p>
            
            <div class="vitals">
                <div><strong>Temp:</strong> ${record.vitals.temp}°C</div>
                <div><strong>Peso:</strong> ${record.vitals.weight} kg</div>
                <div><strong>FC:</strong> ${record.vitals.heartRate} LPM</div>
            </div>

            <p><strong>Diagnóstico:</strong> ${record.diagnosis}</p>
            <p><strong>Tratamiento:</strong> ${record.treatment}</p>
            
            <button class="button primary small" style="background-color: var(--arya-accent) !important; padding: 5px 10px; font-size: 0.8em; margin-top: 5px;"
                    onclick="simulatePrintRecord('${record.pet}', '${record.date}', '${record.id}')">
                <i class="fas fa-print"></i> Imprimir Ficha
            </button>
        `;
        historyList.appendChild(card);
    });
};

/**
 * Muestra el modal de simulación de impresión (CRITERIO 4).
 */
const simulatePrintRecord = (petName, date, recordId) => {
    const systemModal = typeof showSystemModal === 'function' ? showSystemModal : alert;
    
    systemModal(
        `Imprimir Ficha Clínica`,
        `Se ha generado el PDF de la Ficha #${recordId} para **${petName}**, fecha ${date}. Enviando a impresora.`,
        false,
        'var(--arya-accent)'
    );
};