/* --- facturar.js: Lógica del Módulo Generar Facturas (CRUD) --- */

// Las variables 'catalog', 'getInvoices', 'saveInvoices', 'getOwners', 
// 'generateId', 'getAppointments', y 'showSystemModal' 
// se asumen definidas y accesibles desde data.js.

// Contador global para gestionar las filas de ítems dinámicas
let itemRowCount = 0;

// =================================================================
// 1. INICIALIZACIÓN Y CONFIGURACIÓN DE UI
// =================================================================


/**
 * Rellena el selector principal de Cliente/Cita y configura la UI.
 * Versión robusta sin optional chaining para evitar errores TS/JS.
 */
const setupBillingOptions = function() {
    const clientSelect = document.getElementById('client');

    // Fallbacks seguros a las funciones de data.js
    var owners = (typeof getOwners === 'function') ? getOwners() : [{
        id: 'O000',
        name: 'Cliente de Prueba',
        lastname: '',
        phone: 'N/A'
    }];

    var appointments = (typeof getAppointments === 'function') ? getAppointments() : [];

    if (!clientSelect) return;

    var optionsHtml = '<option value="" disabled selected>Seleccione Cliente o Cita</option>';

    // Clientes registrados
    optionsHtml += '<optgroup label="Clientes Registrados">';
    for (var i = 0; i < owners.length; i++) {
        var owner = owners[i] || {};
        var nombre = (owner.name ? owner.name : 'Sin nombre');
        var apellido = (owner.lastname ? ' ' + owner.lastname : '');
        var fullName = (nombre + apellido).trim();
        var telefono = (owner.phone ? owner.phone.trim() : '');
        var label = telefono ? (fullName + ' (' + telefono + ')') : fullName;

        // Valor único: preferimos id, sino username, sino email, sino el nombre
        var valueId = owner.id || owner.username || owner.email || fullName;
        optionsHtml += '<option value="O-' + valueId + '">' + escapeHtml(label) + '</option>';
    }
    optionsHtml += '</optgroup>';

    // Citas pendientes
    optionsHtml += '<optgroup label="Citas Pendientes de Factura">';
    for (var j = 0; j < appointments.length; j++) {
        var a = appointments[j] || {};
        // Aceptar citas que explícitamente estén pendientes o que no tengan estado definido
        if (typeof a.estado === 'undefined' || a.estado === 'Pendiente') {
            var cid = a.id || ('no-id-' + j);
            var mascota = a.pet ? a.pet : 'Mascota desconocida';
            var dueno = a.owner ? a.owner : 'Sin dueño';
            var labelCita = 'Cita ' + cid + ': ' + mascota + ' (' + dueno + ')';
            optionsHtml += '<option value="A-' + cid + '">' + escapeHtml(labelCita) + '</option>';
        }
    }
    optionsHtml += '</optgroup>';

    clientSelect.innerHTML = optionsHtml;
};

/**
 * Pequeña función para escapar texto antes de inyectarlo en innerHTML
 * (evita problemas con caracteres especiales o etiquetas).
 */
function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}



// =================================================================
// 2. MANEJO DINÁMICO DE ÍTEMS Y CÁLCULOS
// =================================================================

/**
 * Añade una nueva fila para seleccionar un producto/servicio.
 */
const addItemRow = () => {
    // ID para el contenedor de ítems en facturar.html
    const container = document.getElementById('items-list');
    if (!container) return;

    const rowId = itemRowCount++;
    const row = document.createElement('div');
    row.className = 'item-row form-grid-2';
    row.id = `item-row-${rowId}`;
    row.style = 'gap: 10px; margin-bottom: 10px; align-items: center;';

    // HTML de la fila, adaptado a la estructura de tu formulario
    row.innerHTML = `
        <select class="custom-select product-select" data-id="${rowId}" required>
            <option value="">Seleccionar Producto/Servicio</option>
            ${catalog.map(item => `<option value="${item.id}">${item.name} ($${item.price.toFixed(2)})</option>`).join('')}
        </select>
        
        <div style="display: flex; gap: 5px; align-items: center;">
            <input type="number" class="quantity-input custom-select" placeholder="Cant." value="1" min="1" required 
                style="width: 70px; text-align: center; height: 40px;"> 
            
            <button type="button" class="button small danger delete-item-btn" onclick="removeItemRow('item-row-${rowId}')" title="Eliminar ítem" style="height: 40px; margin: 0;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(row);
};

/**
 * Elimina una fila de ítem y actualiza el total.
 */
const removeItemRow = (rowId) => {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
        // Forzar recálculo
        updateInvoiceTotals();
    }
    // Si no quedan filas, añade una nueva para que el formulario no quede vacío
    if (document.querySelectorAll('.item-row').length === 0) {
        addItemRow();
    }
};

/**
 * Recalcula y actualiza el campo de "Total a Pagar".
 */
const updateInvoiceTotals = () => {
    const rows = document.querySelectorAll('.item-row');
    let total = 0;

    rows.forEach(row => {
        const select = row.querySelector('.product-select');
        const input = row.querySelector('.quantity-input');

        const productId = select ? select.value : '';
        const quantity = parseInt(input ? input.value : 0) || 0;

        const product = catalog.find(p => p.id === productId);

        if (product && quantity > 0) {
            const itemSubtotal = product.price * quantity;
            const itemTax = itemSubtotal * product.taxRate;
            const itemTotal = itemSubtotal + itemTax;

            total += itemTotal;
        }
    });

    // Actualiza el campo de texto del total
    document.getElementById('total-amount').value = `$ ${total.toFixed(2)}`;
};

// =================================================================
// 3. GENERACIÓN Y PERSISTENCIA DE FACTURA
// =================================================================

/**
 * Procesa la factura, actualiza el inventario y guarda.
 */
const generateInvoice = (clientValue, items) => {
    // Determinar nombre del cliente a partir del valor del select
    const clientName = clientValue.includes('-') ? clientValue.split('-')[1].trim() : clientValue;

    // 1. Asignar numeración consecutiva automática
    let invCounter = parseInt(localStorage.getItem('invoiceCounter')) || 1000;
    const invoiceNumber = invCounter++;
    localStorage.setItem('invoiceCounter', invCounter);

    const now = new Date();
    let totalSubtotal = 0;
    let totalTax = 0;

    const invoiceDetails = items.map(item => {
        const product = catalog.find(p => p.id === item.id);
        if (!product) return null;

        const itemSubtotal = product.price * item.quantity;
        const itemTax = itemSubtotal * product.taxRate;

        totalSubtotal += itemSubtotal;
        totalTax += itemTax;

        // 2. Actualizar inventario (Simulación de la baja de stock)
        if (product.type === 'Product') {
            product.stock = Math.max(0, product.stock - item.quantity);
            // Si el inventario se gestiona con persistencia, se debe guardar la lista 'catalog' aquí.
        }

        return {
            name: product.name,
            quantity: item.quantity,
            price: product.price,
            subtotal: itemSubtotal.toFixed(2),
            tax: itemTax.toFixed(2)
        };
    }).filter(item => item !== null);

    const total = totalSubtotal + totalTax;

    const invoice = {
        number: invoiceNumber,
        date: now.toISOString().split('T')[0],
        client: clientName,
        details: invoiceDetails,
        subtotal: totalSubtotal.toFixed(2),
        taxTotal: totalTax.toFixed(2),
        total: total.toFixed(2),
        status: 'Pagada' // Asumimos pago inmediato
    };

    // 3. Guardar factura en el sistema
    let invoices = getInvoices();
    invoices.push(invoice);
    saveInvoices(invoices);

    return invoice;
};


/**
 * Maneja el envío del formulario de facturación. (Crear)
 */
const handleFormSubmit = async (event) => {
    event.preventDefault();

    const clientValue = document.getElementById('client').value;
    const selectedItems = [];

    // Recolectar ítems seleccionados
    document.querySelectorAll('.item-row').forEach(row => {
        const id = row.querySelector('.product-select').value;
        const quantity = parseInt(row.querySelector('.quantity-input').value) || 0;

        if (id && quantity > 0) {
            selectedItems.push({
                id,
                quantity
            });
        }
    });

    // Alias a showSystemModal para asegurar el uso del modal estilizado
    const systemModal = typeof showSystemModal === 'function' ? showSystemModal : alert;


    if (!clientValue) {
        systemModal('Error de Cliente', "Debe seleccionar un cliente o cita asociada.", false, 'var(--danger-color)');
        return;
    }

    if (selectedItems.length === 0) {
        systemModal('Error de Ítems', "Debe seleccionar al menos un producto o servicio para facturar.", false, 'var(--danger-color)');
        return;
    }

    // Generar y guardar
    const newInvoice = generateInvoice(clientValue, selectedItems);

    // Llamada a showSystemModal con formato bonito
    await systemModal(
        'Factura Emitida',
        `🎉 Factura #${newInvoice.number} generada exitosamente.\nTotal: $${newInvoice.total}\nCliente: ${newInvoice.client}.`,
        false, 
        'var(--arya-secondary)' // Color verde de éxito
    );

    // Limpiar y actualizar interfaz
    document.getElementById('billing-form').reset();
    document.getElementById('items-list').innerHTML = '';
    itemRowCount = 0;
    addItemRow(); // Añadir fila inicial (y poblar opciones)
    renderInvoiceHistory();
    updateInvoiceTotals(); // Recalcular (debe dar $0.00)
};


// =================================================================
// 4. LECTURA (HISTORIAL)
// =================================================================

/**
 * Muestra el modal de detalles de la factura.
 */
const showInvoiceDetails = (invoiceNumber) => {
    const invoices = getInvoices();
    const invoice = invoices.find(inv => inv.number === invoiceNumber);

    // Alias a showSystemModal para asegurar el uso del modal estilizado
    const systemModal = typeof showSystemModal === 'function' ? showSystemModal : alert;
    
    if (invoice) {
        let detailsMessage = `
            Cliente: ${invoice.client}
            Fecha: ${invoice.date}
            Estado: ${invoice.status}
            -------------------------------------
            Items:
        `;

        invoice.details.forEach(item => {
            detailsMessage += `\n- ${item.name} x${item.quantity} ($${item.subtotal})`;
        });

        detailsMessage += `
            -------------------------------------
            Subtotal: $${invoice.subtotal}
            Impuestos: $${invoice.taxTotal}
            TOTAL: $${invoice.total}
        `;

        systemModal(
            `Detalle Factura #${invoice.number}`,
            detailsMessage,
            false,
            'var(--arya-blue)' // Color azul para información/detalles
        );
    } else {
        systemModal('Error', `Factura #${invoiceNumber} no encontrada.`, false, 'var(--danger-color)');
    }
};

/**
 * Muestra el modal de simulación de reimpresión.
 */
const simulatePrintInvoice = (invoiceNumber) => {
    // Alias a showSystemModal para asegurar el uso del modal estilizado
    const systemModal = typeof showSystemModal === 'function' ? showSystemModal : alert;
    
    systemModal(
        `Reimprimir Factura #${invoiceNumber}`,
        `Se ha enviado la Factura #${invoiceNumber} a la impresora virtual.`,
        false,
        'var(--arya-accent)' // Color amarillo para acción de impresión
    );
};


/**
 * Renderiza la tabla con el historial de facturas generadas.
 */
const renderInvoiceHistory = () => {
    const invoicesListDiv = document.getElementById('invoices-list');
    const invoices = getInvoices();

    if (invoices.length === 0) {
        invoicesListDiv.innerHTML = '<p style="text-align: center; color: var(--arya-accent); padding: 20px;">No hay facturas generadas en el historial.</p>';
        return;
    }

    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th># FACTURA</th>
                    <th>CLIENTE</th>
                    <th>FECHA</th>
                    <th>TOTAL</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Ordenar por número de factura descendente
    invoices.sort((a, b) => b.number - a.number).forEach(inv => {
        const estadoClase = inv.status === 'Pagada' ? 'estado-completada' : 'estado-pendiente';

        // 💡 CORRECCIÓN: Reemplazo de alert() por funciones que usan showSystemModal
        tableHTML += `
            <tr>
                <td><strong>#${inv.number}</strong></td>
                <td>${inv.client}</td>
                <td>${inv.date}</td>
                <td>$${inv.total}</td>
                <td class="${estadoClase}">${inv.status}</td>
                <td>
                    <div class="action-group">
                        <button class="icon-button view" onclick="showInvoiceDetails(${inv.number})" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                        <button class="icon-button edit" onclick="simulatePrintInvoice(${inv.number})" title="Reimprimir"><i class="fas fa-print"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    invoicesListDiv.innerHTML = tableHTML;
};


// =================================================================
// 5. INICIALIZACIÓN
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Configurar los selectores y la primera fila
    setupBillingOptions();
    addItemRow(); // Inicializa la primera fila de ítems (crea la fila Y sus opciones)

    // 2. Cargar el historial
    renderInvoiceHistory();
    updateInvoiceTotals(); // Inicializa el total a $0.00

    // 3. Event Listeners

    // Botón "Añadir Item" (Se asume ID="add-item-btn" en facturar.html)
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItemRow);
    }

    // Formulario de Envío
    document.getElementById('billing-form').addEventListener('submit', handleFormSubmit);

    // Delegación de eventos para recalcular totales al cambiar cualquier selector o cantidad
    document.getElementById('items-list').addEventListener('change', updateInvoiceTotals);
    document.getElementById('items-list').addEventListener('input', updateInvoiceTotals);

    // Event Listener para el botón "Cancelar" (Limpia y resetea el formulario)
    const cancelButton = document.querySelector('.button.danger');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            document.getElementById('billing-form').reset();
            document.getElementById('items-list').innerHTML = '';
            itemRowCount = 0;
            addItemRow();
            updateInvoiceTotals();
        });
    }
});
