// ===== CONFIGURACIÓN DE SUPABASE =====
const SUPABASE_URL = 'https://vyhqyrbqequyxjtwcint.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aHF5cmJxZXF1eXhqdHdjaW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDczODEsImV4cCI6MjA4ODM4MzM4MX0.6nbzM7dPU7t5nosWTGj58Ycb5zTLUric3ApSThethK0';

// Configuración de WhatsApp
const OWNER_PHONE = '521234567890';

// Verificar que Supabase está cargado
console.log('🔄 Verificando Supabase...', typeof supabase);

// Inicializar cliente de Supabase
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Cliente Supabase inicializado');
    window.supabaseClient = supabaseClient;
} catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
}

// ===== CLASE CARRITO =====
class Carrito {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.total = 0;
        this.calcularTotal();
        console.log('🛒 Carrito inicializado con', this.items.length, 'productos');
    }

    agregarItem(producto) {
        const existente = this.items.find(item => item.id === producto.id);
        
        if (existente) {
            existente.cantidad += 1;
            console.log(`✅ Cantidad actualizada: ${producto.nombre} ahora tiene ${existente.cantidad}`);
        } else {
            this.items.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                imagen: producto.imagen_url
            });
            console.log(`✅ Producto agregado: ${producto.nombre}`);
        }
        
        this.calcularTotal();
        this.guardar();
        this.actualizarUI();
        this.mostrarNotificacion(`${producto.nombre} agregado al carrito`, 'success');
    }

    eliminarItem(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            console.log(`🗑️ Eliminando: ${item.nombre}`);
            this.items = this.items.filter(item => item.id !== id);
            this.calcularTotal();
            this.guardar();
            this.actualizarUI();
            this.mostrarNotificacion('Producto eliminado del carrito', 'success');
        }
    }

    actualizarCantidad(id, nuevaCantidad) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            if (nuevaCantidad <= 0) {
                this.eliminarItem(id);
            } else {
                item.cantidad = nuevaCantidad;
                this.calcularTotal();
                this.guardar();
                this.actualizarUI();
            }
        }
    }

    calcularTotal() {
        this.total = this.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    }

    guardar() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    vaciar() {
        if (this.items.length > 0) {
            this.items = [];
            this.total = 0;
            this.guardar();
            this.actualizarUI();
            this.mostrarNotificacion('Carrito vaciado', 'success');
        }
    }

    actualizarUI() {
        // Actualizar contador en el ícono del carrito
        const cartCounts = document.querySelectorAll('.cart-count');
        const totalItems = this.items.reduce((sum, item) => sum + item.cantidad, 0);
        
        cartCounts.forEach(cartCount => {
            if (cartCount) {
                cartCount.textContent = totalItems;
                cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
            }
        });

        // Actualizar modal del carrito si está abierto
        this.actualizarModalCarrito();
    }

    actualizarModalCarrito() {
        const modal = document.getElementById('cart-modal');
        if (!modal || modal.style.display !== 'flex') return;

        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');

        if (!cartItems || !cartTotal) return;

        if (this.items.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart" style="font-size: 4rem; color: #cbd5e1;"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
            cartTotal.textContent = this.formatPrice(0);
            return;
        }

        let itemsHTML = '';
        this.items.forEach(item => {
            itemsHTML += `
                <div class="cart-item">
                    <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h4>${item.nombre}</h4>
                        <p class="cart-item-price">${this.formatPrice(item.precio)}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button onclick="carrito.actualizarCantidad(${item.id}, ${item.cantidad - 1})" class="quantity-btn">-</button>
                        <span>${item.cantidad}</span>
                        <button onclick="carrito.actualizarCantidad(${item.id}, ${item.cantidad + 1})" class="quantity-btn">+</button>
                    </div>
                    <button onclick="carrito.eliminarItem(${item.id})" class="remove-item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        cartItems.innerHTML = itemsHTML;
        cartTotal.textContent = this.formatPrice(this.total);
    }

    generarMensajeWhatsApp() {
        let mensaje = "🛒 *Nuevo Pedido - Blue Gym*\n\n";
        mensaje += "*Productos:*\n";
        
        this.items.forEach(item => {
            mensaje += `• ${item.nombre} x${item.cantidad} - ${this.formatPrice(item.precio * item.cantidad)}\n`;
        });
        
        mensaje += `\n*Total: ${this.formatPrice(this.total)}*\n\n`;
        mensaje += `¡Gracias por tu compra!`;
        
        return encodeURIComponent(mensaje);
    }

    realizarPedido() {
        if (this.items.length === 0) {
            this.mostrarNotificacion('El carrito está vacío', 'error');
            return;
        }

        const mensaje = this.generarMensajeWhatsApp();
        const url = `https://wa.me/${OWNER_PHONE}?text=${mensaje}`;
        
        window.open(url, '_blank');
        this.mostrarNotificacion('Pedido enviado por WhatsApp', 'success');
    }

    formatPrice(price) {
        return '€' + parseFloat(price).toFixed(2);
    }

    mostrarNotificacion(mensaje, tipo = 'success') {
        // Por ahora usamos console.log y alert
        console.log(`🔔 ${tipo}: ${mensaje}`);
        // alert(mensaje); // Descomenta si quieres alerts
    }
}

// ===== INSTANCIA GLOBAL DEL CARRITO =====
const carrito = new Carrito();
window.carrito = carrito; // Hacer disponible globalmente
console.log('✅ Carrito disponible globalmente');

// ===== FUNCIONES DEL MODAL DE PLANES =====
function mostrarModalPlan(plan) {
    const modal = document.getElementById('plan-modal');
    if (!modal) return;
    
    const planName = document.getElementById('selected-plan');
    const planPrice = document.getElementById('plan-price');
    
    if (planName) planName.textContent = plan.nombre;
    if (planPrice) planPrice.textContent = plan.precio;
    
    modal.style.display = 'flex';
    
    setTimeout(() => {
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) modalContent.style.transform = 'scale(1)';
    }, 10);
}

function cerrarModalPlan() {
    const modal = document.getElementById('plan-modal');
    if (!modal) return;
    
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'scale(0.9)';
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
        const form = document.getElementById('plan-form');
        if (form) form.reset();
    }, 300);
}

function enviarPlanWhatsApp(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre')?.value;
    const apellido = document.getElementById('apellido')?.value;
    const plan = document.getElementById('selected-plan')?.textContent;
    const precio = document.getElementById('plan-price')?.textContent;
    
    if (!nombre || !apellido || !plan || !precio) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    const mensaje = `🏋️ *Nueva Solicitud de Plan - Blue Gym*\n\n` +
                   `*Plan Seleccionado:* ${plan}\n` +
                   `*Precio:* ${precio}\n` +
                   `*Cliente:* ${nombre} ${apellido}\n\n` +
                   `¡Gracias por elegir Blue Gym! Un asesor se comunicará contigo.`;
    
    const url = `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    cerrarModalPlan();
}

// ===== FUNCIONES DEL CARRITO UI =====
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) {
        console.error('❌ No se encontró el modal del carrito');
        return;
    }
    
    modal.style.display = 'flex';
    if (carrito) carrito.actualizarModalCarrito();
    
    setTimeout(() => {
        const cartContent = document.querySelector('.cart-content');
        if (cartContent) cartContent.style.transform = 'translateX(0)';
    }, 10);
}

function cerrarCarrito() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    
    const cartContent = document.querySelector('.cart-content');
    if (cartContent) {
        cartContent.style.transform = 'translateX(100%)';
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Hacer funciones disponibles globalmente
window.toggleCart = toggleCart;
window.cerrarCarrito = cerrarCarrito;
window.mostrarModalPlan = mostrarModalPlan;
window.cerrarModalPlan = cerrarModalPlan;
window.enviarPlanWhatsApp = enviarPlanWhatsApp;

// ===== MENÚ HAMBURGUESA =====
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger?.classList.remove('active');
        });
    });
}

// ===== ANIMACIONES AL HACER SCROLL =====
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Main.js cargado correctamente');
    setupMobileMenu();
    setupScrollAnimations();
    
    document.querySelectorAll('.plan-card, .trainer-card, .product-card, .stat-card, .about-text').forEach(el => {
        el.classList.add('animate-on-scroll');
    });
    
    // Actualizar UI del carrito
    if (carrito) carrito.actualizarUI();
});
