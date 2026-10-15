import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaCalendarCell, FigmaCalendarDetails, FigmaCalendarExtraRow, useFigmaCalendar } from '../FigmaCalendar';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/CalendarTablet";
const imgVector = `${assetPathPrefix}/7d323.svg`;
const imgDivider = `${assetPathPrefix}/02e4a.svg`;
const imgIconSpecialForkKnife = `${assetPathPrefix}/7e5b8.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/30242.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/d5f5f.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/4a643.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/d074c.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/f8978.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/80149.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/56b99.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/7679f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/96a22.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/e9231.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/57698.svg`;
const imgIconBell = `${assetPathPrefix}/4a0c9.svg`;
const imgIconSpecialPersonSimpleRun = `${assetPathPrefix}/6a619.svg`;
const imgIconSpecialCalendarCheck = `${assetPathPrefix}/c167e.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/4f1bf.svg`;
const imgIconCaretRight = `${assetPathPrefix}/35078.svg`;
const imgIconCaretDown = `${assetPathPrefix}/16cfa.svg`;
const imgCheckbox = `${assetPathPrefix}/63c07.svg`;
const imgCheckbox1 = `${assetPathPrefix}/51dee.svg`;
const imgCheckbox2 = `${assetPathPrefix}/5abdb.svg`;
const imgVector1 = `${assetPathPrefix}/90342.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgIconNavCalendarDots1 = `${assetPathPrefix}/b3414.svg`;
const imgIconClock = `${assetPathPrefix}/148cc.svg`;
const imgIconMapPinArea = `${assetPathPrefix}/f9b60.svg`;
const imgDivider1 = `${assetPathPrefix}/f484c.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type CellCalendarBodyProps = {
  className?: string;
  date?: string;
  variant?: "Default" | "Off Day";
};

function CellCalendarBody({ className, date = "", variant = "Off Day" }: CellCalendarBodyProps) {
  const isDefault = variant === "Default";
  const isOffDay = variant === "Off Day";
  return (
    <div className={className || `border-[#e1e1e2] border-r border-solid content-stretch flex flex-col h-[125px] items-start p-[4px] relative w-[122px] ${isDefault ? "bg-white" : "bg-[#f6f6f7] gap-[10px] overflow-clip"}`} id={isDefault ? "node-217_7508" : "node-217_7504"}>
      {isOffDay && (
        <div className="absolute inset-[-6.74%_calc(-87.5%-1.87px)_-6.74%_calc(-86.46%-0.86px)]" data-node-id="217:7505" data-name="Vector">
          <div className="absolute inset-[-0.24%_-0.11%]">
            <img alt="" className="block max-w-none size-full" src={imgVector} />
          </div>
        </div>
      )}
      <div className={`content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px] ${isDefault ? "" : "overflow-clip"}`} id={isDefault ? "node-217_7509" : "node-217_7506"} data-name="Day">
        {isOffDay && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#bebfc2] text-[10px] whitespace-nowrap" data-node-id="217:7507">
            {date}
          </p>
        )}
        {isDefault && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="217:7510">
            {date}
          </p>
        )}
      </div>
    </div>
  );
}

type CellCalendarHeadProps = {
  className?: string;
  day?: string;
  model?: "Default";
};

function CellCalendarHead({ className, day = "Sun", model = "Default" }: CellCalendarHeadProps) {
  return (
    <div className={className || "bg-white border-r border-solid border-white content-stretch flex items-center justify-center px-[10px] py-[12px] relative w-[96px]"} data-node-id="217:7500">
      <div className="content-stretch flex h-[16px] items-center justify-center pb-px relative shrink-0" data-node-id="217:7501" data-name="Day">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="217:7502">
          {day}
        </p>
      </div>
    </div>
  );
}

type CardStatisticCalendarProps = {
  className?: string;
  amount?: string;
  category?: string;
  model?: "Default";
};

function CardStatisticCalendar({ className, amount = "0", category = "Total Physical Activities Schedule", model = "Default" }: CardStatisticCalendarProps) {
  return (
    <div className={className || "bg-white content-stretch flex flex-col gap-[12px] items-start justify-center p-[16px] relative rounded-[16px] w-[275px]"} data-node-id="214:5650">
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="214:5638">
        {category}
      </p>
      <div className="h-0 relative shrink-0 w-full" data-node-id="214:5649" data-name="Divider">
        <div className="absolute inset-[-0.5px_0]">
          <img alt="" className="block max-w-none size-full" src={imgDivider} />
        </div>
      </div>
      <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="214:5645" data-name="Bottom">
        <div className="bg-[#c2e66e] content-stretch flex items-center p-[10px] relative rounded-[10px] shrink-0" data-node-id="214:5635" data-name="Icon">
          <div className="relative shrink-0 size-[16px]" data-node-id="214:5636" data-name="Icon/Special/ForkKnife">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialForkKnife} />
          </div>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px not-italic relative whitespace-nowrap" data-node-id="214:5639" data-name="Info Amount">
          <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="214:5640">
            {amount}
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="214:5641">{'comidas'}</p>
        </div>
      </div>
    </div>
  );
}

export default function Component05CalendarTablet() {
  const calendarData = useFigmaCalendar();
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="427:15467" data-name="05. Calendar (Tablet)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[28px] relative self-stretch shrink-0" data-node-id="427:15468" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[6px] relative shrink-0" data-node-id="I427:15468;408:17341" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I427:15468;408:17342" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative" data-node-id="I427:15468;408:17343" data-name="Menu Nav">
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17344" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17344;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17345" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17345;408:17513" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17346" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17346;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17347" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17347;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17348" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17348;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17349" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17349;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17350" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17350;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17353" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17353;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17354" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17354;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I427:15468;408:17363" data-name="Button Nav">
          <div className="relative shrink-0 size-[18px]" data-node-id="I427:15468;408:17363;408:17518" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px overflow-clip p-[28px] relative self-stretch" data-node-id="427:15469" data-name="Content">
        <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="427:15470" data-name="Header">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px py-[2px] relative" data-node-id="I427:15470;418:13843" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="I427:15470;418:13844">
              Calendario
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I427:15470;418:13846" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I427:15470;418:13854" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I427:15470;418:13854;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I427:15470;418:13855" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I427:15470;418:13855;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I427:15470;418:13855;2:3559" />
            </div>
            <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I427:15470;418:13857" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I427:15470;418:13857;2:3114" data-name="User Image/12">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I427:15470;418:13857;2:3114;2:3159" data-name="Place Image Here" />
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-node-id="427:16289" data-name="Section Statistics">
          <CardStatisticCalendar category="Planificación de comidas" className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]"  amount={String(calendarData.stats[0])}/>
          <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]" data-node-id="427:16291" data-name="Card Statistic - Calendar">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I427:16291;214:5638">
              Actividades físicas totales
            </p>
            <div className="h-0 relative shrink-0 w-full" data-node-id="I427:16291;214:5649" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider} />
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I427:16291;214:5645" data-name="Bottom">
              <div className="bg-[#ffcb65] content-stretch flex items-center p-[10px] relative rounded-[10px] shrink-0" data-node-id="I427:16291;214:5635" data-name="Icon">
                <div className="relative shrink-0 size-[16px]" data-node-id="I427:16291;214:5636" data-name="Icon/Special/ForkKnife">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleRun} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px not-italic relative whitespace-nowrap" data-node-id="I427:16291;214:5639" data-name="Info Amount">
                <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I427:16291;214:5640">{calendarData.stats[1]}</p>
                <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="I427:16291;214:5641">
                  actividades
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]" data-node-id="427:16292" data-name="Card Statistic - Calendar">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I427:16292;214:5638">
              Citas y eventos totales
            </p>
            <div className="h-0 relative shrink-0 w-full" data-node-id="I427:16292;214:5649" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider} />
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I427:16292;214:5645" data-name="Bottom">
              <div className="bg-[#ffa257] content-stretch flex items-center p-[10px] relative rounded-[10px] shrink-0" data-node-id="I427:16292;214:5635" data-name="Icon">
                <div className="relative shrink-0 size-[16px]" data-node-id="I427:16292;214:5636" data-name="Icon/Special/ForkKnife">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialCalendarCheck} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px not-italic relative whitespace-nowrap" data-node-id="I427:16292;214:5639" data-name="Info Amount">
                <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I427:16292;214:5640">{calendarData.stats[2]}</p>
                <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="I427:16292;214:5641">{'citas'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="433:16643" data-name="Section Calendar">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="433:16644" data-name="Header-Section">
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-node-id="433:16645" data-name="Left Section">
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="433:16646" data-name="Buttons">
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="433:16647" data-name="Button Icon" aria-label="Mes anterior" role="button" tabIndex={0} onClick={() => calendarData.shift(-1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.shift(-1); } }}>
                  <div className="relative shrink-0 size-[18px]" data-node-id="I433:16647;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                  </div>
                </div>
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="433:16648" data-name="Button Icon" aria-label="Mes siguiente" role="button" tabIndex={0} onClick={() => calendarData.shift(1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.shift(1); } }}>
                  <div className="relative shrink-0 size-[18px]" data-node-id="I433:16648;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[4px] h-[18px] items-center relative shrink-0" data-node-id="433:16649" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="433:16650">{calendarData.monthName}</p>
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="433:16651">{calendarData.year}</p>
                <div className="relative shrink-0 size-[14px]" data-node-id="433:16652" data-name="Icon/CaretDown">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                </div>
              <input type="month" aria-label="Elegir mes" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={calendarData.year + '-' + String(calendarData.month.getMonth() + 1).padStart(2, '0')} onChange={(event) => calendarData.chooseMonth(event.target.value)} /></div>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="433:16653" data-name="Right Section">
              <div className="bg-white content-stretch flex gap-[2px] items-start relative rounded-[10px] shrink-0" data-node-id="433:16655" data-name="Segmented Button">
                <div className="bg-white content-stretch flex items-center justify-center pl-[16px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I433:16655;2:3607" data-name="Button Picker" role="button" tabIndex={0} aria-pressed={calendarData.view === 'day'} style={{ backgroundColor: calendarData.view === 'day' ? '#c2e66e' : '#fff' }} onClick={() => calendarData.setView('day')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.setView('day'); } }}>
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I433:16655;2:3607;2:3481" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I433:16655;2:3607;2:3482">
                      Día
                    </p>
                  </div>
                </div>
                <div className="bg-white content-stretch flex items-center justify-center px-[16px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I433:16655;2:3608" data-name="Button Picker" role="button" tabIndex={0} aria-pressed={calendarData.view === 'week'} style={{ backgroundColor: calendarData.view === 'week' ? '#c2e66e' : '#fff' }} onClick={() => calendarData.setView('week')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.setView('week'); } }}>
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I433:16655;2:3608;2:3481" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I433:16655;2:3608;2:3482">
                      Semana
                    </p>
                  </div>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I433:16655;2:3609" data-name="Button Picker" role="button" tabIndex={0} aria-pressed={calendarData.view === 'month'} style={{ backgroundColor: calendarData.view === 'month' ? '#c2e66e' : '#fff' }} onClick={() => calendarData.setView('month')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.setView('month'); } }}>
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I433:16655;2:3609;2:3331" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I433:16655;2:3609;2:3332">
                      Mes
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="433:16662" data-name="Button CTA" role="button" tabIndex={0} onClick={() => calendarData.newActivity()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.newActivity(); } }}>
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I433:16662;2:3331" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I433:16662;2:3332">
                    Nueva actividad
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col items-start overflow-clip pb-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="433:16663" data-name="Calendar">
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[24px] items-center p-[16px] relative shrink-0 w-full" data-node-id="433:16664" data-name="Category List">
              <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="433:16665" data-name="Category" role="button" tabIndex={0} aria-pressed={calendarData.categories[0]} style={{ opacity: calendarData.categories[0] ? 1 : 0.45 }} onClick={() => calendarData.toggleCategory(0)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.toggleCategory(0); } }}>
                <div className="relative shrink-0 size-[16px]" data-node-id="433:16666" data-name="Checkbox">
                  <div className="absolute inset-[-6.25%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                  </div>
                </div>
                <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="433:16667" data-name="Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="433:16668">
                    Planificación de comidas
                  </p>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="433:16669" data-name="Category" role="button" tabIndex={0} aria-pressed={calendarData.categories[1]} style={{ opacity: calendarData.categories[1] ? 1 : 0.45 }} onClick={() => calendarData.toggleCategory(1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.toggleCategory(1); } }}>
                <div className="relative shrink-0 size-[16px]" data-node-id="433:16670" data-name="Checkbox">
                  <div className="absolute inset-[-6.25%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox1} />
                  </div>
                </div>
                <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="433:16671" data-name="Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="433:16672">
                    Actividades físicas
                  </p>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="433:16673" data-name="Category" role="button" tabIndex={0} aria-pressed={calendarData.categories[2]} style={{ opacity: calendarData.categories[2] ? 1 : 0.45 }} onClick={() => calendarData.toggleCategory(2)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.toggleCategory(2); } }}>
                <div className="relative shrink-0 size-[16px]" data-node-id="433:16674" data-name="Checkbox">
                  <div className="absolute inset-[-6.25%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox2} />
                  </div>
                </div>
                <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="433:16675" data-name="Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="433:16676">
                    Citas y eventos
                  </p>
                </div>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center overflow-clip relative shrink-0 w-full" data-node-id="433:16677" data-name="Row-Calendar-Head">
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative"  day="Dom"/>
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Lun" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Mar" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Mié" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Jue" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Vie" />
              <div className="bg-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" data-node-id="433:16684" data-name="Cell-Calendar-Head">
                <div className="content-stretch flex h-[16px] items-center justify-center pb-px relative shrink-0" data-node-id="I433:16684;217:7501" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I433:16684;217:7502">
                    Sáb
                  </p>
                </div>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:16685" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[0] ? undefined : 'none' }}>
              <FigmaCalendarCell index={0} nodeId="433:16686" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={1} nodeId="433:16687" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={2} nodeId="433:16688" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={3} nodeId="433:16689" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={4} className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={5} nodeId="433:16691" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={6} nodeId="433:16692" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:16693" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[7] ? undefined : 'none' }}>
              <FigmaCalendarCell index={7} nodeId="433:16694" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={8} nodeId="433:16695" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={9} nodeId="433:16696" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={10} nodeId="433:16697" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={11} nodeId="433:16698" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={12} nodeId="433:16699" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={13} nodeId="433:16700" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:16701" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[14] ? undefined : 'none' }}>
              <FigmaCalendarCell index={14} nodeId="433:16702" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={15} className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={16} nodeId="433:16704" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={17} nodeId="433:16705" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={18} className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={19} nodeId="433:16707" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={20} nodeId="433:16708" className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:16709" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[21] ? undefined : 'none' }}>
              <FigmaCalendarCell index={21} nodeId="433:16710" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={22} nodeId="433:16711" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={23} nodeId="433:16712" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={24} nodeId="433:16713" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={25} nodeId="433:16714" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={26} nodeId="433:16715" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={27} nodeId="433:16716" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
            <div className="content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:16717" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[28] ? undefined : 'none' }}>
              <FigmaCalendarCell index={28} nodeId="433:16718" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={29} nodeId="433:16719" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={30} nodeId="433:16720" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={31} nodeId="433:16721" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={32} nodeId="433:16722" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={33} nodeId="433:16723" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={34} nodeId="433:16724" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
          <FigmaCalendarExtraRow assetPathPrefix={assetPathPrefix} /></div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[16px] items-start px-[20px] py-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="433:17176" data-name="Right Side">
          <div className="content-stretch flex items-center justify-between px-[8px] relative shrink-0 w-full" data-node-id="433:17177" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-461px] relative shrink-0" data-node-id="I433:17177;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I433:17177;2:4223">
                Detalles de la agenda
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I433:17177;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I433:17177;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I433:17177;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-node-id="433:17249" data-name="List Schedule">
            <FigmaCalendarDetails />
            
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="427:15729" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="427:15730" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="427:15731">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="427:15732" data-name="Links">
              <p className="relative shrink-0" data-node-id="427:15733">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="427:15734">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="427:15735">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="427:15736" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="427:15737" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="427:15738" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="427:15739" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="427:15740" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="427:15741" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
