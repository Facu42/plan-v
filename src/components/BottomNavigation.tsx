import { Plus, Activity, BarChart3, Clock, Utensils } from 'lucide-react';
import { useState } from 'react';

export function BottomNavigation() {
  const [activeTab, setActiveTab] = useState('calories');

  const navItems = [
    { id: 'calories', label: 'Calorías', icon: Activity, color: '#2d6a4f' },
    { id: 'meal-plan', label: 'Plan de Comidas', icon: Utensils, color: '#6b7280' },
    { id: 'fasting', label: 'Ayuno', icon: Clock, color: '#6b7280' },
    { id: 'progress', label: 'Mi Progreso', icon: BarChart3, color: '#6b7280' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
      <div className="flex items-center justify-around relative">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center py-2 px-3"
            >
              <Icon 
                size={20} 
                color={isActive ? item.color : '#9ca3af'} 
              />
              <span 
                className={`text-xs mt-1 ${
                  isActive ? 'text-[#2d6a4f]' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Central add button */}
        <button className="bg-[#2d6a4f] rounded-full w-12 h-12 flex items-center justify-center -mt-2 shadow-lg">
          <Plus size={24} color="white" />
        </button>
        
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center py-2 px-3"
            >
              <Icon 
                size={20} 
                color={isActive ? item.color : '#9ca3af'} 
              />
              <span 
                className={`text-xs mt-1 ${
                  isActive ? 'text-[#2d6a4f]' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}