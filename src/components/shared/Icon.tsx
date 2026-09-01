import type { ReactNode } from 'react';

export type IconName =
  | 'arrow' | 'bell' | 'calendar' | 'camera' | 'check' | 'chevron' | 'clock'
  | 'drop' | 'heart' | 'leaf' | 'message' | 'moon' | 'plus' | 'sparkle'
  | 'sun' | 'trend' | 'users' | 'video' | 'edit' | 'loader';

const paths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" /></>,
  camera: <><path d="M4 7h4l1.5-2h5L16 7h4a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>,
  check: <path d="m5 12 4.2 4.2L19 6.5" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
  drop: <path d="M12 3.5S6.5 10.1 6.5 14A5.5 5.5 0 0 0 12 19.5a5.5 5.5 0 0 0 5.5-5.5C17.5 10.1 12 3.5 12 3.5Z" />,
  heart: <path d="M20.8 8.8c0 5.7-8.8 10.6-8.8 10.6S3.2 14.5 3.2 8.8A4.5 4.5 0 0 1 12 7.4a4.5 4.5 0 0 1 8.8 1.4Z" />,
  leaf: <><path d="M20 4C10.5 4 5 8.5 5 15c0 2.2 1.8 4 4 4C15.5 19 20 13.5 20 4Z" /><path d="M4 20c3-4.5 6.5-7 11-9" /></>,
  message: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.4 8.4 0 0 1-3-.6L4 20l1.4-4A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>,
  moon: <path d="M20 15.4A8.3 8.3 0 0 1 8.6 4 8.3 8.3 0 1 0 20 15.4Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  sparkle: <><path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  trend: <><path d="M4 17 10 11l4 4 6-7" /><path d="M15 8h5v5" /></>,
  users: <><path d="M16 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 19.5V21" /><circle cx="10" cy="7" r="3.5" /><path d="M17 11.2a3.5 3.5 0 0 0 0-6.4M20 21v-1.5a4.5 4.5 0 0 0-2.6-4.1" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  loader: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />,
};

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

export function Mark() {
  return (
    <div className="brand-mark" aria-label="Plan V">
      <span>V</span>
      <i />
    </div>
  );
}

export function ScoreRing({ score, label }: { score: number; label: string }) {
  const filled = Math.round((Math.max(0, Math.min(100, score)) / 100) * 36);
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const inner = 42;
    const outer = 54;
    const x1 = (60 + inner * Math.cos(rad)).toFixed(1);
    const y1 = (60 + inner * Math.sin(rad)).toFixed(1);
    const x2 = (60 + outer * Math.cos(rad)).toFixed(1);
    const y2 = (60 + outer * Math.sin(rad)).toFixed(1);
    return <line key={i} className={i < filled ? 'tick-on' : 'tick-off'} x1={x1} y1={y1} x2={x2} y2={y2} />;
  });
  return (
    <div className="score-ring">
      <svg className="score-ticks" viewBox="0 0 120 120" aria-hidden>{ticks}</svg>
      <strong>{score}</strong>
      <span>{label}</span>
    </div>
  );
}

export function MacroBar({ macros }: { macros: { kcal: number; protein_g: number; carbs_g: number; fat_g: number } }) {
  return (
    <div className="macro-grid">
      <div className="macro-cell"><strong>{macros.kcal}</strong><span>kcal</span></div>
      <div className="macro-cell protein"><strong>{macros.protein_g}g</strong><span>proteína</span></div>
      <div className="macro-cell carbs"><strong>{macros.carbs_g}g</strong><span>carbos</span></div>
      <div className="macro-cell fat"><strong>{macros.fat_g}g</strong><span>grasas</span></div>
    </div>
  );
}
