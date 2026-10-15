import DashboardStatistics from './DashboardStatistics';
import DashboardWeightNutrients from './DashboardWeightNutrients';
import DashboardWorkoutProgress from './DashboardWorkoutProgress';
import DashboardRecommendations from './DashboardRecommendations';
import type { MouseEvent } from 'react';
import type { ShowroomPage } from '../nutrigo/ShowroomPanels';
import './figma-pack.css';

const destinations: [string, ShowroomPage][] = [
  ['43:1106', 'recetas'], ['43:1105', 'ejercicio'], ['71:1235', 'ejercicio'],
  ['62:1513', 'diario'], ['57:1509', 'progreso'], ['78:782', 'progreso'],
  ['74:2016', 'ejercicio'], ['82:892', 'progreso'], ['74:2051', 'progreso'],
];

export function FigmaPatientDashboard({ onNavigate }: { onNavigate: (page: ShowroomPage) => void }) {
  const openSection = (event: MouseEvent<HTMLDivElement>) => {
    const clicked = event.target as Element;
    for (const [nodeId, page] of destinations) {
      if (clicked.closest(`[data-node-id="${nodeId}"]`)) { onNavigate(page); break; }
    }
  };
  return <div id="figma-pack-root" className="figma-dashboard-body" onClick={openSection}>
    <div className="figma-dashboard-statistics"><DashboardStatistics /></div>
    <div className="figma-dashboard-weight"><DashboardWeightNutrients /></div>
    <div className="figma-dashboard-workout"><DashboardWorkoutProgress /></div>
    <div className="figma-dashboard-recommendations"><DashboardRecommendations /></div>
  </div>;
}
