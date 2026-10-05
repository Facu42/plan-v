const assetPathPrefix = "https://www.figma.com/api/mcp/asset/e9c85ebf-4211-493c-911b-43ddf5540d40";
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconCaretDown = `${assetPathPrefix}/8e5ed.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconSpecialSpeedometer = `${assetPathPrefix}/7544e.svg`;
const imgLine = `${assetPathPrefix}/c0d2a.svg`;
const imgLine1 = `${assetPathPrefix}/0b752.svg`;
const imgLine2 = `${assetPathPrefix}/99357.svg`;
const imgIconSpecialFootprints = `${assetPathPrefix}/94e6c.svg`;
const imgVector = `${assetPathPrefix}/e6f03.svg`;
const imgIconSpecialMoonStars = `${assetPathPrefix}/7d1c2.svg`;
const imgEllipse3 = `${assetPathPrefix}/f2c94.svg`;
const imgEllipse4 = `${assetPathPrefix}/5bce9.svg`;
const imgIconSpecialPintGlass = `${assetPathPrefix}/99830.svg`;
const imgDonutBase = `${assetPathPrefix}/e1fc6.svg`;
const imgMaskGroup = `${assetPathPrefix}/a6b65.svg`;
const imgDonutProgress = `${assetPathPrefix}/5a1ca.svg`;
const imgVector10 = `${assetPathPrefix}/61258.svg`;
const imgEllipseBase = `${assetPathPrefix}/596c8.svg`;
const imgDonutBase1 = `${assetPathPrefix}/4fd1b.svg`;
const imgDonutProgress1 = `${assetPathPrefix}/1af77.svg`;
const imgIconSpecialLightning = `${assetPathPrefix}/ea252.svg`;
const imgIconSpecialForkKnife = `${assetPathPrefix}/63f81.svg`;
const imgIconSpecialFire = `${assetPathPrefix}/2b142.svg`;
const imgIconSpecialPersonSimpleRun = `${assetPathPrefix}/6e985.svg`;
const imgIconSpecialPersonSimpleDeadlifts = `${assetPathPrefix}/2218d.svg`;
const imgIconSpecialPersonSimpleTaiChi = `${assetPathPrefix}/6b479.svg`;
const imgIconSpecialFire1 = `${assetPathPrefix}/3003c.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/7470b.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/76a07.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/bc928.svg`;
const imgIconClock = `${assetPathPrefix}/5abc0.svg`;
const imgIconChartBar = `${assetPathPrefix}/a1d03.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/6e80c.svg`;
const imgIconCaretRight = `${assetPathPrefix}/27dfe.svg`;
const imgCheckbox = `${assetPathPrefix}/13628.svg`;
const imgIconCaretUp = `${assetPathPrefix}/58124.svg`;
const imgDivider = `${assetPathPrefix}/d6cd0.svg`;
const imgIconSpecialBread1 = `${assetPathPrefix}/0c987.svg`;
const imgIconSpecialFish1 = `${assetPathPrefix}/d6aa7.svg`;
const imgIconSpecialDrop1 = `${assetPathPrefix}/188dc.svg`;
const imgDivider1 = `${assetPathPrefix}/9ef3a.svg`;
const imgCheckbox1 = `${assetPathPrefix}/db928.svg`;
const imgCheckbox2 = `${assetPathPrefix}/82059.svg`;
const imgCheckbox3 = `${assetPathPrefix}/0280f.svg`;
const imgIconBell = `${assetPathPrefix}/0f7c2.svg`;
const imgLine3 = `${assetPathPrefix}/ccbf8.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/184b6.svg`;
const imgIconSpecialPersonSimpleRun1 = `${assetPathPrefix}/49c0e.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/3dba6.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type InputSearchProps = {
  className?: string;
  placeholder?: string;
  size?: "Small";
};

function InputSearch({ className, placeholder = "Search placeholder", size = "Small" }: InputSearchProps) {
  return (
    <div className={className || "bg-[#f6f6f7] content-stretch flex gap-[4px] items-center px-[8px] py-[6px] relative rounded-[8px] w-[223px]"} data-node-id="2:3946">
      <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="2:3947" data-name="Icon">
        <div className="relative shrink-0 size-[14px]" data-node-id="2:3948" data-name="Icon/MagnifyingGlass">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
        </div>
      </div>
      <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="2:3949" data-name="Text">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="2:3950">
          {placeholder}
        </p>
      </div>
    </div>
  );
}

type HeaderSectionProps = {
  className?: string;
  addInfo?: string;
  model?: "Default";
  showAddInfo?: boolean;
  showButtonMore?: boolean;
  showCta?: boolean;
  showPicker?: boolean;
  showPicker2?: boolean;
  showSearchInput?: boolean;
  showSegmentedButton?: boolean;
  showSortBy?: boolean;
  title?: string;
};

function HeaderSection({ className, addInfo = "(1,242)", model = "Default", showAddInfo = false, showButtonMore = true, showCta = true, showPicker = true, showPicker2 = true, showSearchInput = true, showSegmentedButton = true, showSortBy = true, title = "Header Title" }: HeaderSectionProps) {
  return (
    <div className={className || "content-stretch flex items-center justify-between relative w-[1281px]"} data-node-id="2:4221">
      <div className="[word-break:break-word] content-stretch flex gap-[4px] h-[18px] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="2:4222" data-name="Div Title">
        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="2:4223">
          {title}
        </p>
        {showAddInfo && (
          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#868f9b] text-[11px]" data-node-id="2:4224">
            {addInfo}
          </p>
        )}
      </div>
      <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="2:4225" data-name="Right Section">
        {showSearchInput && <InputSearch className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-center px-[8px] py-[6px] relative rounded-[8px] shrink-0 w-[223px]" />}
        {showSegmentedButton && (
          <div className="bg-[#eeeeef] content-stretch flex gap-[2px] items-start relative rounded-[10px] shrink-0 w-[313px]" data-node-id="2:4227" data-name="Segmented Button">
            <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[12px] py-[6px] relative rounded-[8px]" data-node-id="I2:4227;2:3607" data-name="Button Picker">
              <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I2:4227;2:3607;2:3331" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I2:4227;2:3607;2:3332">
                  Tab 1
                </p>
              </div>
            </div>
            <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[6px] relative rounded-[8px]" data-node-id="I2:4227;2:3608" data-name="Button Picker">
              <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I2:4227;2:3608;2:3481" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I2:4227;2:3608;2:3482">
                  Tab 2
                </p>
              </div>
            </div>
            <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[6px] relative rounded-[8px]" data-node-id="I2:4227;2:3609" data-name="Button Picker">
              <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I2:4227;2:3609;2:3481" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I2:4227;2:3609;2:3482">
                  Tab 3
                </p>
              </div>
            </div>
          </div>
        )}
        {showPicker && (
          <div className="bg-[#eeeeef] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="2:4228" data-name="Button Picker">
            <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I2:4228;2:3476" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I2:4228;2:3477">
                Popular
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I2:4228;2:3478" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I2:4228;2:3479" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
        )}
        {showPicker2 && (
          <div className="bg-[#eeeeef] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="2:4229" data-name="Button Picker">
            <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I2:4229;2:3476" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I2:4229;2:3477">
                Popular
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I2:4229;2:3478" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I2:4229;2:3479" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
        )}
        {showSortBy && (
          <div className="content-stretch flex gap-[10px] items-baseline relative shrink-0" data-node-id="2:4230" data-name="Sort by">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="2:4231">
              Sort by:
            </p>
            <div className="bg-[#eeeeef] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="2:4232" data-name="Button Picker">
              <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I2:4232;2:3476" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I2:4232;2:3477">
                  Popular
                </p>
              </div>
              <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I2:4232;2:3478" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I2:4232;2:3479" data-name="Icon/CaretDown">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                </div>
              </div>
            </div>
          </div>
        )}
        {showButtonMore && (
          <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="2:4233" data-name="Button More">
            <div className="relative shrink-0 size-[24px]" data-node-id="I2:4233;2:3576" data-name="Icon/ChatTeardropDots">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
            </div>
          </div>
        )}
        {showCta && (
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="2:4234" data-name="Button CTA">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I2:4234;2:3331" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I2:4234;2:3332">
                Popular
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type CellCalendarDashboardProps = {
  className?: string;
  active?: boolean;
  date?: string;
  day?: string;
};

function CellCalendarDashboard({ className, active = false, date = "4", day = "Mon" }: CellCalendarDashboardProps) {
  const isActive = active;
  const isNotActive = !active;
  return (
    <div className={className || `content-stretch flex flex-col items-center pb-[6px] pt-[8px] px-[4px] relative rounded-[10px] w-[38px] ${isActive ? "bg-[#c2e66e] text-[#272932]" : ""}`} id={isActive ? "node-28_953" : "node-28_932"}>
      {isNotActive && (
        <>
          <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px] w-full" data-node-id="28:221">
            {day}
          </p>
          <div className="flex flex-col font-['Poppins:SemiBold'] h-[30px] justify-center leading-[0] relative shrink-0 text-[#272932] text-[16px] w-full" data-node-id="28:930">
            <p className="leading-[1.24]">{date}</p>
          </div>
        </>
      )}
      {isActive && (
        <>
          <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[10px] w-full" data-node-id="28:954">
            {day}
          </p>
          <div className="flex flex-col font-['Poppins:SemiBold'] h-[30px] justify-center leading-[0] relative shrink-0 text-[16px] w-full" data-node-id="28:955">
            <p className="leading-[1.24]">{date}</p>
          </div>
        </>
      )}
    </div>
  );
}

type ItemListMacronutrientsProps = {
  className?: string;
  amount?: string;
  nutrients?: string;
  percentage?: string;
  unit?: string;
};

function ItemListMacronutrients({ className, amount = "120", nutrients = "Carbohydrates", percentage = "37%", unit = "/325gr" }: ItemListMacronutrientsProps) {
  return (
    <div className={className || "bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] w-[275px]"} data-node-id="67:706" data-name="Item List Macronutrients">
      <div className="[word-break:break-word] bg-[#eeeeef] content-stretch flex items-baseline justify-between not-italic px-[12px] py-[8px] relative rounded-[10px] shrink-0 w-[89px] whitespace-nowrap" data-node-id="67:675" data-name="Current Weight">
        <p className="font-['Poppins:Bold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="67:676">
          {amount}
        </p>
        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="67:677">
          {unit}
        </p>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-node-id="67:683" data-name="Main Data">
        <div className="[word-break:break-word] content-stretch flex items-start justify-between leading-[1.24] not-italic relative shrink-0 text-[11px] w-full whitespace-nowrap" data-node-id="67:680" data-name="Header">
          <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="67:678">
            {nutrients}
          </p>
          <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="67:679">
            {percentage}
          </p>
        </div>
        <div className="bg-white content-stretch flex flex-col items-start pr-[114.03px] relative rounded-[6px] shrink-0 w-full" data-node-id="67:682" data-name="Chart">
          <div className="bg-[#c2e66e] h-[6px] relative rounded-[6px] shrink-0 w-full" data-node-id="67:681" data-name="Progress Bar" />
        </div>
      </div>
    </div>
  );
}

export default function Component03DashboardMobile() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="427:14405" data-name="03. Dashboard (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="427:14406" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I427:14406;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I427:14406;427:15210" data-name="Logo">
            <div className="absolute inset-[6.25%]" data-node-id="I427:14406;427:15210;408:17493" data-name="symbol">
              <div className="absolute bg-[#c2e66e] inset-[53.57%_7.14%_-3.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I427:14406;427:15210;408:17494" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] inset-[-3.57%_7.14%_53.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I427:14406;427:15210;408:17495" data-name="Bowl" />
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I427:14406;433:18077">
          Dashboard
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I427:14406;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I427:14406;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[24px] items-start overflow-clip px-[16px] py-[24px] relative shrink-0 w-full" data-node-id="427:14407" data-name="Content">
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="427:14408" data-name="Header">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px not-italic py-[2px] relative" data-node-id="I427:14408;427:15258" data-name="Title">
            <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[20px] w-full whitespace-pre-wrap" data-node-id="I427:14408;427:15259">{`Hello, Adam!  👋`}</p>
            <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I427:14408;427:15260">{`Let's begin our journey to better health today`}</p>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="427:14410" data-name="Section Statistics">
          <div className="bg-white content-stretch flex flex-col h-[142px] items-start justify-between p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14411" data-name="Card Statistic - Dashboard">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="427:14412" data-name="Header">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="427:14413">
                Weight
              </p>
              <div className="bg-[#c2e66e] content-stretch flex items-baseline p-[6px] relative rounded-[10px] shrink-0" data-node-id="427:14414" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="427:14415" data-name="Icon/Special/Speedometer">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialSpeedometer} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="427:14416" data-name="Chart">
              <div className="bg-[#f6f6f7] content-stretch flex h-[6px] items-center pl-[107px] relative rounded-[6px] shrink-0 w-full" data-node-id="427:14417" data-name="Slider">
                <div className="relative shrink-0 size-[14px]" data-node-id="427:14418" data-name="Button Slider">
                  <div className="absolute bg-[#ffa257] left-0 rounded-[16px] size-[14px] top-0" data-node-id="427:14419" data-name="Progress Bar" />
                  <div className="-translate-x-1/2 [word-break:break-word] absolute bottom-[20px] content-stretch flex gap-[4px] items-baseline justify-end left-[calc(50%-0.5px)] not-italic whitespace-nowrap" data-node-id="427:14420" data-name="Info Current Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="427:14421">
                      78
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="427:14422">
                      kg
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="427:14423" data-name="Ruler">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="427:14424" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14425" data-name="Line">
                    <div className="absolute inset-[-2.5%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="427:14426" data-name="Number">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="427:14427">
                      85
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14428" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14429" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14430" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14431" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14432" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14433" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14434" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14435" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="427:14436" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14437" data-name="Line">
                    <div className="absolute inset-[-2.5%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="427:14438" data-name="Number">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="427:14439">
                      80
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14440" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14441" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14442" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14443" data-name="Line">
                    <div className="absolute inset-[-10.71%_-1.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine2} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14444" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14445" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14446" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14447" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="427:14448" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14449" data-name="Line">
                    <div className="absolute inset-[-2.5%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="427:14450" data-name="Number">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="427:14451">
                      75
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14452" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14453" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14454" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14455" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14456" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14457" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14458" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14459" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="427:14460" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14461" data-name="Line">
                    <div className="absolute inset-[-2.5%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="427:14462" data-name="Number">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="427:14463">
                      70
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14464" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14465" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14466" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14467" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14468" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14469" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="427:14470" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14471" data-name="Line">
                    <div className="absolute inset-[-3.57%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine1} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="427:14472" data-name="Column Ruler">
                  <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="427:14473" data-name="Line">
                    <div className="absolute inset-[-2.5%_-0.5px]">
                      <img alt="" className="block max-w-none size-full" src={imgLine} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="427:14474" data-name="Number">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="427:14475">
                      65
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col h-[142px] items-start justify-between p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14476" data-name="Card Statistic - Dashboard">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="427:14477" data-name="Header">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="427:14478">
                Steps
              </p>
              <div className="bg-[#c2e66e] content-stretch flex items-baseline p-[6px] relative rounded-[10px] shrink-0" data-node-id="427:14479" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="427:14480" data-name="Icon/Special/Footprints">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFootprints} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="427:14481" data-name="Main Data">
              <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline justify-end not-italic relative shrink-0 whitespace-nowrap" data-node-id="427:14482" data-name="Info Current Amount">
                <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="427:14483">
                  8050
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="427:14484">
                  steps
                </p>
              </div>
              <div className="content-stretch flex gap-[6px] items-start relative rounded-[6px] shrink-0 w-full" data-node-id="427:14485" data-name="Chart">
                <div className="bg-[#ffa257] flex-[1_0_0] h-[24px] min-w-px relative rounded-[6px]" data-node-id="427:14486" data-name="Progress Bar" />
                <div className="bg-[#ffcb65] content-stretch flex gap-[10px] items-center overflow-clip pr-[76.32px] relative rounded-[6px] self-stretch shrink-0" data-node-id="427:14487" data-name="Empty Bar">
                  <div className="bg-[#eeeeef] h-full relative rounded-[6px] shrink-0 w-px" data-node-id="427:14488" data-name="Empty Dot" />
                  <div className="absolute h-[87px] left-[-137.53px] top-0 w-[223px]" data-node-id="427:14489" data-name="Vector">
                    <div className="absolute inset-[-0.41%_-0.16%]">
                      <img alt="" className="block max-w-none size-full" src={imgVector} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="427:14490" data-name="Header">
                <div className="content-stretch flex items-baseline relative shrink-0" data-node-id="427:14491" data-name="Numbers">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="427:14492">
                    76%
                  </p>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="427:14493">
                  1950 steps left
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col h-[142px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:15408" data-name="Card Statistic - Dashboard">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="427:15409" data-name="Header">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="427:15410">
                Sleep
              </p>
              <div className="bg-[#c2e66e] content-stretch flex items-baseline p-[6px] relative rounded-[10px] shrink-0" data-node-id="427:15411" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="427:15412" data-name="Icon/Special/MoonStars">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialMoonStars} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-h-px relative w-full" data-node-id="427:15413" data-name="Body">
              <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline justify-end not-italic relative shrink-0 whitespace-nowrap" data-node-id="427:15414" data-name="Info Current Amount">
                <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="427:15415">
                  6.5
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="427:15416">
                  hours
                </p>
              </div>
              <div className="content-stretch flex flex-[1_0_0] items-center min-h-px relative w-full" data-node-id="427:15417" data-name="Chart">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="427:15418" data-name="Column Ruler">
                  <div className="bg-[#eeeeef] h-[16px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="427:15419" />
                  <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="427:15420" />
                  <div className="relative shrink-0 size-[6px]" data-node-id="427:15421">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="427:15422" data-name="Column Ruler">
                  <div className="bg-[#eeeeef] h-[10px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="427:15423" />
                  <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="427:15424" />
                  <div className="relative shrink-0 size-[6px]" data-node-id="427:15425">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="427:15426" data-name="Column Ruler">
                  <div className="bg-[#eeeeef] h-[6px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="427:15427" />
                  <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="427:15428" />
                  <div className="relative shrink-0 size-[6px]" data-node-id="427:15429">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="427:15430" data-name="Column Ruler">
                  <div className="bg-[#eeeeef] h-[10px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="427:15431" />
                  <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="427:15432" />
                  <div className="relative shrink-0 size-[6px]" data-node-id="427:15433">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="427:15434" data-name="Column Ruler">
                  <div className="bg-[#eeeeef] relative rounded-[4px] shrink-0 size-[4px]" data-node-id="427:15435" />
                  <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="427:15436" />
                  <div className="relative shrink-0 size-[6px]" data-node-id="427:15437">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="427:15438" data-name="Column Ruler">
                  <div className="bg-[#eeeeef] h-[10px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="427:15439" />
                  <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="427:15440" />
                  <div className="relative shrink-0 size-[6px]" data-node-id="427:15441">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="427:15442" data-name="Column Ruler">
                  <div className="bg-[#eeeeef] h-[13px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="427:15443" />
                  <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="427:15444" />
                  <div className="relative shrink-0 size-[6px]" data-node-id="427:15445">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="427:15446" data-name="Column Ruler">
                  <div className="bg-[#eeeeef] h-[5px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="427:15447" />
                  <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="427:15448" />
                  <div className="relative shrink-0 size-[6px]" data-node-id="427:15449">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col h-[142px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:15450" data-name="Card Statistic - Dashboard">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="427:15451" data-name="Header">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="427:15452">
                Water Intake
              </p>
              <div className="bg-[#c2e66e] content-stretch flex items-baseline p-[6px] relative rounded-[10px] shrink-0" data-node-id="427:15453" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="427:15454" data-name="Icon/Special/PintGlass">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPintGlass} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start justify-center min-h-px relative w-full" data-node-id="427:15455" data-name="Chart">
              <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline justify-end not-italic relative shrink-0 whitespace-nowrap" data-node-id="427:15456" data-name="Info Current Amount">
                <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="427:15457">
                  0.7
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="427:15458">
                  litre left
                </p>
              </div>
              <div className="bg-[#f6f6f7] border-[#ffcb65] border-b-2 border-l-2 border-r-2 border-solid content-stretch flex flex-[1_0_0] flex-col items-start min-h-px overflow-clip pt-[12px] relative rounded-bl-[6px] rounded-br-[6px] w-full" data-node-id="427:15459" data-name="Chart">
                <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] items-end justify-end min-h-px px-[10px] py-[8px] relative w-full" data-node-id="427:15460" data-name="Progress Bar">
                  <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="427:15461" data-name="Amount">
                    <p className="font-['Poppins:SemiBold'] relative shrink-0" data-node-id="427:15462">
                      1.3/2
                    </p>
                    <p className="font-['Poppins:Regular'] relative shrink-0" data-node-id="427:15463">
                      litre
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col items-center relative rounded-[16px] shrink-0 w-full" data-node-id="427:14552" data-name="Widget Weight Data">
          <div className="bg-white content-stretch flex flex-col gap-[16px] items-center pb-[24px] pt-[16px] px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14553" data-name="Main">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="427:14554" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I427:14554;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I427:14554;2:4223">
                  Weight Data
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I427:14554;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I427:14554;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I427:14554;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[154px] overflow-clip relative shrink-0 w-[248px]" data-node-id="427:14555" data-name="Chart">
              <div className="absolute inset-[0_0_-60.63%_0]" data-node-id="427:14556" data-name="Donut Base">
                <div className="absolute bottom-1/2 left-[47.16%] right-[0.18%] top-0">
                  <img alt="" className="block max-w-none size-full" src={imgDonutBase} />
                </div>
              </div>
              <div className="absolute h-[247.37px] left-0 top-0 w-[248px]" data-node-id="427:14557" data-name="Mask group">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMaskGroup} />
              </div>
              <div className="absolute inset-[0_0_-60.63%_0]" data-node-id="427:14560" data-name="Donut Progress">
                <div className="absolute bottom-1/2 left-[0.18%] right-[55.15%] top-[1.03%]">
                  <img alt="" className="block max-w-none size-full" src={imgDonutProgress} />
                </div>
              </div>
              <div className="-translate-x-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[8px] items-center left-1/2 not-italic top-[73px] w-[106px] whitespace-nowrap" data-node-id="427:14561" data-name="Info Current Weight">
                <div className="content-stretch flex gap-[3px] items-end leading-[1.08] relative shrink-0 text-[#272932]" data-node-id="427:14562" data-name="Current Weight">
                  <p className="font-['Poppins:Bold'] relative shrink-0 text-[26px]" data-node-id="427:14563">
                    78
                  </p>
                  <p className="font-['Poppins:Regular'] relative shrink-0 text-[24px]" data-node-id="427:14564">
                    kg
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="427:14565">
                  Current Weight
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="427:14566">
                  13 kg left
                </p>
              </div>
              <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[18px] font-['Poppins:SemiBold'] leading-[1.25] left-[12px] not-italic text-[#8a8c90] text-[14px] text-center translate-y-full w-[24px]" data-node-id="427:14567">
                85
              </p>
              <p className="[word-break:break-word] absolute bottom-[18px] font-['Poppins:SemiBold'] leading-[1.25] not-italic right-[12px] text-[#8a8c90] text-[14px] text-center translate-x-1/2 translate-y-full w-[24px]" data-node-id="427:14568">
                65
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-center pb-[16px] pt-[8px] px-[16px] relative rounded-[12px] shrink-0 w-full" data-node-id="427:14569" data-name="Motivational Note">
            <div className="h-0 relative shrink-0 w-full" data-node-id="427:14570">
              <div className="absolute inset-[-1px_-0.31%]">
                <img alt="" className="block max-w-none size-full" src={imgVector10} />
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center w-full" data-node-id="427:14571">
              <span className="leading-[1.6]">{`Progress is progress, no matter how slow. Keep going, you're getting closer to your goal every day! `}</span>
              <span className="leading-[1.6]">🎉</span>
            </p>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14572" data-name="Widget Calories Intake">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="427:14573" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I427:14573;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I427:14573;2:4223">
                Calories Intake
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I427:14573;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I427:14573;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I427:14573;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-center relative shrink-0 w-full" data-node-id="427:14574" data-name="Body">
            <div className="relative shrink-0 size-[228px]" data-node-id="427:14575" data-name="Chart">
              <div className="absolute inset-[0_-0.25%_0_0.25%]" data-node-id="427:14576" data-name="Ellipse Base">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipseBase} />
              </div>
              <div className="absolute inset-[7.41%_6.94%_7.41%_7.87%]" data-node-id="427:14577" data-name="Donut Base">
                <div className="absolute inset-[-1.03%]">
                  <img alt="" className="block max-w-none size-full" src={imgDonutBase1} />
                </div>
              </div>
              <div className="absolute inset-[4.63%_4.17%_4.63%_5.09%]" data-node-id="427:14578" data-name="Donut Progress">
                <div className="absolute bottom-[8.94%] left-1/2 right-0 top-0">
                  <img alt="" className="block max-w-none size-full" src={imgDonutProgress1} />
                </div>
              </div>
              <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col gap-[8px] items-center left-[calc(50%-0.5px)] top-[calc(50%-8px)] w-[106px]" data-node-id="427:14579" data-name="Info Current Weight">
                <div className="relative shrink-0 size-[32px]" data-node-id="427:14580" data-name="Icon/Special/Lightning">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialLightning} />
                </div>
                <div className="[word-break:break-word] content-stretch flex gap-[3px] items-end leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] whitespace-nowrap" data-node-id="427:14581" data-name="Current Weight">
                  <p className="font-['Poppins:SemiBold'] relative shrink-0" data-node-id="427:14582">
                    1240
                  </p>
                  <p className="font-['Poppins:Regular'] relative shrink-0" data-node-id="427:14583">
                    kcal
                  </p>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="427:14584">
                  Calories left
                </p>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[20px] items-center relative shrink-0 w-full" data-node-id="427:14585" data-name="Data">
              <div className="content-stretch flex gap-[32px] items-start justify-center pr-[4px] relative shrink-0 w-full" data-node-id="427:14586" data-name="Detail Calories">
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="427:14587" data-name="Detail Calories">
                  <div className="content-stretch flex gap-[10px] items-center py-[4px] relative shrink-0" data-node-id="427:14589" data-name="Info Eaten Calories">
                    <div className="bg-[#dff9a2] content-stretch flex items-center px-[8px] py-[10px] relative rounded-[20px] shrink-0" data-node-id="427:14590" data-name="Icon">
                      <div className="relative shrink-0 size-[16px]" data-node-id="427:14591" data-name="Icon/Special/ForkKnife">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialForkKnife} />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="427:14592" data-name="Info">
                      <div className="content-stretch flex gap-[3px] items-baseline relative shrink-0 text-[#272932]" data-node-id="427:14593" data-name="Current Weight">
                        <p className="font-['Poppins:SemiBold'] leading-[1.2] relative shrink-0 text-[18px]" data-node-id="427:14594">
                          1750
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[16px]" data-node-id="427:14595">
                          kcal
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="427:14596">
                        Eaten calories
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="427:14597" data-name="Detail Calories">
                  <div className="content-stretch flex gap-[10px] items-center py-[4px] relative shrink-0" data-node-id="427:14599" data-name="Info Burned Calories">
                    <div className="bg-[#dff9a2] content-stretch flex items-center px-[8px] py-[10px] relative rounded-[20px] shrink-0" data-node-id="427:14600" data-name="Icon">
                      <div className="relative shrink-0 size-[16px]" data-node-id="427:14601" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="427:14602" data-name="Info">
                      <div className="content-stretch flex gap-[3px] items-baseline relative shrink-0 text-[#272932]" data-node-id="427:14603" data-name="Current Weight">
                        <p className="font-['Poppins:SemiBold'] leading-[1.2] relative shrink-0 text-[18px]" data-node-id="427:14604">
                          510
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[16px]" data-node-id="427:14605">
                          kcal
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="427:14606">
                        Burned calories
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="427:14607" data-name="List Macronutrients">
                <ItemListMacronutrients className="bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] shrink-0 w-full" />
                <div className="bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] shrink-0 w-full" data-node-id="427:14609" data-name="Item List Macronutrients">
                  <div className="[word-break:break-word] bg-[#eeeeef] content-stretch flex items-baseline justify-between not-italic px-[12px] py-[8px] relative rounded-[10px] shrink-0 w-[89px] whitespace-nowrap" data-node-id="I427:14609;67:675" data-name="Current Weight">
                    <p className="font-['Poppins:Bold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="I427:14609;67:676">
                      70
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I427:14609;67:677">
                      /75gr
                    </p>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-node-id="I427:14609;67:683" data-name="Main Data">
                    <div className="[word-break:break-word] content-stretch flex items-start justify-between leading-[1.24] not-italic relative shrink-0 text-[11px] w-full whitespace-nowrap" data-node-id="I427:14609;67:680" data-name="Header">
                      <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="I427:14609;67:678">
                        Proteins
                      </p>
                      <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="I427:14609;67:679">
                        93%
                      </p>
                    </div>
                    <div className="bg-white content-stretch flex flex-col items-start pr-[11.34px] relative rounded-[6px] shrink-0 w-full" data-node-id="I427:14609;67:682" data-name="Chart">
                      <div className="bg-[#c2e66e] h-[6px] relative rounded-[6px] shrink-0 w-full" data-node-id="I427:14609;67:681" data-name="Progress Bar" />
                    </div>
                  </div>
                </div>
                <div className="bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] shrink-0 w-full" data-node-id="427:14610" data-name="Item List Macronutrients">
                  <div className="[word-break:break-word] bg-[#eeeeef] content-stretch flex items-baseline justify-between not-italic px-[12px] py-[8px] relative rounded-[10px] shrink-0 w-[89px] whitespace-nowrap" data-node-id="I427:14610;67:675" data-name="Current Weight">
                    <p className="font-['Poppins:Bold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="I427:14610;67:676">
                      20
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I427:14610;67:677">
                      /44gr
                    </p>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-node-id="I427:14610;67:683" data-name="Main Data">
                    <div className="[word-break:break-word] content-stretch flex items-start justify-between leading-[1.24] not-italic relative shrink-0 text-[11px] w-full whitespace-nowrap" data-node-id="I427:14610;67:680" data-name="Header">
                      <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="I427:14610;67:678">
                        Fats
                      </p>
                      <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="I427:14610;67:679">
                        45%
                      </p>
                    </div>
                    <div className="bg-white content-stretch flex flex-col items-start pr-[89.1px] relative rounded-[6px] shrink-0 w-full" data-node-id="I427:14610;67:682" data-name="Chart">
                      <div className="bg-[#c2e66e] h-[6px] relative rounded-[6px] shrink-0 w-full" data-node-id="I427:14610;67:681" data-name="Progress Bar" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="427:14611" data-name="Widget Workout Progress">
          <div className="content-stretch flex items-center justify-between px-[4px] relative shrink-0 w-full" data-node-id="427:14612" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-723px] relative shrink-0" data-node-id="I427:14612;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I427:14612;2:4223">
                Workout Progress
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I427:14612;2:4225" data-name="Right Section">
              <div className="bg-white content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I427:14612;2:4228" data-name="Button Picker">
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I427:14612;2:4228;2:3476" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I427:14612;2:4228;2:3477">
                    This Week
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I427:14612;2:4228;2:3478" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I427:14612;2:4228;2:3479" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="427:14613" data-name="Body">
            <div className="bg-[#c2e66e] content-stretch flex gap-[16px] h-[92px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14614" data-name="Item List Macronutrients">
              <div className="bg-[#fefcfb] content-stretch flex items-baseline p-[14px] relative rounded-[10px] shrink-0" data-node-id="I427:14614;71:1382" data-name="Icon">
                <div className="relative shrink-0 size-[32px]" data-node-id="I427:14614;72:1400" data-name="Icon/Special/PersonSimpleRun">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleRun} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] h-full items-start justify-center min-w-px relative" data-node-id="I427:14614;71:1385" data-name="Main Data">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I427:14614;71:1391">
                  Running 10 km
                </p>
                <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-node-id="I427:14614;84:1505" data-name="Bottom">
                  <div className="[word-break:break-word] content-stretch flex items-start justify-between not-italic relative shrink-0 text-[#272932] w-full whitespace-nowrap" data-node-id="I427:14614;71:1386" data-name="Header">
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="I427:14614;72:1404" data-name="Numbers">
                      <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I427:14614;71:1388">
                        75%
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px]" data-node-id="I427:14614;71:1387">
                        (7/10)
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px]" data-node-id="I427:14614;72:1403">
                      Cardio
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-start relative rounded-[6px] shrink-0 w-full" data-node-id="I427:14614;71:1389" data-name="Chart">
                    <div className="bg-[#fefcfb] flex-[1_0_0] h-[6px] min-w-px relative rounded-[6px]" data-node-id="I427:14614;71:1390" data-name="Progress Bar" />
                    <div className="bg-[#dff9a2] content-stretch flex items-center overflow-clip pr-[40.8px] relative rounded-[8px] shrink-0" data-node-id="I427:14614;72:1480" data-name="Empty Bar">
                      <div className="h-[6px] relative rounded-[6px] shrink-0 w-px" data-node-id="I427:14614;72:1473" data-name="Empty Dot" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#ffcb65] content-stretch flex gap-[16px] h-[92px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14615" data-name="Item List Macronutrients">
              <div className="bg-[#fefcfb] content-stretch flex items-baseline p-[14px] relative rounded-[10px] shrink-0" data-node-id="I427:14615;71:1382" data-name="Icon">
                <div className="relative shrink-0 size-[32px]" data-node-id="I427:14615;72:1400" data-name="Icon/Special/PersonSimpleRun">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleDeadlifts} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] h-full items-start justify-center min-w-px relative" data-node-id="I427:14615;71:1385" data-name="Main Data">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I427:14615;71:1391">
                  Squatting 50kg
                </p>
                <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-node-id="I427:14615;84:1505" data-name="Bottom">
                  <div className="[word-break:break-word] content-stretch flex items-start justify-between not-italic relative shrink-0 text-[#272932] w-full whitespace-nowrap" data-node-id="I427:14615;71:1386" data-name="Header">
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="I427:14615;72:1404" data-name="Numbers">
                      <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I427:14615;71:1388">
                        60%
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px]" data-node-id="I427:14615;71:1387">
                        (5/8)
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px]" data-node-id="I427:14615;72:1403">
                      Strength
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-start relative rounded-[6px] shrink-0 w-full" data-node-id="I427:14615;71:1389" data-name="Chart">
                    <div className="bg-[#fefcfb] flex-[1_0_0] h-[6px] min-w-px relative rounded-[6px]" data-node-id="I427:14615;71:1390" data-name="Progress Bar" />
                    <div className="bg-[#ffe6b5] content-stretch flex items-center overflow-clip pr-[63px] relative rounded-[8px] shrink-0" data-node-id="I427:14615;72:1480" data-name="Empty Bar">
                      <div className="h-[6px] relative rounded-[6px] shrink-0 w-px" data-node-id="I427:14615;72:1473" data-name="Empty Dot" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#ffa257] content-stretch flex gap-[16px] h-[92px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14616" data-name="Item List Macronutrients">
              <div className="bg-[#fefcfb] content-stretch flex items-baseline p-[14px] relative rounded-[10px] shrink-0" data-node-id="I427:14616;71:1382" data-name="Icon">
                <div className="relative shrink-0 size-[32px]" data-node-id="I427:14616;72:1400" data-name="Icon/Special/PersonSimpleRun">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleTaiChi} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] h-full items-start justify-center min-w-px relative" data-node-id="I427:14616;71:1385" data-name="Main Data">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I427:14616;71:1391">
                  Stretching to touch toes
                </p>
                <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-node-id="I427:14616;84:1505" data-name="Bottom">
                  <div className="[word-break:break-word] content-stretch flex items-start justify-between not-italic relative shrink-0 text-[#272932] w-full whitespace-nowrap" data-node-id="I427:14616;71:1386" data-name="Header">
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="I427:14616;72:1404" data-name="Numbers">
                      <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I427:14616;71:1388">
                        50%
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px]" data-node-id="I427:14616;71:1387">
                        (3/6)
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px]" data-node-id="I427:14616;72:1403">
                      Flexibility
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-start relative rounded-[6px] shrink-0 w-full" data-node-id="I427:14616;71:1389" data-name="Chart">
                    <div className="bg-[#fefcfb] flex-[1_0_0] h-[6px] min-w-px relative rounded-[6px]" data-node-id="I427:14616;71:1390" data-name="Progress Bar" />
                    <div className="bg-[#ffe1c9] content-stretch flex items-center overflow-clip pr-[72px] relative rounded-[8px] shrink-0" data-node-id="I427:14616;72:1480" data-name="Empty Bar">
                      <div className="h-[6px] relative rounded-[6px] shrink-0 w-px" data-node-id="I427:14616;72:1473" data-name="Empty Dot" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14618" data-name="Widget Recommended Menu">
          <div className="content-stretch flex items-center justify-between px-[4px] relative shrink-0 w-full" data-node-id="427:14619" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-755px] relative shrink-0" data-node-id="I427:14619;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I427:14619;2:4223">
                Recommended Menu
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I427:14619;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I427:14619;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I427:14619;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-node-id="427:14620" data-name="List Exercise">
            <div className="bg-white content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="427:14621" data-name="Card Recommended Menu">
              <div className="h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I427:14621;43:1174" data-name="Image">
                <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I427:14621;43:1175" data-name="Place Image Here" />
                <div className="absolute content-stretch flex gap-[8px] items-center left-[14px] top-[14px]" data-node-id="I427:14621;52:898" data-name="Details Info">
                  <div className="bg-[#c2e66e] content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14621;48:1199" data-name="Info Meal Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14621;48:1201">
                      Breakfast
                    </p>
                  </div>
                  <div className="bg-white content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14621;43:1168" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I427:14621;43:1169" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14621;43:1170">
                      350 kcal
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[14px] items-start p-[16px] relative shrink-0 w-full" data-node-id="I427:14621;43:1165" data-name="Main">
                <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I427:14621;43:1167" data-name="Details">
                  <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-node-id="I427:14621;48:1179" data-name="Detail Nutrients">
                    <div className="bg-[#dff9a2] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I427:14621;48:1180" data-name="Info Carbs">
                      <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14621;48:1181" data-name="Label">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I427:14621;48:1182" data-name="Icon/Special/Bread">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I427:14621;48:1183">
                          C
                        </p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14621;48:1184">
                        45g
                      </p>
                    </div>
                    <div className="bg-[#ffe6b5] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I427:14621;48:1185" data-name="Info Protein">
                      <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14621;48:1186" data-name="Label">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I427:14621;48:1187" data-name="Icon/Special/Fish">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I427:14621;48:1188">
                          P
                        </p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14621;48:1189">
                        12g
                      </p>
                    </div>
                    <div className="bg-[#ffe1c9] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I427:14621;48:1190" data-name="Info Fats">
                      <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14621;48:1191" data-name="Label">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I427:14621;48:1192" data-name="Icon/Special/Drop">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I427:14621;48:1193">
                          F
                        </p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14621;48:1194">
                        14g
                      </p>
                    </div>
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start not-italic relative shrink-0 w-full" data-node-id="I427:14621;48:1204" data-name="Main Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I427:14621;43:1166">
                    Oatmeal with Almond Butter and Berries
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.6] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I427:14621;48:1178">
                    High in fiber and antioxidants, providing long-lasting energy and improving digestion.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="427:14622" data-name="Card Recommended Menu">
              <div className="h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I427:14622;43:1174" data-name="Image">
                <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I427:14622;43:1175" data-name="Place Image Here" />
                <div className="absolute content-stretch flex gap-[8px] items-center left-[14px] top-[14px]" data-node-id="I427:14622;52:898" data-name="Details Info">
                  <div className="bg-[#ffcb65] content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14622;48:1199" data-name="Info Meal Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14622;48:1201">
                      Lunch
                    </p>
                  </div>
                  <div className="bg-white content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14622;43:1168" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I427:14622;43:1169" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14622;43:1170">
                      450 kcal
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[14px] items-start p-[16px] relative shrink-0 w-full" data-node-id="I427:14622;43:1165" data-name="Main">
                <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I427:14622;43:1167" data-name="Details">
                  <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-node-id="I427:14622;48:1179" data-name="Detail Nutrients">
                    <div className="bg-[#dff9a2] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I427:14622;48:1180" data-name="Info Carbs">
                      <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14622;48:1181" data-name="Label">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I427:14622;48:1182" data-name="Icon/Special/Bread">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I427:14622;48:1183">
                          C
                        </p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14622;48:1184">
                        40g
                      </p>
                    </div>
                    <div className="bg-[#ffe6b5] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I427:14622;48:1185" data-name="Info Protein">
                      <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14622;48:1186" data-name="Label">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I427:14622;48:1187" data-name="Icon/Special/Fish">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I427:14622;48:1188">
                          P
                        </p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14622;48:1189">
                        30g
                      </p>
                    </div>
                    <div className="bg-[#ffe1c9] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I427:14622;48:1190" data-name="Info Fats">
                      <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14622;48:1191" data-name="Label">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I427:14622;48:1192" data-name="Icon/Special/Drop">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I427:14622;48:1193">
                          F
                        </p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14622;48:1194">
                        18g
                      </p>
                    </div>
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start not-italic relative shrink-0 w-full" data-node-id="I427:14622;48:1204" data-name="Main Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I427:14622;43:1166">
                    Grilled Chicken Wrap with Avocado and Spinach
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.6] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I427:14622;48:1178">
                    Rich in protein and healthy fats, perfect for muscle recovery and maintaining satiety.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[12px] items-start pt-[8px] relative shrink-0 w-full" data-node-id="427:14623" data-name="Widget Recommended Exercises">
          <div className="content-stretch flex items-center justify-between px-[4px] relative shrink-0 w-full" data-node-id="427:14624" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-723px] relative shrink-0" data-node-id="I427:14624;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I427:14624;2:4223">
                Recommended Exercises
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I427:14624;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I427:14624;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I427:14624;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="427:14625" data-name="List Exercise">
            <div className="bg-white content-stretch flex gap-[16px] items-end overflow-clip p-[12px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14626" data-name="Card Recommended Exercise">
              <div className="flex flex-row items-end self-stretch" data-node-id="I427:14626;41:1023">
                <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[10px] shrink-0 w-[78px]" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-[1.22%_0_0_0]" data-node-id="I427:14626;41:1024" data-name="profile-side-view-strong-sportive-guy-sit-ups-isolated-grey-background" />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start pb-[4px] relative shrink-0 w-[178px]" data-node-id="I427:14626;41:1026" data-name="Main">
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I427:14626;52:740" data-name="Main">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#2a2b2a] text-[14px] w-full" data-node-id="I427:14626;41:518">
                    Brisk Walking
                  </p>
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="I427:14626;41:1025" data-name="Details">
                    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I427:14626;41:1013" data-name="Info Cal">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I427:14626;41:1014" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14626;41:1015">
                        200 kcal
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I427:14626;41:1018" data-name="Info Duration">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I427:14626;41:1019" data-name="Icon/Clock">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14626;41:1020">
                        30 min
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I427:14626;49:634" data-name="Details">
                  <div className="bg-[#c2e66e] content-stretch flex gap-[6px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14626;49:635" data-name="Info Cal">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I427:14626;49:636" data-name="Icon/ChartBar">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I427:14626;49:637">
                      Beginner
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[16px] items-end overflow-clip p-[12px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14627" data-name="Card Recommended Exercise">
              <div className="flex flex-row items-end self-stretch" data-node-id="I427:14627;41:1023">
                <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[10px] shrink-0 w-[78px]" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-[1.22%_0_0_0]" data-node-id="I427:14627;41:1024" data-name="profile-side-view-strong-sportive-guy-sit-ups-isolated-grey-background" />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start pb-[4px] relative shrink-0 w-[178px]" data-node-id="I427:14627;41:1026" data-name="Main">
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I427:14627;52:740" data-name="Main">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#2a2b2a] text-[14px] w-full" data-node-id="I427:14627;41:518">
                    Bodyweight Squats
                  </p>
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="I427:14627;41:1025" data-name="Details">
                    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I427:14627;41:1013" data-name="Info Cal">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I427:14627;41:1014" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14627;41:1015">
                        180 kcal
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I427:14627;41:1018" data-name="Info Duration">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I427:14627;41:1019" data-name="Icon/Clock">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14627;41:1020">
                        20 min
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I427:14627;49:634" data-name="Details">
                  <div className="bg-[#ffcb65] content-stretch flex gap-[6px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14627;49:635" data-name="Info Cal">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I427:14627;49:636" data-name="Icon/ChartBar">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I427:14627;49:637">
                      Intermediate
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[16px] items-end overflow-clip p-[12px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14628" data-name="Card Recommended Exercise">
              <div className="flex flex-row items-end self-stretch" data-node-id="I427:14628;41:1023">
                <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[10px] shrink-0 w-[78px]" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-[1.22%_0_0_0]" data-node-id="I427:14628;41:1024" data-name="profile-side-view-strong-sportive-guy-sit-ups-isolated-grey-background" />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start pb-[4px] relative shrink-0 w-[178px]" data-node-id="I427:14628;41:1026" data-name="Main">
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I427:14628;52:740" data-name="Main">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#2a2b2a] text-[14px] w-full" data-node-id="I427:14628;41:518">
                    Dumbbell Squat
                  </p>
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="I427:14628;41:1025" data-name="Details">
                    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I427:14628;41:1013" data-name="Info Cal">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I427:14628;41:1014" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14628;41:1015">
                        300 kcal
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I427:14628;41:1018" data-name="Info Duration">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I427:14628;41:1019" data-name="Icon/Clock">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14628;41:1020">
                        30 min
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I427:14628;49:634" data-name="Details">
                  <div className="bg-[#ffa257] content-stretch flex gap-[6px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14628;49:635" data-name="Info Cal">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I427:14628;49:636" data-name="Icon/ChartBar">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I427:14628;49:637">
                      Hard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[20px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14629" data-name="Section Meal Plan">
          <div className="content-stretch flex items-center justify-between px-[4px] relative shrink-0 w-full" data-node-id="427:15393" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-755px] relative shrink-0" data-node-id="I427:15393;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I427:15393;2:4223">
                Meal Plan
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I427:15393;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I427:15393;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I427:15393;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-start p-[12px] relative rounded-[12px] shrink-0 w-full" data-node-id="427:14630" data-name="Calendar">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="427:14631" data-name="Header-Section">
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:SemiBold'] gap-[4px] h-[18px] items-baseline leading-[1.25] not-italic relative shrink-0 text-[14px] whitespace-nowrap" data-node-id="427:14632" data-name="Div Title">
                <p className="relative shrink-0 text-[#272932]" data-node-id="427:14633">
                  September
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="427:14634">
                  2028
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="427:14635" data-name="Right Section">
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="427:14636" data-name="Button More">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I427:14636;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                  </div>
                </div>
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="427:14637" data-name="Button More">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I427:14637;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                  </div>
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex items-center not-italic relative shrink-0 text-center w-full" data-node-id="427:14638" data-name="Row Calendar">
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" date="3" day="Sun" />
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" />
              <CellCalendarDashboard active className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px] text-[#272932]" date="5" day="Tue" />
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" date="6" day="Wed" />
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" date="7" day="Thu" />
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" date="8" day="Fri" />
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" date="9" day="Sat" />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-node-id="427:14651" data-name="List Meal Plan">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="427:14652" data-name="Card Meal Plan">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="I427:14652;28:999" data-name="Header">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I427:14652;88:3437" data-name="Left Side">
                  <div className="bg-[#eeeeef] content-stretch flex gap-[8px] items-center pr-[8px] relative rounded-[6px] shrink-0" data-node-id="I427:14652;28:997" data-name="Title Meal Time">
                    <div className="relative shrink-0 size-[22px]" data-node-id="I427:14652;28:985" data-name="Checkbox">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheckbox} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14652;28:971">
                      Breakfast
                    </p>
                  </div>
                  <div className="bg-[#eeeeef] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14652;33:1105" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I427:14652;33:1106" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14652;33:1107">
                      300 kcal
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-start p-[3px] relative rounded-[6px] shrink-0" data-node-id="I427:14652;88:3465" data-name="Button More">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I427:14652;88:3465;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="I427:14652;28:996" data-name="Detail Menu">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I427:14652;28:995" data-name="Main Section">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I427:14652;28:963" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I427:14652;100:1974" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I427:14652;28:994" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I427:14652;28:966">{`Scrambled Eggs with Spinach & Whole Grain Toast`}</p>
                    <div className="h-0 relative shrink-0 w-full" data-node-id="I427:14652;33:1484" data-name="Divider">
                      <div className="absolute inset-[-0.5px_0]">
                        <img alt="" className="block max-w-none size-full" src={imgDivider} />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-full" data-node-id="I427:14652;33:1147" data-name="Detail Nutrients">
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14652;33:1148" data-name="Info Carbs">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14652;33:1293" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14652;33:1262" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14652;33:1149">
                            C
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14652;33:1150">
                          25g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14652;33:1151" data-name="Info Protein">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14652;33:1314" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14652;33:1315" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14652;33:1316">
                            P
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14652;33:1153">
                          20g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14652;33:1154" data-name="Info Fats">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14652;33:1339" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14652;33:1340" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14652;33:1341">
                            F
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14652;33:1156">
                          12g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-node-id="427:14653" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider1} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="427:14654" data-name="Card Meal Plan">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="I427:14654;28:999" data-name="Header">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I427:14654;88:3437" data-name="Left Side">
                  <div className="bg-[#c2e66e] content-stretch flex gap-[8px] items-center pr-[8px] relative rounded-[6px] shrink-0" data-node-id="I427:14654;28:997" data-name="Title Meal Time">
                    <div className="relative shrink-0 size-[22px]" data-node-id="I427:14654;28:985" data-name="Checkbox">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheckbox1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14654;28:971">
                      Lunch
                    </p>
                  </div>
                  <div className="bg-[#dff9a2] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14654;33:1105" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I427:14654;33:1106" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14654;33:1107">
                      450 kcal
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-start p-[3px] relative rounded-[6px] shrink-0" data-node-id="I427:14654;88:3465" data-name="Button More">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I427:14654;88:3465;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="I427:14654;28:996" data-name="Detail Menu">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I427:14654;28:995" data-name="Main Section">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I427:14654;28:963" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I427:14654;100:1974" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I427:14654;28:994" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I427:14654;28:966">
                      Grilled Chicken Salad with Avocado and Quinoa
                    </p>
                    <div className="h-0 relative shrink-0 w-full" data-node-id="I427:14654;33:1484" data-name="Divider">
                      <div className="absolute inset-[-0.5px_0]">
                        <img alt="" className="block max-w-none size-full" src={imgDivider} />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-full" data-node-id="I427:14654;33:1147" data-name="Detail Nutrients">
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14654;33:1148" data-name="Info Carbs">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14654;33:1293" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14654;33:1262" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14654;33:1149">
                            C
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14654;33:1150">
                          40g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14654;33:1151" data-name="Info Protein">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14654;33:1314" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14654;33:1315" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14654;33:1316">
                            P
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14654;33:1153">
                          35g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14654;33:1154" data-name="Info Fats">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14654;33:1339" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14654;33:1340" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14654;33:1341">
                            F
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14654;33:1156">
                          20g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-node-id="427:14655" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider1} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="427:14656" data-name="Card Meal Plan">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="I427:14656;28:999" data-name="Header">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I427:14656;88:3437" data-name="Left Side">
                  <div className="bg-[#ffcb65] content-stretch flex gap-[8px] items-center pr-[8px] relative rounded-[6px] shrink-0" data-node-id="I427:14656;28:997" data-name="Title Meal Time">
                    <div className="relative shrink-0 size-[22px]" data-node-id="I427:14656;28:985" data-name="Checkbox">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheckbox2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14656;28:971">
                      Snack
                    </p>
                  </div>
                  <div className="bg-[#ffe6b5] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14656;33:1105" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I427:14656;33:1106" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14656;33:1107">
                      200 kcal
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-start p-[3px] relative rounded-[6px] shrink-0" data-node-id="I427:14656;88:3465" data-name="Button More">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I427:14656;88:3465;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="I427:14656;28:996" data-name="Detail Menu">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I427:14656;28:995" data-name="Main Section">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I427:14656;28:963" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I427:14656;100:1974" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I427:14656;28:994" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I427:14656;28:966">
                      Greek Yogurt with Mixed Berries and Almonds
                    </p>
                    <div className="h-0 relative shrink-0 w-full" data-node-id="I427:14656;33:1484" data-name="Divider">
                      <div className="absolute inset-[-0.5px_0]">
                        <img alt="" className="block max-w-none size-full" src={imgDivider} />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-full" data-node-id="I427:14656;33:1147" data-name="Detail Nutrients">
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14656;33:1148" data-name="Info Carbs">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14656;33:1293" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14656;33:1262" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14656;33:1149">
                            C
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14656;33:1150">
                          18g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14656;33:1151" data-name="Info Protein">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14656;33:1314" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14656;33:1315" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14656;33:1316">
                            P
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14656;33:1153">
                          12g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14656;33:1154" data-name="Info Fats">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14656;33:1339" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14656;33:1340" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14656;33:1341">
                            F
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14656;33:1156">
                          10g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-node-id="427:14657" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider1} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="427:14658" data-name="Card Meal Plan">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="I427:14658;28:999" data-name="Header">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I427:14658;88:3437" data-name="Left Side">
                  <div className="bg-[#ffa257] content-stretch flex gap-[8px] items-center pr-[8px] relative rounded-[6px] shrink-0" data-node-id="I427:14658;28:997" data-name="Title Meal Time">
                    <div className="relative shrink-0 size-[22px]" data-node-id="I427:14658;28:985" data-name="Checkbox">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheckbox3} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14658;28:971">
                      Dinner
                    </p>
                  </div>
                  <div className="bg-[#ffe1c9] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I427:14658;33:1105" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I427:14658;33:1106" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14658;33:1107">
                      500 kcal
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-start p-[3px] relative rounded-[6px] shrink-0" data-node-id="I427:14658;88:3465" data-name="Button More">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I427:14658;88:3465;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="I427:14658;28:996" data-name="Detail Menu">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I427:14658;28:995" data-name="Main Section">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I427:14658;28:963" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I427:14658;100:1974" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I427:14658;28:994" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I427:14658;28:966">
                      Grilled Chicken with Sweet Potato and Green Beans
                    </p>
                    <div className="h-0 relative shrink-0 w-full" data-node-id="I427:14658;33:1484" data-name="Divider">
                      <div className="absolute inset-[-0.5px_0]">
                        <img alt="" className="block max-w-none size-full" src={imgDivider} />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-full" data-node-id="I427:14658;33:1147" data-name="Detail Nutrients">
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14658;33:1148" data-name="Info Carbs">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14658;33:1293" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14658;33:1262" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14658;33:1149">
                            C
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14658;33:1150">
                          45g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14658;33:1151" data-name="Info Protein">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14658;33:1314" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14658;33:1315" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14658;33:1316">
                            P
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14658;33:1153">
                          35g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I427:14658;33:1154" data-name="Info Fats">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I427:14658;33:1339" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I427:14658;33:1340" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I427:14658;33:1341">
                            F
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I427:14658;33:1156">
                          20g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="427:14659" data-name="Section Recent Activity">
          <HeaderSection className="content-stretch flex items-center justify-between relative shrink-0 w-full" showCta={false} showPicker={false} showPicker2={false} showSearchInput={false} showSegmentedButton={false} showSortBy={false} title="Recent Activity" />
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="427:14661" data-name="List Recent Activity">
            <div className="bg-white content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="427:14662" data-name="Item List Recent Activity">
              <div className="content-stretch flex flex-col gap-[4px] items-center pb-[4px] relative self-stretch shrink-0" data-node-id="I427:14662;33:1968" data-name="Left Side">
                <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[20px] shrink-0" data-node-id="I427:14662;33:1866" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I427:14662;33:1891" data-name="Icon/Nav/PersonSimpleTaiChi">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
                  </div>
                </div>
                <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="I427:14662;33:2004" data-name="Line">
                  <div className="absolute inset-[0_-0.5px]">
                    <img alt="" className="block max-w-none size-full" src={imgLine3} />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col font-['Poppins:Regular'] gap-[4px] items-start min-w-px not-italic pb-[20px] relative" data-node-id="I427:14662;33:1867" data-name="Info">
                <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px] w-full" data-node-id="I427:14662;33:1894">
                  6:00 PM
                </p>
                <p className="leading-[0] relative shrink-0 text-[#272932] text-[11px] w-full" data-node-id="I427:14662;33:1868">
                  <span className="leading-[1.6]">{`Notification sent: `}</span>
                  <span className="leading-[1.6]">{`"Congratulations! You've reached 75% of your cardio endurance goal!"`}</span>
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="427:14663" data-name="Item List Recent Activity">
              <div className="content-stretch flex flex-col gap-[4px] items-center pb-[4px] relative self-stretch shrink-0" data-node-id="I427:14663;33:1968" data-name="Left Side">
                <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[20px] shrink-0" data-node-id="I427:14663;33:1866" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I427:14663;33:1891" data-name="Icon/Nav/PersonSimpleTaiChi">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
                  </div>
                </div>
                <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="I427:14663;33:2004" data-name="Line">
                  <div className="absolute inset-[0_-0.5px]">
                    <img alt="" className="block max-w-none size-full" src={imgLine3} />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col font-['Poppins:Regular'] gap-[4px] items-start min-w-px not-italic pb-[20px] relative" data-node-id="I427:14663;33:1867" data-name="Info">
                <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px] w-full" data-node-id="I427:14663;33:1894">
                  5:15 PM
                </p>
                <p className="leading-[0] relative shrink-0 text-[#272932] text-[11px] w-full" data-node-id="I427:14663;33:1868">
                  <span className="leading-[1.6]">Ladya Mortimov</span>
                  <span className="leading-[1.6]">{` completed her 3rd stretching session for flexibility improvement`}</span>
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="427:14664" data-name="Item List Recent Activity">
              <div className="content-stretch flex flex-col gap-[4px] items-center pb-[4px] relative self-stretch shrink-0" data-node-id="I427:14664;33:1968" data-name="Left Side">
                <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[20px] shrink-0" data-node-id="I427:14664;33:1866" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I427:14664;33:1891" data-name="Icon/Nav/PersonSimpleTaiChi">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleRun1} />
                  </div>
                </div>
                <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="I427:14664;33:2004" data-name="Line">
                  <div className="absolute inset-[0_-0.5px]">
                    <img alt="" className="block max-w-none size-full" src={imgLine3} />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col font-['Poppins:Regular'] gap-[4px] items-start min-w-px not-italic pb-[20px] relative" data-node-id="I427:14664;33:1867" data-name="Info">
                <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px] w-full" data-node-id="I427:14664;33:1894">
                  3:00 PM
                </p>
                <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px] w-full" data-node-id="I427:14664;33:1868">
                  Cardio progress updated – 7.5 km completed out of 10 km goal for endurance improvement
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="427:14665" data-name="Item List Recent Activity">
              <div className="content-stretch flex flex-col items-center pb-[4px] relative self-stretch shrink-0" data-node-id="I427:14665;33:2027" data-name="Left Side">
                <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[20px] shrink-0" data-node-id="I427:14665;33:2028" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I427:14665;33:2029" data-name="Icon/Nav/PersonSimpleTaiChi">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col font-['Poppins:Regular'] gap-[4px] items-start min-w-px not-italic pb-[8px] relative" data-node-id="I427:14665;33:2031" data-name="Info">
                <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px] w-full" data-node-id="I427:14665;33:2032">
                  12:45 PM
                </p>
                <p className="leading-[0] relative shrink-0 text-[#272932] text-[11px] w-full" data-node-id="I427:14665;100:2023">
                  <span className="leading-[1.6]">Ladya Mortimov</span>
                  <span className="leading-[1.6]">{` logged her lunch meal: Grilled Chicken Wrap with Avocado and Spinach (450 kcal)`}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="427:14667" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="427:14668" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="427:14669">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="427:14670" data-name="Links">
              <p className="relative shrink-0" data-node-id="427:14671">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="427:14672">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="427:14673">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="427:14674" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="427:14675" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="427:14676" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="427:14677" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="427:14678" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="427:14679" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
