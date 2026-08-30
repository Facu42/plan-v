import { ImageWithFallback } from './figma/ImageWithFallback';
import { WeeklyCalendar } from './WeeklyCalendar';
import logoImage from 'figma:asset/315e8c4f101589da951c9d224ce94059435fea42.png';

export function Header() {
  return (
    <div className="bg-gray-50 pt-12 pb-4">
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h1 className="text-2xl text-gray-800">Hoy</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <ImageWithFallback
              src={logoImage}
              alt="Plan V Nutrición"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm">
              <span className="text-orange-500 text-sm">🔥</span>
              <span className="text-gray-600 text-sm ml-1">0</span>
            </div>
            
            <a 
              href="https://api.whatsapp.com/qr/CO5YAOMMALBXC1?autoload=1&app_absent=0"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2d6a4f] text-white px-3 py-1 rounded-full text-sm hover:bg-[#255a47] transition-colors cursor-pointer"
            >
              PRO
            </a>
          </div>
        </div>
      </div>
      
      <WeeklyCalendar />
    </div>
  );
}