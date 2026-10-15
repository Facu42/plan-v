import { FigmaCalendarCell, FigmaCalendarDetails, FigmaCalendarExtraRow, useFigmaCalendar } from '../FigmaCalendar';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/CalendarMobile";
const imgVector = `${assetPathPrefix}/7d323.svg`;
const imgDivider = `${assetPathPrefix}/1d34f.svg`;
const imgIconSpecialForkKnife = `${assetPathPrefix}/7e5b8.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconSpecialPersonSimpleRun = `${assetPathPrefix}/6a619.svg`;
const imgIconSpecialCalendarCheck = `${assetPathPrefix}/c167e.svg`;
const imgIconCaretDown = `${assetPathPrefix}/16cfa.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/8e5ed.svg`;
const imgIconPlus = `${assetPathPrefix}/03c75.svg`;
const imgCheckbox = `${assetPathPrefix}/63c07.svg`;
const imgCheckbox1 = `${assetPathPrefix}/51dee.svg`;
const imgCheckbox2 = `${assetPathPrefix}/5abdb.svg`;
const imgVector1 = `${assetPathPrefix}/755f0.svg`;
const imgVector2 = `${assetPathPrefix}/ae73d.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/b3414.svg`;
const imgIconClock = `${assetPathPrefix}/148cc.svg`;
const imgIconMapPinArea = `${assetPathPrefix}/f9b60.svg`;
const imgDivider1 = `${assetPathPrefix}/1ae08.svg`;
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
  model?: "Mobile";
};

function CellCalendarHead({ className, day = "Sun", model = "Mobile" }: CellCalendarHeadProps) {
  return (
    <div className={className || "bg-white border-r border-solid border-white content-stretch flex items-center justify-center p-[10px] relative w-[96px]"} data-node-id="433:18451">
      <div className="content-stretch flex h-[16px] items-center justify-center pb-px relative shrink-0" data-node-id="433:18452" data-name="Day">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="433:18453">
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
  model?: "Mobile";
};

function CardStatisticCalendar({ className, amount = "0", category = "Total Physical Activities Schedule", model = "Mobile" }: CardStatisticCalendarProps) {
  return (
    <div className={className || "bg-white content-stretch flex flex-col gap-[12px] items-start justify-center p-[16px] relative rounded-[16px] w-[106px]"} data-node-id="433:18116">
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="433:18117">
        {category}
      </p>
      <div className="h-0 relative shrink-0 w-full" data-node-id="433:18118" data-name="Divider">
        <div className="absolute inset-[-0.5px_0]">
          <img alt="" className="block max-w-none size-full" src={imgDivider} />
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="433:18119" data-name="Bottom">
        <div className="bg-[#c2e66e] content-stretch flex items-center p-[10px] relative rounded-[10px] shrink-0" data-node-id="433:18120" data-name="Icon">
          <div className="relative shrink-0 size-[16px]" data-node-id="433:18121" data-name="Icon/Special/ForkKnife">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialForkKnife} />
          </div>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start justify-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="433:18122" data-name="Info Amount">
          <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="433:18123">
            {amount}
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="433:18124">{'comidas'}</p>
        </div>
      </div>
    </div>
  );
}

export default function Component06CalendarMobile() {
  const calendarData = useFigmaCalendar();
  return (
    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="433:17250" data-name="06. Calendar (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="433:17251" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I433:17251;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I433:17251;427:15210" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I433:17251;433:18077">
          Calendario
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I433:17251;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I433:17251;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[24px] items-start overflow-clip py-[24px] relative shrink-0 w-full" data-node-id="433:17252" data-name="Content">
        <div className="content-stretch flex gap-[16px] items-start px-[16px] relative shrink-0 w-full" data-node-id="433:18045" data-name="Section Statistics">
          <CardStatisticCalendar category="Planificación de comidas" className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]"  amount={String(calendarData.stats[0])}/>
          <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]" data-node-id="433:18047" data-name="Card Statistic - Calendar">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I433:18047;433:18117">
              Actividades físicas
            </p>
            <div className="h-0 relative shrink-0 w-full" data-node-id="I433:18047;433:18118" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="I433:18047;433:18119" data-name="Bottom">
              <div className="bg-[#ffcb65] content-stretch flex items-center p-[10px] relative rounded-[10px] shrink-0" data-node-id="I433:18047;433:18120" data-name="Icon">
                <div className="relative shrink-0 size-[16px]" data-node-id="I433:18047;433:18121" data-name="Icon/Special/ForkKnife">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleRun} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start justify-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:18047;433:18122" data-name="Info Amount">
                <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I433:18047;433:18123">{calendarData.stats[1]}</p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I433:18047;433:18124">
                  actividades
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]" data-node-id="433:18048" data-name="Card Statistic - Calendar">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I433:18048;433:18117">
              Citas y eventos
            </p>
            <div className="h-0 relative shrink-0 w-full" data-node-id="I433:18048;433:18118" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="I433:18048;433:18119" data-name="Bottom">
              <div className="bg-[#ffa257] content-stretch flex items-center p-[10px] relative rounded-[10px] shrink-0" data-node-id="I433:18048;433:18120" data-name="Icon">
                <div className="relative shrink-0 size-[16px]" data-node-id="I433:18048;433:18121" data-name="Icon/Special/ForkKnife">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialCalendarCheck} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start justify-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:18048;433:18122" data-name="Info Amount">
                <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I433:18048;433:18123">{calendarData.stats[2]}</p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I433:18048;433:18124">{'citas'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[8px] items-start pb-[8px] pt-[16px] relative shrink-0 w-full" data-node-id="433:18153" data-name="Section Calendar">
          <div className="content-stretch flex items-center justify-between px-[16px] relative shrink-0 w-full" data-node-id="433:18154" data-name="Header-Section">
            <div className="content-stretch flex items-center relative shrink-0" data-node-id="433:18155" data-name="Left Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-center relative shrink-0" data-node-id="433:18159" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="433:18160">{calendarData.monthName}</p>
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="433:18161">{calendarData.year}</p>
                <div className="relative shrink-0 size-[14px]" data-node-id="433:18162" data-name="Icon/CaretDown">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                </div>
              <input type="month" aria-label="Elegir mes" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={calendarData.year + '-' + String(calendarData.month.getMonth() + 1).padStart(2, '0')} onChange={(event) => calendarData.chooseMonth(event.target.value)} /></div>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="433:18163" data-name="Right Section">
              <div className="bg-[#eeeeef] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="433:18172" data-name="Button CTA">
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I433:18172;2:3476" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I433:18172;2:3477">{calendarData.view === 'month' ? 'Mes' : calendarData.view === 'week' ? 'Semana' : 'Día'}</p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I433:18172;2:3478" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I433:18172;2:3479" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              <select aria-label="Vista del calendario" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={calendarData.view} onChange={(event) => calendarData.setView(event.target.value as 'day' | 'week' | 'month')}><option value="day">Día</option><option value="week">Semana</option><option value="month">Mes</option></select></div>
              <div className="bg-[#c2e66e] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="433:18171" data-name="Button More" aria-label="Nueva actividad" role="button" tabIndex={0} onClick={() => calendarData.newActivity()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.newActivity(); } }}>
                <div className="relative shrink-0 size-[18px]" data-node-id="I433:18171;2:3578" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="433:18173" data-name="Calendar">
            <div className="content-stretch flex gap-[24px] items-center p-[16px] relative shrink-0 w-full" data-node-id="433:18174" data-name="Category List">
              <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="433:18175" data-name="Category" role="button" tabIndex={0} aria-pressed={calendarData.categories[0]} style={{ opacity: calendarData.categories[0] ? 1 : 0.45 }} onClick={() => calendarData.toggleCategory(0)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.toggleCategory(0); } }}>
                <div className="relative shrink-0 size-[16px]" data-node-id="433:18176" data-name="Checkbox">
                  <div className="absolute inset-[-6.25%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                  </div>
                </div>
                <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="433:18177" data-name="Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="433:18178">
                    Planificación de comidas
                  </p>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="433:18179" data-name="Category" role="button" tabIndex={0} aria-pressed={calendarData.categories[1]} style={{ opacity: calendarData.categories[1] ? 1 : 0.45 }} onClick={() => calendarData.toggleCategory(1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.toggleCategory(1); } }}>
                <div className="relative shrink-0 size-[16px]" data-node-id="433:18180" data-name="Checkbox">
                  <div className="absolute inset-[-6.25%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox1} />
                  </div>
                </div>
                <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="433:18181" data-name="Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="433:18182">
                    Actividades físicas
                  </p>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="433:18183" data-name="Category" role="button" tabIndex={0} aria-pressed={calendarData.categories[2]} style={{ opacity: calendarData.categories[2] ? 1 : 0.45 }} onClick={() => calendarData.toggleCategory(2)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.toggleCategory(2); } }}>
                <div className="relative shrink-0 size-[16px]" data-node-id="433:18184" data-name="Checkbox">
                  <div className="absolute inset-[-6.25%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox2} />
                  </div>
                </div>
                <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="433:18185" data-name="Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="433:18186">
                    Citas y eventos
                  </p>
                </div>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center overflow-clip relative shrink-0 w-full" data-node-id="433:18187" data-name="Row-Calendar-Head">
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative"  day="Dom"/>
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Lun" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Mar" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Mié" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Jue" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Vie" />
              <div className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" data-node-id="433:18194" data-name="Cell-Calendar-Head">
                <div className="content-stretch flex h-[16px] items-center justify-center pb-px relative shrink-0" data-node-id="I433:18194;433:18452" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I433:18194;433:18453">
                    Sáb
                  </p>
                </div>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18195" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[0] ? undefined : 'none' }}>
              <FigmaCalendarCell index={0} nodeId="433:18196" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={1} nodeId="433:18197" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={2} nodeId="433:18198" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={3} nodeId="433:18199" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={4} className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={5} nodeId="433:18201" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={6} nodeId="433:18202" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18203" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[7] ? undefined : 'none' }}>
              <FigmaCalendarCell index={7} nodeId="433:18204" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={8} nodeId="433:18205" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={9} nodeId="433:18206" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={10} nodeId="433:18207" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={11} nodeId="433:18208" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={12} nodeId="433:18209" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={13} nodeId="433:18210" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18211" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[14] ? undefined : 'none' }}>
              <FigmaCalendarCell index={14} nodeId="433:18212" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={15} className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={16} nodeId="433:18214" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={17} nodeId="433:18215" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={18} className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={19} nodeId="433:18217" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={20} nodeId="433:18218" className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18219" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[21] ? undefined : 'none' }}>
              <FigmaCalendarCell index={21} nodeId="433:18220" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={22} nodeId="433:18221" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={23} nodeId="433:18222" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={24} nodeId="433:18223" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={25} nodeId="433:18224" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={26} nodeId="433:18225" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={27} nodeId="433:18226" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
            <div className="content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18227" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[28] ? undefined : 'none' }}>
              <FigmaCalendarCell index={28} nodeId="433:18228" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={29} nodeId="433:18229" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={30} nodeId="433:18230" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={31} nodeId="433:18231" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={32} nodeId="433:18232" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={33} nodeId="433:18233" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              <FigmaCalendarCell index={34} nodeId="433:18234" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
            </div>
          <FigmaCalendarExtraRow assetPathPrefix={assetPathPrefix} /></div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[16px] items-start pb-[20px] pt-[16px] px-[16px] relative shrink-0 w-full" data-node-id="433:18471" data-name="Right Side">
          <div className="content-stretch flex items-center justify-between px-[8px] relative shrink-0 w-full" data-node-id="433:18472" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-731px] relative shrink-0" data-node-id="I433:18472;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I433:18472;2:4223">
                Detalles de la agenda
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I433:18472;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I433:18472;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I433:18472;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="433:18473" data-name="List Schedule">
            <FigmaCalendarDetails />
            
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="433:17504" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="433:17505" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="433:17506">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="433:17507" data-name="Links">
              <p className="relative shrink-0" data-node-id="433:17508">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="433:17509">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="433:17510">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="433:17511" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="433:17512" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:17513" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:17514" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:17515" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:17516" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
