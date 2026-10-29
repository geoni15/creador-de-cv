# Creador de CV

Creador de hojas de vida open source: varias versiones del currículum, edición, duplicado y exportación a PDF en A4, en español o inglés, sin marcas de agua.

**Demo:** [geoni15.github.io/creador-de-cv](https://geoni15.github.io/creador-de-cv/)

> La demo pública funciona sin servidor: guarda las hojas en el almacenamiento del navegador (`localStorage`). Para usar la app completa con MySQL, ejecútala localmente como se explica abajo.

## Funciones

- Varias hojas por persona, con nombre interno de versión (no se imprime).
- Foto cuadrada con recorte automático (JPG, PNG o WebP, hasta 10 MB).
- Secciones de perfil, experiencia, formación, habilidades e idiomas.
- Seis temas de color para la hoja, guardados con cada versión del currículum.
- Hoja de vida en español o inglés (los datos se escriben una sola vez).
- Vista previa e impresión A4 con `Imprimir / PDF → Guardar como PDF`.
- Buscador, filtros por idioma, métricas del portafolio y modo oscuro.
- App de escritorio para Windows que funciona sin conexión ni instalación.
- Version local: guardado en MySQL. Demo pública y app de escritorio: guardado en el equipo.

## Stack

- Frontend: React 19 + Vite.
- Backend: Express 5 + MySQL 8 (`mysql2`).

## Requisitos

- Node.js 20 o superior.
- MySQL 8 en ejecución (solo para la version local completa). Por defecto se conecta a `localhost:3306` con usuario `root` y contraseña vacía. La base de datos `creador_cv` y su tabla se crean solas la primera vez.

## Desarrollo

```bash
cd backend && npm install
cd ../frontend && npm install
```

```bash
# Terminal 1 — API y MySQL
cd backend
npm run dev
```

```bash
# Terminal 2 — interfaz con recarga en vivo
cd frontend
npm run dev
```

Abre `http://localhost:5174`. Vite envía `/api` al backend en `http://localhost:3100`.

## Producción local

```bash
cd frontend
npm run build
```

```bash
cd backend
npm start
```

El backend sirve la interfaz compilada y la API en `http://localhost:3100`.

## Demo estática (sin backend)

```bash
cd frontend
npm run build:demo
```

El build de demo usa `VITE_LOCAL_MODE` (ver `frontend/.env.demo`) y guarda todo en `localStorage`, así que puede publicarse en cualquier hosting estático. Esta es la versión que corre en GitHub Pages.

## App de escritorio (Windows, offline)

Descarga el ejecutable desde [Releases](https://github.com/geoni15/creador-de-cv/releases/latest), descomprime el ZIP y abre `Creador de CV.exe`. No requiere instalar nada ni conexión a internet: las hojas se guardan en el equipo.

> Windows puede mostrar el aviso de SmartScreen por ser un ejecutable sin firma digital. Elige "Más información" y luego "Ejecutar de todas formas".

Para compilarla tú mismo:

```bash
cd frontend
npm run build:demo

cd ../desktop
npm install
npm run sync
npm run pack
```

El resultado queda en `desktop/release/Creador de CV-win32-x64/`. La app empaqueta el build de demo, por lo que no usa el backend ni MySQL.

## Configuración

Copia `backend/.env.example` a `backend/.env` si necesitas cambiar los valores:

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `PORT` | `3100` | Puerto del backend. |
| `HOST` | `0.0.0.0` | Interfaz de escucha. |
| `DB_HOST` | `localhost` | Servidor MySQL. |
| `DB_PORT` | `3306` | Puerto MySQL. |
| `DB_USER` | `root` | Usuario MySQL. |
| `DB_PASSWORD` | vacío | Contraseña MySQL. |
| `DB_NAME` | `creador_cv` | Base de datos; se crea si no existe. |
| `CORS_ORIGIN` | `http://localhost:5174,http://127.0.0.1:5174` | Orígenes permitidos en desarrollo. |
| `FRONTEND_DIST` | vacío | Ruta alternativa a la carpeta compilada. |

En el frontend, `VITE_API_URL` cambia la base de la API (por defecto `/api`) y `VITE_LOCAL_MODE=1` activa el modo demo sin backend.

## Estructura

```text
backend/    API Express + MySQL (validación, CRUD, duplicado, resumen)
frontend/   React + Vite (interfaz, hoja imprimible, estilos)
desktop/    Electron (app offline para Windows)
```

## Licencia

[MIT](LICENSE)
