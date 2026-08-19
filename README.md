🌐 Idioma: Español | English Version

💬 Chat App — Mensajería Instantánea en Tiempo Real Full-Stack

Aplicación web distribuida de comunicación bidireccional en tiempo real con soporte para canales grupales, chats individuales directos, autenticación híbrida y sincronización de estado sin latencia.

🔒 Arquitectura de Real-Time & Persistencia Atómica
⚡ Comunicación Bidireccional con Socket.IO: Arquitectura basada en eventos para el manejo de salas (rooms), transporte de mensajes, notificaciones y sincronización de presencia en tiempo real entre múltiples clientes conectados.

🛡️ Persistencia Atómica en MongoDB: Operaciones a nivel de base de datos utilizando operadores atómicos ($addToSet, $pull) para la adición y eliminación de contactos, evitando condiciones de carrera (race conditions) y garantizando la integridad de los datos.

🔐 Seguridad & Autenticación Híbrida: Flujo de autenticación doble soportado por Json Web Tokens (JWT) con encriptación para usuarios locales e integración directa con Google OAuth 2.0 para un inicio de sesión sin fricción.

☁️ Pipeline de Multimedia en la Nube: Subida, optimización y transformación de imágenes al vuelo mediante la API de Cloudinary para reducir el impacto en el rendimiento de la red.

🛠️ Tech Stack
Frontend & Estado

Core: React 19, TypeScript

Gestión de Estado: Redux Toolkit

Estilos & UI: Tailwind CSS v4

Backend & Servicios

Servidor & Real-Time: Node.js, Express, Socket.IO

Base de Datos: MongoDB Atlas + Mongoose ORM

Autenticación: JWT, Google OAuth 2.0

Almacenamiento Multimedia: Cloudinary API

✨ Características Principales
⚡ Mensajería Instantánea en Tiempo Real: Emisión y recepción de mensajes con manejo de eventos en Socket.IO sin necesidad de recargar la vista.

🔐 Inicio de Sesión Flexible: Autenticación mediante cuenta de Google o registro tradicional por email/contraseña con hash seguro.

💬 Canales y Mensajes Directos: Gestión de salas dinámicas para conversaciones grupales e interacción privada de 1 a 1 entre usuarios.

👤 Gestión Eficiente de Contactos: Añade o elimina contactos con actualización atómica en tiempo real en cliente y servidor.

🖼️ Compartir Archivos Multimedia: Carga optimizada de imágenes alojadas de forma segura en la nube.

🌐 Despliegue Distribuido: Servidor Backend desplegado en Render y cliente Frontend alojado en Vercel con integración continua (CI/CD).

💻 Instalación y Configuración Local
1. Clonar el repositorio
Bash
git clone https://github.com/Federico-Aguirre/Chat-App.git
cd Chat-App
2. Configuración del Backend
Bash
cd backend
npm install
Crea un archivo .env en la carpeta backend con las siguientes variables:

Fragmento de código
PORT=5000
MONGO_URI=tu_conexion_mongodb
JWT_SECRET=tu_secreto_jwt
GOOGLE_CLIENT_ID=tu_google_client_id
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
Iniciar el servidor backend:

Bash
npm run dev
3. Configuración del Frontend
En una nueva terminal:

Bash
cd frontend
npm install
Crea un archivo .env.local en la carpeta frontend:

Fragmento de código
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
Iniciar la aplicación cliente:

Bash
npm run dev
Abre http://localhost:5173 en tu navegador para ver la aplicación funcionando.