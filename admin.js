// --- admin.js: Lógica del Módulo Administrativo ---

document.addEventListener('DOMContentLoaded', () => {
// Inicialización
setupTabs();
renderCatalogue();
renderUsers(); // Cargar usuarios al iniciar

// Event Listeners
document.getElementById('add-new-item-btn').addEventListener('click', handleAddNewItem);
document.getElementById('catalogue-list').addEventListener('click', handleCatalogueActions);
document.getElementById('generate-report-btn').addEventListener('click', generateReport);

// Event Listener para crear nuevo usuario
const createUserBtn = document.querySelector('#usuarios .button.secondary');
if (createUserBtn) {
    createUserBtn.onclick = createNewUser;
}
});


// =========================================================
// 1. GESTIÓN DE PESTAÑAS (TABS)
// ... (El resto de setupTabs permanece igual)
// =========================================================

const setupTabs = () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Desactivar todas las pestañas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activar la pestaña seleccionada
            button.classList.add('active');
            const targetTab = document.getElementById(button.getAttribute('data-tab'));
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
};


// =========================================================
// 2. GESTIÓN DE CATÁLOGOS
// ... (Toda la lógica de catálogo permanece igual)
// =========================================================

/**
 * Renderiza la lista de productos y servicios (Catálogo)
 */
const renderCatalogue = () => {
    const listContainer = document.getElementById('catalogue-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    // El 'catalog' está en data.js
    if (typeof catalog === 'undefined' || catalog.length === 0) {
        listContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #777; border: 2px dashed #ccc; border-radius: 12px; background-color: rgba(142, 68, 173, 0.02);">
                <i class="fas fa-box-open" style="font-size: 3em; color: var(--arya-blue); margin-bottom: 15px; display: block;"></i>
                <p style="font-size: 1.05em; margin: 0;">No hay items en el catálogo. Agregue uno para comenzar.</p>
            </div>
        `;
        return;
    }
    
    catalog.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'catalogue-item';
        itemDiv.id = `cat-${item.id}`;
        
        const typeIcon = item.type === 'Product' ? '📦' : '💡';
        const typeText = item.type === 'Product' ? 'Producto' : 'Servicio';
        
        itemDiv.innerHTML = `
            <span data-label="Nombre: ">${item.name} <small>(${item.id})</small></span>
            <span data-label="Tipo: ">${typeIcon} ${typeText}</span>
            <span data-label="Precio: " class="price-display">$${item.price.toFixed(2)}</span>
            <span data-label="Impuesto: " class="tax-display">${(item.taxRate * 100).toFixed(0)}%</span>
            <div class="catalogue-actions">
                <button class="edit-btn" data-id="${item.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="delete-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });
};

/**
 * Maneja las acciones de Editar/Eliminar
 */
const handleCatalogueActions = (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    
    const itemId = target.getAttribute('data-id');

    if (target.classList.contains('edit-btn')) {
        handleEditItem(itemId);
    } else if (target.classList.contains('delete-btn')) {
        handleDeleteItem(itemId);
    }
};

/**
 * Edición de Ítem del Catálogo usando Modal Personalizado
 */
const handleEditItem = async (itemId) => {
    const item = catalog.find(i => i.id === itemId);
    if (!item) return;

    // Crear modal personalizado para edición
    const modalHTML = `
        <div style="text-align: left;">
            <p style="margin-bottom: 15px;">Editando precio para: <strong>${item.name}</strong></p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0; color: #666;">Precio actual: <strong style="color: var(--arya-primary); font-size: 1.2em;">$${item.price.toFixed(2)}</strong></p>
            </div>
            <label for="edit-price-input" style="display: block; margin-bottom: 8px; font-weight: 600;">Nuevo Precio:</label>
            <input type="number" id="edit-price-input" 
                   value="${item.price.toFixed(2)}" 
                   step="0.01" 
                   min="0"
                   style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1.1em; box-sizing: border-box;"
                   autofocus>
        </div>
    `;

    // Crear contenedor temporal para el modal
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = modalHTML;
    
    // Mostrar modal con HTML personalizado
    const modalBackdrop = document.getElementById('system-modal-backdrop');
    const modalContent = document.getElementById('system-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalActions = document.getElementById('modal-actions');

    if (!modalBackdrop || !modalContent) {
        alert('Error: Modal del sistema no encontrado');
        return;
    }

    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Precio';
    modalMessage.innerHTML = '';
    modalMessage.appendChild(tempContainer.firstElementChild);
    
    modalActions.innerHTML = `
        <button class="button secondary" id="modal-cancel-btn">
            <i class="fas fa-times"></i> Cancelar
        </button>
        <button class="button primary" id="modal-save-btn">
            <i class="fas fa-save"></i> Guardar Cambios
        </button>
    `;

    modalBackdrop.style.display = 'flex';

    // Promise para manejar la respuesta del usuario
    return new Promise((resolve) => {
        const priceInput = document.getElementById('edit-price-input');
        
        const closeModal = () => {
            modalBackdrop.style.display = 'none';
            resolve(false);
        };

        const savePrice = async () => {
            const newPrice = parseFloat(priceInput.value);
            
            if (isNaN(newPrice) || newPrice < 0) {
                await showSystemModal(
                    'Error de Validación',
                    '❌ Por favor, ingrese un precio válido mayor o igual a 0.',
                    false,
                    'var(--danger-color)'
                );
                return;
            }

            const oldPrice = item.price;
            item.price = newPrice;
            
            modalBackdrop.style.display = 'none';
            
            await showSystemModal(
                'Precio Actualizado', 
                `✅ Precio de **${item.name}** actualizado correctamente:\n\n$${oldPrice.toFixed(2)} → **$${item.price.toFixed(2)}**`,
                false,
                'var(--arya-secondary)'
            );
            
            renderCatalogue();
            resolve(true);
        };

        document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
        document.getElementById('modal-save-btn').addEventListener('click', savePrice);
        
        // Enter para guardar
        priceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') savePrice();
        });
    });
};

/**
 * Eliminación de Ítem del Catálogo
 */
const handleDeleteItem = async (itemId) => {
    const item = catalog.find(i => i.id === itemId);
    if (!item) return;

    const confirmed = await showSystemModal(
        'Confirmar Eliminación',
        `¿Está seguro de archivar/eliminar el ítem **${item.name}** (${item.id})?\n\n⚠️ Esta acción simulará la inhabilitación del item.`,
        true,
        'var(--danger-color)'
    );

    if (confirmed) {
        const itemIndex = catalog.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            catalog.splice(itemIndex, 1);
        }

        await showSystemModal(
            'Item Archivado',
            `❌ Ítem **${item.name}** archivado/inhabilitado exitosamente.`,
            false,
            'var(--danger-color)'
        );

        renderCatalogue();
    }
};

/**
 * Agregar Nuevo Ítem al Catálogo usando Modal Personalizado
 */
const handleAddNewItem = async () => {
    // Crear modal personalizado para agregar item
    const modalHTML = `
        <div style="text-align: left;">
            <div style="margin-bottom: -80px;">
                <label for="new-item-name" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    <i class="fas fa-tag"></i> Nombre del Producto/Servicio:
                </label>
                <input type="text" id="new-item-name" 
                       placeholder="Ej: Vacuna Triple Felina"
                       style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em; box-sizing: border-box;"
                       autofocus>
            </div>
            
            <div style="margin-bottom: -20px;">
                <label for="new-item-type" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    <i class="fas fa-layer-group"></i> Tipo:
                </label>
                <select id="new-item-type" 
                        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em; appearance: none; background-color: white; cursor: pointer;">
                    <option value="" disabled selected>Seleccione un tipo</option>
                    <option value="product">📦 Producto</option>
                    <option value="service">💡 Servicio</option>
                </select>
            </div>

            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid var(--arya-blue);">
                <p style="margin: 0; font-size: 0.9em; color: #555;">
                    <i class="fas fa-info-circle"></i> Después de crear el item, podrá editar su precio y otros detalles.
                </p>
            </div>
        </div>
    `;

    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = modalHTML;
    
    const modalBackdrop = document.getElementById('system-modal-backdrop');
    const modalContent = document.getElementById('system-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalActions = document.getElementById('modal-actions');

    if (!modalBackdrop || !modalContent) {
        alert('Error: Modal del sistema no encontrado');
        return;
    }

    modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Nuevo Item';
    modalMessage.innerHTML = '';
    modalMessage.appendChild(tempContainer.firstElementChild);
    
    modalActions.innerHTML = `
        <button class="button secondary" id="modal-cancel-btn">
            <i class="fas fa-times"></i> Cancelar
        </button>
        <button class="button primary" id="modal-create-btn">
            <i class="fas fa-check"></i> Crear Item
        </button>
    `;

    modalBackdrop.style.display = 'flex';

    return new Promise((resolve) => {
        const nameInput = document.getElementById('new-item-name');
        const typeSelect = document.getElementById('new-item-type');
        
        const closeModal = () => {
            modalBackdrop.style.display = 'none';
            resolve(false);
        };

        const createItem = async () => {
            const newName = nameInput.value.trim();
            const newType = typeSelect.value;
            
            if (!newName) {
                await showSystemModal(
                    'Error de Validación',
                    '❌ Por favor, ingrese un nombre para el item.',
                    false,
                    'var(--danger-color)'
                );
                return;
            }

            if (!newType) {
                await showSystemModal(
                    'Error de Validación',
                    '❌ Por favor, seleccione un tipo (Producto o Servicio).',
                    false,
                    'var(--danger-color)'
                );
                return;
            }
            
            const newId = (newType === 'product' ? 'P' : 'S') + 
                          (catalog.length + 10).toString().padStart(3, '0');
            
            const newItem = {
                id: newId,
                name: newName,
                type: newType.charAt(0).toUpperCase() + newType.slice(1),
                price: 0.00,
                taxRate: 0.19,
                stock: newType === 'product' ? 0 : undefined,
                duration: newType === 'service' ? '30 min' : undefined
            };
            
            catalog.push(newItem);
            
            modalBackdrop.style.display = 'none';
            
            await showSystemModal(
                'Item Creado',
                `🎉 Nuevo item **${newName}** (${newId}) agregado al catálogo exitosamente.\n\nAhora puede editar su precio y otros detalles.`,
                false,
                'var(--arya-secondary)'
            );
            
            renderCatalogue();
            resolve(true);
        };

        document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
        document.getElementById('modal-create-btn').addEventListener('click', createItem);
        
        // Enter para crear
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && typeSelect.value) createItem();
        });
    });
};


// =========================================================
// 3. GESTIÓN DE USUARIOS
// =========================================================

/**
 * Muestra los detalles de un usuario en un modal
 */
const viewUserDetails = async (username) => {
    const users = typeof getUsers === 'function' ? getUsers() : [];
    const user = users.find(u => u.username === username);
    
    if (!user) {
        await showSystemModal(
            'Error',
            '❌ Usuario no encontrado.',
            false,
            'var(--danger-color)'
        );
        return;
    }

    // Asegurarse de que el campo exista para la vista de detalles
    if (typeof user.isEnabled === 'undefined') {
        user.isEnabled = true;
    }
    const statusText = user.isEnabled ? 'Habilitado (Activo)' : 'Deshabilitado (Inactivo)';
    const statusColor = user.isEnabled ? '#2ecc71' : '#95a5a6';

    const detailsHTML = `
        <div style="text-align: left;">
            <div style="background: linear-gradient(135deg, var(--arya-primary) 0%, var(--arya-secondary) 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                <i class="fas fa-user-circle" style="font-size: 4em; color: white; margin-bottom: 10px; display: block;"></i>
                <h3 style="color: white; margin: 0;">${user.username}</h3>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0; display: flex; justify-content: space-between;">
                    <strong><i class="fas fa-id-badge"></i> Usuario:</strong>
                    <span>${user.username}</span>
                </p>
            </div>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0; display: flex; justify-content: space-between;">
                    <strong><i class="fas fa-user-tag"></i> Rol:</strong>
                    <span style="padding: 4px 12px; background-color: ${getRoleColor(user.role)}; color: white; border-radius: 20px; font-size: 0.9em;">${user.role}</span>
                </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0; display: flex; justify-content: space-between;">
                    <strong><i class="fas fa-toggle-on"></i> Estado:</strong>
                    <span style="font-weight: 600; color: ${statusColor};">${statusText}</span>
                </p>
            </div>
            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid var(--arya-blue);">
                <p style="margin: 0; font-size: 0.9em; color: #555;">
                    <i class="fas fa-info-circle"></i> <strong>Contraseña:</strong> ••••••••
                </p>
            </div>
        </div>
    `;

    // Usar el modal directamente para mostrar HTML
    const modalBackdrop = document.getElementById('system-modal-backdrop');
    const modalContent = document.getElementById('system-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalActions = document.getElementById('modal-actions');

    if (!modalBackdrop || !modalContent) {
        alert('Error: Modal del sistema no encontrado');
        return;
    }

    modalTitle.innerHTML = '<i class="fas fa-user-circle"></i> Detalles del Usuario';
    modalMessage.innerHTML = detailsHTML;
    modalContent.style.borderTop = `5px solid var(--arya-primary)`;
    
    modalActions.innerHTML = `
        <button class="button primary" id="modal-close-btn">
            <i class="fas fa-times"></i> Cerrar
        </button>
    `;

    modalBackdrop.style.display = 'flex';

    return new Promise((resolve) => {
        const closeModal = () => {
            modalBackdrop.style.display = 'none';
            resolve(true);
        };

        document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    });
};

/**
 * Retorna el color según el rol
 */
const getRoleColor = (role) => {
    const colors = {
        'Administrador': '#e74c3c',
        'Veterinario': '#2ecc71',
        'Recepcionista': '#3498db',
        'Auxiliar': '#f39c12'
    };
    return colors[role] || '#95a5a6';
};

/**
 * Alterna el estado de habilitación/deshabilitación de un usuario
 */
const toggleUserStatus = async (username) => {
    const users = typeof getUsers === 'function' ? getUsers() : [];
    const user = users.find(u => u.username === username);

    if (!user) {
        await showSystemModal(
            'Error',
            '❌ Usuario no encontrado.',
            false,
            'var(--danger-color)'
        );
        return;
    }

    // Asegurarse de que el campo exista, por si viene de data.js sin él.
    if (typeof user.isEnabled === 'undefined') {
        user.isEnabled = true;
    }

    const newStatus = !user.isEnabled;
    const actionText = newStatus ? 'habilitar' : 'deshabilitar';
    const newStatusText = newStatus ? 'Habilitado' : 'Deshabilitado';
    const confirmColor = newStatus ? 'var(--arya-secondary)' : 'var(--danger-color)';
    const confirmIcon = newStatus ? 'fa-check' : 'fa-ban';

    const confirmed = await showSystemModal(
        'Confirmar Acción',
        `¿Está seguro de **${actionText}** al usuario **${user.username}**?\n\nEl usuario ${newStatus ? 'podrá acceder' : 'perderá el acceso'} al sistema.`,
        true,
        confirmColor
    );

    if (confirmed) {
        user.isEnabled = newStatus;

        await showSystemModal(
            'Estado Actualizado',
            `✅ Usuario **${user.username}** ha sido **${newStatusText}** exitosamente.`,
            false,
            'var(--arya-secondary)'
        );

        renderUsers();
    }
};

/**
 * Edita un usuario existente
 */
const editUser = async (username) => {
    const users = typeof getUsers === 'function' ? getUsers() : [];
    const user = users.find(u => u.username === username);
    
    if (!user) {
        await showSystemModal(
            'Error',
            '❌ Usuario no encontrado.',
            false,
            'var(--danger-color)'
        );
        return;
    }

    const editHTML = `
        <div style="text-align: left;">
            <div style="margin-bottom: 20px;">
                <label for="edit-username" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    <i class="fas fa-user"></i> Nombre de Usuario:
                </label>
                <input type="text" id="edit-username" 
                       value="${user.username}"
                       style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em; box-sizing: border-box;"
                       readonly>
                <small style="color: #777; display: block; margin-top: 5px;">El nombre de usuario no puede modificarse</small>
            </div>

            <div style="margin-bottom: 20px;">
                <label for="edit-password" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    <i class="fas fa-lock"></i> Nueva Contraseña:
                </label>
                <input type="password" id="edit-password" 
                       placeholder="Dejar en blanco para no cambiar"
                       style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
            </div>

            <div style="margin-bottom: 20px;">
                <label for="edit-role" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    <i class="fas fa-user-tag"></i> Rol:
                </label>
                <select id="edit-role" 
                        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em; appearance: none; background-color: white; cursor: pointer;">
                    <option value="Administrador" ${user.role === 'Administrador' ? 'selected' : ''}>Administrador</option>
                    <option value="Veterinario" ${user.role === 'Veterinario' ? 'selected' : ''}>Veterinario</option>
                    <option value="Recepcionista" ${user.role === 'Recepcionista' ? 'selected' : ''}>Recepcionista</option>
                    <option value="Auxiliar" ${user.role === 'Auxiliar' ? 'selected' : ''}>Auxiliar</option>
                </select>
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-size: 0.9em; color: #856404;">
                    <i class="fas fa-exclamation-triangle"></i> Los cambios se aplicarán inmediatamente en el sistema.
                </p>
            </div>
        </div>
    `;

    const modalBackdrop = document.getElementById('system-modal-backdrop');
    const modalContent = document.getElementById('system-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalActions = document.getElementById('modal-actions');

    if (!modalBackdrop || !modalContent) {
        alert('Error: Modal del sistema no encontrado');
        return;
    }

    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = editHTML;

    modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuario';
    modalMessage.innerHTML = '';
    modalMessage.appendChild(tempContainer.firstElementChild);
    
    modalActions.innerHTML = `
        <button class="button secondary" id="modal-cancel-btn">
            <i class="fas fa-times"></i> Cancelar
        </button>
        <button class="button primary" id="modal-save-btn">
            <i class="fas fa-save"></i> Guardar Cambios
        </button>
    `;

    modalBackdrop.style.display = 'flex';

    return new Promise((resolve) => {
        const closeModal = () => {
            modalBackdrop.style.display = 'none';
            resolve(false);
        };

        const saveChanges = async () => {
            const newPassword = document.getElementById('edit-password').value;
            const newRole = document.getElementById('edit-role').value;

            // Actualizar usuario
            if (newPassword) {
                user.password = newPassword;
            }
            user.role = newRole;

            modalBackdrop.style.display = 'none';
            
            await showSystemModal(
                'Usuario Actualizado',
                `✅ Usuario **${user.username}** actualizado exitosamente.\n\n**Nuevo Rol:** ${user.role}`,
                false,
                'var(--arya-secondary)'
            );
            
            renderUsers();
            resolve(true);
        };

        document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
        document.getElementById('modal-save-btn').addEventListener('click', saveChanges);
    });
};

/**
 * Crea un nuevo usuario
 */
const createNewUser = async () => {
    const createHTML = `
        <div style="text-align: left;">
            <div style="margin-bottom: -60px;">
                <label for="new-username" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    <i class="fas fa-user"></i> Nombre de Usuario:
                </label>
                <input type="text" id="new-username" 
                       placeholder="Ej: dragonzales"
                       style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em; box-sizing: border-box;"
                       autofocus>
            </div>

            <div style="margin-bottom: -60px;">
                <label for="new-password" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    <i class="fas fa-lock"></i> Contraseña:
                </label>
                <input type="password" id="new-password" 
                       placeholder="Ingrese una contraseña segura"
                       style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em; box-sizing: border-box;">
            </div>

            <div style="margin-bottom: 20px;">
                <label for="new-role" style="display: block; margin-bottom: 8px; font-weight: 600;">
                    <i class="fas fa-user-tag"></i> Rol:
                </label>
                <select id="new-role" 
                        style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em; appearance: none; background-color: white; cursor: pointer;">
                    <option value="" disabled selected>Seleccione un rol</option>
                    <option value="Administrador">🔒 Administrador</option>
                    <option value="Veterinario">⚕️ Veterinario</option>
                    <option value="Recepcionista">📋 Recepcionista</option>
                    <option value="Auxiliar">🤝 Auxiliar</option>
                </select>
            </div>

            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid var(--arya-blue);">
                <p style="margin: 0; font-size: 0.9em; color: #555;">
                    <i class="fas fa-info-circle"></i> El nuevo usuario podrá acceder al sistema inmediatamente.
                </p>
            </div>
        </div>
    `;

    const modalBackdrop = document.getElementById('system-modal-backdrop');
    const modalContent = document.getElementById('system-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalActions = document.getElementById('modal-actions');

    if (!modalBackdrop || !modalContent) {
        alert('Error: Modal del sistema no encontrado');
        return;
    }

    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = createHTML;

    modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Crear Nuevo Usuario';
    modalMessage.innerHTML = '';
    modalMessage.appendChild(tempContainer.firstElementChild);
    
    modalActions.innerHTML = `
        <button class="button secondary" id="modal-cancel-btn">
            <i class="fas fa-times"></i> Cancelar
        </button>
        <button class="button primary" id="modal-create-btn">
            <i class="fas fa-check"></i> Crear Usuario
        </button>
    `;

    modalBackdrop.style.display = 'flex';

    return new Promise((resolve) => {
        const closeModal = () => {
            modalBackdrop.style.display = 'none';
            resolve(false);
        };

        const createUser = async () => {
            const username = document.getElementById('new-username').value.trim();
            const password = document.getElementById('new-password').value;
            const role = document.getElementById('new-role').value;

            // Validaciones
            if (!username) {
                await showSystemModal(
                    'Error de Validación',
                    '❌ Por favor, ingrese un nombre de usuario.',
                    false,
                    'var(--danger-color)'
                );
                return;
            }

            if (!password) {
                await showSystemModal(
                    'Error de Validación',
                    '❌ Por favor, ingrese una contraseña.',
                    false,
                    'var(--danger-color)'
                );
                return;
            }

            if (!role) {
                await showSystemModal(
                    'Error de Validación',
                    '❌ Por favor, seleccione un rol.',
                    false,
                    'var(--danger-color)'
                );
                return;
            }

            // Verificar si el usuario ya existe
            const users = typeof getUsers === 'function' ? getUsers() : [];
            if (users.find(u => u.username === username)) {
                await showSystemModal(
                    'Usuario Duplicado',
                    `❌ El usuario **${username}** ya existe en el sistema.`,
                    false,
                    'var(--danger-color)'
                );
                return;
            }

            // Crear el nuevo usuario
            users.push({ 
                username, 
                password, 
                role,
                isEnabled: true // Nuevo usuario siempre se crea habilitado
            });

            modalBackdrop.style.display = 'none';
            
            await showSystemModal(
                'Usuario Creado',
                `✅ Usuario **${username}** creado exitosamente.\n\n**Rol asignado:** ${role}`,
                false,
                'var(--arya-secondary)'
            );
            
            renderUsers();
            resolve(true);
        };

        document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
        document.getElementById('modal-create-btn').addEventListener('click', createUser);

        // Enter para crear
        document.getElementById('new-username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('new-password').focus();
        });
        document.getElementById('new-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('new-role').focus();
        });
    });
};

/**
 * Renderiza la lista de usuarios dinámicamente
 */
const renderUsers = () => {
    const usersContainer = document.querySelector('.users-container');
    if (!usersContainer) return;

    const users = typeof getUsers === 'function' ? getUsers() : [];
    
    usersContainer.innerHTML = '';

    users.forEach(user => {
        // Inicializar el estado si no existe (asumiendo que por defecto está habilitado)
        if (typeof user.isEnabled === 'undefined') {
            user.isEnabled = true;
        }

        const isEnabled = user.isEnabled;
        const statusText = isEnabled ? 'Habilitado' : 'Deshabilitado';
        const statusClass = isEnabled ? 'status-enabled' : 'status-disabled';
        const toggleIcon = isEnabled ? 'fa-ban' : 'fa-check-circle'; // ban para deshabilitar (si está habilitado)
        const toggleTitle = isEnabled ? 'Deshabilitar Usuario' : 'Habilitar Usuario';
        const toggleColor = isEnabled ? '#95a5a6' : '#2ecc71'; // Gris para desactivar, verde para activar

        const roleClass = user.role === 'Veterinario' ? 'role-vet' : 'role-receptionist';
        const roleIcon = user.role === 'Administrador' ? 'fa-user-shield' :
                        user.role === 'Veterinario' ? 'fa-user-md' :
                        user.role === 'Recepcionista' ? 'fa-user' : 'fa-user-nurse';

        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-avatar">
                <i class="fas ${roleIcon}"></i>
            </div>
            <div class="user-info">
                <h4>${user.username}</h4>
                <span class="user-role ${roleClass}">${user.role}</span>
                <span class="user-status ${statusClass}">${statusText}</span> </div>
            <div class="user-actions">
                <button class="icon-button" style="background-color: var(--arya-blue);" onclick="viewUserDetails('${user.username}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="icon-button edit" onclick="editUser('${user.username}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-button toggle-status-btn" style="background-color: ${toggleColor};" onclick="toggleUserStatus('${user.username}')" title="${toggleTitle}">
                    <i class="fas ${toggleIcon}"></i>
                </button> </div>
        `;
        usersContainer.appendChild(userCard);
    });
};



// =========================================================
// 4. REPORTES FINANCIEROS
// ... (Toda la lógica de reportes permanece igual)
// =========================================================

const generateReport = () => {
    const reportType = document.getElementById('report-type').value;
    const outputDiv = document.getElementById('report-output');
    
    if (!outputDiv) return;

    const invoices = typeof getInvoices === 'function' ? getInvoices() : [];
    const appointments = typeof getAppointments === 'function' ? getAppointments() : [];
    const vets = typeof veterinarians !== 'undefined' ? veterinarians : [];

    let html = '';

    if (reportType === 'summary') {
        // Reporte de Ingresos Totales
        const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
        const totalTax = invoices.reduce((sum, inv) => sum + parseFloat(inv.taxTotal || 0), 0);
        const totalInvoices = invoices.length;

        html = `
            <h3><i class="fas fa-money-bill-wave"></i> Resumen de Ingresos Históricos</h3>
            <p><strong>Número Total de Facturas:</strong> ${totalInvoices}</p>
            <p style="font-size: 1.2em; color: var(--arya-secondary);">
                <strong>Ventas Netas:</strong> $${(totalRevenue - totalTax).toFixed(2)}
            </p>
            <p style="font-size: 1.5em; color: var(--arya-primary); font-weight: 700;">
                <strong>Total Recaudado (con impuestos):</strong> $${totalRevenue.toFixed(2)}
            </p>
            <p><strong>Total Impuestos Recaudados:</strong> $${totalTax.toFixed(2)}</p>
        `;
    } else if (reportType === 'appointments') {
        // Reporte de Citas por Veterinario
        const vetCounts = appointments.reduce((counts, cita) => {
            const vet = cita.veterinarian || cita.veterinario || 'Sin asignar';
            counts[vet] = (counts[vet] || 0) + 1;
            return counts;
        }, {});

        let vetList = '<ul>';
        
        if (vets.length > 0) {
            vets.forEach(vet => {
                const vetName = typeof vet === 'string' ? vet : vet.nombre;
                const count = vetCounts[vetName] || 0;
                vetList += `<li><strong>${vetName}:</strong> ${count} citas agendadas.</li>`;
            });
        } else {
            Object.keys(vetCounts).forEach(vet => {
                vetList += `<li><strong>${vet}:</strong> ${vetCounts[vet]} citas agendadas.</li>`;
            });
        }
        
        vetList += '</ul>';

        html = `
            <h3><i class="fas fa-calendar-check"></i> Citas Agendadas por Profesional</h3>
            <p><strong>Total de Citas en el Sistema:</strong> ${appointments.length}</p>
            ${vetList}
        `;
    }

    outputDiv.innerHTML = html;
};