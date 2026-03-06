// admin.js - Scripts específicos para el panel de administración - Blue Gym

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin.js cargado correctamente');
    
    // Verificar autenticación de admin
    verificarAdmin();
    
    // Verificar que el cliente de Supabase existe
    if (typeof supabaseClient === 'undefined') {
        console.error('❌ Error: supabaseClient no está definido');
        mostrarMensaje('Error de conexión con la base de datos', 'error');
        return;
    }
    
    // Configurar formulario
    setupAdminForm();
    
    // Cargar productos existentes
    loadAdminProducts();
});

// ===== FUNCIÓN PARA VERIFICAR ADMIN =====
function verificarAdmin() {
    const isAdmin = sessionStorage.getItem('isAdmin');
    
    if (!isAdmin) {
        const password = prompt('🔐 Ingresa la contraseña de administrador:');
        
        if (password === 'bluegym2024') {
            sessionStorage.setItem('isAdmin', 'true');
            console.log('✅ Acceso de admin concedido');
        } else {
            alert('❌ Contraseña incorrecta. Acceso denegado.');
            window.location.href = 'index.html';
        }
    }
}

// ===== FUNCIÓN PARA CONFIGURAR FORMULARIO =====
function setupAdminForm() {
    const form = document.getElementById('product-form');
    const imageInput = document.getElementById('product-image');
    const imagePreview = document.getElementById('image-preview');
    const fileName = document.getElementById('file-name');

    if (!form) {
        console.error('❌ No se encontró el formulario');
        return;
    }

    // Preview de imagen al seleccionar archivo
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validar tipo de archivo
                if (!file.type.startsWith('image/')) {
                    mostrarMensaje('Por favor, selecciona una imagen válida', 'error');
                    this.value = '';
                    return;
                }
                
                // Validar tamaño (máx 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    mostrarMensaje('La imagen no debe superar los 5MB', 'error');
                    this.value = '';
                    return;
                }
                
                // Mostrar nombre del archivo
                if (fileName) {
                    fileName.textContent = file.name;
                }
                
                // Mostrar preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (imagePreview) {
                        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Enviar formulario
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Obtener valores
        const nombre = document.getElementById('product-name')?.value.trim();
        const descripcion = document.getElementById('product-description')?.value.trim();
        const precio = parseFloat(document.getElementById('product-price')?.value);
        const imagenFile = document.getElementById('product-image')?.files[0];

        // Validaciones
        if (!nombre || !descripcion || !precio || !imagenFile) {
            mostrarMensaje('Por favor completa todos los campos', 'error');
            return;
        }

        if (precio <= 0) {
            mostrarMensaje('El precio debe ser mayor a 0', 'error');
            return;
        }

        // Deshabilitar botón mientras se procesa
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        try {
            console.log('🔄 Subiendo imagen...');
            
            // Generar nombre único para la imagen
            const fileName = `${Date.now()}_${imagenFile.name}`;
            
            // Intentar subir imagen a Supabase Storage
            let imagenUrl = '';
            
            try {
                const { data: imageData, error: imageError } = await supabaseClient.storage
                    .from('productos')
                    .upload(fileName, imagenFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (imageError) {
                    console.log('⚠️ Error al subir imagen, usando placeholder:', imageError);
                    // Usar imagen de placeholder si falla el storage
                    imagenUrl = 'https://images.unsplash.com/photo-1546483875-901b9d1f3f8b?w=500';
                } else {
                    // Obtener URL pública
                    const { data: publicUrl } = supabaseClient.storage
                        .from('productos')
                        .getPublicUrl(fileName);
                    
                    imagenUrl = publicUrl.publicUrl;
                    console.log('✅ Imagen subida:', imagenUrl);
                }
            } catch (storageError) {
                console.log('⚠️ Storage no disponible, usando placeholder');
                imagenUrl = 'https://images.unsplash.com/photo-1546483875-901b9d1f3f8b?w=500';
            }

            // Guardar producto en la base de datos
            console.log('🔄 Guardando producto en la base de datos...');
            
            const { error } = await supabaseClient
                .from('productos')
                .insert([
                    {
                        nombre: nombre,
                        descripcion: descripcion,
                        precio: precio,
                        imagen_url: imagenUrl
                    }
                ]);

            if (error) throw error;

            console.log('✅ Producto guardado exitosamente');
            mostrarMensaje('Producto guardado exitosamente', 'success');
            
            // Resetear formulario
            form.reset();
            if (imagePreview) {
                imagePreview.innerHTML = '<i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #94a3b8;"></i><p>Vista previa de la imagen</p>';
            }
            if (fileName) {
                fileName.textContent = 'Ningún archivo seleccionado';
            }
            
            // Recargar lista de productos
            loadAdminProducts();

        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            mostrarMensaje('Error al guardar el producto: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ===== FUNCIÓN PARA CARGAR PRODUCTOS EN ADMIN =====
async function loadAdminProducts() {
    const container = document.getElementById('admin-products-list');
    
    if (!container) return;
    
    // Mostrar loading
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Cargando productos...
        </div>
    `;
    
    try {
        console.log('🔄 Cargando productos para admin...');
        
        const { data: productos, error } = await supabaseClient
            .from('productos')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!productos || productos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: #cbd5e1;"></i>
                    <p>No hay productos agregados aún</p>
                    <p style="font-size: 0.9rem; color: #94a3b8;">Usa el formulario para agregar tu primer producto</p>
                </div>
            `;
            return;
        }

        // Mostrar productos
        let productosHTML = '';
        
        productos.forEach(producto => {
            productosHTML += `
                <div class="admin-product-item" data-id="${producto.id}">
                    <img src="${producto.imagen_url}" alt="${producto.nombre}" class="admin-product-image">
                    <div class="admin-product-info">
                        <h4>${producto.nombre}</h4>
                        <p>${producto.descripcion.substring(0, 50)}${producto.descripcion.length > 50 ? '...' : ''}</p>
                        <span class="admin-product-price">${formatPrice(producto.precio)}</span>
                    </div>
                    <div class="admin-product-actions">
                        <button class="btn-icon" onclick="deleteProduct(${producto.id})" title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = productosHTML;

    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        container.innerHTML = `
            <div class="empty-state error">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444;"></i>
                <p>Error al cargar los productos</p>
                <p style="font-size: 0.85rem; color: #64748b;">${error.message}</p>
                <button onclick="loadAdminProducts()" class="btn" style="margin-top: 1rem;">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// ===== FUNCIÓN PARA ELIMINAR PRODUCTO =====
async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        console.log('🔄 Eliminando producto:', id);
        
        // Eliminar de la base de datos
        const { error } = await supabaseClient
            .from('productos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('✅ Producto eliminado');
        mostrarMensaje('Producto eliminado exitosamente', 'success');
        
        // Recargar lista
        loadAdminProducts();

    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        mostrarMensaje('Error al eliminar el producto', 'error');
    }
}

// ===== FUNCIÓN PARA MOSTRAR MENSAJES =====
function mostrarMensaje(mensaje, tipo = 'success') {
    // Usar alert por simplicidad, pero puedes implementar notificaciones más bonitas
    if (tipo === 'success') {
        alert('✅ ' + mensaje);
    } else {
        alert('❌ ' + mensaje);
    }
}

// ===== FUNCIÓN PARA FORMATEAR PRECIO =====
function formatPrice(price) {
    return '€' + parseFloat(price).toFixed(2);
}
