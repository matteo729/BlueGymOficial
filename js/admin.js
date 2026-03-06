// admin.js - Scripts específicos para el panel de administración - Blue Gym

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si es admin
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (!isAdmin) {
        const password = prompt('Ingresa la contraseña de administrador:');
        if (password !== 'bluegym2024') {
            alert('Acceso no autorizado');
            window.location.href = 'index.html';
        } else {
            sessionStorage.setItem('isAdmin', 'true');
        }
    }
    
    setupAdminForm();
    loadAdminProducts();
});

function setupAdminForm() {
    const form = document.getElementById('product-form');
    const imageInput = document.getElementById('product-image');
    const imagePreview = document.getElementById('image-preview');
    const fileName = document.getElementById('file-name');

    if (!form) return;

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showNotification('Por favor, selecciona una imagen válida', 'error');
                this.value = '';
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showNotification('La imagen no debe superar los 5MB', 'error');
                this.value = '';
                return;
            }
            
            if (fileName) fileName.textContent = file.name;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nombre = document.getElementById('product-name')?.value.trim();
        const descripcion = document.getElementById('product-description')?.value.trim();
        const precio = parseFloat(document.getElementById('product-price')?.value);
        const imagenFile = document.getElementById('product-image')?.files[0];

        if (!nombre || !descripcion || !precio || !imagenFile) {
            showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        if (precio <= 0) {
            showNotification('El precio debe ser mayor a 0', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        try {
            // Primero verificar si el bucket existe, si no, usar URLs de placeholder
            let imagenUrl = '';
            
            try {
                const fileName = `${Date.now()}_${imagenFile.name}`;
                const { error: imageError } = await supabase.storage
                    .from('productos')
                    .upload(fileName, imagenFile);

                if (imageError) {
                    console.log('Error subiendo imagen, usando placeholder:', imageError);
                    // Usar una imagen de placeholder
                    imagenUrl = 'https://images.unsplash.com/photo-1546483875-901b9d1f3f8b?w=500';
                } else {
                    const { data: publicUrl } = supabase.storage
                        .from('productos')
                        .getPublicUrl(fileName);
                    imagenUrl = publicUrl.publicUrl;
                }
            } catch (storageError) {
                console.log('Storage no disponible, usando placeholder');
                imagenUrl = 'https://images.unsplash.com/photo-1546483875-901b9d1f3f8b?w=500';
            }

            const { error } = await supabase
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

            showNotification('Producto guardado exitosamente', 'success');
            form.reset();
            imagePreview.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><p>Vista previa de la imagen</p>';
            if (fileName) fileName.textContent = 'Ningún archivo seleccionado';
            
            loadAdminProducts();

        } catch (error) {
            console.error('Error guardando producto:', error);
            showNotification('Error al guardar el producto: ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function loadAdminProducts() {
    const container = document.getElementById('admin-products-list');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Cargando productos...
        </div>
    `;
    
    try {
        const { data: productos, error } = await supabase
            .from('productos')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!productos || productos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>No hay productos agregados aún</p>
                </div>
            `;
            return;
        }

        container.innerHTML = productos.map(producto => `
            <div class="admin-product-item" data-id="${producto.id}">
                <img src="${producto.imagen_url}" alt="${producto.nombre}" class="admin-product-image">
                <div class="admin-product-info">
                    <h4>${producto.nombre}</h4>
                    <p>${producto.descripcion.substring(0, 50)}${producto.descripcion.length > 50 ? '...' : ''}</p>
                    <span class="admin-product-price">${formatPrice(producto.precio)}</span>
                </div>
                <div class="admin-product-actions">
                    <button class="btn-icon" onclick="deleteProduct(${producto.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error cargando productos:', error);
        container.innerHTML = `
            <div class="empty-state error">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar los productos</p>
                <small>${error.message}</small>
                <br><br>
                <button onclick="loadAdminProducts()" class="btn" style="margin-top: 1rem;">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            </div>
        `;
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;

    try {
        const { data: producto, error: getError } = await supabase
            .from('productos')
            .select('imagen_url')
            .eq('id', id)
            .single();

        if (getError) throw getError;

        const { error: deleteError } = await supabase
            .from('productos')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        showNotification('Producto eliminado exitosamente', 'success');
        loadAdminProducts();

    } catch (error) {
        console.error('Error eliminando producto:', error);
        showNotification('Error al eliminar el producto', 'error');
    }
}
