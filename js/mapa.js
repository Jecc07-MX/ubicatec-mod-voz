$(document).ready(function () {
    var mapaEmergente = $('#mapaEmergente');
    var mapaDiv = $('#mapa');
    var cerrarMapaBtn = $('#cerrarMapaBtn');
    var verUbicacionBtn = $('#verUbicacionBtn');
    var mapa;
    var marcadorDestino;
    var marcadorUsuario;
    var destinoLatitud = 19.069281; // Coordenada de latitud del Edificio 15
    var destinoLongitud = -98.168944; // Coordenada de longitud del Edificio 15
    var distanciaEnMapaElement = $('#distanciaEnMapa'); // Nuevo elemento para la distancia
    var sonidoNotificacion = document.getElementById('notificacionLlegada'); // Elemento de audio
    var llegadaNotificada = false; // Bandera para evitar notificaciones repetidas

    // Elementos para la ventana modal
    var avisoModal = $('#avisoModal');
    var cerrarAvisoBtn = $('#cerrarAvisoBtn');
    var continuarBtn = $('#continuarBtn');
    var llegadaModal = $('#llegadaModal');
    console.log("Elemento llegadaModal:", llegadaModal);
    var cerrarLlegadaBtn = $('#cerrarLlegadaBtn');
    var cerrarLlegadaOkBtn = $('#cerrarLlegadaOkBtn');

    // Modal de resultados múltiples
    var resultadosModal = $('#resultadosModal');
    var resultadosClose = $('#resultadosClose');

    resultadosClose.on('click', function () {
        resultadosModal.hide();
    });

    // Inicializar grafo accesible si está disponible
    if (typeof inicializarGrafoAccesible === 'function' && typeof grafoAccesible !== 'undefined') {
        inicializarGrafoAccesible(grafoAccesible);
    }

    // Cerrar el modal de llegada al hacer clic en la "x"
    cerrarLlegadaBtn.on('click', function () {
        llegadaModal.hide();
    });

    // Cerrar el modal de llegada al hacer clic en "Ok"
    cerrarLlegadaOkBtn.on('click', function () {
        llegadaModal.hide();
    });

    verUbicacionBtn.on('click', function () {
        avisoModal.show(); // Mostrar la ventana de aviso
    });

    cerrarAvisoBtn.on('click', function () {
        avisoModal.hide();
    });

    continuarBtn.on('click', function () {
        avisoModal.hide();
        mapaEmergente.show();
        inicializarMapa();
        llegadaNotificada = false; // Reiniciar la bandera al abrir el mapa
    });

    cerrarMapaBtn.on('click', function () {
        mapaEmergente.hide();
        if (mapa) {
            mapa.remove(); // Limpiar el mapa al cerrar
            mapa = null;
            marcadorDestino = null;
            marcadorUsuario = null;
        }
    });

    function inicializarMapa() {
        mapa = L.map('mapa').setView([19.0733, -98.2889], 20); // Coordenadas iniciales (Tec de Puebla) y zoom

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapa);

        // Marcador del destino final (Edificio 15)
        marcadorDestino = L.marker([destinoLatitud, destinoLongitud]).addTo(mapa)
            .bindPopup('<b>Edificio 15</b>').openPopup();


        // Crear un icono personalizado para el usuario
        var iconoUsuario = L.icon({
            iconUrl: 'Icon/user.png', // Reemplaza 'Icon/user.png' con la ruta a tu imagen
            iconSize: [27, 35],     // Tamaño del icono (ancho, alto) en píxeles. Ajusta si es necesario.
            iconAnchor: [12, 39],    // Punto del icono que corresponde a la ubicación. Ajusta si es necesario.
            popupAnchor: [1, -34]    // Punto donde se abrirá el popup. Ajusta si es necesario.
        });

        // Opciones para el seguimiento de la ubicación
        var opcionesSeguimiento = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        function exitoUbicacion(pos) {
            var latitudUsuario = pos.coords.latitude;
            var longitudUsuario = pos.coords.longitude;

            if (marcadorUsuario) {
                marcadorUsuario.setLatLng([latitudUsuario, longitudUsuario]);
            } else {
                marcadorUsuario = L.marker([latitudUsuario, longitudUsuario], { icon: iconoUsuario }).addTo(mapa)
                    .bindPopup('Tu ubicación actual').openPopup();
            }

            mapa.panTo(new L.LatLng(latitudUsuario, longitudUsuario));

            // Calcular la distancia restante y actualizar el elemento en el mapa
            var distancia = calcularDistancia(latitudUsuario, longitudUsuario, destinoLatitud, destinoLongitud);
            distanciaEnMapaElement.html('<b>Distancia Restante: ' + Math.round(distancia) + ' Metros</b>');

            // Verificar si se ha llegado al destino (distancia menor a 10 metros)
            var distanciaUmbral = 10; // Metros
            if (distancia <= distanciaUmbral && !llegadaNotificada) {
                sonidoNotificacion.play();
                llegadaModal.show(); // Mostrar el modal de llegada
                llegadaNotificada = true;
            }
        }

        function errorUbicacion(err) {
            console.warn('ERROR(' + err.code + '): ' + err.message);
            alert('No se pudo obtener la ubicación.');
        }

        navigator.geolocation.watchPosition(exitoUbicacion, errorUbicacion, opcionesSeguimiento);

        mapa.invalidateSize();
    }

    // Función para calcular la distancia entre dos puntos (en metros) usando la fórmula Haversine
    function calcularDistancia(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Radio de la Tierra en metros
        const φ1 = lat1 * Math.PI / 180; // φ, λ en radianes
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distancia = R * c; // en metros
        return distancia;
    }

    // Verificar que el contenedor del mapa existe
    var mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Contenedor del mapa no encontrado');
        return;
    }

    // Función para obtener parámetros de URL
    function obtenerParametrosURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            edificio: urlParams.get('edificio'),
            coords: urlParams.get('coords')
        };
    }

    // Función para centrar el mapa en coordenadas específicas
    function centrarMapaEnCoordenadas(coords, edificio) {
        if (coords && map) {
            const [lat, lng] = coords.split(',').map(coord => parseFloat(coord.trim()));

            // Centrar el mapa en las coordenadas
            map.setView([lat, lng], 19, {
                animate: true,
                duration: 1.5
            });

            // Buscar y mostrar el marcador del edificio
            if (window.markersData && edificio) {
                const edificioEncontrado = window.markersData.find(data => {
                    const nombreEdificio = data.name.toLowerCase();
                    const match = nombreEdificio.match(/edificio (\d+)/);
                    return match && match[1] === edificio.toString();
                });

                if (edificioEncontrado) {
                    // Mostrar solo este marcador
                    window.edificioMarkers.clearLayers();
                    window.edificioMarkers.addLayer(edificioEncontrado.marker);

                    // Abrir popup del marcador
                    edificioEncontrado.marker.openPopup();

                    console.log('Mapa centrado en:', edificioEncontrado.name);
                }
            }
        }
    }

    // Crear el mapa con un pequeño delay para asegurar que el DOM esté listo
    setTimeout(function () {
        // Obtener parámetros de URL
        const params = obtenerParametrosURL();

        var map = L.map('map', {
            zoomControl: false,
            dragging: true
        }).setView([19.0698, -98.1688], 18);

        // Agregar controles de zoom personalizados
        L.control.zoom({
            position: 'topright'
        }).addTo(map);

        var calle = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 20,
            minZoom: 15,
            attribution: '&copy; OpenStreetMap contributors'
        });

        calle.addTo(map);

        // Hacer el mapa global para que esté disponible en otras funciones
        window.map = map;

        console.log('Mapa inicializado correctamente');

        // Cargar datos y crear marcadores
        cargarDatos().then(function (datos) {
            window.edificios = datos; // Guardar globalmente
            crearMarcadores(map, datos);

            // Si hay parámetros de URL, centrar el mapa
            if (params.coords && params.edificio) {
                // Ya no necesitamos timeout largo porque los datos están cargados
                centrarMapaEnCoordenadas(params.coords, params.edificio);
            }
        });
    }, 100);

    var accesos = [
        { nombre: "Acceso principal (Avenida Tecnologico)", coords: [19.069821422656712, -98.17042957607508], tipo: "acceso" },
        { nombre: "Acceso Visitantes (Avenida Tecnologico, Frente a Sears)", coords: [19.068467599492795, -98.17061388514823], tipo: "acceso" },
        { nombre: "Acceso Hangar Autobuses y Estacionamiento 3 (Avenida Tecnologico, a un costado de Benteler)", coords: [19.067184781628676, -98.17086525607026], tipo: "acceso" },
        { nombre: "Acceso Estacionamiento 2 (Colonia Maravillas)", coords: [19.069943796103818, -98.16710196647787], tipo: "acceso" },
        { nombre: "Acceso Estudiantes (Colonia Maravillas)", coords: [19.07051268473509, -98.16772933097631], tipo: "acceso" },
        { nombre: "Acceso Estacionamiento 1 (Avenida Tecnologico)", coords: [19.070712336989462, -98.1703082196594], tipo: "acceso" }
    ];

    // Función para cargar datos desde el JSON
    function cargarDatos() {
        return fetch('data/edificios.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error("HTTP error " + response.status);
                }
                return response.json();
            })
            .then(data => {
                var todosLosEdificios = [];

                // Procesar edificios
                if (data.edificios) {
                    data.edificios.forEach(e => {
                        e.link = "edificio.html?id=" + e.id;
                        todosLosEdificios.push(e);
                    });
                }

                // Procesar canchas
                if (data.canchas) {
                    data.canchas.forEach(c => {
                        c.link = "edificio.html?id=" + c.id;
                        todosLosEdificios.push(c);
                    });
                }

                // Procesar puntos de reunión
                if (data.puntos_reunion) {
                    console.log("Encontrados " + data.puntos_reunion.length + " puntos de reunión.");
                    data.puntos_reunion.forEach(p => {
                        p.tipo = "punto_reunion"; // Asignar tipo explícitamente y mantener consistencia
                        todosLosEdificios.push(p);
                    });
                } else {
                    console.warn("No se encontraron puntos de reunión en el JSON.");
                }

                // Agregar accesos (hardcoded)
                accesos.forEach(a => todosLosEdificios.push(a));

                return todosLosEdificios;
            })
            .catch(error => {
                console.error("Error al cargar data/edificios.json:", error);
                // Fallback a solo accesos si falla
                return accesos;
            });
    }

    // Función para crear iconos personalizados según el tipo
    function crearIconoPersonalizado(tipo) {
        var colores = {
            'aula': { color: '#3498db', icono: 'school.svg' },
            'laboratorio': { color: '#27ae60', icono: 'microscope.svg' },
            'administrativo': { color: '#e67e22', icono: 'building.svg' },
            'baño': { color: '#9b59b6', icono: 'toilet-paper.svg' },
            'acceso': { color: '#e74c3c', icono: 'door.svg' },
            'deportivo': { color: '#2ecc71', icono: 'sport.svg' }, // Nuevo tipo deportivo (verde esmeralda)
            'punto_reunion': { color: '#2ecc71', icono: 'triangle-exclamation-solid.svg' },
            'otro': { color: '#95a5a6', icono: 'tools.svg' }
        };

        var config = colores[tipo] || colores['otro'];

        return L.divIcon({
            className: 'custom-marker marker-' + tipo,
            html: '<div style="background-color: ' + config.color + '; border: 3px solid ' + config.color + '; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;"><img src="Icon/tabler/' + config.icono + '" alt="' + tipo + '" style="width: 16px; height: 16px; filter: brightness(0) invert(1);" /></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });
    }

    // Función para crear marcadores
    function crearMarcadores(map, datosEdificios) {
        var markersData = [];
        datosEdificios.forEach(function (edificio) {
            var icono = crearIconoPersonalizado(edificio.tipo);
            var marker = L.marker(edificio.coords, { icon: icono });

            // Asegurar que nombre existe
            var nombre = edificio.nombre || edificio.descripcion || "Sin nombre";

            marker.bindTooltip(nombre, {
                permanent: true,
                direction: 'top',
                className: 'custom-tooltip'
            });

            if (edificio.link) {
                marker.on('click', function () { window.location.href = edificio.link; });
            }

            // Extraer ID del link si existe o usar el ID directo
            var id = edificio.id ? edificio.id.toString() : null;
            if (!id && edificio.link) {
                var matchId = edificio.link.match(/id=(\d+)/);
                if (matchId) {
                    id = matchId[1];
                }
            }

            // Incluir descripción en los datos del marcador para búsqueda
            var descripcion = edificio.descripcion || "";

            markersData.push({
                marker: marker,
                name: nombre.toLowerCase(),
                tipo: edificio.tipo,
                id: id,
                descripcion: normalizeText(descripcion), // Añadir descripción normalizada
                originalData: edificio
            });
        });

        var edificioMarkers = L.layerGroup();
        markersData.forEach(function (data) {
            edificioMarkers.addLayer(data.marker);
        });

        edificioMarkers.addTo(map);

        // Hacer las variables globales para que estén disponibles en otras funciones
        window.markersData = markersData;
        window.edificioMarkers = edificioMarkers;

        // Ocultar todos los marcadores al principio
        window.edificioMarkers.clearLayers();

        console.log('Marcadores creados correctamente:', markersData.length);
    }

    // Función para normalizar texto (quitar acentos y convertir a minúsculas)
    function normalizeText(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function updateMarkers(query, selectedFilter) {
        if (!window.edificioMarkers || !window.markersData) {
            console.log('Marcadores no están listos aún');
            return;
        }

        window.edificioMarkers.clearLayers();
        if (query || selectedFilter !== 'todos') { // Mostrar solo si hay una búsqueda o filtro seleccionado
            var normalizedQuery = normalizeText(query);

            window.markersData.forEach(function (data) {
                var normalizedName = normalizeText(data.name);
                var matchesQuery = normalizedName.includes(normalizedQuery);

                // Buscar también en la descripción
                if (!matchesQuery && data.descripcion && data.descripcion.includes(normalizedQuery)) {
                    matchesQuery = true;
                }

                var matchesFilter = selectedFilter === 'todos'; // Si es 'todos', todos pasan

                // Búsqueda especial para canchas
                if (normalizedQuery.includes('cancha') || normalizedQuery.includes('deportivo')) {
                    if (data.tipo === 'deportivo' || (Array.isArray(data.tipo) && data.tipo.includes('deportivo'))) {
                        matchesQuery = true;
                    }
                }

                if (selectedFilter !== 'todos') {
                    matchesFilter = false;

                    // Comprobar si data.tipo es un array o un string
                    const tipos = Array.isArray(data.tipo) ? data.tipo : [data.tipo];

                    if (selectedFilter === 'otros') {
                        const excludedTypes = ['administrativo', 'aula', 'laboratorio', 'baño', 'acceso', 'punto_reunion', 'deportivo'];
                        // Si NINGUNO de los tipos del edificio está en la lista de excluidos, entonces es "otro"
                        const esExcluido = tipos.some(t => excludedTypes.includes(t));
                        if (!esExcluido) {
                            matchesFilter = true;
                        }
                    } else if (selectedFilter === 'baño') {
                        // Lógica específica para baños (incluye búsqueda por nombre y tipos 'baño' o 'baños')
                        if (normalizedName.includes('wc') || normalizedName.includes('bano') || tipos.includes('baño') || tipos.includes('baños')) {
                            matchesFilter = true;
                        }
                    } else {
                        // Para cualquier otro filtro específico (aula, laboratorio, punto_reunion, etc.)
                        if (tipos.includes(selectedFilter)) {
                            matchesFilter = true;
                        }
                    }
                }

                if (matchesQuery && matchesFilter) {
                    window.edificioMarkers.addLayer(data.marker);
                }
            });
            console.log("Marcadores actualizados. Visibles: " + window.edificioMarkers.getLayers().length);
        }
    }

    // Función auxiliar para centrar en un marcador específico
    function centrarEnMarcador(edificioEncontrado) {
        console.log('Edificio encontrado:', edificioEncontrado.name);

        // Centrar el mapa en el edificio encontrado
        var coords = edificioEncontrado.marker.getLatLng();
        console.log('Coordenadas:', coords);

        // Scroll suave hacia el mapa para asegurar que sea visible en móviles
        // Usamos jQuery animate para mayor compatibilidad móvil
        $('html, body').animate({
            scrollTop: $("#map").offset().top - 80 // Offset para header
        }, 800);

        map.setView(coords, 19, {
            animate: true,
            duration: 1.5
        });

        // Mostrar solo este marcador
        window.edificioMarkers.clearLayers();
        window.edificioMarkers.addLayer(edificioEncontrado.marker);

        // (Popup removido a petición del usuario, solo se muestra el tooltip predeterminado)
        if (edificioEncontrado.marker.getPopup()) {
            edificioEncontrado.marker.unbindPopup();
        }

        console.log('Mapa centrado en:', edificioEncontrado.name);
    }

    // Función auxiliar para mostrar múltiples resultados en el modal
    function mostrarResultadosEnModal(resultados) {
        var lista = document.getElementById('listaResultados');
        lista.innerHTML = ''; // Limpiar resultados anteriores

        resultados.forEach(function (data) {
            var item = document.createElement('div');
            item.className = 'resultado-item';
            // Estilos inline para asegurar consistencia
            item.style.padding = '12px';
            item.style.borderBottom = '1px solid #eee';
            item.style.cursor = 'pointer';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '15px';
            item.style.transition = 'background-color 0.2s';

            // Efecto hover
            item.onmouseover = function () { this.style.backgroundColor = '#f8f9fa'; };
            item.onmouseout = function () { this.style.backgroundColor = 'transparent'; };

            // Determinar color e icono basado en tipo
            var color = '#95a5a6'; // default gray
            var iconName = 'tools.svg';
            var tipoStr = Array.isArray(data.tipo) ? data.tipo.join(' ') : data.tipo;

            if (tipoStr.includes('aula')) { color = '#3498db'; iconName = 'school.svg'; }
            else if (tipoStr.includes('laboratorio')) { color = '#27ae60'; iconName = 'microscope.svg'; }
            else if (tipoStr.includes('administrativo')) { color = '#e67e22'; iconName = 'building.svg'; }
            else if (tipoStr.includes('deportivo')) { color = '#2ecc71'; iconName = 'sport.svg'; }
            else if (tipoStr.includes('baño') || tipoStr.includes('baños')) { color = '#9b59b6'; iconName = 'toilet-paper.svg'; }
            else if (tipoStr.includes('acceso')) { color = '#e74c3c'; iconName = 'door.svg'; }

            // Nombre formateado (Capitalizado)
            // Usamos el tooltip si existe, o el nombre data
            var nombreMostrar = data.name;
            // Intentar obtener el nombre original del tooltip si es posible
            if (data.marker && data.marker.getTooltip()) {
                nombreMostrar = data.marker.getTooltip().getContent();
            } else {
                // Capitalizar primera letra de cada palabra
                nombreMostrar = nombreMostrar.replace(/\b\w/g, l => l.toUpperCase());
            }

            item.innerHTML = `
                <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <img src="Icon/tabler/${iconName}" style="width: 18px; height: 18px; filter: brightness(0) invert(1);" alt="${tipoStr}">
                </div>
                <span style="font-weight: 500; color: #333; font-size: 14px;">${nombreMostrar}</span>
            `;

            item.onclick = function () {
                centrarEnMarcador(data);
                $('#resultadosModal').hide();
            };

            lista.appendChild(item);
        });

        $('#resultadosModal').css('display', 'flex'); // Usar flex para centrar
    }

    // Función para centrar el mapa en un edificio específico (global)
    window.centrarEnEdificio = function (query) {
        console.log('Buscando edificio:', query);

        if (!window.markersData || !map) {
            console.log('Mapa o marcadores no están listos aún');
            return;
        }

        var resultadosEncontrados = [];
        var normalizedQuery = normalizeText(query);

        console.log('Datos de marcadores disponibles:', window.markersData.length);

        // Buscar coincidencia exacta primero o coincidencia parcial fuerte
        // Priorizar coincidencia por número de edificio
        var matchNumero = normalizedQuery.match(/(\d+)/);
        var numeroBuscado = matchNumero ? matchNumero[1] : null;

        // 1. Buscar por número de edificio si la query tiene un número
        if (numeroBuscado) {
            for (var i = 0; i < window.markersData.length; i++) {
                var data = window.markersData[i];
                var normalizedName = normalizeText(data.name);
                var matchEdificio = normalizedName.match(/edificio (\d+)/);

                // Si encontramos coincidencia exacta de número o coincidencia de ID
                if ((matchEdificio && matchEdificio[1] === numeroBuscado) || (data.id && data.id === numeroBuscado)) {
                    resultadosEncontrados.push(data);
                }
            }
        }

        // 2. Si no encontramos por número, buscar por coincidencia de texto
        if (resultadosEncontrados.length === 0) {
            for (var i = 0; i < window.markersData.length; i++) {
                var data = window.markersData[i];
                var normalizedName = normalizeText(data.name);

                if (normalizedName.includes(normalizedQuery) || (data.descripcion && data.descripcion.includes(normalizedQuery))) {
                    resultadosEncontrados.push(data);
                } else if (normalizedQuery.includes('cancha') || normalizedQuery.includes('deportivo')) {
                    // Búsqueda especial para canchas y deportivos
                    if (data.tipo === 'deportivo' || (Array.isArray(data.tipo) && data.tipo.includes('deportivo'))) {
                        resultadosEncontrados.push(data);
                    }
                }
            }
        }

        if (resultadosEncontrados.length === 1) {
            // Un solo resultado: comportamiento original
            centrarEnMarcador(resultadosEncontrados[0]);
        } else if (resultadosEncontrados.length > 1) {
            // Múltiples resultados: mostrar modal
            console.log('Múltiples resultados encontrados:', resultadosEncontrados.length);
            mostrarResultadosEnModal(resultadosEncontrados);
        } else {
            console.log('Edificio no encontrado:', query);
            alert('Edificio no encontrado: ' + query);
        }
    };

    // Event listener para el campo de búsqueda
    document.getElementById('searchInput').addEventListener('input', function () {
        var query = this.value.trim();
        var filterSelect = document.getElementById('filterSelect');

        // Si hay una búsqueda activa, desactivar el filtro automáticamente
        if (query) {
            filterSelect.value = 'todos';
        }

        var selectedFilter = filterSelect.value;
        updateMarkers(query, selectedFilter);
    });

    // Event listener para el formulario de búsqueda (Maneja Enter y Submit en móviles)
    var searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevenir recarga
            var query = document.getElementById('searchInput').value.trim();
            console.log('Formulario enviado, búsqueda:', query);
            if (query) {
                centrarEnEdificio(query);
                // Ocultar teclado en móviles
                document.getElementById('searchInput').blur();
            }
        });
    }

    // Event listener para el botón de búsqueda (Click explícito)
    var searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Prevenir submit duplicado si está dentro del form
            var query = document.getElementById('searchInput').value.trim();
            if (query) {
                centrarEnEdificio(query);
            }
        });
    }

    // Event listener para el selector de filtros
    document.getElementById('filterSelect').addEventListener('change', function () {
        var searchInput = document.getElementById('searchInput');
        var selectedFilter = this.value;

        // Si se selecciona un filtro diferente a 'todos', limpiar la búsqueda
        if (selectedFilter !== 'todos') {
            searchInput.value = '';
        }

        var query = searchInput.value.trim();
        updateMarkers(query, selectedFilter);
    });

    // --- Accessibility Routing Logic ---
    const urlParams = new URLSearchParams(window.location.search);
    const rutaActiva = urlParams.get('ruta');

    if (rutaActiva === 'true') {
        setTimeout(() => {
            procesarRutaAccesible(urlParams);
        }, 1000); // Wait for map to initialize
    }

    function procesarRutaAccesible(params) {
        const destinoId = params.get('destino');
        const origenId = params.get('origen');
        const origenLat = parseFloat(params.get('origen_lat'));
        const origenLon = parseFloat(params.get('origen_lon'));

        console.log('♿ Procesando ruta accesible...', { destinoId, origenId, origenLat, origenLon });

        if (!grafoAccesible) {
            console.error('Grafo accesible no cargado');
            return;
        }

        let nodoOrigen = null;
        if (origenId) {
            nodoOrigen = obtenerNodoPorId(origenId);
        } else if (!isNaN(origenLat) && !isNaN(origenLon)) {
            nodoOrigen = encontrarNodoMasCercano(origenLat, origenLon);
        }

        if (!nodoOrigen) {
            alert('No se pudo determinar el punto de partida.');
            return;
        }

        // Logic to determine route based on Origin Node's route property
        // Assuming simple model where a node belongs to a specific route (azul/naranja)
        const rutaNombre = nodoOrigen.ruta;
        const rutaConfig = grafoAccesible.rutas[rutaNombre];

        if (rutaConfig && rutaConfig.edificios.includes(parseInt(destinoId))) {
            dibujarRutaEnMapa(rutaNombre, nodoOrigen, destinoId);
        } else {
            alert('No se encontró una ruta accesible directa desde este punto.');
        }
    }

    function dibujarRutaEnMapa(rutaNombre, nodoOrigen, destinoId) {
        const aristas = obtenerAristasPorRuta(rutaNombre);
        const rutaConfig = grafoAccesible.rutas[rutaNombre];

        // Collect all distinct coords for polyline (visualization only)

        aristas.forEach(arista => {
            const nodoA = obtenerNodoPorId(arista.desde);
            const nodoB = obtenerNodoPorId(arista.hacia);
            if (nodoA && nodoB) {
                L.polyline([nodoA.coords, nodoB.coords], {
                    color: rutaConfig.color,
                    weight: 6,
                    opacity: 0.8,
                    dashArray: '10, 10'
                }).addTo(map);
            }
        });

        // Current Location Marker
        if (nodoOrigen) {
            L.marker(nodoOrigen.coords).addTo(map)
                .bindPopup('<b>Punto de Partida</b><br>' + (nodoOrigen.descripcion || ''))
                .openPopup();
            map.setView(nodoOrigen.coords, 18);
        }

        // Search for destination to center map eventually
        if (typeof centrarEnEdificio === 'function') {
            // We can assume the user wants to see the path, so maybe just panning to origin is enough
            // or we can fit bounds.
            // For now, let's just ensure markers for destination are also shown if feasible.
            centrarEnEdificio('Edificio ' + destinoId);
        }
    }
});
