import { AuthProvider } from './context/AuthContext';
import { PlanVExperience } from './components/PlanVExperience';
import './plan-v.css';
// Después de plan-v.css: la piel Nutrigo de las pantallas de entrada tiene que ganar los empates de peso.
import './components/auth/auth-nutrigo.css';

export default function App() {
  return (
    <AuthProvider>
      <PlanVExperience />
    </AuthProvider>
  );
}
