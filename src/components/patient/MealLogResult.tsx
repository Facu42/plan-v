import type { CSSProperties } from 'react';
import { Fire } from '@phosphor-icons/react';
import type { FoodItem, MealLog } from '../../types';
import { Icon } from '../shared/Icon';
import { useCountUp, useTicker } from './meal-log-motion';
import {
  MEAL_KEPT_COPY, analyzingMessages, confidenceLevel, macroShares, mealLogWasKept, messageAt, type CaptureMode,
} from './meal-log-helpers';

type Macros = NonNullable<MealLog['macros']>;
const MESSAGE_MS = 2300;
const whole = Math.round;
const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;

export function AnalyzingView({ mode, preview, description }: { mode: CaptureMode; preview: string | null; description: string }) {
  const messages = analyzingMessages(mode, Boolean(preview));
  const tick = useTicker(MESSAGE_MS);
  return (
    <div className="mlm-scroll mlm-analyzing">
      <span className="mlm-sr" role="status">Analizando tu comida…</span>
      <div className="mlm-scan" data-kind={preview ? 'photo' : 'text'} aria-hidden>
        {preview ? <img src={preview} alt="" /> : <p>{description}</p>}
        <i className="mlm-scan-line" />
        <b className="mlm-corner" data-c="tl" /><b className="mlm-corner" data-c="tr" /><b className="mlm-corner" data-c="bl" /><b className="mlm-corner" data-c="br" />
      </div>
      <div className="mlm-progress" aria-hidden><i /></div>
      <p className="mlm-scan-msg" key={tick % messages.length} aria-hidden>{messageAt(messages, tick)}</p>
      <h2 className="mlm-title" tabIndex={-1} data-mlm-heading>Analizando tu comida…</h2>
      <p className="mlm-note">La IA estima alimentos y macros. Verónica confirma antes de que cuente.</p>
    </div>
  );
}

function Count({ target, suffix = '', delay = 0 }: { target: number; suffix?: string; delay?: number }) {
  const value = useCountUp(target, delay);
  return <strong aria-hidden>{`${value}${suffix}`}</strong>;
}

const MACRO_ROWS = [
  { key: 'protein', label: 'Proteínas', spoken: 'de proteínas' },
  { key: 'carbs', label: 'Carbohidratos', spoken: 'de carbohidratos' },
  { key: 'fat', label: 'Grasas', spoken: 'de grasas' },
] as const;

export function MacroPanel({ macros }: { macros: Macros }) {
  const shares = macroShares(macros);
  const grams = { protein: whole(macros.protein_g), carbs: whole(macros.carbs_g), fat: whole(macros.fat_g) };
  return (
    <div className="mlm-macros">
      <div className="mlm-kcal">
        <span className="mlm-kcal-icon" aria-hidden><Fire size={22} weight="fill" /></span>
        <Count target={whole(macros.kcal)} />
        <span aria-hidden>kcal</span>
        <span className="mlm-sr">{`${whole(macros.kcal)} kilocalorías`}</span>
      </div>
      {MACRO_ROWS.map(({ key, label, spoken }, i) => (
        <div className="mlm-macro" data-macro={key} key={key} style={cssVars({ '--mlm-i': i + 1 })}>
          <div className="mlm-macro-head">
            <span>{label}</span>
            <Count target={grams[key]} suffix="g" delay={120 * (i + 1)} />
            <span className="mlm-sr">{`${grams[key]} gramos ${spoken}`}</span>
          </div>
          <div className="mlm-bar" aria-hidden><i style={cssVars({ '--mlm-fill': `${shares[key]}%` })} /></div>
          <small aria-hidden>{`${shares[key]}% de las calorías`}</small>
        </div>
      ))}
    </div>
  );
}

function FoodCards({ foods }: { foods: FoodItem[] }) {
  if (foods.length === 0) return null;
  return (
    <ul className="mlm-foods" aria-label="Alimentos que vemos">
      {foods.map((food, i) => (
        <li key={`${food.name}-${i}`} style={cssVars({ '--mlm-i': i })}>
          <span className="mlm-food-dot" aria-hidden />
          <strong>{food.name}</strong>
          {food.portion_est ? <small>{`~${food.portion_est}${food.portion_unit}`}</small> : null}
        </li>
      ))}
    </ul>
  );
}

type ReviewProps = { result: MealLog; slot: string; preview: string | null; description: string; onConfirm: () => void };

export function ReviewView({ result, slot, preview, description, onConfirm }: ReviewProps) {
  const kept = mealLogWasKept(result);
  return (
    <>
      <div className="mlm-scroll">
        {preview ? (
          <div className="mlm-hero"><img src={preview} alt="Tu comida" /></div>
        ) : (
          <div className="mlm-hero mlm-hero-text"><Icon name="edit" size={24} /><p>{description}</p></div>
        )}
        <p className="mlm-eyebrow">{`${kept ? 'Registro guardado' : 'Lectura asistida'} · ${slot}`}</p>
        <h2 className="mlm-title" tabIndex={-1} data-mlm-heading>{kept ? 'Registramos tu comida' : 'Esto es lo que vemos'}</h2>
        {kept ? <p className="mlm-note mlm-kept">{MEAL_KEPT_COPY}</p> : (
          <>
            <FoodCards foods={result.foods} />
            {result.macros ? (
              <>
                <MacroPanel macros={result.macros} />
                <p className="mlm-confidence" data-level={confidenceLevel(result.confidence)}>
                  {`Estimación · confianza ${(result.confidence * 100).toFixed(0)}% · pendiente de Verónica`}
                </p>
              </>
            ) : <p className="mlm-note">No pudimos estimar macros con confianza. Verónica lo revisará.</p>}
          </>
        )}
        <p className="mlm-note">No es una medida exacta. Verónica confirma antes de que cuente para tu seguimiento.</p>
      </div>
      <footer className="mlm-foot">
        <button className="mlm-cta" type="button" data-ready="true" onClick={onConfirm}><Icon name="check" size={18} />Guardar comida</button>
      </footer>
    </>
  );
}

export function SuccessView({ name, macros, onClose }: { name: string; macros: Macros | null; onClose: () => void }) {
  return (
    <>
      <div className="mlm-scroll mlm-success">
        <div className="mlm-check" aria-hidden>
          <svg viewBox="0 0 52 52"><circle className="mlm-check-ring" cx="26" cy="26" r="24" /><path className="mlm-check-mark" d="M15 27.5l8 8 14.5-17" /></svg>
          {[0, 1, 2, 3, 4, 5].map((n) => <i key={n} className="mlm-spark" style={cssVars({ '--mlm-a': `${n * 60}deg` })} />)}
        </div>
        <p className="mlm-eyebrow">Comida registrada</p>
        <h2 className="mlm-title" tabIndex={-1} data-mlm-heading>{`¡Listo, ${name.split(' ')[0]}!`}</h2>
        <p className="mlm-lead">Quedó como estimación. Verónica lo revisa cuando corresponda.</p>
        {macros && (
          <ul className="mlm-summary" aria-label="Resumen de la comida">
            <li><strong>{whole(macros.kcal)}</strong><small>kcal</small></li>
            <li><strong>{`${whole(macros.protein_g)}g`}</strong><small>proteínas</small></li>
            <li><strong>{`${whole(macros.carbs_g)}g`}</strong><small>carbohidratos</small></li>
            <li><strong>{`${whole(macros.fat_g)}g`}</strong><small>grasas</small></li>
          </ul>
        )}
      </div>
      <footer className="mlm-foot">
        <button className="mlm-cta" type="button" data-ready="true" onClick={onClose}>Volver a mi día</button>
      </footer>
    </>
  );
}
