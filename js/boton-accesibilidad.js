/**
 * Botón de Información de Accesibilidad - UBICATEC
 * Inyecta automáticamente un botón flotante (top-left) y un modal
 * informativo con los edificios accesibles del campus del ITP.
 *
 * Uso: basta con incluir este script en cualquier página HTML:
 *   <script src="js/boton-info-accesibilidad.js"></script>
 */

(function () {
    // -------------------------------------------------------------------------
    // Datos: edificios accesibles del campus
    // -------------------------------------------------------------------------
    const edificios = [
        'Edificio 1', 'Edificio 2', 'Edificio 3', 'Edificio 17',
        'Edificio 19', 'Edificio 20', 'Edificio 25', 'Edificio 27',
        'Edificio 28', 'Edificio 30', 'Edificio 36', 'Edificio 41',
        'Edificio 45', 'Edificio 49', 'Edificio 51', 'Edificio 53'
    ];
    const edificioEspecial = 'Edificio 50 – Centro de Información';

    // -------------------------------------------------------------------------
    // Ruta base hacia img/ (detecta automáticamente si estamos en una
    // subcarpeta — por ejemplo pages/ — o en la raíz del proyecto)
    // -------------------------------------------------------------------------
    const scriptSrc = document.currentScript ? document.currentScript.src : '';
    // js/boton-info-accesibilidad.js → el directorio padre del script es la raíz
    const baseUrl = scriptSrc ? scriptSrc.replace(/js\/[^/]+$/, '') : '';
    const imgAccesibilidad = baseUrl + 'img/accesibilidad.jpeg';

    // -------------------------------------------------------------------------
    // Estilos del botón y el modal (inyectados una sola vez)
    // -------------------------------------------------------------------------
    const style = document.createElement('style');
    style.textContent = `
        #btnInfoAccesibilidad {
            position: fixed;
            top: 20px;
            left: 15px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer;
            z-index: 1001;
            padding: 0;
            overflow: hidden;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        #btnInfoAccesibilidad:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        #btnInfoAccesibilidad img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
        }
        #overlayInfoAccesibilidad {
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.55);
            backdrop-filter: blur(5px);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            padding: 20px;
            box-sizing: border-box;
        }
        #overlayInfoAccesibilidad.visible {
            display: flex;
        }
        #panelInfoAccesibilidad {
            background: white;
            border-radius: 20px;
            padding: 30px 25px 25px;
            max-width: 420px;
            width: 100%;
            max-height: 85vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            position: relative;
        }
        #cerrarInfoAccesibilidad {
            position: absolute; top: 14px; right: 14px;
            background: #e74c3c; color: white; border: none;
            border-radius: 50%; width: 34px; height: 34px;
            font-size: 20px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            line-height: 1;
        }
        #cerrarInfoAccesibilidad:hover { background: #c0392b; }
        .info-acc-header {
            display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
        }
        .info-acc-header img {
            width: 52px; height: 52px; border-radius: 50%;
            object-fit: cover; border: 2px solid #27ae60; flex-shrink: 0;
        }
        .info-acc-header h4 {
            margin: 0; color: #2c3e50; font-size: 17px; font-weight: 700;
        }
        .info-acc-header p {
            margin: 0; font-size: 12px; color: #7f8c8d;
        }
        .info-acc-desc {
            background: #eafaf1; border-left: 4px solid #27ae60;
            border-radius: 6px; padding: 12px 14px; margin-bottom: 16px;
            font-size: 13.5px; color: #1e8449; line-height: 1.5;
        }
        .info-acc-titulo {
            margin: 0 0 10px; color: #2c3e50;
            font-size: 14px; font-weight: 700;
        }
        .info-acc-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }
        .info-acc-item {
            background: #f0f9f4; border: 1px solid #a9dfbf;
            border-radius: 8px; padding: 8px 10px;
            display: flex; align-items: center; gap: 7px;
            font-size: 13px; color: #1a5276;
        }
        .info-acc-item.full { grid-column: 1 / -1; }
        .info-acc-item span { color: #27ae60; font-size: 15px; flex-shrink: 0; }
        .info-acc-nota {
            margin: 16px 0 0; font-size: 12px;
            color: #95a5a6; text-align: center;
        }
    `;
    document.head.appendChild(style);

    // -------------------------------------------------------------------------
    // HTML del botón
    // -------------------------------------------------------------------------
    const btn = document.createElement('button');
    btn.id = 'btnInfoAccesibilidad';
    btn.title = 'Información de accesibilidad';
    btn.innerHTML = `<img src="${imgAccesibilidad}" alt="Accesibilidad">`;

    // -------------------------------------------------------------------------
    // HTML del modal (overlay + panel)
    // -------------------------------------------------------------------------
    const overlay = document.createElement('div');
    overlay.id = 'overlayInfoAccesibilidad';

    // Filas del grid de edificios
    const filasEdificios = edificios.map(e =>
        `<div class="info-acc-item"><span>✓</span>${e}</div>`
    ).join('') +
        `<div class="info-acc-item full"><span>✓</span>${edificioEspecial}</div>`;

    overlay.innerHTML = `
        <div id="panelInfoAccesibilidad">
            <button id="cerrarInfoAccesibilidad">×</button>

            <div class="info-acc-header">
                <img src="${imgAccesibilidad}" alt="Accesibilidad">
                <div>
                    <h4>Rutas Accesibles ITP</h4>
                    <p>TecNM Campus Puebla</p>
                </div>
            </div>

            <div class="info-acc-desc">
                El <strong>Instituto Tecnológico de Puebla</strong> cuenta con rutas
                accesibles para personas con movilidad reducida. Estas rutas evitan
                escaleras y obstáculos, garantizando un trayecto seguro por el campus.<br><br>
                <strong>Importante:</strong> Las rutas accesibles actualmente están
                disponibles para <em>ciertos edificios</em> del campus. Consulta la
                lista a continuación.
            </div>

            <h5 class="info-acc-titulo">Edificios con ruta accesible disponible:</h5>
            <div class="info-acc-grid">${filasEdificios}</div>

            <p class="info-acc-nota">
                Para más información, selecciona un edificio en el mapa y activa
                la ruta accesible.
            </p>
        </div>
    `;

    // -------------------------------------------------------------------------
    // Inyectar en el DOM cuando el documento esté listo
    // -------------------------------------------------------------------------
    function inyectar() {
        document.body.appendChild(btn);
        document.body.appendChild(overlay);

        // Abrir modal
        btn.addEventListener('click', function () {
            overlay.classList.add('visible');
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            window.UBICATECVoiceModule && window.UBICATECVoiceModule.activateFromAccessibilityButton({
                sidebarSelector: '#sidebar',
                language: 'es-MX',
                rate: 1
            });
        });

        // Cerrar con el botón ×
        document.getElementById('cerrarInfoAccesibilidad').addEventListener('click', cerrar);

        // Cerrar al hacer clic en el fondo (fuera del panel)
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cerrar();
        });

        // Cerrar con tecla Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('visible')) cerrar();
        });
    }

    function cerrar() {
        overlay.classList.remove('visible');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inyectar);
    } else {
        inyectar();
    }
})();
