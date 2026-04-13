# UBICATEC - Sistema de Navegación del Campus

Sistema web interactivo para la navegación y exploración del campus universitario con mapas 360° y información detallada de edificios.

## 🚀 Inicio Rápido

### Requisitos
- Python 3.x instalado en tu sistema
- Navegador web moderno

### Comandos para Iniciar el Servidor Local

#### Opción 1: Python 3 (Recomendado)
```bash
python -m http.server 8000
```

#### Opción 2: Python 2 (si tienes Python 2)
```bash
python -m SimpleHTTPServer 8000
```

#### Opción 3: Node.js (si tienes Node.js instalado)
```bash
npx http-server -p 8000
```

### Acceso a la Aplicación

Una vez iniciado el servidor, abre tu navegador y visita:

- **Página Principal**: http://localhost:8000/index.html
- **Mapa del Campus**: http://localhost:8000/aula.html
- **Edificio Específico**: http://localhost:8000/edificio.html?id=X (donde X es el número del edificio)

## 📁 Estructura del Proyecto

```
UBICATEC/
├── index.html          # Página principal
├── aula.html           # Mapa interactivo del campus
├── edificio.html       # Página dinámica de edificios
├── data/
│   └── edificios.json  # Base de datos de edificios
├── js/
│   ├── mapa.js         # Lógica del mapa
│   └── edificio.js     # Lógica de edificios
├── css/
│   ├── style.min.css   # Estilos principales
│   └── markers.css     # Estilos de marcadores
├── img/
│   ├── 360/            # Imágenes panorámicas 360°
│   └── edificios/      # Imágenes de edificios
└── Icon/
    └── tabler/         # Iconos Tabler
```

## 🎯 Características

- **Mapa Interactivo**: Navegación con Leaflet.js
- **Búsqueda Inteligente**: Buscador de edificios con filtros
- **Vista 360°**: Visor panorámico con A-Frame
- **Diseño Responsivo**: Compatible con dispositivos móviles
- **Iconos Modernos**: Interfaz con Tabler Icons

## 🔧 Desarrollo

### Detener el Servidor
Para detener el servidor local, presiona `Ctrl + C` en la terminal.

### Puerto Alternativo
Si el puerto 8000 está ocupado, puedes usar otro puerto:

```bash
python -m http.server 8080
```

Luego accede a: http://localhost:8080

## 📱 Despliegue

El proyecto está configurado para despliegue automático en Netlify desde el repositorio de GitHub.

## 🆘 Solución de Problemas

### Error: "Puerto ya en uso"
```bash
# En Windows
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# En Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### Error: "Python no encontrado"
Asegúrate de tener Python instalado y en el PATH del sistema.

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.