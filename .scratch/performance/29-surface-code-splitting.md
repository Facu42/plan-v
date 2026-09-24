# Corte 29 — división de carga por superficie

Estado: **completado** (2026-09-08). No se alteraron menús, estado, API ni el
contrato Supabase; sólo el límite de carga de las dos superficies principales.

## Medición reproducible

Mismo comando y condiciones: `npm run build`, antes y después de un único cambio
(`React.lazy` + `Suspense` en `PlanVExperience`).

| Métrica | Antes | Después | Diferencia |
| --- | ---: | ---: | ---: |
| JS de entrada (minificado) | 523.46 kB | 434.27 kB | -89.19 kB (-17.04%) |
| JS de entrada (gzip) | 148.18 kB | 125.10 kB | -23.08 kB (-15.58%) |
| Chunk diferido paciente | — | 48.18 kB / 13.85 kB gzip | bajo demanda |
| Chunk diferido CRM | — | 42.38 kB / 11.70 kB gzip | bajo demanda |

El CSS no cambió: 179.17 kB / 31.50 kB gzip. El bundle inicial aún excede el
warning de Vite (500 kB **antes** del corte; ahora 434.27 kB), por lo que el
warning desapareció.

## Implementación

- `PlanVExperience` carga `PatientApp` y `CrmDashboard` con `React.lazy`.
- Un `Suspense` con estado accesible (`role=status`, `aria-live=polite`) cubre la
  carga puntual del módulo al entrar o cambiar de superficie.
- Login, auth, boot y el selector demo siguen en la entrada porque se necesitan
  antes de conocer la superficie que se renderiza.
- No se creó `manualChunks`: Vite ya produjo dos boundaries deterministas a
  partir de los imports dinámicos, sin separar módulos por proveedor de forma
  artificial.

## Guard y QA

- Nuevo guard: `src/components/PlanVExperience.perf.test.ts`. Evita volver a
  imports estáticos y requiere ambos dynamic imports + `Suspense`.
- RED: guard falló sobre imports estáticos.
- Navegador aislado (demo): paciente → nutricionista → paciente. Cargaron
  `Mi plan` y `Centro de seguimiento`; no hubo overflow horizontal.
- Procesos QA finalizados: API/Vite y Chrome aislado.

## Gates

```text
npm test                 27 archivos / 161 tests ✓
npm run check            ✓
npm run build            112 módulos; entrada 434.27 kB / 125.10 kB gzip ✓
npm audit                0 vulnerabilidades ✓
npm audit signatures     90 firmas verificadas ✓
npm audit attestations   45 attestations verificadas ✓
git diff --check         ✓
```

## No incluido

- No se instaló un analizador de bundles ni Lighthouse: no hay Core Web Vitals
  reportados ni un síntoma de interacción que justifique esa segunda línea de
  trabajo.
- No se dividieron componentes internos: no hay medición que pruebe que mejore
  la carga inicial de manera significativa tras este límite de superficie.
