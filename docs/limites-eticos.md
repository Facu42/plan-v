# Límites éticos y legales — copiloto clínico Plan V (ARG)

Fecha: 2026-08-30. v0 de producto (reglas operativas). Citas verificadas contra textos oficiales (Infoleg / argentina.gob.ar / Boletín Oficial / normas.gba.gob.ar). Corte de relevamiento: 30 ago 2026.

Las **7 reglas de producto** de abajo son el techo operativo. Lo legal no las ensancha ni las sustituye: las sostiene.

## Reglas que no se negocian (producto)

1. **No diagnóstico.** Ni de enfermedad, ni de déficit, ni de “esto te está inflamando”. Ni en ficha, ni en mensaje, ni en nota.
2. **No receta.** Ni fármacos, ni suplementos como indicación, ni planes de ayuno/ketosis/etc. como orden. El menú lo arma y confirma la profesional.
3. **El profesional confirma.** `ai_briefs.status` arranca `pending_review`. `messages.suggested_by_ai` nace con `sent_at = null`. Una foto nace `pending_review`. Nada de esto se auto-envía ni se auto-confirma.
4. **Dos audiencias.** Lo que ve el paciente no es lo que ve Vero. `note_for_nutri` y `suggested_action` no existen en la app del paciente.
5. **Estimación ≠ medición.** Macros y porciones se etiquetan como estimación. `confidence < 0.45` no alimenta adherencia.
6. **Datos de salud son sensibles.** RLS: el nutri solo ve sus pacientes; el paciente solo lo suyo. Sin `note_for_nutri` del lado paciente. Sin entrenar modelos con fotos de pacientes salvo contrato explícito (v0: no).
7. **Fuera de v0:** diagnóstico automático, receta médica, marketplace de suplementos, red social, consejo médico general.

## Qué sí puede hacer el copiloto

Hacia **Vero** (ficha / brief):
- resumir fotos, check-ins, agua, sueño, recordatorios no cumplidos
- marcar desvío vs `meal_slots`
- sugerir *próxima acción de producto*: `mensaje` | `ajuste_menu` | `turno`
- redactar un borrador de mensaje (humano, no clínico-legal)

Hacia **el paciente**:
- recordatorios de comida / agua / sueño ya configurados
- mostrar su menú y que la foto quedó registrada
- **no** interpretar la foto (“comiste mal”, “felicitaciones, bajaste carbs”)

## Alcance profesional (Lic. en Nutrición, no medicina)

Plan V asiste a una **Lic. en Nutrición**, no a un médico. El copiloto no ensancha ese alcance: no habla como médico, no completa receta electrónica, no opina sobre fármacos ni estudios. Si un dato parece médico (síntoma agudo, medicación, lab), la acción es **turno** o “que lo mire Vero”, nunca una indicación.

### Medicina vs nutrición

- El **diagnóstico, pronóstico y tratamiento de enfermedades** es ejercicio de la medicina, reservado a médicos matriculados (Ley 17.132, arts. 2.a y 13). Ámbito original: Capital Federal y ex Territorio Nacional de Tierra del Fuego; las provincias tienen leyes locales análogas.
- Exceder el título o la autorización, o anunciar/prescribir/aplicar habitualmente medios de tratamiento de enfermedades, configura el art. **208 del Código Penal** (prisión de 15 días a 1 año). La Ley 24.301 (art. 7) remite expresamente a ese tipo penal.
- **No existe una ley nacional única** de ejercicio de la nutrición para todo el país. La Ley 24.301 rige el ejercicio del Lic. en Nutrición **en Capital Federal / CABA**. Cada provincia tiene su propia ley y colegio/matrícula. *(No hay Ley 24.140 de nutricionistas; esa numeración no corresponde a esta materia.)*

### Qué sí puede hacer la profesional (y qué no)

**Puede** (con título y matrícula de la jurisdicción):
- Promoción, protección, recuperación y rehabilitación de la salud **dentro de las incumbencias del título** (Ley 24.301, arts. 3 y 4).
- Atender personas sanas o enfermas; en CABA, las enfermas **derivadas por profesionales médicos** (Ley 24.301, art. 4).
- En PBA: programar regímenes para sanos; programar regímenes dietoterapéuticos para enfermos **previo diagnóstico y derivación médica** (Ley 13.272, art. 2).
- **Diseñar, prescribir y evaluar planes alimentarios** (promoción/prevención y con fines terapéuticos) como actividad profesional **reservada al título** de Lic. en Nutrición (Res. ME 2619/2023, Anexo V; Ley 24.521 art. 43). Eso es prescripción **dietética**, no receta de medicamentos. El menú lo firma la profesional, no la IA (regla 2 y 3).

**No puede** (CABA Ley 24.301 art. 12; PBA Ley 13.272 art. 11; patrón reiterado en otras provincias):
- Prescribir, administrar o aplicar **medicamentos** (PBA agrega fármacos, sustancias químicas o fórmulas magistrales).
- Usar instrumental médico o hacer actos ajenos a su competencia.
- Prometer resultados, publicar falsos éxitos o engañar (también Código Penal 208 inc. 2).
- Delegar facultades privativas en personal no habilitado, ni prestar la firma/nombre a terceros (Ley 24.301 arts. 7 y 12.f). La IA no es profesional: no “ejerce”; el acto es de la licenciada.

**Incertidumbre — suplementos / nutroterápicos.** Los medicamentos están prohibidos con claridad. Algunas provincias (p. ej. Salta, Ley 8.194) habilitan productos nutroterápicos industriales; PBA es más estricta. Plan V no indica suplementos (regla 2). No resolver esto en producto hasta dictamen por jurisdicción.

**Incertidumbre — “diagnóstico nutricional”.** La formación de grado habla de evaluación y diagnóstico alimentario-nutricional (Res. 2619/2023 y planes de estudio). Eso **no** es diagnóstico médico de enfermedad. La regla 1 del producto es más estricta que el piso legal y se mantiene: el copiloto no diagnostica nada.

## Paciente: información, consentimiento, historia clínica

Ley **26.529** (mod. Ley 26.742), de orden público. Aplica a la relación con **profesionales e instituciones de la salud**, no solo médicos.

- Consentimiento informado **previo** a toda actuación en el ámbito médico-sanitario (art. 6). Lo da el paciente al **profesional interviniente**, no a un modelo. La IA no sustituye esa información.
- Derechos: trato digno, intimidad, confidencialidad de datos sensibles (art. 2.c–d, con remisión a Ley 25.326), autonomía, información sanitaria (incluye el derecho a **no** recibirla).
- Historia clínica: documento obligatorio; el paciente es titular; copia en 48 h (arts. 12–14). Puede ser informatizada si se garantiza integridad, autenticidad, inalterabilidad, perdurabilidad y recuperabilidad, con accesos restringidos (art. 13). Las **prescripciones dietarias** forman parte de la HC (art. 16). Guarda mínima: **10 años** desde la última actuación (art. 18).
- Teleasistencia habilitada por Ley 27.553 (art. 2 bis de la Ley 17.132): solo prácticas autorizadas, en plataformas/protocolos de la autoridad de aplicación, respetando 26.529 y 25.326.

Implicancia para Plan V (sin nuevas reglas de producto): el consentimiento de uso de la app y del tratamiento de datos no reemplaza el consentimiento clínico de la consulta. El menú y la evolución van a la HC de la profesional.

## Datos personales y salud

Ley **25.326** (regl. Decreto 1558/2001). Autoridad de aplicación: **AAIP**.

- La información referente a la **salud** es **dato sensible** (art. 2). Nadie está obligado a proporcionarlo (art. 7.1).
- Establecimientos y **profesionales de ciencias de la salud** pueden recolectar y tratar datos de salud de quienes estén o hayan estado bajo su atención, respetando el **secreto profesional** (art. 8). Encaja con la ficha del paciente de Plan V bajo la profesional.
- Consentimiento para el tratamiento: libre, expreso e informado, por escrito o medio equivalente (art. 5). Informar finalidad, responsable, carácter obligatorio/facultativo, consecuencias y derechos ARS (art. 6). Excepción contractual/profesional cuando los datos sean necesarios para esa relación (art. 5.2.d) — no dispensa informar ni las medidas de seguridad.
- Calidad: ciertos, adecuados, pertinentes, no excesivos; no usar para finalidades incompatibles; destruir cuando dejen de ser necesarios (art. 4).
- Seguridad y confidencialidad (arts. 9–10). Cesión a terceros: consentimiento previo, salvo excepciones (art. 11). Transferencia internacional prohibida a países sin nivel adecuado de protección, con excepciones (art. 12).
- Inscripción de bases destinadas a dar informes (arts. 21 y 24). Encargado de tratamiento: contrato, finalidad limitada, destrucción al terminar salvo autorización (art. 25).
- Impugnación de valoraciones: actos judiciales/administrativos no pueden fundarse **solo** en tratamiento informatizado de perfil (art. 20). No es una prohibición general de IA clínica, pero refuerza la regla 3 (humano confirma).
- Sanciones administrativas AAIP (art. 31) y tipos penales 117 bis / 157 bis del Código Penal (art. 32 de la 25.326).

**Fotos de comidas + ficha.** Si identifican o hacen identificable a la persona (o se vinculan a la ficha), son datos personales; el contexto clínico las trata como **salud / sensibles**. La regla 6 (RLS, no entrenar modelos con fotos de pacientes en v0) es la postura conservadora correcta. Entrenar o ceder a un LLM de terceros sin base legal + contrato de encargado + (si aplica) transferencia internacional adecuada es el riesgo principal.

**2024–2026.** La 25.326 **sigue vigente**. Hay proyectos de reforma en el Congreso (p. ej. 1948-D-2025 y otros); **no son ley**. La UE renovó la decisión de adecuación de Argentina (ene 2024) — relevante si hay transferencia al EEE, no cambia el régimen interno.

## Receta electrónica — quién puede recetar

- Ley **27.553** (texto act. por DNU 70/2023): prescripción y dispensación de medicamentos y **toda otra prescripción** solo por plataformas electrónicas habilitadas. Aplica a receta **médica, odontológica o de otros profesionales sanitarios legalmente facultados a prescribir** (art. 2).
- Decreto **345/2024** + Ministerio de Salud: desde el **1° de enero de 2025**, receta electrónica como única modalidad para medicamentos, vía plataformas inscriptas en **ReNaPDiS**. Papel solo por excepción (conectividad / falla).
- Resolución **2214/2025**: amplía el concepto de prescripción electrónica a dispositivos, estudios, prácticas y procedimientos (plazos de adecuación 2025).
- Quien prescribe se valida contra **REFEPS/SISA**.

La Lic. en Nutrición **no está facultada a recetar medicamentos**. La 27.553 no le crea esa facultad. “Prescribir un plan alimentario” es acto profesional dietético (Res. 2619/2023), no receta de fármaco en ReNaPDiS. Plan V **no** emite receta electrónica ni completa recetarios (reglas 2 y 7).

## IA en salud en Argentina (al 30 ago 2026)

**No hay ley ni reglamento vinculante específico de “IA clínica” o “IA en salud”.** No hay autorización, registro ni estándar técnico obligatorio para un copiloto de nutrición.

Lo que sí hay (soft law / institucional, no habilita ni prohíbe el producto):

- AAIP, **Resolución 161/2023**: Programa de transparencia y protección de datos personales en el uso de IA.
- AAIP, **Guía** para entidades públicas y privadas (transparencia y datos personales para una IA responsable; PDF 2025, elaborada 2024). Recomendaciones: evaluación de impacto, equipos multidisciplinarios, explicabilidad, seguridad de datos, ciclo de vida completo. **No es norma de cumplimiento obligatorio** con sanciones propias.
- **Decreto 893/2025**: crea la Comisión Nacional de Bioética (Ministerio de Salud) para asesorar y fijar estándares éticos sobre investigación y **nuevas tecnologías** en salud. Organismo rector de evaluación ética; al corte de este brief **no se verificó** un estándar técnico publicado y vinculante para IA en consultorio.
- Documentos de consenso de sociedades (AMA / SAIA y similares): **no son derecho vigente**.

La guía AAIP y la 25.326 art. 20 alinean con la regla 3 (humano en el loop) y la 4 (no mostrar al paciente el razonamiento clínico de la IA).

## Incertidumbres (no bloquean v0)

- Matrícula y código de ética son **jurisdiccionales**. v0 opera con una profesional en una jurisdicción; al SaaS multi-provincia hay que parametrizar matrícula + ley local.
- Ley 24.301 dice “Capital Federal”; CABA la replica en su digesto (P-1911). El gobierno de la matrícula en CABA quedó en la autoridad sanitaria local — confirmar trámite vigente al onboarding de cada nutri.
- Suplementos: ver arriba; el producto ya los deja afuera.
- Reforma de datos personales y eventual regulación de IA en salud: vigilar AAIP, Congreso y Comisión Nacional de Bioética. Hasta que haya norma, el techo es 25.326 + 26.529 + las 7 reglas.

## Fuentes

Textos verificados (oficiales o republicación oficial). No se cita ninguna norma cuyo número no se haya contrastado.

**Ejercicio profesional**
- Ley 17.132 (ejercicio de la medicina, odontología y colaboradores). Infoleg: https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/19429/texact.htm
- Ley 24.301 (Lic. en Nutrición, Capital Federal). Infoleg: https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/697/norma.htm — también https://www.argentina.gob.ar/normativa/nacional/ley-24301-697/texto
- Ley 13.272 (PBA, colegiación y ejercicio). https://normas.gba.gob.ar/documentos/BjYPXSyx.html
- Resolución ME 2619/2023 (estándares y actividades reservadas, Licenciatura en Nutrición; Anexo V). Boletín Oficial: https://www.boletinoficial.gob.ar/detalleAviso/primera/299040/20231124 — ficha: https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-2619-2023-393664
- Ley 24.521 art. 43 (títulos de interés público). Contexto de la Res. 2619/2023.
- Código Penal, art. 208 (ejercicio ilegal del arte de curar). Infoleg: https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/16546/texact.htm

**Paciente / HC / teleasistencia**
- Ley 26.529 (texto actualizado, incl. Ley 26.742). Infoleg: https://servicios.infoleg.gob.ar/infolegInternet/anexos/160000-164999/160432/texact.htm
- Ley 27.553 (recetas electrónicas o digitales; teleasistencia). Texto actualizado: https://www.argentina.gob.ar/normativa/nacional/ley-27553-340919/actualizacion

**Datos**
- Ley 25.326. Infoleg: https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm — texto actualizado: https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790/actualizacion

**Receta electrónica (2024–2025)**
- Decreto 345/2024. https://www.argentina.gob.ar/normativa/nacional/decreto-345-2024-398297/texto
- Ministerio de Salud, Receta electrónica / ReNaPDiS: https://www.argentina.gob.ar/salud/digital/renapdis/receta-electronica
- Resolución MS 2214/2025: https://www.argentina.gob.ar/normativa/nacional/415349/texto

**IA (no hay regulación específica de IA-en-salud)**
- AAIP Res. 161/2023: https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-161-2023-389231/texto
- Guía AAIP (PDF): https://www.argentina.gob.ar/sites/default/files/guia_ai-final-2025.pdf — anuncio: https://www.argentina.gob.ar/noticias/guia-de-la-aaip-para-usar-la-inteligencia-artificial-de-manera-responsable — índice: https://www.argentina.gob.ar/aaip/documentos-de-inteligencia-artificial
- Decreto 893/2025, Comisión Nacional de Bioética. Boletín Oficial: https://www.boletinoficial.gob.ar/detalleAviso/primera/336388/20251218 — noticia oficial: https://www.argentina.gob.ar/noticias/el-gobierno-nacional-crea-la-comision-nacional-de-bioetica

*Este brief no es dictamen jurídico. Para onboarding multi-provincia o cambio de las 7 reglas, hace falta abogado local.*
