function abrirModal(titulo, url) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalIframe = document.getElementById('modalIframe');
    
    modalTitle.textContent = titulo;
    modalIframe.src = url;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    const modal = document.getElementById('modal');
    const modalIframe = document.getElementById('modalIframe');
    
    modal.classList.remove('active');
    modalIframe.src = '';
    document.body.style.overflow = 'auto';
}

// Cerrar modal al hacer clic fuera del contenido
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarModal();
    }
});

// Cerrar modal con tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('modal').classList.contains('active')) {
        cerrarModal();
    }
});

// Manejar mensajes desde los iframes
window.addEventListener('message', function(e) {
    if (e.data.action === 'closeModal') {
        cerrarModal();
    }
});