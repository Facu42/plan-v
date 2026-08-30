import { Plus } from 'lucide-react';

interface MealProps {
  name: string;
  icon: string;
  color: string;
  onAdd: () => void;
}

function MealItem({ name, icon, color, onAdd }: MealProps) {
  return (
    <div className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: color }}></div>
          <span className="text-gray-800">{name}</span>
        </div>
        <button
          onClick={onAdd}
          className="bg-green-50 text-[#2d6a4f] px-3 py-1 rounded-lg text-sm border border-green-200 hover:bg-green-100 transition-colors"
        >
          + Registrar
        </button>
      </div>
      <p className="text-gray-500 text-sm mt-2">Aún no hay elementos registrados</p>
    </div>
  );
}

export function MealSection() {
  const meals = [
    { name: 'Desayuno', icon: '🍳', color: '#6b7280' },
    { name: 'Almuerzo', icon: '🥗', color: '#2d6a4f' },
    { name: 'Cena', icon: '🍽️', color: '#f59e0b' }
  ];

  const handleAddMeal = (mealName: string) => {
    console.log(`Adding meal for ${mealName}`);
  };

  return (
    <div className="px-4">
      <h3 className="text-lg text-gray-800 mb-4">Ingesta de Alimentos</h3>
      {meals.map((meal, index) => (
        <MealItem
          key={index}
          name={meal.name}
          icon={meal.icon}
          color={meal.color}
          onAdd={() => handleAddMeal(meal.name)}
        />
      ))}
    </div>
  );
}