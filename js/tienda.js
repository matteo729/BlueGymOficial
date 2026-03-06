// tienda.js - Scripts específicos para la tienda - Blue Gym

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupFilters();
    
    // Suscribirse a cambios en la base de datos
    subscribeToChanges();
});

async function loadProducts() {
    const container = document.getElementById('products-container');
    
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
            .order('id', { ascending: true });

        if (error) throw error;

        displayProducts(productos);
    } catch (error) {
        console.error('Error cargando productos:', error);
        container.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-circle"></i>
                Error al cargar los productos. Por favor, intenta más tarde.
            </div>
        `;
    }
}

function displayProducts(productos) {
    const container = document.getElementById('products-container');
    
    if (!productos || productos.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>No hay productos disponibles en este momento.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="products-grid">
            ${productos.map(producto => `
                <div class="product-card" data-id="${producto.id}" data-category="${getProductCategory(producto.nombre)}">
                    <span class="product-badge">Nuevo</span>
                    <div class="product-image-container">
                        <img src="${producto.imagen_url}" alt="${producto.nombre}" class="product-image" loading="lazy">
                        <div class="product-overlay"></div>
                    </div>
                    <div class="product-info">
                        <span class="product-category">${getProductCategory(producto.nombre)}</span>
                        <h3 class="product-title">${producto.nombre}</h3>
                        <p class="product-description">${producto.descripcion.substring(0, 60)}...</p>
                        <div class="product-footer">
                            <span class="product-price">${formatPrice(producto.precio)}</span>
                            <button class="btn-add" onclick="agregarAlCarrito(${producto.id}, '${producto.nombre}', ${producto.precio}, '${producto.imagen_url}')">
                                <i class="fas fa-cart-plus"></i>
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function agregarAlCarrito(id, nombre, precio, imagen) {
    carrito.agregarItem({
        id: id,
        nombre: nombre,
        precio: precio,
        imagen_url: imagen
    });
}

function getProductCategory(name) {
    const categories = {
        'proteína': 'Nutrición',
        'whey': 'Nutrición',
        'guantes': 'Accesorios',
        'botella': 'Accesorios',
        'shaker': 'Accesorios',
        'banda': 'Equipamiento',
        'batidora': 'Electrónica'
    };
    
    const lowerName = name.toLowerCase();
    for (const [key, value] of Object.entries(categories)) {
        if (lowerName.includes(key)) return value;
    }
    return 'Otros';
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            filterProducts(filter);
        });
    });
}

function filterProducts(filter) {
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        if (filter === 'todos') {
            product.style.display = 'block';
        } else {
            const category = product.dataset.category?.toLowerCase();
            if (category === filter) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        }
    });
}

// ===== SUSCRIPCIÓN EN TIEMPO REAL =====
function subscribeToChanges() {
    const subscription = supabase
        .channel('productos_changes')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'productos' 
            }, 
            (payload) => {
                console.log('Cambio detectado:', payload);
                // Recargar productos cuando hay cambios
                loadProducts();
                showNotification('La tienda se ha actualizado', 'success');
            }
        )
        .subscribe();
}