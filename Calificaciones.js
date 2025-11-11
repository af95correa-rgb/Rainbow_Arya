/* --- Calificaciones.js: Lógica del Módulo de Calificaciones --- */

let editingCalificacionId = null;

// =================================================================
// 1. FUNCIONES DE RENDERIZADO
// =================================================================

/**
 * Renderiza la lista de calificaciones en la tabla.
 */
const renderCalificaciones = () => {
    const container = document.getElementById('appointments-list'); 
    const calificaciones = typeof getCalificaciones === 'function' ? getCalificaciones() : [];

    if (!container) return;

    if (calificaciones.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--arya-accent); padding: 20px;">
                <i class="fas fa-search"></i> No hay calificaciones registradas actualmente.
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>USUARIO</th>
                    <th>SERVICIO</th>
                    <th>MASCOTA</th>
                    <th>PERSONA ATENDIÓ</th>
                    <th>CALIFICACIÓN</th>
                    <th>COMENTARIO</th>
                    <th>ACCIONES</th>
                </tr>
            </thead>
            <tbody id="calificaciones-body">
    `;

    calificaciones.forEach(cal => {
        // Generar estrellas para la calificación
        const estrellas = generarEstrellas(cal.calificacion);
        
        // Truncar comentario si es muy largo
        const comentarioCorto = cal.comentario.length > 50 
            ? cal.comentario.substring(0, 50) + '...' 
            : cal.comentario;
        
        tableHTML += `
            <tr>
                <td><strong>${cal.usuario}</strong><br><small>${cal.usuarioEmail}</small></td>
                <td>${cal.servicio}</td>
                <td>${cal.mascota}</td>
                <td>${cal.personaAtendio}</td>
                <td style="text-align: center;">
                    <div class="rating-stars">${estrellas}</div>
                    <small>(${cal.calificacion}/5)</small>
                </td>
                <td>
                    <div class="comentario-cell" title="${cal.comentario}">
                        ${comentarioCorto}
                    </div>
                </td>
                <td>
                    <button class="icon-button view" onclick="verDetalleCalificacion('${cal.id}')" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="icon-button delete" onclick="eliminarCalificacion('${cal.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
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
 * Genera el HTML de las estrellas según la calificación
 */
const generarEstrellas = (calificacion) => {
    let estrellas = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= calificacion) {
            estrellas += '<i class="fas fa-star" style="color: gold;"></i>';
        } else {
            estrellas += '<i class="far fa-star" style="color: #ccc;"></i>';
        }
    }
    return estrellas;
};

// =================================================================
// 2. FUNCIONES DE ACCIONES
// =================================================================

/**
 * Muestra el detalle completo de una calificación en un modal
 */
async function verDetalleCalificacion(id) {
    const calificaciones = getCalificaciones();
    const cal = calificaciones.find(c => c.id === id);

    if (cal) {
        const estrellas = generarEstrellas(cal.calificacion);
        
        const mensaje = `
            <div style="text-align: left; line-height: 1.8;">
                <p><strong>ID:</strong> ${cal.id}</p>
                <p><strong>Usuario:</strong> ${cal.usuario} (${cal.usuarioEmail})</p>
                <p><strong>Servicio:</strong> ${cal.servicio}</p>
                <p><strong>Mascota:</strong> ${cal.mascota}</p>
                <p><strong>Atendido por:</strong> ${cal.personaAtendio}</p>
                <p><strong>Fecha:</strong> ${cal.fecha}</p>
                <p><strong>Calificación:</strong> ${estrellas} (${cal.calificacion}/5)</p>
                <p><strong>Comentario:</strong></p>
                <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-style: italic;">
                    "${cal.comentario}"
                </p>
            </div>
        `;
        
        await showSystemModal('Detalle de Calificación', mensaje, false, 'var(--arya-secondary)');
    }
}

/**
 * Elimina una calificación después de confirmar
 */
async function eliminarCalificacion(id) {
    const confirmation = await showSystemModal('Confirmación', 
        `¿Está seguro de eliminar la calificación ID ${id}? Esta acción es irreversible.`, 
        true, 'var(--danger-color)');

    if (confirmation) {
        if (typeof deleteCalificacion === 'function') {
            deleteCalificacion(id);
            renderCalificaciones();
            showSystemModal('Eliminada', `Calificación ID ${id} ha sido eliminada.`, false, 'var(--danger-color)');
        }
    }
}

/**
 * Muestra estadísticas de calificaciones por veterinario
 */
const mostrarEstadisticas = () => {
    const calificaciones = getCalificaciones();
    
    if (calificaciones.length === 0) {
        showSystemModal('Sin Datos', 'No hay calificaciones para mostrar estadísticas.', false, 'var(--arya-accent)');
        return;
    }

    // Agrupar por veterinario
    const estatsPorVet = {};
    
    calificaciones.forEach(cal => {
        if (!estatsPorVet[cal.personaAtendio]) {
            estatsPorVet[cal.personaAtendio] = {
                total: 0,
                suma: 0,
                count: 0
            };
        }
        estatsPorVet[cal.personaAtendio].suma += cal.calificacion;
        estatsPorVet[cal.personaAtendio].count += 1;
    });

    let mensaje = '<div style="text-align: left;">';
    mensaje += '<h3>Promedio de Calificaciones por Veterinario</h3>';
    
    for (const [vet, stats] of Object.entries(estatsPorVet)) {
        const promedio = (stats.suma / stats.count).toFixed(1);
        const estrellas = generarEstrellas(Math.round(promedio));
        mensaje += `
            <p style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                <strong>${vet}</strong><br>
                ${estrellas} <strong>${promedio}/5</strong> (${stats.count} calificaciones)
            </p>
        `;
    }
    
    mensaje += '</div>';
    
    showSystemModal('Estadísticas de Calificaciones', mensaje, false, 'var(--arya-secondary)');
};

// =================================================================
// 3. INICIALIZACIÓN DE LA PÁGINA
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Cargar la lista de calificaciones
    renderCalificaciones();
    
    // Agregar botón de estadísticas si existe un contenedor para ello
    const container = document.querySelector('.container');
    if (container) {
        const statsButton = document.createElement('button');
        statsButton.className = 'button secondary';
        statsButton.innerHTML = '<i class="fas fa-chart-bar"></i> Ver Estadísticas';
        statsButton.style.marginBottom = '20px';
        statsButton.onclick = mostrarEstadisticas;
        
        // Insertar antes del panel de calificaciones
        const panel = document.querySelector('.centered-panel-container');
        if (panel) {
            container.insertBefore(statsButton, panel);
        }
    }
});