/* --- inventario.js: Lógica del Módulo de Gestión de Inventario (CRUD) --- */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar datos iniciales
    cargarCategoriasSelect();
    cargarTablaInventario();
    
    // 2. Manejador del formulario 
    document.getElementById('product-form').addEventListener('submit', guardarProducto);
    
    // 3. Manejador del botón Limpiar (ya definido en el HTML, pero aseguramos la función)
    // document.getElementById('limpiar-form').addEventListener('click', resetFormUI); 
});

/**
 * Carga las categorías en el select del formulario.
 */
function cargarCategoriasSelect() {
    const select = document.getElementById('category');
    select.innerHTML = '<option value="" disabled selected>Seleccione Categoría</option>';
    
    const categorias = getCategorias();

    if (categorias && categorias.length > 0) {
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    } else {
        select.innerHTML = '<option value="" disabled>Error al cargar categorías.</option>';
    }
}

/**
 * Muestra el inventario completo en la tabla "Existencias en Bodega".
 */
function cargarTablaInventario() {
    // ID ajustado a tu HTML: <div id="inventory-list">
    const container = document.getElementById('inventory-list'); 
    const inventario = getInventario();

    if (!inventario || inventario.length === 0) {
        container.innerHTML = `
            <div style="color: var(--danger-color); font-weight: bold; text-align: center; padding: 20px; border: 1px dashed var(--arya-accent); border-radius: 8px;">
                <i class="fas fa-exclamation-triangle"></i> No hay productos registrados o el inventario está vacío.
            </div>
        `;
        return;
    }

    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Cantidad</th>
                    <th>Precio ($)</th>
                    <th>Proveedor</th>
                    <th>Caducidad</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    inventario.forEach(producto => {
        const lowStockStyle = producto.cantidad < 20 ? 'style="font-weight: bold; color: var(--danger-color);"' : '';

        tableHTML += `
            <tr>
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td ${lowStockStyle}>${producto.cantidad}</td>
                <td>${producto.precio.toFixed(2)}</td>
                <td>${producto.proveedor}</td>
                <td>${producto.caducidad}</td>
                <td>
                    <button class="button small primary" onclick="editarProducto('${producto.id}')" title="Editar Producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="button small danger" onclick="eliminarProducto('${producto.id}')" title="Eliminar Producto">
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
}

// --- FUNCIONES CRUD ---

/**
 * Crea un nuevo producto o actualiza uno existente.
 */
async function guardarProducto(event) {
    event.preventDefault();

    const form = event.target;
    const productoId = document.getElementById('product-id').value;
    const inventario = getInventario();

    const cantidadValue = document.getElementById('quantity').value;
    const precioValue = document.getElementById('price').value;
    
    if (isNaN(cantidadValue) || isNaN(precioValue) || cantidadValue === "" || precioValue === "") {
        await showSystemModal('Error de Validación', 'La Cantidad y el Precio son campos obligatorios y deben ser numéricos.', false, 'var(--danger-color)');
        return;
    }
    
    const productoData = {
        nombre: document.getElementById('name').value.trim(),
        categoria: document.getElementById('category').value,
        cantidad: parseInt(cantidadValue),
        precio: parseFloat(precioValue),
        proveedor: document.getElementById('supplier').value.trim(),
        caducidad: '', // Asumo que no tienes campo de caducidad, pero lo inicializo
    };

    // Si tu HTML tiene un campo de caducidad:
    const expirationField = document.getElementById('expiration');
    if (expirationField) {
        productoData.caducidad = expirationField.value.trim() || 'N/A';
    } else {
         productoData.caducidad = 'N/A';
    }
    
    let mensaje = '';

    if (productoId) {
        // ACTUALIZACIÓN
        const index = inventario.findIndex(p => p.id === productoId);
        if (index !== -1) {
            inventario[index] = { ...inventario[index], ...productoData, id: productoId }; 
            mensaje = `Producto ID ${productoId} (${productoData.nombre}) actualizado exitosamente.`;
        }
    } else {
        // CREACIÓN
        const newId = 'P' + generateId().substring(0, 6).toUpperCase(); 
        const nuevoProducto = {
            id: newId,
            ...productoData
        };
        inventario.push(nuevoProducto);
        mensaje = `Nuevo producto (${nuevoProducto.nombre}) registrado con ID ${newId}.`;
    }

    saveInventario(inventario); 
    form.reset();
    resetFormUI();
    cargarTablaInventario();
    await showSystemModal('Éxito', mensaje, false, 'var(--arya-secondary)');
}

/**
 * Carga los datos de un producto en el formulario para su edición.
 */
function editarProducto(id) {
    const inventario = getInventario();
    const producto = inventario.find(p => p.id === id);

    if (producto) {
        document.getElementById('product-id').value = producto.id;
        document.getElementById('name').value = producto.nombre;
        document.getElementById('category').value = producto.categoria;
        document.getElementById('quantity').value = producto.cantidad; 
        document.getElementById('price').value = producto.precio;
        document.getElementById('supplier').value = producto.proveedor;
        
        // Manejo del campo de caducidad si existe
        const expirationField = document.getElementById('expiration');
        if (expirationField) {
            expirationField.value = producto.caducidad === 'N/A' ? '' : producto.caducidad;
        }
        
        document.querySelector('.form-container-card h2').innerHTML = 
            `<i class="fas fa-box-open"></i> Editando: ${producto.nombre}`;
    }
}

/**
 * Elimina un producto del inventario. (Lógica revisada)
 */
async function eliminarProducto(id) {
    // 1. Obtener datos antes de la confirmación
    const inventarioActual = getInventario();
    const producto = inventarioActual.find(p => p.id === id);
    const nombreProducto = producto?.nombre || 'Producto Desconocido';
    
    // 2. Confirmación asíncrona (DEPENDEMOS DE QUE showSystemModal devuelva true/false)
    const confirmation = await showSystemModal('Confirmación', 
        `¿Está seguro de eliminar ${nombreProducto} (ID ${id}) permanentemente? Esta acción es irreversible.`, 
        true, 'var(--danger-color)');

    if (!confirmation) {
        return;
    }

    // 3. Filtrar y guardar (Lógica CRÍTICA)
    const nuevoInventario = inventarioActual.filter(p => p.id !== id);
    saveInventario(nuevoInventario); // Guardar el nuevo array sin el producto

    // 4. Verificar si la eliminación fue efectiva
    if (getInventario().length === inventarioActual.length) {
        // Si las longitudes son iguales, la eliminación falló.
         await showSystemModal('Error', `No se pudo eliminar el producto ${nombreProducto}. Verifique la consistencia de los datos.`, false, 'var(--danger-color)');
         return;
    }

    // 5. Notificar y actualizar UI
    await showSystemModal('Eliminado', `${nombreProducto} ha sido eliminado del inventario.`, false, 'var(--danger-color)');
    cargarTablaInventario();
    resetFormUI();
}

/**
 * Reinicia el formulario y el título a su estado inicial.
 */
function resetFormUI() {
    document.getElementById('product-id').value = '';
    document.querySelector('.form-container-card h2').innerHTML = 
        '<i class="fas fa-box-open"></i> Producto Nuevo / Editar';
    document.getElementById('product-form').reset();
}