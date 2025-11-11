/* --- agendar.js: Lógica del Módulo de Agendamiento de Citas (CRUD) --- */

// Asumimos que las funciones y variables globales (veterinarios, servicios, getAppointments, 
// saveAppointments, generateId, getOwners, showSystemModal) están definidas en data.js.

// Variable para almacenar el ID de la cita que se está editando
let editingAppointmentId = null;

// =================================================================
// 1. FUNCIONES DE RENDERIZADO Y FORMULARIO
// =================================================================

/**
 * Rellena los selectores de Veterinario, Tipo de Servicio y Propietario.
 * Adaptado a tu data.js en español (usa nombre, telefono, etc.)
 */
const setupFormOptions = () => {
    const vetSelect = document.getElementById('veterinarian'); 
    const tipoServicioSelect = document.getElementById('type'); 
    const ownerSelect = document.getElementById('owner'); 
    
    const populateSelect = (selectElement, list, valueKey, textKey, initialText) => {
        if (selectElement) {
            let optionsHtml = `<option value="" disabled selected>${initialText}</option>`;
            list.forEach(item => {
                const text = typeof textKey === 'function' ? textKey(item) : item[textKey];
                optionsHtml += `<option value="${item[valueKey]}">${text}</option>`;
            });
            selectElement.innerHTML = optionsHtml;
        }
    };

    // ============================
    // 1. Veterinarios
    // ============================
    const veterinariansList = typeof veterinarios !== 'undefined' ? veterinarios : [];
    populateSelect(
        vetSelect,
        veterinariansList,
        'nombre',
        (v) => v.nombre ? `${v.nombre}${v.telefono ? ' (' + v.telefono + ')' : ''}` : 'Sin nombre',
        'Seleccione un Veterinario'
    );

    // ============================
    // 2. Servicios
    // ============================
    const servicesList = typeof servicios !== 'undefined' ? servicios : [];
    populateSelect(
        tipoServicioSelect,
        servicesList,
        'nombre',
        (s) => s.nombre ? `${s.nombre}${s.duracion ? ' (' + s.duracion + ')' : ''}` : 'Sin nombre',
        'Seleccione Tipo de Servicio'
    );
    
    // ============================
    // 3. Propietarios
    // ============================
    if (typeof getOwners === 'function') {
        const ownersList = getOwners();
        populateSelect(
            ownerSelect,
            ownersList,
            'name',
            (o) => {
                const fullName = `${o.name || 'Sin nombre'}${o.lastname ? ' ' + o.lastname : ''}`;
                return o.phone ? `${fullName} (${o.phone})` : fullName;
            },
            'Buscar Propietario'
        );
    }
};



/**
 * Renderiza la lista de citas agendadas en la tabla.
 */
const renderCitasAgendadas = () => {
    const container = document.getElementById('appointments-list'); 
    const citasAgendadas = typeof getAppointments === 'function' ? getAppointments() : [];

    if (!container) return;

    if (citasAgendadas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--arya-accent); padding: 20px;">
                <i class="fas fa-search"></i> No hay citas agendadas actualmente.
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>FECHA</th>
                    <th>HORA</th>
                    <th>VETERINARIO</th>
                    <th>MASCOTA / DUEÑO</th>
                    <th>SERVICIO</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                </tr>
            </thead>
            <tbody id="proximas-citas-body">
    `;

    citasAgendadas.forEach(cita => {
        const estadoClase = cita.estado === 'Pendiente' ? 'estado-pendiente' : 
                            cita.estado === 'Confirmada' ? 'estado-confirmada' :
                            'estado-completada';
        
        tableHTML += `
            <tr>
                <td>${cita.date}</td>
                <td>${cita.time}</td>
                <td>${cita.veterinarian}</td>
                <td>${cita.pet} / ${cita.owner}</td>
                <td>${cita.type}</td>
                <td class="${estadoClase}">${cita.estado}</td>
                <td>
                    <div class="action-group">
                        <button class="icon-button edit" onclick="editarCita('${cita.id}')" title="Editar cita"><i class="fas fa-edit"></i></button>
                        <button class="icon-button complete" onclick="marcarComoCompletada('${cita.id}')" title="Completar cita"><i class="fas fa-check-circle"></i></button>
                        <button class="icon-button delete" onclick="eliminarCita('${cita.id}')" title="Eliminar cita"><i class="fas fa-times-circle"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
};

/**
 * Reinicia el formulario y limpia el estado de edición.
 */
const resetFormUI = () => {
    document.getElementById('appointment-form').reset();
    editingAppointmentId = null;
    
    // Restaurar el botón 'Agendar'
    const submitButton = document.querySelector('#appointment-form button[type="submit"]');
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-save"></i> Agendar';
        submitButton.classList.remove('secondary');
        submitButton.classList.add('primary');
    }
    
    // Restaurar el título del formulario (si tienes uno)
    // document.querySelector('.form-container-card h2').innerHTML = '<i class="fas fa-notes-medical"></i> Nueva Cita';
};


// =================================================================
// 2. MANEJADOR PRINCIPAL DEL FORMULARIO (Agendar/Guardar Cambios)
// =================================================================

/**
 * Maneja el envío del formulario: crea una nueva cita o actualiza una existente.
 */
async function handleAgendarCita(event) {
    event.preventDefault();
    
    const form = event.target;
    let currentAppointments = getAppointments();
    let isEditing = !!editingAppointmentId;
    
    // Recolectar datos del formulario
    const appointmentData = {
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        veterinarian: document.getElementById('veterinarian').value,
        type: document.getElementById('type').value,
        owner: document.getElementById('owner').value,
        pet: document.getElementById('pet').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        // Estado solo se inicializa si es una nueva cita
        estado: isEditing ? (currentAppointments.find(c => c.id === editingAppointmentId)?.estado || 'Pendiente') : 'Pendiente'
    };
    
    let mensaje = '';

    if (isEditing) {
        // ACTUALIZACIÓN
        const index = currentAppointments.findIndex(c => c.id === editingAppointmentId);
        if (index !== -1) {
            currentAppointments[index] = { ...currentAppointments[index], ...appointmentData, id: editingAppointmentId }; 
            mensaje = `Cita ID ${editingAppointmentId} actualizada exitosamente.`;
        }
    } else {
        // CREACIÓN
        const newId = 'A' + generateId().substring(0, 5).toUpperCase(); 
        const nuevaCita = { ...appointmentData, id: newId };
        currentAppointments.push(nuevaCita);
        mensaje = `Nueva cita agendada para ${nuevaCita.pet}.`;
    }

    // Guardar y actualizar UI
    saveAppointments(currentAppointments); 
    resetFormUI();
    renderCitasAgendadas();
    
    await showSystemModal('Éxito', mensaje, false, 'var(--arya-secondary)');
}


// =================================================================
// 3. FUNCIONES CRUD DE ACCIONES
// =================================================================

/**
 * Carga los datos de una cita en el formulario para su edición.
 */
function editarCita(id) {
    const citas = getAppointments();
    const cita = citas.find(c => c.id === id);

    if (cita) {
        // 1. Marcar el modo de edición
        editingAppointmentId = id;
        
        // 2. Rellenar el formulario
        document.getElementById('date').value = cita.date;
        document.getElementById('time').value = cita.time;
        document.getElementById('veterinarian').value = cita.veterinarian;
        document.getElementById('type').value = cita.type;
        document.getElementById('owner').value = cita.owner;
        document.getElementById('pet').value = cita.pet;
        document.getElementById('notes').value = cita.notes;

        // 3. Cambiar la interfaz para indicar edición
        const submitButton = document.querySelector('#appointment-form button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
            submitButton.classList.remove('primary');
            submitButton.classList.add('secondary');
        }
        
        // Opcional: Desplazarse al formulario para que el usuario lo vea
        document.getElementById('appointment-form').scrollIntoView({ behavior: 'smooth' });
    }
}


async function marcarComoCompletada(id) {
    const confirmation = await showSystemModal('Confirmación', 
        `¿Marcar la cita ID ${id} como "Completada"?`, 
        true, 'var(--arya-secondary)');

    if (confirmation) {
        let citas = getAppointments();
        const index = citas.findIndex(c => c.id === id);
        if (index !== -1) {
            citas[index].estado = 'Completada';
            saveAppointments(citas);
            renderCitasAgendadas();
            showSystemModal('Estado Actualizado', `Cita ID ${id} marcada como Completada.`, false, 'var(--arya-secondary)');
        }
    }
}

async function eliminarCita(id) {
    const confirmation = await showSystemModal('Confirmación', 
        `¿Eliminar la cita ID ${id} permanentemente? Esta acción es irreversible.`, 
        true, 'var(--danger-color)');

    if (confirmation) {
        let citas = getAppointments();
        const citasFiltradas = citas.filter(c => c.id !== id);
        saveAppointments(citasFiltradas);
        renderCitasAgendadas();
        showSystemModal('Eliminada', `Cita ID ${id} ha sido eliminada.`, false, 'var(--danger-color)');
    }
}


// =================================================================
// 4. INICIALIZACIÓN DE LA PÁGINA
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Configurar los selectores
    setupFormOptions();      
    
    // 2. Cargar la lista de citas
    renderCitasAgendadas();  
    
    // 3. Añadir Event Listener para el formulario principal (Maneja Agendar y Guardar Cambios)
    document.getElementById('appointment-form').addEventListener('submit', handleAgendarCita);
    
    // 4. Añadir Event Listener para el botón "Borrar" del formulario para limpiar el modo edición
    document.querySelector('#appointment-form .button.danger').addEventListener('click', resetFormUI);
});
