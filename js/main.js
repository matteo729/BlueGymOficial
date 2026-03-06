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

// ===== FUNCIONES DE UTILIDAD =====
function formatPrice(price) {
    return '€' + parseFloat(price).toFixed(2);
}

function showNotification(message, type = 'success') {
    alert(message); // Simple mientras tanto
}

// ===== FUNCIONES DEL MODAL DE PLANES =====
function mostrarModalPlan(plan) {
    const modal = document.getElementById('plan-modal');
    if (!modal) return;
    
    document.getElementById('selected-plan').textContent = plan.nombre;
    document.getElementById('plan-price').textContent = plan.precio;
    
    modal.style.display = 'flex';
    setTimeout(() => {
        document.querySelector('.modal-content').style.transform = 'scale(1)';
    }, 10);
}

function cerrarModalPlan() {
    const modal = document.getElementById('plan-modal');
    document.querySelector('.modal-content').style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('plan-form')?.reset();
    }, 300);
}

function enviarPlanWhatsApp(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const plan = document.getElementById('selected-plan').textContent;
    const precio = document.getElementById('plan-price').textContent;
    
    const mensaje = `🏋️ *Nueva Solicitud de Plan - Blue Gym*\n\n` +
                   `*Plan:* ${plan}\n` +
                   `*Precio:* ${precio}\n` +
                   `*Cliente:* ${nombre} ${apellido}`;
    
    const url = `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    cerrarModalPlan();
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Main.js cargado');
});

