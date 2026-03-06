// tienda.js - Scripts específicos para la tienda - Blue Gym

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Tienda.js cargado correctamente');
    
    // Verificar que el cliente de Supabase existe
    if (typeof supabaseClient === 'undefined') {
        console.error('❌ Error: supabaseClient no está definido');
        mostrarError('Error de conexión con la base de datos');
        return;
    }
    
    // Cargar productos
    loadProducts();
    
    // Configurar filtros
    setupFilters();
    
    // Suscribirse a cambios en tiempo real
    subscribeToChanges();
});

// ===== FUNCIÓN PARA CARGAR PRODUCTOS =====
async function loadProducts() {
    const container = document.getElementById('products-container');
    
    if (!container) {
        console.error('❌ No se encontró el contenedor de productos');
        return;
    }
    
    // Mostrar loading
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Cargando productos...
        </div>
    `;
    
    try {
        console.log('🔄 Cargando productos desde Supabase...');
        
        const { data: productos, error } = await supabaseClient
            .from('productos')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('❌ Error de Supabase:', error);
            throw error;
        }

        console.log('✅ Productos cargados:', productos);
        displayProducts(productos);
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        mostrarError(error.message || 'Error al cargar los productos');
    }
}

// ===== FUNCIÓN PARA MOSTRAR PRODUCTOS =====
function displayProducts(productos) {
    const container = document.getElementById('products-container');
    
    if (!productos || productos.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open" style="font-size: 4rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                <p>No hay productos disponibles en este momento</p>
                <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 0.5rem;">
                    Agrega productos desde el panel de administración
                </p>
                <button onclick="loadProducts()" class="btn" style="margin-top: 1.5rem;">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            </div>
        `;
        return;
    }

    // Construir el HTML de los productos
    let productsHTML = '<div class="products-grid">';
    
    productos.forEach(producto => {
        const categoria = getProductCategory(producto.nombre);
        const descripcionCorta = producto.descripcion.length > 60 
            ? producto.descripcion.substring(0, 60) + '...' 
            : producto.descripcion;
        
        productsHTML += `
            <div class="product-card" data-id="${producto.id}" data-category="${categoria.toLowerCase()}">
                <span class="product-badge">${categoria}</span>
                <div class="product-image-container">
                    <img src="${producto.imagen_url}" alt="${producto.nombre}" class="product-image" loading="lazy">
                    <div class="product-overlay"></div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${producto.nombre}</h3>
                    <p class="product-description">${descripcionCorta}</p>
                    <div class="product-footer">
                        <span class="product-price">${formatPrice(producto.precio)}</span>
                        <button class="btn-add" onclick="agregarAlCarrito(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio}, '${producto.imagen_url}')">
                            <i class="fas fa-cart-plus"></i>
                            Agregar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    productsHTML += '</div>';
    container.innerHTML = productsHTML;
}

// ===== FUNCIÓN PARA AGREGAR AL CARRITO =====
function agregarAlCarrito(id, nombre, precio, imagen) {
    if (typeof carrito !== 'undefined' && carrito) {
        carrito.agregarItem({
            id: id,
            nombre: nombre,
            precio: precio,
            imagen_url: imagen
        });
    } else {
        console.error('❌ Carrito no disponible');
        alert('Error: Carrito no disponible');
    }
}

// ===== FUNCIÓN PARA OBTENER CATEGORÍA DEL PRODUCTO =====
function getProductCategory(nombre) {
    const nombreLower = nombre.toLowerCase();
    
    if (nombreLower.includes('proteína') || nombreLower.includes('whey')) {
        return 'Nutrición';
    } else if (nombreLower.includes('guante')) {
        return 'Accesorios';
    } else if (nombreLower.includes('botella')) {
        return 'Accesorios';
    } else if (nombreLower.includes('shaker')) {
        return 'Accesorios';
    } else if (nombreLower.includes('banda')) {
        return 'Equipamiento';
    } else if (nombreLower.includes('batidora')) {
        return 'Electrónica';
    } else {
        return 'Otros';
    }
}

// ===== FUNCIÓN PARA CONFIGURAR FILTROS =====
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (!filterButtons.length) {
        console.log('No hay botones de filtro');
        return;
    }
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Quitar clase active de todos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase active al clickeado
            this.classList.add('active');
            
            // Obtener filtro
            const filter = this.dataset.filter;
            
            // Filtrar productos
            filterProducts(filter);
        });
    });
}

// ===== FUNCIÓN PARA FILTRAR PRODUCTOS =====
function filterProducts(filter) {
    const products = document.querySelectorAll('.product-card');
    
    if (!products.length) return;
    
    products.forEach(product => {
        if (filter === 'todos') {
            product.style.display = 'block';
        } else {
            const category = product.dataset.category;
            if (category === filter) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        }
    });
}

// ===== FUNCIÓN PARA SUSCRIBIRSE A CAMBIOS =====
function subscribeToChanges() {
    try {
        supabaseClient
            .channel('productos_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'productos' 
                }, 
                (payload) => {
                    console.log('🔄 Cambio detectado en productos:', payload);
                    loadProducts();
                    if (typeof showNotification === 'function') {
                        showNotification('La tienda se ha actualizado', 'success');
                    }
                }
            )
            .subscribe();
            
        console.log('✅ Suscripción a cambios activada');
    } catch (error) {
        console.log('⚠️ No se pudo activar la suscripción en tiempo real:', error);
    }
}

// ===== FUNCIÓN PARA MOSTRAR ERROR =====
function mostrarError(mensaje) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
            <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">Error al cargar los productos</p>
            <p style="color: #64748b; margin-bottom: 1.5rem;">${mensaje}</p>
            <button onclick="loadProducts()" class="btn">
                <i class="fas fa-sync"></i> Reintentar
            </button>
            <br><br>
            <p style="font-size: 0.85rem; color: #94a3b8;">
                Verifica que la tabla "productos" exista en Supabase
            </p>
        </div>
    `;
}

// ===== FUNCIÓN PARA FORMATEAR PRECIO =====
function formatPrice(price) {
    return '€' + parseFloat(price).toFixed(2);
}
