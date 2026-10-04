# Registro de cambios

Este documento recoge los cambios relevantes realizados en FaktuDash.

## Sin publicar — 30 de septiembre de 2026

### Añadido

- Modo oscuro con detección de la preferencia del sistema y selector manual persistente.
- Paleta de comandos con búsqueda, navegación rápida y atajos de teclado.
- Panel flotante de herramientas rápidas con cierre al pulsar fuera de él.
- Botón independiente para volver al inicio de la página mediante un desplazamiento suave.
- Animaciones de aparición durante el desplazamiento, transiciones, giros y microinteracciones en botones.
- Respuesta háptica en dispositivos compatibles para determinadas acciones.
- Navegación móvil desplegable adaptada a pantallas pequeñas.
- Tokens de diseño para colores, superficies, bordes, sombras, radios y duraciones de animación.
- Guardado automático y recuperación local de borradores en formularios.
- Indicadores de envío, carga y error, junto con pantallas de carga y esqueletos animados.
- Página 404 personalizada y páginas globales para errores recuperables y críticos.
- Página pública de demostración de solo lectura con datos ficticios, accesible sin iniciar sesión.
- Acceso directo a la demostración desde la página de inicio de sesión.
- Página y formulario de contacto con validación, guardado automático y botones para compartir contenido.
- Botones para compartir mediante LinkedIn y WhatsApp.
- Testimonio de producto en la portada.
- Enlace de contacto en el mapa del sitio.

### Cambiado

- Separación del botón para volver arriba y del botón de herramientas para mejorar su accesibilidad.
- El desplazamiento hacia el inicio ahora utiliza una animación progresiva y respeta la preferencia de movimiento reducido.
- La navegación privada en móviles utiliza un menú compacto en lugar de una cuadrícula de enlaces.
- Los formularios de clientes, comunidades, facturas y presupuestos incorporan guardado automático cuando corresponde.
- Los botones y campos comparten estilos, estados de foco, estados de espera y respuestas visuales coherentes.
- La portada elimina bloques y llamadas a la acción repetidos para reducir la carga de decisión.
- La página de precios elimina llamadas a la acción redundantes.
- El diseño general mejora el contraste, los estados al pasar el puntero y la adaptación móvil.
- Los textos de las nuevas funciones están disponibles en español e inglés mediante el sistema de idiomas existente.

### Accesibilidad

- Se añadieron estilos de foco visibles y controles con nombres accesibles.
- Las animaciones se reducen o desactivan cuando el sistema solicita menos movimiento.
- La paleta de comandos, la navegación móvil y los botones flotantes admiten navegación mediante teclado.
- La demostración pública utiliza estados y barras de progreso con atributos semánticos adecuados.

### Corregido

- El panel de herramientas ya no permanece abierto al pulsar fuera de él.
- El botón para volver arriba deja de producir un salto instantáneo en condiciones normales.
- Los estados de carga y error proporcionan una respuesta visible mientras se completa una acción.

## Historial anterior

Los cambios anteriores a esta fecha se conservan en el historial de Git del proyecto.
