# Publicación del dashboard web — 8 de octubre de 2026

Facundo autorizó «aplicar a produccion» después del cierre de Modelos. El paquete reúne la cadena dependiente Alimentos (#70), Recetas (#71), Planes (#72) y Modelos (#73). Se integra main 038afa2 para conservar la pantalla de paciente y fotos de ingredientes ya publicadas. No incluye otros PR pendientes, Academy ni desarrollo mobile.

## Base de producción

Proyecto existente plan-v-app (wvosvlxpfytokwfbcero). Ocho migraciones aplicadas mediante Supabase MCP; sin nuevos recursos ni cambios de proveedores/configuración. ingredient_covers ya estaba aplicada y no se repitió.

| Archivo local | Versión registrada | SHA-256 |
|---|---|---|
| 20261007160000_food_catalog.sql | 20261008134853 | FD92D1CD1237EF98D9E9AAC09E319AF9BF0615FDD728CA5E355A1A300E7650F1 |
| 20261007173000_recipe_catalog_composition.sql | 20261008134859 | C6F1ABD3FD2193EF72C7657FBB6024034C7C41BB22DD42726873DC3D7FF9520E |
| 20261007190000_professional_recipe_favorites.sql | 20261008134907 | 8C5564ECBC9E4A13540916572992DA4FD62AF29BA110C88B0D2FBECFE173988C |
| 20261007210000_recipe_culinary_categories.sql | 20261008134915 | 4CF92D5424B7A6DA90417795E1744EF8CDB5E7C10E2D9024F3B6B4279C5CA24C |
| 20261007230000_meal_components.sql | 20261008134919 | 3A8990183DDA85E4E6DA1BED15E8609A8A70E75641731FABF99E422529F6C9E1 |
| 20261008013013_professional_models.sql | 20261008134922 | 1F31376C3A4690CE1EEA668E08AEF775BB076B815DCE1CB1919F2261F9AB5CAC |
| 20261008022927_apply_professional_models.sql | 20261008134925 | 25AEE2DE42B268E4F42811373F3596CE3C7B0B9E4E3FE0CFE9B85AE302ED1420 |
| 20261008131756_plan_guidance_models.sql | 20261008134927 | AED9DEDEE4DD0938B5DBFFAE1A8C2ADFAF8C4A482A62630BF2D8188D45821D20 |

Comprobación posterior: columnas catalog_recipe, components y guidance presentes; tablas nuevas con RLS, sin lectura anónima; funciones internas de las envolturas sin permiso para anon/authenticated. APIs nuevas restringidas a sesión con comprobaciones de profesional/propiedad y revisión. Asesor de seguridad: mismos 22 avisos informativos y 3 avisos de vistas previas; funciones ejecutables autenticadas pasan de 119 a 125 por seis APIs públicas intencionales y probadas. [Referencia del asesor](https://supabase.com/docs/guides/database/database-linter?lint=0028_authenticated_security_definer_function_executable).

## Integración y comprobaciones

La integración detectó y corrigió dos omisiones antes del despliegue: las fotos de ingredientes de componentes no se encolaban/decoraban; el consumidor de paciente no leía componentes e indicaciones. Se conservan snapshots clínicos, versiones y cantidades. El detalle usa la ventana existente del archivo y las indicaciones publicadas quedan encima de la grilla; el menú incluye todas las recetas de los componentes.

Pruebas de regresión primero fallaron y luego pasaron. QA local ficticia a 1440: receta de 2 porciones y alimento de 50 g visibles, nota conservada, ventana de detalle y apertura de receta correctas, sin desbordamiento horizontal. Capturas locales en evidencia-modelos. No equivalen a una sesión autenticada de producción.

El PR #73 se integró el 2026-10-08 a las 11:04 (Argentina), commit 03d405ba9c6e700e44e6509a793b93f75c34bc11. Los PR dependientes #70–#72 se cerraron después de verificar que todos sus commits están incorporados en main.


Verificación local final integrada: 305 archivos, 2114 pruebas aprobadas y 2 omitidas; tipos, compilación y control de migraciones aprobados. Revisiones independientes de código y funcionamiento sin bloqueantes. El ensayo CI anterior pasó 27 casos con sesiones firmadas, pero su navegador falló por un selector de calorías ambiguo del nuevo editor: se adapta el recorrido y se exige repetir antes del merge.

## Publicación comprobada

El ensayo final del PR pasó 27 pruebas con sesiones firmadas y 42 comprobaciones de navegador en Supabase descartable: creación, publicación, asignación, conservación de borradores y versiones, edición, recarga y reinicio. [Sesiones y navegador](https://github.com/Facu42/plan-v/actions/runs/37788399512), [CI general](https://github.com/Facu42/plan-v/actions/runs/37788399491).

Los servicios no iniciaron inmediatamente su despliegue automático. Se conectó de nuevo la misma fuente Facu42/plan-v@main para API/worker sin fijar SHA ni cambiar variables, réplicas o comandos; Vercel se desplegó desde el commit exacto mediante su API sobre el proyecto existente. Todos mantienen las funciones anteriores y la configuración de proveedores vigente.

| Servicio | Despliegue de 03d405b | Resultado |
|---|---|---|
| Web | dpl_4oMKjYF2D2hgCzToSD3JZQSQLg9s | READY, alias plan-v-eight.vercel.app asignado |
| API | 4af2c65c-676c-484e-9178-0bb75bd69afa | SUCCESS, /api/health 200 con SHA correcto |
| Worker | 50b55e23-69ce-45aa-9b2f-8ba88cafe0e3 | SUCCESS, mismo SHA y una réplica activa |

No se crearon cuentas ni se modificaron fichas clínicas de producción para esta publicación. La comprobación clínica completa usa sesiones ficticias descartables y demo local. La comprobación productiva acredita migraciones, permisos, despliegue y salud de servicios; no se presenta como un recorrido autenticado de producción. No se ejecutó una generación IA paga ni se cambió su proveedor.

La API también devolvió /api/ready 200, worker externo disponible, sin trabajos en espera, reservados ni fallidos, y SHA 03d405b. El dominio público se comprueba sin sesión; no se copian datos reales.
