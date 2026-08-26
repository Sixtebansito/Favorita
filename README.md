# Sistema de Gestión de Transporte - La Favorita

Un sistema integral diseñado para automatizar y optimizar el proceso de facturación, gestión de guías y liquidación de pagos de transportistas para La Favorita. 

Desarrollado con [Next.js](https://nextjs.org/) y [Prisma ORM](https://www.prisma.io/).

## Características Principales

* **Control de Acceso Basado en Roles:** Paneles separados para `ADMIN` (visibilidad completa de métricas y gestión de tarifarios) y `USER` (vista restringida a la gestión propia).
* **Gestión de Tarifarios:** Registro de matrices de precios (códigos, destinos y valores base) con un esquema de versionamiento por fecha de vigencia.
* **Registro de Guías (Vuelos):** 
  * Evaluación dinámica e instantánea del valor al ingresar el código.
  * Autoselección del valor mayor si el vuelo contiene múltiples códigos.
  * Cálculo dinámico automático del valor del **Ticket** basado en reglas específicas de negocio (según destino y precio base).
  * Posibilidad de añadir Costos Adicionales (peajes, Termo King, desvíos).
* **Generación de Prefacturas (Liquidaciones):** Flujo para auditar las guías "Activas", cuadrarlas y generar liquidaciones consolidadas (incluyendo el desglose del total de guías vs total de tickets).
* **Diseño Adaptativo (Mobile-First):** Interfaz amigable, modo oscuro/claro y componentes optimizados para conductores utilizando dispositivos móviles en la vía.

## Tecnologías

- **Framework:** Next.js (App Router)
- **Base de Datos:** Prisma ORM con SQLite (Para desarrollo)
- **Estilos:** CSS Modules + UI Components
- **Iconos:** Lucide React

## Requisitos Previos

- Node.js (v18 o superior)
- npm o pnpm

## Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd Favorita
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y agrega tu conexión a la base de datos (por defecto usará SQLite):
   ```env
   DATABASE_URL="file:./dev.db"
   ```

4. **Sincronizar la base de datos:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## Scripts de Utilidad

* `npm run dev`: Inicia el servidor en modo desarrollo.
* `npm run build`: Construye la aplicación optimizada para producción.
* `npm run start`: Inicia el servidor en modo producción.
* `npm run lint`: Ejecuta el linter de Next.js.
* `npx prisma studio`: Abre la interfaz gráfica de Prisma para visualizar e interactuar directamente con los datos de la base de datos.

## Licencia

Todos los derechos reservados.
