import { useState } from 'react';

export function WeeklyCalendar() {
  const [selectedDay, setSelectedDay] = useState(0);
  
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dates = [6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="flex justify-between items-center px-4 py-3">
      {days.map((day, index) => (
        <div
          key={index}
          className="flex flex-col items-center cursor-pointer"
          onClick={() => setSelectedDay(index)}
        >
          <span className={`text-sm mb-1 ${
            selectedDay === index ? 'text-gray-800' : 'text-gray-500'
          }`}>
            {day}
          </span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            selectedDay === index 
              ? 'bg-[#2d6a4f] text-white' 
              : 'text-gray-600'
          }`}>
            <span className="text-sm">{dates[index]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}