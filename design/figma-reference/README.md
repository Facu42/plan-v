# Frontend original de Figma conectado a Plan V

Fuente: Nutrigo `OTolnKfsxUFjaZOhhdb04i`, obtenido por el MCP de Figma con código y captura de 24 nodos: doce pantallas en escritorio y doce versiones móviles. El [inventario](manifest.json) conserva las huellas del código recibido. Actualización: 2026-10-02, PR #46.

Se tradujo el frontend recibido a React y CSS nativo, reutilizando las operaciones y permisos de Plan V. No se instaló Tailwind ni se usan capturas como imágenes de pantalla. `FigmaPatientFront.tsx`, `patient-figma-front.css` y los componentes de cada vista componen los bloques originales y conectan los datos de la API.

Los 19 SVG iniciales están inventariados en `manifest.json`. Otros 62 originales están en `src/assets/nutrigo/front` y [front-assets.json](front-assets.json), con nodo, origen, dimensiones, tamaño y SHA-256. Se conservaron sus bytes y dimensiones de raíz. No hay URLs temporales de assets de Figma en la aplicación. Referencias y capturas de comprobación permanecen locales en `.gstack/figma-reference` y `.gstack`.

Medidas comprobadas: escritorio 1440, navegación 223, Inicio 892 + 325, cabecera 50 con separación 28, contenido 28; móvil 390 con cabecera 64 y márgenes 16. Menú tiene imagen 298, destacado 670 y macros 2 × 2 en celular. Receta conserva imagen 275, bloques en orden móvil y Facts 441 con nueve filas. Progreso mantiene el área gris 440 × 674 / 358 × 556 y sus conectores originales. Compartir recurso usa cuatro botones 30 × 30 con SVG 18 y dos espacios de videos de 160 de alto.

Plan V conserva marca, español y datos de su API. Dificultad, puntuación de salud, cocción, reseñas, utensilios, notas y nutrientes adicionales no disponibles muestran «—» o un estado vacío dentro de sus bloques. Las imágenes reales siguen siendo dinámicas; sin foto, permanece el relleno gris. Los autores salen del catálogo real. Los videos permanecen vacíos porque la API no tiene un catálogo.

Defaults explícitos: compras muestra cantidades/estado en el gráfico original porque no hay precios; descanso muestra horas y energía declaradas, sin inventar fases; calorías muestra consumo revisado de siete días, quemadas «—». Pasos y metas de peso ausentes permanecen vacíos. Los pesos respetan períodos y permiso de medidas; las fotos privadas se abren desde Mis registros.

Figma no dibuja el CRM ni estos estados operativos. Pacientes, Ficha, Plan y selector conservan la lógica de Plan V con la misma familia visual. Los formularios se abren en un diálogo que contiene el foco y protege guardados. Los cinco símbolos sociales del pie son decorativos: no simulan cuentas de Plan V. Los botones de compartir del recurso copian el enlace para la red indicada; «Compartir con otras apps» usa el selector nativo.

[browser-verification.json](browser-verification.json) registra recorridos y medidas sin contenido de pacientes. La comprobación usa datos ficticios locales: no equivale a comparar las 24 capturas píxel por píxel ni a verificar producción. El navegador automatizado rechazó la copia al portapapeles; se comprobó el estado de error y el enlace sin selección privada, sin afirmar que se copió o publicó en redes.
