interface CalorieCircleProps {
  remaining: number;
  percentage: number;
}

export function CalorieCircle({ remaining, percentage }: CalorieCircleProps) {
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="80"
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r="80"
          stroke="#2d6a4f"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl text-gray-800">{remaining}</span>
        <span className="text-sm text-gray-500">cal restantes</span>
      </div>
    </div>
  );
}