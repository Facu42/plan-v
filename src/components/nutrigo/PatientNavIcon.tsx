import type { ShowroomPage } from './ShowroomPanels';
import dashboard from '../../assets/figma/nav/dashboard.svg';
import calendar from '../../assets/figma/nav/calendar.svg';
import messages from '../../assets/figma/nav/messages.svg';
import menu from '../../assets/figma/nav/menu.svg';
import plan from '../../assets/figma/nav/plan.svg';
import diary from '../../assets/figma/nav/diary.svg';
import progress from '../../assets/figma/nav/progress.svg';
import exercise from '../../assets/figma/nav/exercise.svg';
import insights from '../../assets/figma/nav/insights.svg';

const assets: Partial<Record<ShowroomPage, string>> = {
  inicio: dashboard,
  agenda: calendar,
  mensajes: messages,
  recetas: menu,
  plan,
  diario: diary,
  progreso: progress,
  ejercicio: exercise,
  recursos: insights,
};

export function PatientNavIcon({ page }: { page: ShowroomPage }) {
  const src = assets[page];
  return src ? <img className="nv-figma-nav-icon" src={src} alt="" aria-hidden="true" /> : null;
}
