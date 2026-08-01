# 🧘 Web de Afiliados ZenZone

Este es el proyecto de la web de afiliados para **ZenZone** ([zenzone.es](https://zenzone.es)), desarrollado utilizando **Astro**, **Tailwind CSS v4**, **MDX** y **Sitemap**.

---

## 🛠️ Requisitos Previos

- **Node.js**: Versión `>=22.12.0` (recomendado usar la versión LTS activa).
- **Gestor de paquetes**: npm (incluido con Node.js).

---

## 🚀 Instalación y Desarrollo Local

1. **Instalar dependencias:**
   ```sh
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```sh
   npm run dev
   ```
   El sitio estará disponible en [http://localhost:4321](http://localhost:4321).

3. **Compilar para producción:**
   ```sh
   npm run build
   ```
   Este comando compilará el sitio estático optimizado dentro del directorio `./dist/`.

4. **Previsualizar la compilación de producción:**
   ```sh
   npm run preview
   ```
   Permite probar la versión de producción localmente antes del despliegue.

---

## 🌐 Estructura de Rutas y Contenido

El enrutamiento del sitio se basa en archivos dentro del directorio `src/pages/`. A continuación, se detallan las rutas públicas disponibles:

| Ruta (Localhost) | Archivo de Origen | Descripción |
| :--- | :--- | :--- |
| [http://localhost:4321/](http://localhost:4321/) | [index.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/index.astro) | Página de inicio de ZenZone. |
| [http://localhost:4321/mesas-escritorio](http://localhost:4321/mesas-escritorio) | [mesas-escritorio.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/mesas-escritorio.astro) | Catálogo/Comparativas de mesas de escritorio. |
| [http://localhost:4321/sillas-oficina](http://localhost:4321/sillas-oficina) | [sillas-oficina.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/sillas-oficina.astro) | Catálogo/Comparativas de sillas de oficina. |
| [http://localhost:4321/sillas-gaming](http://localhost:4321/sillas-gaming) | [sillas-gaming.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/sillas-gaming.astro) | Catálogo/Comparativas de sillas gaming. |
| [http://localhost:4321/perifericos](http://localhost:4321/perifericos) | [index.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/perifericos/index.astro) | Hub principal de Periféricos. |
| [http://localhost:4321/perifericos/ratones](http://localhost:4321/perifericos/ratones) | [ratones.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/perifericos/ratones.astro) | Comparativas y análisis de Ratones. |
| [http://localhost:4321/perifericos/teclados](http://localhost:4321/perifericos/teclados) | [teclados.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/perifericos/teclados.astro) | Comparativas y análisis de Teclados. |
| [http://localhost:4321/perifericos/auriculares](http://localhost:4321/perifericos/auriculares) | [auriculares.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/perifericos/auriculares.astro) | Comparativas y análisis de Auriculares. |
| [http://localhost:4321/perifericos/monitores](http://localhost:4321/perifericos/monitores) | [monitores.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/perifericos/monitores.astro) | Comparativas y análisis de Monitores. |
| [http://localhost:4321/perifericos/altavoces](http://localhost:4321/perifericos/altavoces) | [altavoces.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/perifericos/altavoces.astro) | Comparativas y análisis de Altavoces. |
| [http://localhost:4321/iluminacion](http://localhost:4321/iluminacion) | [iluminacion.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/iluminacion.astro) | Guía y comparativas de iluminación LED, Screenbars y RGB. |
| [http://localhost:4321/alfombrillas](http://localhost:4321/alfombrillas) | [alfombrillas.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/alfombrillas.astro) | Guía y comparativas de alfombrillas XXL y ergonómicas. |
| [http://localhost:4321/humidificadores](http://localhost:4321/humidificadores) | [humidificadores.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/humidificadores.astro) | Guía y comparativas de humidificadores ultrasónicos y difusores. |
| [http://localhost:4321/[category]](http://localhost:4321/oficina) (ejemplo) | `[category]/index.astro` | Listados dinámicos agrupados por categorías. |
| [http://localhost:4321/[category]/[slug]](http://localhost:4321/oficina/silla-ergonomica) (ejemplo) | `[category]/[slug].astro` | Páginas de producto/artículos individuales dinámicos. |
| [http://localhost:4321/aviso-legal](http://localhost:4321/aviso-legal) | [aviso-legal.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/aviso-legal.astro) | Información legal obligatoria. |
| [http://localhost:4321/cookies](http://localhost:4321/cookies) | [cookies.astro](file:///d:/MIS%20PROYECTOS/WEB%20AFILIADOS%20ZENZONE/mi-web-afiliados/src/pages/cookies.astro) | Política de cookies del sitio web. |

---

## 📦 Comandos y Guía de Despliegue

Dado que el sitio está configurado como un sitio estático (SSG), su despliegue consiste simplemente en subir el contenido generado en el directorio `./dist/` después de ejecutar `npm run build`.

### Opciones de Despliegue Comunes:

1. **Hosting Tradicional (FTP / SSH):**
   - Ejecuta `npm run build`.
   - Sube todos los archivos del directorio `./dist/` a la raíz de tu servidor web (p. ej., `public_html`).

2. **Netlify / Vercel / Cloudflare Pages (Recomendado):**
   - Conecta el repositorio de Git a la plataforma.
   - Configura los siguientes parámetros en los ajustes de build:
     - **Build Command:** `npm run build`
     - **Publish Directory:** `dist`
     - **Node Version:** `22` o superior
   - El despliegue se automatizará en cada `git push` a la rama principal.

---

## 📂 Estructura del Proyecto

```text
mi-web-afiliados/
├── public/              # Archivos estáticos (imágenes, favicons, etc.)
├── src/
│   ├── components/      # Componentes reutilizables de UI (Astro/React/etc.)
│   ├── pages/           # Páginas del sitio (generan las rutas automáticamente)
│   └── layouts/         # Plantillas base de página (estructura HTML común)
├── astro.config.mjs     # Configuración del framework Astro y plugins (Tailwind, Sitemap, MDX)
├── package.json         # Scripts de NPM y dependencias del proyecto
└── tsconfig.json        # Configuración de TypeScript
```

