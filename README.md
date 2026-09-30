# Una invitación para ti

Página personal en HTML, CSS y JavaScript, con acceso mediante nombre y código, preguntas, dos juegos opcionales y un reporte por correo. Preparada para Vercel; las funciones `api/login.js` y `api/submit.js` validan el acceso y envían el resumen con Resend.

## Personalización

- Ajusta los textos y las opciones en `index.html`.
- Ajusta las ideas del juego de sorpresas en `app.js`.
- En Vercel configura las variables de `.env.example`. Nunca publiques los valores reales en GitHub.
- `GUEST_NAME` es el nombre que ella escribirá. `ACCESS_CODE` es un código para esta invitación, no su contraseña personal.
- `REPORT_TO_EMAIL` recibe las respuestas; `REPORT_FROM_EMAIL` debe usar un remitente autorizado en Resend.

## Publicación

1. Sube esta carpeta a un repositorio privado o con textos que no te importe hacer públicos.
2. En Vercel, importa el repositorio como proyecto sin framework ni comando de compilación.
3. Añade las seis variables de `.env.example` en la configuración del proyecto para Production (y Preview si vas a probar allí).
4. Verifica el dominio remitente en Resend y crea su API key. Configura `REPORT_FROM_EMAIL` usando ese dominio.
5. Publica y prueba el enlace con el nombre y el código. El correo solo se envía al pulsar «Enviar mi respuesta».

El HTML puede verse abriendo `index.html`, pero el login y envío requieren las funciones de Vercel y sus variables. Para desarrollo local, usa `vercel dev` con las variables locales correspondientes. No se almacena la respuesta en una base de datos.

## Antes de compartir

Sustituye el nombre, código, dirección destinataria, remitente y textos generales por los definitivos. Revisa que las opciones de comida y actividades encajen con ella. No uses el login para pedir credenciales de cuentas reales.
