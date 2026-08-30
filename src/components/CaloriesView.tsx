import { CalorieCircle } from './CalorieCircle';
import { Edit } from 'lucide-react';

interface CaloriesViewProps {
  dailyGoal: number;
  consumed: number;
  burned: number;
}

export function CaloriesView({ dailyGoal, consumed, burned }: CaloriesViewProps) {
  const remaining = dailyGoal - consumed + burned;
  const percentage = consumed > 0 ? (consumed / dailyGoal) * 100 : 0;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h2 className="text-xl text-gray-800">Calorías</h2>
        <button className="flex items-center text-gray-500 text-sm">
          <Edit size={16} className="mr-1" />
          Editar
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mx-4">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm">Meta Diaria</p>
              <p className="text-gray-800 text-lg">{dailyGoal} cal</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Consumido</p>
              <p className="text-gray-800 text-lg">{consumed} cal</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Quema por Actividad</p>
              <p className="text-gray-800 text-lg">{burned} cal</p>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <CalorieCircle remaining={remaining} percentage={percentage} />
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-gray-400 text-sm text-center">
            Restante = Meta - Consumido + Quemado
          </p>
        </div>
      </div>
    </div>
  );
}