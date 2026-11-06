import { CalendarDays, Check, CircleDollarSign, Clock3, Heart, LayoutGrid, MessageCircle, Plus, ClipboardList, Users } from 'lucide-react'
import { Avatar, Bar, Badge, Button, Collapse, Count, Roll, Row, Stage, States, Window, type Act } from '../../kit'
import './nutridash.css'

// Nutridash, el panel de la nutri: aprobar un plan desde Pendientes y ver
// entrar un pago de Mercado Pago que mueve lo cobrado y lo que falta cobrar.

type S = {
  approved: boolean
  fade: boolean
  planRow: boolean
  pending: number
  paid: boolean
  cobrado: number
  porCobrar: number
}

const initial: S = { approved: false, fade: false, planRow: true, pending: 11, paid: false, cobrado: 1280000, porCobrar: 162000 }
const POSTER: S = { approved: true, fade: false, planRow: false, pending: 10, paid: true, cobrado: 1314000, porCobrar: 128000 }

const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')
const REST = { wide: { x: 470, y: 120 }, compact: { x: 260, y: 150 } }
const I = { size: 15, strokeWidth: 1.6 }

async function script(a: Act<S>) {
  await a.wait(700)

  // 1. Aprobar el plan que armó el asistente
  await a.move({ at: 'aprobar', x: 0.82, y: 0.7 })
  await a.wait(250)
  await a.click()
  await a.set({ approved: true })
  await a.wait(700)
  await a.set({ planRow: false, pending: 10 })
  await a.move('rest')
  await a.wait(900)

  // 2. Entra el pago de Mercado Pago: la cuota pasa a pagada y los totales se mueven
  await a.set({ paid: true })
  await a.wait(350)
  await a.set({ cobrado: 1314000, porCobrar: 128000 })
  await a.wait(3200)

  // Vuelta: la pantalla se funde y el día arranca de nuevo, sin rebobinar números a la vista
  await a.set({ fade: true })
  await a.wait(320)
  await a.snap({ ...initial, fade: true })
  await a.wait(60)
  await a.set({ fade: false })
  await a.wait(700)
}

export function NutridashInicio() {
  return (
    <Stage
      width={720}
      height={340}
      compact={{ below: 600, width: 358, height: 300 }}
      initial={initial}
      poster={POSTER}
      script={script}
      cursor={{ at: REST }}
      className="nd"
      tokens={{
        '--ss-font': '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
        '--ss-text-strong': '#101114',
        '--ss-text': '#43464D',
        '--ss-text-faint': '#666972',
        '--ss-line': '#E1E3DD',
        '--ss-line-faint': '#EBECE7',
        '--ss-surface': '#FFFFFF',
        '--ss-canvas': '#EFF0EB',
        '--ss-well': '#E1E2E4',
        '--ss-accent': '#3F5A0A',
      }}
    >
      {(s, _rect, layout) => (
        <>
          <Window url="nutridash.net/panel" className="nd-browser">
            <div className="nd-app">
              {layout === 'wide' && (
                <aside className="nd-side">
                  <span className="nd-nv on"><LayoutGrid {...I} /></span>
                  <span className="nd-nv"><Users {...I} /></span>
                  <span className="nd-nv"><CalendarDays {...I} /></span>
                  <span className="nd-nv"><CircleDollarSign {...I} /></span>
                  <span className="nd-nv"><ClipboardList {...I} /></span>
                  <span className="nd-nv"><MessageCircle {...I} /></span>
                  <span className="nd-nv"><Heart {...I} /></span>
                </aside>
              )}
              <main className="nd-main" data-fade={s.fade || undefined}>
                <div className="nd-top">
                  <div className="nd-h1">
                    Buen día, Verónica <span>· 6 consultas hoy</span>
                  </div>
                  <Button variant="primary" className="nd-cta" icon={<Plus size={12} strokeWidth={2} />}>
                    Nueva consulta
                  </Button>
                </div>

                <div className="nd-kpis">
                  {layout === 'wide' && (
                    <div className="nd-kpi">
                      <div className="nd-lb"><Clock3 size={13} strokeWidth={1.6} />Consultas de hoy</div>
                      <div className="nd-v">6<small>/ 8 lugares</small></div>
                      <div className="nd-ft"><span className="nd-tag">2 hechas</span>4 por atender</div>
                    </div>
                  )}
                  <div className="nd-kpi">
                    <div className="nd-lb"><CircleDollarSign size={13} strokeWidth={1.6} />{layout === 'wide' ? 'Cobrado en noviembre' : 'Cobrado'}</div>
                    <div className="nd-v"><Count value={s.cobrado} format={pesos} duration={800} /></div>
                    <div className="nd-ft"><span className="nd-tag">+12%</span>vs. octubre</div>
                  </div>
                  <div className="nd-kpi">
                    <div className="nd-lb"><Clock3 size={13} strokeWidth={1.6} />Por cobrar</div>
                    <div className="nd-v"><Count value={s.porCobrar} format={pesos} duration={800} /></div>
                    <div className="nd-ft"><span className="nd-tag warn"><Roll>{s.paid ? '2 vencidas' : '3 vencidas'}</Roll></span>{layout === 'wide' && 'más vieja: 12 días'}</div>
                  </div>
                </div>

                <div className="nd-card" data-crop>
                  <div className="nd-card-h">
                    Pendientes <span className="nd-ct"><Count value={s.pending} /></span>
                  </div>
                  <Collapse open={s.planRow}>
                    <Row
                      className="nd-row"
                      lead={<Avatar name="Martina Díaz" size={28} />}
                      title={layout === 'wide' ? 'Aprobar plan de Martina Díaz' : 'Plan de Martina Díaz'}
                      subtitle="Armado con el asistente · 1.650 kcal"
                    >
                      <Button size="small" data-target="aprobar" data-cursor="pointer" className="nd-ok" data-done={s.approved || undefined} icon={s.approved ? <Check size={12} strokeWidth={2.2} /> : undefined}>
                        {s.approved ? 'Aprobado' : 'Aprobar'}
                      </Button>
                    </Row>
                  </Collapse>
                  <Row
                    className="nd-row"
                    lead={<Avatar name="Laura Ruiz" size={28} />}
                    title={layout === 'wide' ? 'Cuota de noviembre de Laura Ruiz' : 'Cuota de Laura Ruiz'}
                    subtitle={<Roll variant="fade">{s.paid ? (layout === 'wide' ? 'Pagó con Mercado Pago · ahora' : 'Mercado Pago · ahora') : (layout === 'wide' ? '$34.000 · venció hace 12 días' : 'Venció hace 12 días')}</Roll>}
                  >
                    <States
                      align="end"
                      value={s.paid ? 'paid' : 'due'}
                      states={{
                        due: <Badge tone="warning">Vencida</Badge>,
                        paid: <Badge tone="success" icon={<Check size={12} strokeWidth={2.2} />}>Pagada</Badge>,
                      }}
                    />
                  </Row>
                  <Row className="nd-row" lead={<Avatar size={28} />} title={<Bar w={150} h={6} tone={2} />} subtitle={<Bar w={96} h={5} tone={1} />} />
                  <Row className="nd-row" lead={<Avatar size={28} />} title={<Bar w={120} h={6} tone={2} />} subtitle={<Bar w={110} h={5} tone={1} />} />
                </div>
              </main>
            </div>
          </Window>

          <span data-target="rest" style={{ position: 'absolute', left: REST[layout].x, top: REST[layout].y }} />
        </>
      )}
    </Stage>
  )
}
