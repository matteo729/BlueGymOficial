// index.js - Scripts específicos para la página de inicio - Blue Gym

document.addEventListener('DOMContentLoaded', function() {
    // Animación para números en estadísticas
    animateStats();
    
    // Efecto parallax suave para el hero
    setupParallax();
});

function animateStats() {
    const stats = document.querySelectorAll('.stat-card h3');
    
    stats.forEach(stat => {
        const target = parseInt(stat.innerText.replace(/[^0-9]/g, ''));
        let current = 0;
        const increment = target / 50; // 50 pasos para la animación
        
        const updateStat = () => {
            if (current < target) {
                current += increment;
                stat.innerText = Math.round(current) + '+';
                requestAnimationFrame(updateStat);
            } else {
                stat.innerText = target + '+';
            }
        };
        
        // Observar cuando la estadística es visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateStat();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(stat);
    });
}

function setupParallax() {
    const hero = document.querySelector('.hero');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        if (hero) {
            hero.style.backgroundPositionY = scrolled * 0.5 + 'px';
        }
    });
}