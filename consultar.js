// --- consultar.js: Lógica del Módulo Consultar Citas ---

document.addEventListener('DOMContentLoaded', () => {
    populateSelects();
    // Inicialmente, mostrar la vista para hoy
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filter-date').value = today;
    renderAppointmentsView();
    
    // Agregar evento a todos los controles de filtro
    const controls = document.querySelectorAll('.filter-controls input, .filter-controls select');
    controls.forEach(control => {
        control.addEventListener('change', renderAppointmentsView);
        if (control.type === 'text') {
             // Criterio 4: Búsqueda por texto (mejor en input para respuesta rápida)
            control.addEventListener('input', renderAppointmentsView);
        }
    });
});

// Carga las opciones de veterinarios
const populateSelects = () => {
    const vetSelect = document.getElementById('filter-veterinario');
    veterinarians.forEach(vet => {
        vetSelect.innerHTML += `<option value="${vet}">${vet}</option>`;
    });
};

// Función principal para filtrar y renderizar (Criterio 1, 2, 3, 4)
const renderAppointmentsView = () => {
    const appointments = getAppointments().sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    const viewContainer = document.getElementById('calendar-view');
    viewContainer.innerHTML = '';

    // Obtener valores de los filtros
    const filterDate = document.getElementById('filter-date').value;
    const filterVet = document.getElementById('filter-veterinario').value;
    const filterStatus = document.getElementById('filter-status').value;
    const searchTerm = document.getElementById('search-term').value.toLowerCase().trim();
    
    // 1. Aplicar Filtros
    const filteredAppointments = appointments.filter(cita => {
        // Criterio Filtro por Fecha (Vista Diaria simulada)
        if (filterDate && cita.date !== filterDate) return false;

        // Criterio Filtro por Veterinario
        if (filterVet && cita.veterinario !== filterVet) return false;

        // Criterio Filtro por Estado (Criterio 6 - Agendamiento)
        if (filterStatus && cita.status !== filterStatus) return false;

        // Criterio 4: Búsqueda por Propietario o Mascota
        if (searchTerm) {
            const matchesOwner = cita.owner.toLowerCase().includes(searchTerm);
            const matchesPet = cita.pet.toLowerCase().includes(searchTerm);
            if (!matchesOwner && !matchesPet) return false;
        }

        return true;
    });

    if (filteredAppointments.length === 0) {
        viewContainer.innerHTML = '<p style="text-align: center; padding: 30px; color: #6c757d;">No se encontraron citas que coincidan con los filtros aplicados.</p>';
        return;
    }

    // 2. Agrupar por fecha (Simulación de Vista Diaria/Semanal/Mensual)
    // Cuando el usuario cambia la fecha, ve la "Vista Diaria" de ese día.
    const groupedByDate = filteredAppointments.reduce((groups, cita) => {
        const date = cita.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(cita);
        return groups;
    }, {});
    
    // 3. Renderizar Grupos
    for (const date in groupedByDate) {
        const group = document.createElement('div');
        group.className = 'day-group';
        group.innerHTML = `<div class="day-header">${date}</div>`;
        
        const list = document.createElement('ul');
        list.className = 'list-container';

        groupedByDate[date].forEach(cita => {
            const duration = getDurationMinutes(cita.consultationType);
            const endTime = getEndTime(cita.date, cita.time, duration);
            
            const listItem = document.createElement('li');
            listItem.className = `list-item list-item-consult status-${cita.status}`;
            
            listItem.innerHTML = `
                <div class="cita-details">
                    <p><strong>${cita.time} - ${endTime}</strong> (${duration} min)</p>
                    <p><strong>Mascota:</strong> ${cita.pet} | <strong>Propietario:</strong> ${cita.owner}</p>
                    <p><strong>Veterinario:</strong> ${cita.veterinario} | <strong>Tipo:</strong> ${cita.consultationType}</p>
                    <p><strong>Estado:</strong> <span style="font-weight: bold;">${cita.status}</span></p>
                </div>
                <div class="item-actions">
                    <button onclick="alert('Abriendo ficha de cita #${cita.id.substring(0, 6).toUpperCase()} para acciones (Reagendar/Cancelar)')"
                            style="background-color: #007bff; padding: 8px 15px; font-size: 0.9em;">Gestionar</button>
                </div>
            `;
            list.appendChild(listItem);
        });
        
        group.appendChild(list);
        viewContainer.appendChild(group);
    }
};