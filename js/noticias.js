document.addEventListener('DOMContentLoaded', function() {
    loadNews();
});

// Datos de respaldo por si falla el fetch (ej. problema de CORS en local)
const fallbackData = [
  {
    "id": 1,
    "titulo": "El TECNM Puebla evalúa la vinculación con empleadoras(es)",
    "fecha": "2026-01-22",
    "imagen": "https://www.puebla.tecnm.mx/wp-content/uploads/2026/01/empleadores-e1768936100529.jpg",
    "resumen": "¡Hola leonas y leones! El TECNM Puebla evalúa la vinculación con empleadoras(es)… #OrgulloTecNM #SomosTecNM #SomosITPuebla #leonasyleones",
    "url": "https://www.puebla.tecnm.mx/el-tecnm-puebla-evalua-la-vinculacion-con-empleadorases/"
  },
  {
    "id": 2,
    "titulo": "La Rama Estudiantil IEEE del TECNM Puebla recibe reconocimiento.",
    "fecha": "2026-01-22",
    "imagen": "https://www.puebla.tecnm.mx/wp-content/uploads/2026/01/ieee.jpg",
    "resumen": "¡Hola leonas y leones! La Rama Estudiantil IEEE del TECNM Puebla recibe reconocimiento. Se llevó a cabo la Toma de Protesta de la nueva administra...",
    "url": "https://www.puebla.tecnm.mx/la-rama-estudiantil-ieee-del-tecnm-puebla-recibe-reconocimiento/"
  },
  {
    "id": 3,
    "titulo": "Inicia la segunda semana de Cursos Intersemestrales en el TECNM Puebla.",
    "fecha": "2026-01-21",
    "imagen": "https://www.puebla.tecnm.mx/wp-content/uploads/2026/01/cursos2.jpg",
    "resumen": "¡Hola leonas y leones! Inicia la segunda semana de Cursos Intersemestrales en el TECNM Puebla. El departamento de Desarrollo Académico, a través de...",
    "url": "https://www.puebla.tecnm.mx/inicia-la-segunda-semana-de-cursos-intersemestrales-en-el-tecnm-puebla/"
  }
];

function loadNews() {
    const container = document.getElementById('news-container');
    
    // Simular carga o usar fetch real
    fetch('data/noticias.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de noticias');
            }
            return response.json();
        })
        .then(data => {
            container.innerHTML = ''; // Limpiar spinner
            
            if (data.length === 0) {
                container.innerHTML = '<div class="col-12 text-center"><h3>No hay noticias disponibles por el momento.</h3></div>';
                return;
            }

            data.forEach(news => {
                const cardHtml = createNewsCard(news);
                container.innerHTML += cardHtml;
            });
            
            // Refrescar AOS para detectar los nuevos elementos
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        })
        .catch(error => {
            console.error('Error cargando noticias:', error);
            
            // Intentar usar datos de respaldo si es un error de fetch (probablemente CORS local)
            if (fallbackData && fallbackData.length > 0) {
                console.log('Usando datos de respaldo...');
                container.innerHTML = '';
                fallbackData.forEach(news => {
                    const cardHtml = createNewsCard(news);
                    container.innerHTML += cardHtml;
                });
                if (typeof AOS !== 'undefined') AOS.refresh();
                
                // Agregar aviso discreto
                const warningDiv = document.createElement('div');
                warningDiv.className = 'col-12 text-center text-muted mt-3';
                warningDiv.innerHTML = '<small>Modo offline: Mostrando noticias recientes almacenadas.</small>';
                container.appendChild(warningDiv);
            } else {
                container.innerHTML = `
                    <div class="col-12 text-center text-danger">
                        <h3>Hubo un error al cargar las noticias.</h3>
                        <p>Por favor intenta de nuevo más tarde.</p>
                    </div>`;
            }
        });
}

function createNewsCard(news) {
    // Formatear fecha
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(news.fecha + 'T12:00:00'); // T12:00:00 para evitar problemas de zona horaria
    const formattedDate = date.toLocaleDateString('es-ES', options);

    const linkAttr = news.url ? `href="${news.url}" target="_blank" rel="noopener noreferrer"` : `href="#" onclick="openNewsModal(${news.id}); return false;"`;

    return `
        <div class="col-lg-4 col-md-6 mb-4" data-aos="fade-up">
            <div class="news-card">
                <a ${linkAttr} class="text-decoration-none">
                    <img src="${news.imagen}" alt="${news.titulo}" class="news-image" onerror="this.src='img/fondo.jpg'">
                </a>
                <div class="news-content">
                    <div class="news-date">
                        <i class="far fa-calendar-alt"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <h3 class="news-title">
                        <a ${linkAttr} class="text-dark text-decoration-none">
                            ${news.titulo}
                        </a>
                    </h3>
                    <p class="news-excerpt">${news.resumen}</p>
                    <a ${linkAttr} class="news-link">
                        Leer más <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Función para abrir modal (si decidimos implementarlo más adelante, por ahora solo un alert o log)
function openNewsModal(id) {
    // Aquí se podría implementar un modal real con Bootstrap
    console.log('Abriendo noticia:', id);
    // Para una implementación simple, podríamos buscar la noticia y mostrarla en un modal
    // Pero por ahora, dejémoslo funcional.
    
    fetch('data/noticias.json')
        .then(res => res.json())
        .then(data => {
            const news = data.find(n => n.id === id);
            if (news) {
                // Crear modal dinámicamente
                const modalHtml = `
                    <div class="modal fade" id="newsModal" tabindex="-1" role="dialog" aria-hidden="true">
                        <div class="modal-dialog modal-lg" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">${news.titulo}</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body">
                                    <img src="${news.imagen}" class="img-fluid mb-3 rounded" style="width:100%; max-height:400px; object-fit:cover;">
                                    <p class="text-muted"><i class="far fa-calendar-alt"></i> ${new Date(news.fecha + 'T12:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <div class="news-body-text">
                                        ${news.contenido.replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Remover modal anterior si existe
                $('#newsModal').remove();
                $('body').append(modalHtml);
                $('#newsModal').modal('show');
            }
        });
}
