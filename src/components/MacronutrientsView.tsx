import { MacroCircle } from './MacroCircle';
import { Edit } from 'lucide-react';

interface MacronutrientsViewProps {
  protein: { current: number; goal: number; };
  carbs: { current: number; goal: number; };
  fats: { current: number; goal: number; };
  fiber: { current: number; goal: number; };
}

export function MacronutrientsView({ protein, carbs, fats, fiber }: MacronutrientsViewProps) {
  const dailyEntries = [
    { color: '#6b7280', count: 0 }, // Desayuno
    { color: '#2d6a4f', count: 0 }, // Almuerzo  
    { color: '#f59e0b', count: 0 }, // Cena
    { color: '#ef4444', count: 0 }, // Snacks
  ];

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6 px-4">
        <h2 className="text-xl text-gray-800">Macronutrientes</h2>
        <button className="flex items-center text-gray-500 text-sm">
          <Edit size={16} className="mr-1" />
          Editar
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 mx-4">
        <div className="grid grid-cols-2 gap-6">
          <MacroCircle
            current={protein.current}
            goal={protein.goal}
            unit="g"
            color="#ff6b6b"
            label="Proteína"
          />
          <MacroCircle
            current={carbs.current}
            goal={carbs.goal}
            unit="g"
            color="#ffd93d"
            label="Carbos"
          />
          <MacroCircle
            current={fats.current}
            goal={fats.goal}
            unit="g"
            color="#6c5ce7"
            label="Grasas"
          />
          <MacroCircle
            current={fiber.current}
            goal={fiber.goal}
            unit="g"
            color="#00b894"
            label="Fibra"
          />
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-gray-600 text-sm text-center mb-3">Entradas de hoy</p>
          <div className="flex items-center justify-center space-x-4">
            {dailyEntries.map((entry, index) => (
              <div key={index} className="flex items-center space-x-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}