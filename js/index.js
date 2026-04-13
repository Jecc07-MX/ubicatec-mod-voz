document.addEventListener('DOMContentLoaded', function() {
    const loaderContainer = document.getElementById('loader-container');
    const bienvenidaContainer = document.querySelector('.video-bienvenida-container');

    if (loaderContainer) {
        loaderContainer.style.display = 'none';
    }

    if (bienvenidaContainer) {
        bienvenidaContainer.classList.add('loaded');
    }
});