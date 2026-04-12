# Aurum Peptides — Sitio Web

## 🚀 Guía de Deployment en GitHub Pages

### Paso 1: Crear el repositorio
1. Ve a [github.com/new](https://github.com/new)
2. Nombre del repo: `aurum-peptides` (o `aurumpeptides.github.io` si quieres que sea tu sitio principal)
3. Hazlo **público** (GitHub Pages gratuito requiere repo público)
4. NO marques "Add README" (ya tienes uno)
5. Click **Create repository**

### Paso 2: Subir archivos
**Opción A — Desde la web (más fácil):**
1. En tu repo nuevo, click **"uploading an existing file"**
2. Arrastra TODOS los archivos de esta carpeta (index.html, imágenes, etc.)
3. Click **Commit changes**

**Opción B — Desde terminal:**
```bash
cd aurum-peptides-github
git init
git add .
git commit -m "Lanzamiento Aurum Peptides"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/aurum-peptides.git
git push -u origin main
```

### Paso 3: Activar GitHub Pages
1. Ve a **Settings** → **Pages** (menú lateral izquierdo)
2. Source: **Deploy from a branch**
3. Branch: **main** / **/ (root)**
4. Click **Save**
5. Espera 2-3 minutos
6. Tu sitio estará en: `https://TU-USUARIO.github.io/aurum-peptides/`

---

## ⚙️ Configuración Obligatoria

### 1. WhatsApp
Abre `index.html` y busca `521XXXXXXXXXX`. Reemplázalo con tu número real:
- Formato: `521` + 10 dígitos (ej: `5215551234567`)

### 2. Tiendanube
Busca el bloque `CONFIG` al inicio del `<script>` y actualiza:
```javascript
var CONFIG = {
  whatsapp: '5215551234567',
  tiendanube: 'https://aurumpeptides.mitiendanube.com',
  productLinks: {
    'retatrutide': '/productos/retatrutide/',
    // ... actualiza cada URL con la real de tu tienda
  }
};
```

### 3. Dominio personalizado (opcional, después)
Cuando compres `aurumpeptides.mx`:
1. Crea un archivo `CNAME` con el contenido: `aurumpeptides.mx`
2. En tu proveedor de dominio, agrega un registro CNAME: `TU-USUARIO.github.io`
3. En GitHub Pages Settings, escribe tu dominio personalizado

---

## 📋 Estructura de Archivos
```
index.html              ← Página principal (landing + catálogo)
peptide_detail.html     ← Página de detalle de producto
catalogo_viales.html    ← Catálogo visual de viales
favicon.png             ← Icono del navegador
logo_*.png              ← Logos
banner_*.png            ← Imágenes hero y banners
producto_*.png          ← Fotos de productos
label_*.png             ← Etiquetas de productos
vial_*.png              ← Fotos de viales
box_*.png               ← Fotos de empaque
```

## 🏪 Integración con Tiendanube
La estrategia es:
- **GitHub Pages** = Tu vitrina premium (branding, catálogo, información)
- **Tiendanube** = Tu checkout (pagos, envíos, gestión de pedidos)

Los botones "🛒 Comprar en tienda" redirigen a tu Tiendanube.
Los botones "Agregar" y "Pedir por WhatsApp" funcionan como respaldo.
