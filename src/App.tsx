import { AuthProvider } from './context/AuthContext';
import { PlanVExperience } from './components/PlanVExperience';
import './plan-v.css';

export default function App() {
  return (
    <AuthProvider>
      <PlanVExperience />
    </AuthProvider>
  );
}
