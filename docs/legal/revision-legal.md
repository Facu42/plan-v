# Revisión legal de los textos de Plan V

Borrador del 2026-09-29, escrito con el agente `legal-compliance-checker` (apartado A, punto 6).
**No es asesoramiento legal.** Antes de dar los textos por definitivos, los tiene que leer un
abogado o abogada con experiencia en datos personales y salud.

## Qué cubren los textos

- `public/legal/privacidad.html` (Política de privacidad, versión 2026-09-29): quién es
  responsable de qué (la nutricionista de los datos de salud de sus pacientes; Plan V de las
  cuentas, los datos técnicos y la app), qué datos se guardan, para qué, consentimiento para
  datos de salud, la función de inteligencia artificial con permiso por uso, quién ve los datos,
  proveedores en el exterior y transferencia internacional, cuánto se guardan (con la
  historia clínica de 10 años), seguridad, derechos de acceso, corrección y borrado, cómo
  pedirlos desde el menú de la cuenta → "Tus datos", menores, cambios, y el aviso obligatorio de la AAIP.
- `public/legal/terminos.html` (Términos y condiciones, versión 2026-09-29): qué es y qué no es
  Plan V (no es servicio de salud ni de urgencias), cuentas, obligaciones de la nutricionista
  (matrícula, secreto, historia clínica), el acuerdo de Plan V como prestador de servicios por
  cuenta de la nutricionista (artículo 25 de la Ley 25.326), reglas para pacientes,
  inteligencia artificial, suscripción con arrepentimiento y baja, uso correcto, contenido,
  responsabilidad, fin de la cuenta, cambios, ley aplicable y reclamos.
- Leyes: 25.326 (datos personales) y su decreto 1558/2001, 26.529 (derechos del paciente),
  24.240 (defensa del consumidor), Código Civil y Comercial (arts. 26 y 1110), Resolución
  AAIP 47/2018 (seguridad), Disposición 60-E/2016 (transferencia internacional).
- Ninguna de las dos páginas tiene JavaScript ni carga nada externo. Se enlazan entre sí y
  con "/".

## Datos para completar (en las dos páginas)

| Marca | Qué poner | Dónde aparece |
| --- | --- | --- |
| `[RESPONSABLE: nombre o razón social]` | Nombre completo o razón social de quien explota Plan V | Privacidad 1; Términos 1 y 11 |
| `[CUIT]` | CUIT de ese responsable | Privacidad 1; Términos 1 |
| `[DOMICILIO]` | Domicilio legal | Privacidad 1 y 15; Términos 1 |
| `[MAIL DE CONTACTO]` | Mail que alguien lea y conteste (plazos de 10 días y 5 días hábiles) | Varias veces en las dos |
| `[FECHA DE VIGENCIA]` | Fecha desde la que valen los textos | Arriba de las dos |
| `[REGIÓN DE LA BASE]` | Región de Supabase del proyecto `plan-v-app` (se ve en Supabase → Project Settings → General; por ejemplo "Estados Unidos (us-east-1)" o "Brasil (sa-east-1)") | Privacidad 7 |

Para buscar lo que falta: `grep -n "\[" public/legal/*.html`.

## Puntos para el abogado (`[CONFIRMAR CON ABOGADO]`)

En la política de privacidad:

1. **Reparto de papeles** (punto 1): nutricionista responsable de los datos clínicos y Plan V
   encargado; Plan V responsable de cuentas y datos técnicos. ¿Es correcto? ¿Los datos técnicos
   de la cuenta de la paciente quedan bajo Plan V o bajo la nutricionista?
2. **Consentimiento "por escrito"** (punto 4): ¿alcanza una casilla al registrarse para datos
   sensibles (art. 5 Ley 25.326)? ¿Conviene casillas separadas para salud y para
   transferencia internacional?
3. **OpenAI** (punto 5): condiciones vigentes (no entrenar con los datos, cuánto guarda) y si
   hace falta un acuerdo de tratamiento de datos firmado.
4. **Transferencia internacional** (punto 7): Estados Unidos no es país "adecuado". Además del
   consentimiento, ¿hay que firmar las cláusulas modelo de la Disposición 60-E/2016 con
   Supabase, Railway, Vercel y OpenAI, o alcanzan sus condiciones estándar?
5. **Historia clínica** (punto 8): ¿lo que registra una licenciada en nutrición es "historia
   clínica" según la Ley 26.529? ¿La obligación de guardarla 10 años es de la nutricionista
   (lo más probable) y no de Plan V? ¿Cuánto guardar registros de seguridad y el registro de
   pedidos? ¿Qué pasa con la historia clínica cuando la nutricionista deja Plan V?
6. **Menores** (punto 13): cómo aplicar el art. 26 del Código Civil y Comercial (13 a 16 y
   mayores de 16) y quién consiente.
7. **Aviso obligatorio de la AAIP** (punto 15): confirmar que el texto es el vigente.

En los términos:

8. **Menores** (punto 4): mismo tema que el 6.
9. **Nutricionista y la historia clínica** (punto 5): si es la depositaria, si puede cumplir
   guardándola en Plan V, qué pasa al cancelar la cuenta (plazo de descarga, conservación a
   su pedido, costo) y si cada nutricionista debe inscribir su propia base ante la AAIP.
10. **Contrato del artículo 25** (punto 6): si esta cláusula alcanza o hace falta un acuerdo
    firmado aparte; plazo concreto para descargar datos al terminar.
11. **Cobro** (punto 9): si la Ley 24.240 aplica a la nutricionista (contrata para su
    profesión); política de reintegros; botón de arrepentimiento (Res. 424/2020) y botón de
    baja. Revisar de nuevo cuando exista el cobro.
12. **Responsabilidad** (punto 13): validez de las limitaciones frente al art. 37 de la
    Ley 24.240; tope para nutricionistas.
13. **Tribunales y reclamos** (punto 16): tribunales para nutricionistas y enlace vigente de
    la Ventanilla Única Federal.

Además, sin marca en el texto pero conviene preguntar: si el proyecto de nueva ley de datos
personales (reemplazo de la 25.326) avanzó y cambia algo de esto.

## Compromisos que los textos toman y la app tiene que cumplir

Los textos prometen cosas que el equipo tiene que confirmar o construir antes de publicarlos:

- el menú de la cuenta → "Tus datos" con descarga y pedido de borrado, y registro de cada pedido.
- Permiso de la paciente para inteligencia artificial, separado por uso, que se pueda dar y
  sacar desde la app.
- Guardar la fecha y la versión de términos y privacidad que aceptó cada persona.
- Si una nutricionista deriva a una paciente a otra profesional dentro de Plan V, esa
  profesional ve sus datos (confirmar que la app funciona así y que la paciente lo sabe).
- Notas internas de la nutricionista que la paciente no ve (así funciona hoy).
- Avisar a las pacientes cuando su nutricionista cierra la cuenta.
- Avisar incidentes de seguridad a pacientes y nutricionistas.
- Avisar cambios de precio con 30 días y cambios importantes de términos con 15 días.
- Botón de arrepentimiento y botón de baja cuando exista el cobro.
- Datos borrados que quedan en copias de seguridad por un tiempo corto: confirmar qué copias
  hay en el plan de Supabase contratado y cuánto duran.
- Proveedor de mails y proveedor de pagos: cuando se sumen, agregarlos a la tabla del punto 7
  de la política antes de usarlos.

## Inscripción en el Registro Nacional de Bases de Datos (AAIP)

**Sí, hay que inscribir.** El artículo 21 de la Ley 25.326 obliga a inscribir toda base de
datos privada que no sea para uso exclusivamente personal, y la AAIP lo aplica a cualquier
empresa o persona que guarde datos de clientes o usuarios. Plan V guarda datos de
nutricionistas (y técnicos de todas las cuentas) como responsable, así que tiene que inscribirse.

Qué significa para Facundo:

- Es un trámite **gratuito y en línea**, en Trámites a Distancia (TAD,
  tramitesadistancia.gob.ar), con CUIT y clave fiscal: "Inscripción de bases de datos
  personales" de la AAIP.
- Se declara quién es el responsable, qué bases hay (por ejemplo: "usuarias de Plan V",
  "pacientes"), qué datos tienen (incluidos datos de salud), para qué se usan, dónde están
  (incluida la transferencia a Estados Unidos) y qué medidas de seguridad hay.
- Después hay que mantenerlo al día: renovación periódica y avisar cambios importantes
  (por ejemplo, un proveedor nuevo o una finalidad nueva). No tener la inscripción puede dar
  multas y sanciones de la AAIP.
- **Duda para el abogado:** como la nutricionista es la responsable de los datos de sus
  pacientes, en principio ella también debería inscribir su base. Hay que decidir si Plan V
  inscribe la base de pacientes a su nombre (como encargado no correspondería), si ayuda a
  cada nutricionista con una guía, o ambas cosas.

## Frase recomendada para la casilla de registro

Casilla sin marcar de antemano, obligatoria para crear la cuenta, con los enlaces a las dos
páginas. Guardar fecha, hora y versión aceptada.

> Leí y acepto los Términos y condiciones y la Política de privacidad, y doy mi consentimiento expreso para que se traten mis datos de salud, incluso en servidores fuera de Argentina, para los fines que ahí se explican.

Los permisos de inteligencia artificial van aparte, uno por uso, y no son obligatorios.
