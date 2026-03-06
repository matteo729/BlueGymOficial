// main.js - Funciones compartidas - Blue Gym

// ===== CONFIGURACIÓN DE SUPABASE =====
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Supabase
// SUPABASE_URL: La URL de tu proyecto (ej: https://tuproyecto.supabase.co)
// SUPABASE_ANON_KEY: Tu clave anónima de Supabase
const SUPABASE_URL = 'https://vyhqyrbqequyxjtwcint.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aHF5cmJxZXF1eXhqdHdjaW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDczODEsImV4cCI6MjA4ODM4MzM4MX0.6nbzM7dPU7t5nosWTGj58Ycb5zTLUric3ApSThethK0';

// Configuración de WhatsApp (cambiar por el número del dueño)
const OWNER_PHONE = '521234567890'; // Formato: código de país + número sin +

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== FUNCIONES DE UTILIDAD =====
function formatPrice(price) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    }).format(price);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== FUNCIONES DEL CARRITO =====
class Carrito {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.total = 0;
        this.calcularTotal();
    }

    agregarItem(producto) {
        const existente = this.items.find(item => item.id === producto.id);
        
        if (existente) {
            existente.cantidad += 1;
        } else {
            this.items.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                imagen: producto.imagen_url
            });
        }
        
        this.calcularTotal();
        this.guardar();
        this.actualizarUI();
        showNotification(`${producto.nombre} agregado al carrito`, 'success');
    }

    eliminarItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.calcularTotal();
        this.guardar();
        this.actualizarUI();
    }

    actualizarCantidad(id, nuevaCantidad) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.cantidad = nuevaCantidad;
            if (item.cantidad <= 0) {
                this.eliminarItem(id);
            } else {
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
        this.items = [];
        this.total = 0;
        this.guardar();
        this.actualizarUI();
    }

    actualizarUI() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.items.reduce((sum, item) => sum + item.cantidad, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        this.actualizarModalCarrito();
    }

    actualizarModalCarrito() {
        const modal = document.getElementById('cart-modal');
        if (!modal || modal.style.display !== 'flex') return;

        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');

        if (this.items.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Tu carrito está vacío</p></div>';
            cartTotal.textContent = formatPrice(0);
            return;
        }

        cartItems.innerHTML = this.items.map(item => `
            <div class="cart-item">
                <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p class="cart-item-price">${formatPrice(item.precio)}</p>
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
        `).join('');

        cartTotal.textContent = formatPrice(this.total);
    }

    generarMensajeWhatsApp() {
        let mensaje = "🛒 *Nuevo Pedido - Blue Gym*\n\n";
        mensaje += "*Productos:*\n";
        
        this.items.forEach(item => {
            mensaje += `• ${item.nombre} x${item.cantidad} - ${formatPrice(item.precio * item.cantidad)}\n`;
        });
        
        mensaje += `\n*Total: ${formatPrice(this.total)}*`;
        
        return encodeURIComponent(mensaje);
    }

    async realizarPedido() {
        if (this.items.length === 0) {
            showNotification('El carrito está vacío', 'error');
            return;
        }

        const mensaje = this.generarMensajeWhatsApp();
        const url = `https://wa.me/${OWNER_PHONE}?text=${mensaje}`;
        
        window.open(url, '_blank');
    }
}

// Instancia global del carrito
const carrito = new Carrito();

// ===== FUNCIONES DEL MODAL DE PLANES =====
function mostrarModalPlan(plan) {
    const modal = document.getElementById('plan-modal');
    const planName = document.getElementById('selected-plan');
    const planPrice = document.getElementById('plan-price');
    
    planName.textContent = plan.nombre;
    planPrice.textContent = plan.precio;
    
    modal.style.display = 'flex';
    
    setTimeout(() => {
        document.querySelector('.modal-content').style.transform = 'scale(1)';
    }, 10);
}

function cerrarModalPlan() {
    const modal = document.getElementById('plan-modal');
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
    
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const plan = document.getElementById('selected-plan').textContent;
    const precio = document.getElementById('plan-price').textContent;
    
    const mensaje = `🏋️ *Nueva Solicitud de Plan - Blue Gym*\n\n` +
                   `*Plan Seleccionado:* ${plan}\n` +
                   `*Precio:* ${precio}\n` +
                   `*Cliente:* ${nombre} ${apellido}\n\n` +
                   `¡Gracias por elegir Blue Gym! Un asesor se comunicará contigo.`;
    
    const url = `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
    cerrarModalPlan();
    showNotification('Solicitud enviada por WhatsApp', 'success');
}

// ===== FUNCIONES DEL CARRITO UI =====
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = 'flex';
    carrito.actualizarModalCarrito();
    
    setTimeout(() => {
        document.querySelector('.cart-content').style.transform = 'translateX(0)';
    }, 10);
}

function cerrarCarrito() {
    const modal = document.getElementById('cart-modal');
    const cartContent = document.querySelector('.cart-content');
    
    if (cartContent) {
        cartContent.style.transform = 'translateX(100%)';
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

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
    setupMobileMenu();
    setupScrollAnimations();
    
    document.querySelectorAll('.plan-card, .trainer-card, .product-card, .stat-card, .about-text').forEach(el => {
        el.classList.add('animate-on-scroll');
    });
    
    carrito.actualizarUI();
});
