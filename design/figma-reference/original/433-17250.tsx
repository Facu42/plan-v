const assetPathPrefix = "https://www.figma.com/api/mcp/asset/f151f087-0dc2-49bf-ba41-216d19506e3e";
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

function CellCalendarBody({ className, date = "31", variant = "Off Day" }: CellCalendarBodyProps) {
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

function CardStatisticCalendar({ className, amount = "15", category = "Total Physical Activities Schedule", model = "Mobile" }: CardStatisticCalendarProps) {
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
          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="433:18124">
            agendas
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Component06CalendarMobile() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="433:17250" data-name="06. Calendar (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="433:17251" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I433:17251;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I433:17251;427:15210" data-name="Logo">
            <div className="absolute inset-[6.25%]" data-node-id="I433:17251;427:15210;408:17493" data-name="symbol">
              <div className="absolute bg-[#c2e66e] inset-[53.57%_7.14%_-3.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I433:17251;427:15210;408:17494" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] inset-[-3.57%_7.14%_53.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I433:17251;427:15210;408:17495" data-name="Bowl" />
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I433:17251;433:18077">
          Calendar
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I433:17251;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I433:17251;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[24px] items-start overflow-clip py-[24px] relative shrink-0 w-full" data-node-id="433:17252" data-name="Content">
        <div className="content-stretch flex gap-[16px] items-start px-[16px] relative shrink-0 w-full" data-node-id="433:18045" data-name="Section Statistics">
          <CardStatisticCalendar category="Meal Planning" className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]" />
          <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]" data-node-id="433:18047" data-name="Card Statistic - Calendar">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I433:18047;433:18117">
              Physical Activities
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
                <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I433:18047;433:18123">
                  10
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I433:18047;433:18124">
                  agendas
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]" data-node-id="433:18048" data-name="Card Statistic - Calendar">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I433:18048;433:18117">
              Appointments/Events
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
                <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I433:18048;433:18123">
                  5
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I433:18048;433:18124">
                  agendas
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[8px] items-start pb-[8px] pt-[16px] relative shrink-0 w-full" data-node-id="433:18153" data-name="Section Calendar">
          <div className="content-stretch flex items-center justify-between px-[16px] relative shrink-0 w-full" data-node-id="433:18154" data-name="Header-Section">
            <div className="content-stretch flex items-center relative shrink-0" data-node-id="433:18155" data-name="Left Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-center relative shrink-0" data-node-id="433:18159" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="433:18160">
                  September
                </p>
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="433:18161">
                  2028
                </p>
                <div className="relative shrink-0 size-[14px]" data-node-id="433:18162" data-name="Icon/CaretDown">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="433:18163" data-name="Right Section">
              <div className="bg-[#eeeeef] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="433:18172" data-name="Button CTA">
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I433:18172;2:3476" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I433:18172;2:3477">
                    Month
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I433:18172;2:3478" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I433:18172;2:3479" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="433:18171" data-name="Button More">
                <div className="relative shrink-0 size-[18px]" data-node-id="I433:18171;2:3578" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="433:18173" data-name="Calendar">
            <div className="content-stretch flex gap-[24px] items-center p-[16px] relative shrink-0 w-full" data-node-id="433:18174" data-name="Category List">
              <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="433:18175" data-name="Category">
                <div className="relative shrink-0 size-[16px]" data-node-id="433:18176" data-name="Checkbox">
                  <div className="absolute inset-[-6.25%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                  </div>
                </div>
                <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="433:18177" data-name="Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="433:18178">
                    Meal Planning
                  </p>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="433:18179" data-name="Category">
                <div className="relative shrink-0 size-[16px]" data-node-id="433:18180" data-name="Checkbox">
                  <div className="absolute inset-[-6.25%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox1} />
                  </div>
                </div>
                <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="433:18181" data-name="Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="433:18182">
                    Physical Activities
                  </p>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="433:18183" data-name="Category">
                <div className="relative shrink-0 size-[16px]" data-node-id="433:18184" data-name="Checkbox">
                  <div className="absolute inset-[-6.25%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox2} />
                  </div>
                </div>
                <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="433:18185" data-name="Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="433:18186">
                    Appointments/Events
                  </p>
                </div>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center overflow-clip relative shrink-0 w-full" data-node-id="433:18187" data-name="Row-Calendar-Head">
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Mon" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Tue" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Wed" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Thu" />
              <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" day="Fri" />
              <div className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px p-[10px] relative" data-node-id="433:18194" data-name="Cell-Calendar-Head">
                <div className="content-stretch flex h-[16px] items-center justify-center pb-px relative shrink-0" data-node-id="I433:18194;433:18452" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I433:18194;433:18453">
                    Sat
                  </p>
                </div>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18195" data-name="Row-Calendar-Body">
              <div className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" data-node-id="433:18196" data-name="Cell-Calendar-Body">
                <div className="absolute inset-[-6.74%_calc(-87.5%-1.87px)_-6.74%_calc(-86.46%-0.86px)]" data-node-id="I433:18196;217:7505" data-name="Vector">
                  <div className="absolute inset-[-0.15%_-0.3%]">
                    <img alt="" className="block max-w-none size-full" src={imgVector1} />
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-center overflow-clip p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18196;217:7506" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#bebfc2] text-[10px] whitespace-nowrap" data-node-id="I433:18196;217:7507">
                    27
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" data-node-id="433:18197" data-name="Cell-Calendar-Body">
                <div className="absolute inset-[-6.74%_calc(-87.5%-1.87px)_-6.74%_calc(-86.46%-0.86px)]" data-node-id="I433:18197;217:7505" data-name="Vector">
                  <div className="absolute inset-[-0.15%_-0.3%]">
                    <img alt="" className="block max-w-none size-full" src={imgVector2} />
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-center overflow-clip p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18197;217:7506" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#bebfc2] text-[10px] whitespace-nowrap" data-node-id="I433:18197;217:7507">
                    28
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" data-node-id="433:18198" data-name="Cell-Calendar-Body">
                <div className="absolute inset-[-6.74%_calc(-87.5%-1.87px)_-6.74%_calc(-86.46%-0.86px)]" data-node-id="I433:18198;217:7505" data-name="Vector">
                  <div className="absolute inset-[-0.15%_-0.3%]">
                    <img alt="" className="block max-w-none size-full" src={imgVector2} />
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-center overflow-clip p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18198;217:7506" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#bebfc2] text-[10px] whitespace-nowrap" data-node-id="I433:18198;217:7507">
                    29
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" data-node-id="433:18199" data-name="Cell-Calendar-Body">
                <div className="absolute inset-[-6.74%_calc(-87.5%-1.87px)_-6.74%_calc(-86.46%-0.86px)]" data-node-id="I433:18199;217:7505" data-name="Vector">
                  <div className="absolute inset-[-0.15%_-0.3%]">
                    <img alt="" className="block max-w-none size-full" src={imgVector2} />
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-center overflow-clip p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18199;217:7506" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#bebfc2] text-[10px] whitespace-nowrap" data-node-id="I433:18199;217:7507">
                    30
                  </p>
                </div>
              </div>
              <CellCalendarBody className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" />
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18201" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18201;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18201;217:7510">
                    1
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18202" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18202;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18202;217:7510">
                    2
                  </p>
                </div>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18203" data-name="Row-Calendar-Body">
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18204" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18204;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18204;217:7510">
                    3
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18205" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18205;217:7512" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18205;217:7513">
                    4
                  </p>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18205;217:7514" data-name="Schedule">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18205;217:7515" data-name="Main">
                    <p className="leading-[1.3] relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18205;217:7517">
                      9:00 AM
                    </p>
                    <ul className="block leading-[0] relative shrink-0 text-[#272932] w-full" data-node-id="I433:18205;217:7516">
                      <li className="list-disc ms-[12px]">
                        <span className="leading-[1.3]">Grocery Shopping: Fruits</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18206" data-name="Cell-Calendar-Body">
                <div className="bg-[#dff9a2] content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18206;217:8024" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18206;217:8025">
                    5
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-h-px relative w-full" data-node-id="I433:18206;217:8034" data-name="Schedules">
                  <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18206;217:8026" data-name="Schedule">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18206;217:8027" data-name="Main">
                      <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18206;217:8028">
                        7:00 AM
                      </p>
                      <p className="overflow-hidden relative shrink-0 text-[#272932] text-ellipsis w-full" data-node-id="I433:18206;217:8029">
                        Morning Yoga Session
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18206;217:8030" data-name="Schedule">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18206;217:8031" data-name="Main">
                      <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18206;217:8032">
                        3:00 PM
                      </p>
                      <p className="overflow-hidden relative shrink-0 text-[#272932] text-ellipsis w-full" data-node-id="I433:18206;217:8033">
                        General Health Check-up with Doctor
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18207" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18207;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18207;217:7510">
                    6
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18208" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18208;217:7512" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18208;217:7513">
                    7
                  </p>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18208;217:7514" data-name="Schedule">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18208;217:7515" data-name="Main">
                    <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18208;217:7517">
                      6:00 PM
                    </p>
                    <p className="relative shrink-0 text-[#272932] w-full" data-node-id="I433:18208;217:7516">
                      Meal Preparation for Two Days
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18209" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18209;217:7512" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18209;217:7513">
                    8
                  </p>
                </div>
                <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18209;217:7514" data-name="Schedule">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18209;217:7515" data-name="Main">
                    <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18209;217:7517">
                      7:30 AM
                    </p>
                    <p className="relative shrink-0 text-[#272932] w-full" data-node-id="I433:18209;217:7516">
                      Running 5 km
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18210" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18210;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18210;217:7510">
                    9
                  </p>
                </div>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18211" data-name="Row-Calendar-Body">
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18212" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18212;217:7512" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18212;217:7513">
                    10
                  </p>
                </div>
                <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18212;217:7514" data-name="Schedule">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18212;217:7515" data-name="Main">
                    <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18212;217:7517">
                      5:00 PM
                    </p>
                    <p className="relative shrink-0 text-[#272932] w-full" data-node-id="I433:18212;217:7516">
                      Online Nutrition Workshop
                    </p>
                  </div>
                </div>
              </div>
              <CellCalendarBody className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" date="11" variant="Default" />
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18214" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18214;217:7512" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18214;217:7513">
                    12
                  </p>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18214;217:7514" data-name="Schedule">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18214;217:7515" data-name="Main">
                    <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18214;217:7517">
                      6:00 PM
                    </p>
                    <p className="relative shrink-0 text-[#272932] w-full" data-node-id="I433:18214;217:7516">
                      Quinoa Salad (Dinner)
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18215" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18215;217:7512" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18215;217:7513">
                    13
                  </p>
                </div>
                <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18215;217:7514" data-name="Schedule">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18215;217:7515" data-name="Main">
                    <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18215;217:7517">
                      8:00 AM
                    </p>
                    <p className="relative shrink-0 text-[#272932] w-full" data-node-id="I433:18215;217:7516">
                      Strength Training – Squats (50kg)
                    </p>
                  </div>
                </div>
              </div>
              <CellCalendarBody className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" date="14" variant="Default" />
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18217" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18217;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18217;217:7510">
                    15
                  </p>
                </div>
              </div>
              <div className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18218" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18218;217:8024" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18218;217:8025">
                    16
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-h-px relative w-full" data-node-id="I433:18218;217:8034" data-name="Schedules">
                  <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18218;217:8026" data-name="Schedule">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18218;217:8027" data-name="Main">
                      <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18218;217:8028">
                        7:00 AM
                      </p>
                      <p className="overflow-hidden relative shrink-0 text-[#272932] text-ellipsis w-full" data-node-id="I433:18218;217:8029">
                        Meal Prep: Oatmeal with Berries (Breakfast)
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18218;217:8030" data-name="Schedule">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18218;217:8031" data-name="Main">
                      <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18218;217:8032">
                        4:00 PM
                      </p>
                      <p className="overflow-hidden relative shrink-0 text-[#272932] text-ellipsis w-full" data-node-id="I433:18218;217:8033">
                        Follow-up Consultation with a Nutritionist
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18219" data-name="Row-Calendar-Body">
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18220" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18220;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18220;217:7510">
                    17
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18221" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18221;217:8024" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18221;217:8025">
                    18
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-h-px relative w-full" data-node-id="I433:18221;217:8034" data-name="Schedules">
                  <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18221;217:8026" data-name="Schedule">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18221;217:8027" data-name="Main">
                      <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18221;217:8028">
                        9:00 AM
                      </p>
                      <p className="overflow-hidden relative shrink-0 text-[#272932] text-ellipsis w-full" data-node-id="I433:18221;217:8029">
                        Swimming Session
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18221;217:8030" data-name="Schedule">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18221;217:8031" data-name="Main">
                      <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18221;217:8032">
                        5:00 PM
                      </p>
                      <p className="overflow-hidden relative shrink-0 text-[#272932] text-ellipsis w-full" data-node-id="I433:18221;217:8033">
                        Grocery Shopping: Veggies
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18222" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18222;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18222;217:7510">
                    19
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18223" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18223;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18223;217:7510">
                    20
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18224" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18224;217:7512" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18224;217:7513">
                    21
                  </p>
                </div>
                <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18224;217:7514" data-name="Schedule">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18224;217:7515" data-name="Main">
                    <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18224;217:7517">
                      6:00 PM
                    </p>
                    <p className="relative shrink-0 text-[#272932] w-full" data-node-id="I433:18224;217:7516">
                      Outdoor Group Fitness Class
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18225" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18225;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18225;217:7510">
                    22
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18226" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18226;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18226;217:7510">
                    23
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18227" data-name="Row-Calendar-Body">
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18228" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18228;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18228;217:7510">
                    24
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18229" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18229;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18229;217:7510">
                    25
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18230" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18230;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18230;217:7510">
                    26
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" data-node-id="433:18231" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-node-id="I433:18231;217:8024" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18231;217:8025">
                    27
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-h-px relative w-full" data-node-id="I433:18231;217:8034" data-name="Schedules">
                  <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18231;217:8026" data-name="Schedule">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18231;217:8027" data-name="Main">
                      <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18231;217:8028">
                        8:00 AM
                      </p>
                      <p className="overflow-hidden relative shrink-0 text-[#272932] text-ellipsis w-full" data-node-id="I433:18231;217:8029">
                        Flexibility Training – Stretching
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px p-[6px] relative rounded-[4px] w-full" data-node-id="I433:18231;217:8030" data-name="Schedule">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start leading-[1.3] not-italic relative shrink-0 text-[8px] w-full" data-node-id="I433:18231;217:8031" data-name="Main">
                      <p className="relative shrink-0 text-[#52545b] w-full" data-node-id="I433:18231;217:8032">
                        2:00 PM
                      </p>
                      <p className="overflow-hidden relative shrink-0 text-[#272932] text-ellipsis w-full" data-node-id="I433:18231;217:8033">
                        Nutritional Consultation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18232" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18232;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18232;217:7510">
                    28
                  </p>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18233" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18233;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18233;217:7510">
                    29
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" data-node-id="433:18234" data-name="Cell-Calendar-Body">
                <div className="content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px]" data-node-id="I433:18234;217:7509" data-name="Day">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I433:18234;217:7510">
                    30
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[16px] items-start pb-[20px] pt-[16px] px-[16px] relative shrink-0 w-full" data-node-id="433:18471" data-name="Right Side">
          <div className="content-stretch flex items-center justify-between px-[8px] relative shrink-0 w-full" data-node-id="433:18472" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-731px] relative shrink-0" data-node-id="I433:18472;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I433:18472;2:4223">
                Schedule Details
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
            <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="433:18474" data-name="Schedule 1">
              <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="433:18475" data-name="Badge Category">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="433:18476">
                  Physical Activities
                </p>
              </div>
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.2] min-w-full not-italic relative shrink-0 text-[#272932] text-[18px] w-[min-content]" data-node-id="433:18477">
                Morning Yoga Session
              </p>
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="433:18478" data-name="Details">
                <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="433:18479" data-name="Detail Date">
                  <div className="relative shrink-0 size-[16px]" data-node-id="433:18480" data-name="Icon/Nav/CalendarDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="433:18481">
                    Tuesday, 5 September 2028
                  </p>
                </div>
                <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="433:18482" data-name="Detail Date">
                  <div className="relative shrink-0 size-[16px]" data-node-id="433:18483" data-name="Icon/Clock">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="433:18484">
                    7:00 AM
                  </p>
                </div>
                <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="433:18485" data-name="Detail Date">
                  <div className="relative shrink-0 size-[16px]" data-node-id="433:18486" data-name="Icon/MapPinArea">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMapPinArea} />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="433:18487">
                    Sunrise Yoga Studio, Main Street
                  </p>
                </div>
              </div>
              <div className="bg-[#fefcfb] content-stretch flex flex-col gap-[8px] h-[108px] items-start p-[12px] relative rounded-[12px] shrink-0 w-full" data-node-id="433:18488" data-name="Details">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="433:18489">
                  Note
                </p>
                <div className="h-0 relative shrink-0 w-full" data-node-id="433:18490" data-name="Divider">
                  <div className="absolute inset-[-0.5px_0]">
                    <img alt="" className="block max-w-none size-full" src={imgDivider1} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.5] min-w-full not-italic relative shrink-0 text-[#52545b] text-[12px] w-[min-content]" data-node-id="433:18491">
                  Focus on flexibility and breathing exercises, 1-hour session
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-end justify-end relative shrink-0 w-full" data-node-id="433:18492" data-name="Action">
                <div className="bg-[#fefcfb] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="433:18493" data-name="Button CTA">
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I433:18493;2:3331" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I433:18493;2:3332">
                      Edit
                    </p>
                  </div>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="433:18494" data-name="Button CTA">
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I433:18494;2:3331" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I433:18494;2:3332">
                      Remove
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="433:18495" data-name="Schedule 2">
              <div className="content-stretch flex items-start relative shrink-0" data-node-id="433:18496" data-name="Header">
                <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="433:18497" data-name="Badge Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="433:18498">
                    Appointments
                  </p>
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.2] min-w-full not-italic relative shrink-0 text-[#272932] text-[18px] w-[min-content]" data-node-id="433:18499">
                General Health Check-up with Doctor
              </p>
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="433:18500" data-name="Details">
                <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="433:18501" data-name="Detail Date">
                  <div className="relative shrink-0 size-[16px]" data-node-id="433:18502" data-name="Icon/Nav/CalendarDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="433:18503">
                    Tuesday, 5 September 2028
                  </p>
                </div>
                <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="433:18504" data-name="Detail Date">
                  <div className="relative shrink-0 size-[16px]" data-node-id="433:18505" data-name="Icon/Clock">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="433:18506">
                    3:00 PM
                  </p>
                </div>
                <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="433:18507" data-name="Detail Date">
                  <div className="relative shrink-0 size-[16px]" data-node-id="433:18508" data-name="Icon/MapPinArea">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMapPinArea} />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="433:18509">
                    Central Health Clinic, 5th Avenue
                  </p>
                </div>
              </div>
              <div className="bg-[#fefcfb] content-stretch flex flex-col gap-[8px] items-start p-[12px] relative rounded-[12px] shrink-0 w-full" data-node-id="433:18510" data-name="Details">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="433:18511">
                  Note
                </p>
                <div className="h-0 relative shrink-0 w-full" data-node-id="433:18512" data-name="Divider">
                  <div className="absolute inset-[-0.5px_0]">
                    <img alt="" className="block max-w-none size-full" src={imgDivider1} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.5] min-w-full not-italic relative shrink-0 text-[#52545b] text-[12px] w-[min-content]" data-node-id="433:18513">
                  Annual check-up, bring previous health records, and fasting required for blood tests.
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-start justify-end relative shrink-0 w-full" data-node-id="433:18514" data-name="Action">
                <div className="bg-[#fefcfb] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="433:18515" data-name="Button CTA">
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I433:18515;2:3331" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I433:18515;2:3332">
                      Edit
                    </p>
                  </div>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="433:18516" data-name="Button CTA">
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I433:18516;2:3331" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I433:18516;2:3332">
                      Remove
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="433:17504" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="433:17505" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="433:17506">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="433:17507" data-name="Links">
              <p className="relative shrink-0" data-node-id="433:17508">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="433:17509">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="433:17510">
                Contact
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
