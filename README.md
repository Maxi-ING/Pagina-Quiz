# Una invitación para ti

Página personal en HTML, CSS y JavaScript. La portada ofrece el quiz de la cita, protegido con nombre y código, y una sección independiente de seis juegos que se puede usar sin iniciar sesión. El quiz lleva a la propuesta final que se acepta con un botón. Preparada para Vercel; las funciones `api/login.js` y `api/submit.js` validan el acceso y envían el resumen con Resend.

## Personalización

- Ajusta los textos y las opciones en `public/index.html`.
- Ajusta las ideas del juego de sorpresas en `public/app.js`.
- El juego de memoria ofrece tres dificultades: fácil (3 parejas), medio (6 parejas) y difícil (10 parejas), con intentos y tiempo.
- Los juegos se abren en un área central ampliada sin login. Desde allí se puede volver al inicio o pasar al login del quiz; los resultados jugados se incluyen en el reporte si se acepta la invitación.
- Ajusta la velocidad y las reglas de los juegos de bloques y pajarito en `public/games.js`. Bloques llega al nivel 10 y se completa al despejar 40 filas.
- En `public/extra-games.js` están Atrapa las rosas (45 segundos, dificultad creciente, récord en este navegador) y El paseo de los corazones (cinco niveles, vidas y corazones secretos). Ambos admiten teclado y controles táctiles. El progreso del paseo se reinicia al salir del juego.
- La fecha opcional solo admite desde el día actual; el servidor vuelve a comprobarla en la zona horaria de Lima.
- Cambia el usuario y el código en `lib/config.js`. Los valores iniciales son `chica` y `123`.
- También puedes definir `GUEST_NAME` y `ACCESS_CODE` en Vercel; estas variables tienen prioridad sobre el código.
- El código `123` sirve para probar. Este repositorio es público y cualquiera puede verlo, así que antes de compartir la invitación usa un código largo configurado en Vercel.
- Para enviar correos, configura `RESEND_API_KEY`, `REPORT_TO_EMAIL` y `REPORT_FROM_EMAIL` en Vercel. También se recomienda configurar `SESSION_SECRET` con una cadena aleatoria. Nunca publiques estos valores en GitHub.
- `REPORT_TO_EMAIL` recibe las respuestas; `REPORT_FROM_EMAIL` debe usar un remitente autorizado en Resend.

## Publicación

1. Sube esta carpeta a un repositorio privado o con textos que no te importe hacer públicos.
2. En Vercel, importa el repositorio como proyecto sin framework ni comando de compilación.
3. Configura las variables del correo en Vercel para Production (y Preview si vas a probar allí). El usuario y código pueden quedarse con los valores iniciales mientras revisas el diseño.
4. Verifica el dominio remitente en Resend y crea su API key. Configura `REPORT_FROM_EMAIL` usando ese dominio.
5. Publica y prueba los juegos sin acceder y el quiz con el nombre y el código. El correo solo se envía al pulsar «Acepto la invitación».

El HTML puede verse abriendo `public/index.html`, pero el login del quiz requiere la función de Vercel; el envío también necesita las variables de correo. Para desarrollo local, usa `vercel dev`. Vercel sirve los archivos visuales desde `public/` y ejecuta las funciones desde `api/`. No se almacena la respuesta en una base de datos.

## Antes de compartir

Sustituye el nombre, código, dirección destinataria, remitente y textos generales por los definitivos. Revisa que las opciones de comida y actividades encajen con ella. No uses el login para pedir credenciales de cuentas reales.
