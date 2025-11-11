// ----------------------------
// PROPIETARIO.JS COMPLETO
// ----------------------------

// Cargar datos desde data.js
let owners = getOwners(); 
let pets = getPets();

// ----------------------------
// FUNCION PARA RENDERIZAR LA TABLA
// ----------------------------
function renderOwnersTable() {
    const container = document.getElementById('invoices-list');
    
    // Crear la estructura completa de la tabla
    const tableHTML = `
        <table id="recent-clients-list-table"> 
            <thead>
                <tr>
                    <th>ID</th>
                    <th>PROPIETARIO</th>
                    <th>TELÉFONO</th>
                    <th>MASCOTA PRINCIPAL</th>
                    <th>REGISTRO</th>
                    <th>ACCIONES</th>
                </tr>
            </thead>
            <tbody id="recent-clients-list">
            </tbody>
        </table>
    `;
    
    // Inyectar la tabla en el contenedor
    container.innerHTML = tableHTML;
    
    // Ahora llenar el tbody
    const tbody = document.getElementById('recent-clients-list');
    tbody.innerHTML = '';

    owners.forEach(owner => {
        // Mascota principal (primera)
        const ownerPets = pets.filter(p => p.ownerUsername === owner.username);
        const mainPet = ownerPets[0] || { name: '-' };

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${owner.id}</td>
            <td>${owner.name} ${owner.lastname}</td>
            <td>${owner.phone}</td>
            <td>${mainPet.name}</td>
            <td>${owner.registeredDate}</td>
            <td>
                <div class="action-group">
                    <button class="icon-button view" onclick="viewOwner('${owner.id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="icon-button delete" onclick="deleteOwner('${owner.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>    
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ----------------------------
// FUNCION PARA MOSTRAR MODAL DE PROPIETARIO
// ----------------------------
function viewOwner(ownerId) {
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) return;

    const ownerPets = pets.filter(p => p.ownerUsername === owner.username);
    const petsInfo = ownerPets.length
        ? ownerPets.map(p => `• ${p.name} (${p.species}, ${p.age} años, color: ${p.color || '-'})`).join('<br>')
        : 'No tiene mascotas registradas';

    showSystemModal(
        'Detalles del Propietario y Mascotas',
        `
        <strong>Propietario:</strong> ${owner.name} ${owner.lastname}<br>
        <strong>Teléfono:</strong> ${owner.phone}<br>
        <strong>Correo:</strong> ${owner.email}<br>
        <strong>Mascotas:</strong><br>${petsInfo}
        `,
        false
    );
}

// ----------------------------
// FUNCION PARA ELIMINAR PROPIETARIO
// ----------------------------
function deleteOwner(ownerId) {
    showSystemModal(
        'Confirmar Eliminación',
        '¿Está seguro que desea eliminar este propietario y sus mascotas?',
        true
    ).then(confirm => {
        if (!confirm) return;

        const owner = owners.find(o => o.id === ownerId);
        owners = owners.filter(o => o.id !== ownerId);
        pets = pets.filter(p => p.ownerUsername !== owner.username);

        saveOwners(owners);
        savePets(pets);
        renderOwnersTable();
    });
}

// ----------------------------
// FUNCION REGISTRO ASISTIDO
// ----------------------------
document.getElementById('assisted-registration-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newOwner = {
        id: getNextOwnerId(),
        name: document.getElementById('reg-name').value.trim(),
        lastname: document.getElementById('reg-lastname').value.trim(),
        age: parseInt(document.getElementById('reg-age').value),
        phone: document.getElementById('reg-phone').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        username: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value.trim(),
        role: 'Cliente',
        registeredDate: new Date().toLocaleDateString(),
        isEnabled: true
    };

    const newPet = {
        id: getNextPetId(),
        name: document.getElementById('pet-name').value.trim(),
        ownerUsername: newOwner.username,
        species: document.getElementById('pet-type').value,
        age: parseInt(document.getElementById('pet-age').value),
        color: document.getElementById('pet-color').value.trim(),
        breed: '',
        birthDate: '',
        historialClinico: [] // 🩺 CAMPO AGREGADO para historial clínico
    };

    owners.push(newOwner);
    pets.push(newPet);

    saveOwners(owners);
    savePets(pets);

    renderOwnersTable();
    this.reset();

    showSystemModal(
        'Registro Exitoso',
        `Propietario <strong>${newOwner.name}</strong> y su mascota <strong>${newPet.name}</strong> han sido registrados correctamente.`,
        false
    );
});

// ----------------------------
// INICIALIZAR TABLA AL CARGAR PAGINA
// ----------------------------
window.addEventListener('DOMContentLoaded', () => {
    owners = getOwners(); // asegurar datos actualizados desde localStorage
    pets = getPets();
    renderOwnersTable();
});