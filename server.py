import http.server
import socketserver
import webbrowser
import os
import sys

# Configuración
PORT = 8000
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    # Asegurar que estamos en el directorio del script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Permitir reutilizar el puerto si se cerró hace poco
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}"
            print(f"✅ Servidor iniciado exitosamente!")
            print(f"🌍 Abriendo en: {url}")
            print("⌨️  Presiona Ctrl+C para detener el servidor")
            
            # Abrir navegador automáticamente
            webbrowser.open(url)
            
            # Mantener el servidor corriendo
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 10048: # Error de puerto en uso
            print(f"⚠️  El puerto {PORT} está ocupado.")
            print("Intenta cerrar otras venas de terminal o python.")
        else:
            raise e
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario.")

if __name__ == "__main__":
    run_server()
