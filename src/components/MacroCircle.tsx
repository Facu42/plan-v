interface MacroCircleProps {
  current: number;
  goal: number;
  unit: string;
  color: string;
  label: string;
}

export function MacroCircle({ current, goal, unit, color, label }: MacroCircleProps) {
  const percentage = (current / goal) * 100;
  const circumference = 2 * Math.PI * 35;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center mb-2">
        <svg width="80" height="80" className="transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="#f3f4f6"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg text-gray-800">{current}</span>
          <span className="text-xs text-gray-500">/{goal}{unit}</span>
        </div>
      </div>
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-xs text-gray-500">{goal - current}{unit} restantes</span>
    </div>
  );
}