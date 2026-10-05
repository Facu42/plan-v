const assetPathPrefix = "https://www.figma.com/api/mcp/asset/36c2d163-2019-4e22-b953-9c56634984a9";
const imgIconMagnifyingGlass = `${assetPathPrefix}/f08ac.svg`;
const imgIconMagnifyingGlass1 = `${assetPathPrefix}/843cb.svg`;
const imgIconCaretDown = `${assetPathPrefix}/8e5ed.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/a4124.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/63892.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/de8e1.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/2be86.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/bf5d8.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
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
const imgDonutBase = `${assetPathPrefix}/f641d.svg`;
const imgMaskGroup = `${assetPathPrefix}/35603.svg`;
const imgDonutProgress = `${assetPathPrefix}/16730.svg`;
const imgVector10 = `${assetPathPrefix}/28578.svg`;
const imgEllipseBase = `${assetPathPrefix}/596c8.svg`;
const imgDonutBase1 = `${assetPathPrefix}/57c0c.svg`;
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
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;
const imgIconBell = `${assetPathPrefix}/dfce3.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/6e80c.svg`;
const imgIconCaretRight = `${assetPathPrefix}/27dfe.svg`;
const imgCheckbox = `${assetPathPrefix}/13628.svg`;
const imgIconCaretUp = `${assetPathPrefix}/58124.svg`;
const imgDivider = `${assetPathPrefix}/d6cd0.svg`;
const imgIconSpecialBread1 = `${assetPathPrefix}/0c987.svg`;
const imgIconSpecialFish1 = `${assetPathPrefix}/d6aa7.svg`;
const imgIconSpecialDrop1 = `${assetPathPrefix}/188dc.svg`;
const imgDivider1 = `${assetPathPrefix}/9beaa.svg`;
const imgCheckbox1 = `${assetPathPrefix}/db928.svg`;
const imgCheckbox2 = `${assetPathPrefix}/82059.svg`;
const imgCheckbox3 = `${assetPathPrefix}/0280f.svg`;
const imgIconBell1 = `${assetPathPrefix}/0f7c2.svg`;
const imgLine3 = `${assetPathPrefix}/ccbf8.svg`;
const imgIconNavPersonSimpleTaiChi1 = `${assetPathPrefix}/184b6.svg`;
const imgIconSpecialPersonSimpleRun1 = `${assetPathPrefix}/49c0e.svg`;
const imgIconNavBowlFood1 = `${assetPathPrefix}/3dba6.svg`;

type InputSearchProps = {
  className?: string;
  placeholder?: string;
  size?: "Small" | "Large";
};

function InputSearch({ className, placeholder = "Search placeholder", size = "Large" }: InputSearchProps) {
  const isSmall = size === "Small";
  return (
    <div className={className || `bg-[#f6f6f7] content-stretch flex items-center relative ${isSmall ? "gap-[4px] px-[8px] py-[6px] rounded-[8px] w-[223px]" : "gap-[6px] px-[13px] py-[9px] rounded-[12px] w-[237px]"}`} id={isSmall ? "node-2_3946" : "node-2_3936"}>
      <div className="content-stretch flex items-center py-[2px] relative shrink-0" id={isSmall ? "node-2_3947" : "node-2_3937"} data-name="Icon">
        <div className={`relative shrink-0 ${isSmall ? "size-[14px]" : "size-[18px]"}`} id={isSmall ? "node-2_3948" : "node-2_3938"} data-name="Icon/MagnifyingGlass">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={isSmall ? imgIconMagnifyingGlass1 : imgIconMagnifyingGlass} />
        </div>
      </div>
      <div className={`content-stretch flex items-center px-[2px] relative ${isSmall ? "shrink-0" : "flex-[1_0_0] min-w-px"}`} id={isSmall ? "node-2_3949" : "node-2_3939"} data-name="Text">
        {size === "Large" && (
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.25] min-w-px not-italic relative text-[#8a8c90] text-[14px]" data-node-id="2:3940">
            {placeholder}
          </p>
        )}
        {isSmall && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="2:3950">
            {placeholder}
          </p>
        )}
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
        {showSearchInput && <InputSearch className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-center px-[8px] py-[6px] relative rounded-[8px] shrink-0 w-[223px]" size="Small" />}
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

type HeaderProps = {
  className?: string;
  device?: "Desktop";
  showSubtitle?: boolean;
  subtitle?: string;
  title?: string;
  variant?: "Dashboard";
};

function Header({ className, device = "Desktop", showSubtitle = true, subtitle = "Welcome and Let’s do some workout today!", title = "Hello, Wingman!  👋", variant = "Dashboard" }: HeaderProps) {
  return (
    <div className={className || "content-stretch flex h-[50px] items-center justify-between pl-[4px] relative w-[1171px]"} data-node-id="2:4486">
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[6px] items-start not-italic py-[2px] relative shrink-0 w-[340px]" data-node-id="2:4487" data-name="Title">
        <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px] w-full whitespace-pre-wrap" data-node-id="2:4488">
          {title}
        </p>
        {showSubtitle && (
          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="2:4489">
            {subtitle}
          </p>
        )}
      </div>
      <div className="content-stretch flex items-center relative rounded-[28px] shrink-0 w-[330px]" data-node-id="2:4490" data-name="Header Menu">
        <div className="bg-white content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px px-[13px] py-[9px] relative rounded-[12px]" data-node-id="2:4491" data-name="Input-search">
          <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I2:4491;2:3937" data-name="Icon">
            <div className="relative shrink-0 size-[18px]" data-node-id="I2:4491;2:3938" data-name="Icon/MagnifyingGlass">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
            </div>
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px px-[2px] relative" data-node-id="I2:4491;2:3939" data-name="Text">
            <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.25] min-w-px not-italic relative text-[#8a8c90] text-[14px]" data-node-id="I2:4491;2:3940">
              Search anything
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Component01DashboardDesktop() {
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="12:792" data-name="01. Dashboard (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="12:793" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I12:793;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I12:793;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I12:793;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I12:793;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I12:793;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I12:793;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I12:793;2:4499" data-name="Menu Nav">
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;2:4500;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I12:793;2:4500;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;2:4500;2:3292">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I12:793;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I12:793;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;2:4505;2:3296">
                Messages
              </p>
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I12:793;2:4505;2:3297" data-name="Badge">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I12:793;2:4505;2:3297;2:3262" data-name="Div Red">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I12:793;2:4505;2:3297;2:3263">
                  6
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I12:793;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;2:4502;2:3296">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I12:793;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;2:4503;2:3296">
                Meal Plan
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I12:793;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I12:793;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I12:793;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;2:4504;2:3296">
                Food Diary
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I12:793;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;2:4506;2:3296">
                Progress
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I12:793;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;2:4509;2:3296">
                Exercises
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I12:793;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;12:1059;2:3296">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I12:793;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I12:793;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I12:793;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I12:793;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I12:793;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I12:793;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I12:793;2:4518;2:3335">
                Claim Now!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I12:793;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I12:793;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I12:793;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I12:793;2:4519;2:3296">
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative self-stretch" data-node-id="28:417" data-name="Content">
        <Header className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" subtitle="Let's begin our journey to better health today" title="Hello, Adam!  👋" />
        <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-node-id="84:1489" data-name="Body">
          <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="72:1548" data-name="Section Statistics">
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="78:782">
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px p-[16px] relative rounded-[16px]" data-name="Card Statistic - Dashboard">
                <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="78:783" data-name="Header">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="78:784">
                    Weight
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-baseline p-[6px] relative rounded-[10px] shrink-0" data-node-id="78:785" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="78:786" data-name="Icon/Special/Speedometer">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialSpeedometer} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="78:787" data-name="Chart">
                  <div className="bg-[#f6f6f7] content-stretch flex h-[6px] items-center pl-[52px] relative rounded-[6px] shrink-0 w-full" data-node-id="82:888" data-name="Slider">
                    <div className="relative shrink-0 size-[14px]" data-node-id="84:1481" data-name="Button Slider">
                      <div className="absolute bg-[#ffa257] left-0 rounded-[16px] size-[14px] top-0" data-node-id="82:889" data-name="Progress Bar" />
                      <div className="-translate-x-1/2 [word-break:break-word] absolute bottom-[20px] content-stretch flex gap-[4px] items-baseline justify-end left-[calc(50%-0.5px)] not-italic whitespace-nowrap" data-node-id="84:1482" data-name="Info Current Amount">
                        <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="84:1483">
                          78
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="84:1484">
                          kg
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="82:824" data-name="Ruler">
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="82:803" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="82:802" data-name="Line">
                        <div className="absolute inset-[-2.5%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine} />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="82:813" data-name="Number">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="78:799">
                          85
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="82:804" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="82:806" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="82:843" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="82:845" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="82:846" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="82:848" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="82:849" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="82:851" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="82:817" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="82:820" data-name="Line">
                        <div className="absolute inset-[-2.5%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine} />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="82:818" data-name="Number">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="82:819">
                          80
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3366" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3367" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3372" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3373" data-name="Line">
                        <div className="absolute inset-[-10.71%_-1.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine2} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3363" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3364" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3369" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3370" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="82:825" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="82:828" data-name="Line">
                        <div className="absolute inset-[-2.5%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine} />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="82:826" data-name="Number">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="82:827">
                          75
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3390" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3391" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3387" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3388" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3384" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3385" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3393" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3394" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="82:832" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="82:835" data-name="Line">
                        <div className="absolute inset-[-2.5%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine} />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="82:833" data-name="Number">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="82:834">
                          70
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3381" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3382" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3396" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3397" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3375" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3376" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col h-[36px] items-center min-w-px pb-[22px] relative" data-node-id="84:3378" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="84:3379" data-name="Line">
                        <div className="absolute inset-[-3.57%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine1} />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-[36px] items-center min-w-px relative" data-node-id="82:839" data-name="Column Ruler">
                      <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="82:842" data-name="Line">
                        <div className="absolute inset-[-2.5%_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgLine} />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-node-id="82:840" data-name="Number">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center w-[16px]" data-node-id="82:841">
                          65
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="74:2016">
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px p-[16px] relative rounded-[16px]" data-name="Card Statistic - Dashboard">
                <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="74:2017" data-name="Header">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="74:2019">
                    Steps
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-baseline p-[6px] relative rounded-[10px] shrink-0" data-node-id="74:2047" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="74:2048" data-name="Icon/Special/Footprints">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFootprints} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="74:2030" data-name="Main Data">
                  <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline justify-end not-italic relative shrink-0 whitespace-nowrap" data-node-id="74:2043" data-name="Info Current Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="74:2044">
                      8050
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="74:2045">
                      steps
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-start relative rounded-[6px] shrink-0 w-full" data-node-id="74:2032" data-name="Chart">
                    <div className="bg-[#ffa257] flex-[1_0_0] h-[24px] min-w-px relative rounded-[6px]" data-node-id="74:2033" data-name="Progress Bar" />
                    <div className="bg-[#ffcb65] content-stretch flex gap-[10px] items-center overflow-clip pr-[40.8px] relative rounded-[6px] self-stretch shrink-0" data-node-id="74:2034" data-name="Empty Bar">
                      <div className="bg-[#eeeeef] h-full relative rounded-[6px] shrink-0 w-px" data-node-id="74:2035" data-name="Empty Dot" />
                      <div className="absolute h-[87px] left-[-137.53px] top-0 w-[223px]" data-node-id="84:1486" data-name="Vector">
                        <div className="absolute inset-[-0.41%_-0.16%]">
                          <img alt="" className="block max-w-none size-full" src={imgVector} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="74:2036" data-name="Header">
                    <div className="content-stretch flex items-baseline relative shrink-0" data-node-id="74:2037" data-name="Numbers">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="74:2038">
                        76%
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="74:2040">
                      1950 steps left
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="82:892">
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[16px] relative rounded-[16px]" data-name="Card Statistic - Dashboard">
                <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="82:893" data-name="Header">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="82:894">
                    Sleep
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-baseline p-[6px] relative rounded-[10px] shrink-0" data-node-id="82:895" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="82:896" data-name="Icon/Special/MoonStars">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialMoonStars} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-h-px relative w-full" data-node-id="82:900" data-name="Body">
                  <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline justify-end not-italic relative shrink-0 whitespace-nowrap" data-node-id="82:897" data-name="Info Current Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="82:898">
                      6.5
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="82:899">
                      hours
                    </p>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] items-center min-h-px relative w-full" data-node-id="82:901" data-name="Chart">
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="82:902" data-name="Column Ruler">
                      <div className="bg-[#eeeeef] h-[16px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="82:975" />
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="82:976" />
                      <div className="relative shrink-0 size-[6px]" data-node-id="82:974">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="82:982" data-name="Column Ruler">
                      <div className="bg-[#eeeeef] h-[10px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="82:983" />
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="82:984" />
                      <div className="relative shrink-0 size-[6px]" data-node-id="82:985">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="82:992" data-name="Column Ruler">
                      <div className="bg-[#eeeeef] h-[6px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="82:993" />
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="82:994" />
                      <div className="relative shrink-0 size-[6px]" data-node-id="82:995">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="82:997" data-name="Column Ruler">
                      <div className="bg-[#eeeeef] h-[10px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="82:998" />
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="82:999" />
                      <div className="relative shrink-0 size-[6px]" data-node-id="82:1000">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="82:987" data-name="Column Ruler">
                      <div className="bg-[#eeeeef] relative rounded-[4px] shrink-0 size-[4px]" data-node-id="82:988" />
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="82:989" />
                      <div className="relative shrink-0 size-[6px]" data-node-id="82:990">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="82:977" data-name="Column Ruler">
                      <div className="bg-[#eeeeef] h-[10px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="82:978" />
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="82:979" />
                      <div className="relative shrink-0 size-[6px]" data-node-id="82:980">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="82:1002" data-name="Column Ruler">
                      <div className="bg-[#eeeeef] h-[13px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="82:1003" />
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="82:1004" />
                      <div className="relative shrink-0 size-[6px]" data-node-id="82:1005">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] h-[52px] items-center min-w-px relative" data-node-id="84:1007" data-name="Column Ruler">
                      <div className="bg-[#eeeeef] h-[5px] relative rounded-[4px] shrink-0 w-[4px]" data-node-id="84:1008" />
                      <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-[4px] w-[4px]" data-node-id="84:1009" />
                      <div className="relative shrink-0 size-[6px]" data-node-id="84:1010">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="74:2051">
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[16px] relative rounded-[16px]" data-name="Card Statistic - Dashboard">
                <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="74:2052" data-name="Header">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="74:2053">
                    Water Intake
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-baseline p-[6px] relative rounded-[10px] shrink-0" data-node-id="74:2054" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="74:2055" data-name="Icon/Special/PintGlass">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPintGlass} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start justify-center min-h-px relative w-full" data-node-id="74:2056" data-name="Chart">
                  <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline justify-end not-italic relative shrink-0 whitespace-nowrap" data-node-id="74:2058" data-name="Info Current Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="74:2059">
                      0.7
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="74:2060">
                      litre left
                    </p>
                  </div>
                  <div className="bg-[#f6f6f7] border-[#ffcb65] border-b-2 border-l-2 border-r-2 border-solid content-stretch flex flex-[1_0_0] flex-col items-start min-h-px overflow-clip pt-[12px] relative rounded-bl-[6px] rounded-br-[6px] w-full" data-node-id="74:2061" data-name="Chart">
                    <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] items-end justify-end min-h-px px-[10px] py-[8px] relative w-full" data-node-id="74:2071" data-name="Progress Bar">
                      <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="74:2075" data-name="Amount">
                        <p className="font-['Poppins:SemiBold'] relative shrink-0" data-node-id="74:2072">
                          1.3/2
                        </p>
                        <p className="font-['Poppins:Regular'] relative shrink-0" data-node-id="74:2073">
                          litre
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0 w-full" data-node-id="72:1490" data-name="Section Weight & Nutrients">
            <div className="bg-white content-stretch flex flex-col h-[306px] items-center relative rounded-[16px] shrink-0 w-[265px]" data-node-id="57:1509" data-name="Widget Weight Data">
              <div className="bg-white content-stretch flex flex-col gap-[16px] items-center pb-[24px] pt-[16px] px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="62:1511" data-name="Main">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="56:1350" data-name="Header-Section">
                  <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-840px] relative shrink-0" data-node-id="I56:1350;2:4222" data-name="Div Title">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I56:1350;2:4223">
                      Weight Data
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I56:1350;2:4225" data-name="Right Section">
                    <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I56:1350;2:4233" data-name="Button More">
                      <div className="relative shrink-0 size-[24px]" data-node-id="I56:1350;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-[127px] overflow-clip relative shrink-0 w-[204px]" data-node-id="56:1463" data-name="Chart">
                  <div className="absolute inset-[0_0_-60.63%_0]" data-node-id="56:1464" data-name="Donut Base">
                    <div className="absolute bottom-1/2 left-[47.16%] right-[0.17%] top-0">
                      <img alt="" className="block max-w-none size-full" src={imgDonutBase} />
                    </div>
                  </div>
                  <div className="absolute left-0 size-[204px] top-0" data-node-id="62:1553" data-name="Mask group">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMaskGroup} />
                  </div>
                  <div className="absolute inset-[0_0_-60.63%_0]" data-node-id="62:1512" data-name="Donut Progress">
                    <div className="absolute bottom-1/2 left-[0.17%] right-[55.14%] top-[1.01%]">
                      <img alt="" className="block max-w-none size-full" src={imgDonutProgress} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] items-center left-[49px] not-italic top-[52px] w-[106px] whitespace-nowrap" data-node-id="57:1474" data-name="Info Current Weight">
                    <div className="content-stretch flex gap-[3px] items-end leading-[1.08] relative shrink-0 text-[#272932]" data-node-id="57:1473" data-name="Current Weight">
                      <p className="font-['Poppins:Bold'] relative shrink-0 text-[26px]" data-node-id="56:1466">
                        78
                      </p>
                      <p className="font-['Poppins:Regular'] relative shrink-0 text-[24px]" data-node-id="57:1471">
                        kg
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="56:1470">
                      Current Weight
                    </p>
                  </div>
                  <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Poppins:Regular'] leading-[1.24] left-[102px] not-italic text-[#8a8c90] text-[11px] text-center top-[111px] whitespace-nowrap" data-node-id="62:1538">
                    13 kg left
                  </p>
                  <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.25] left-[12px] not-italic text-[#8a8c90] text-[14px] text-center top-[109px] w-[24px]" data-node-id="56:1468">
                    85
                  </p>
                  <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.25] not-italic right-[12px] text-[#8a8c90] text-[14px] text-center top-[109px] translate-x-1/2 w-[24px]" data-node-id="56:1469">
                    65
                  </p>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px pb-[16px] pt-[8px] px-[16px] relative rounded-[12px] w-full" data-node-id="57:1510" data-name="Motivational Note">
                <div className="h-0 relative shrink-0 w-full" data-node-id="68:1234">
                  <div className="absolute inset-[-1px_-0.43%]">
                    <img alt="" className="block max-w-none size-full" src={imgVector10} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center w-full" data-node-id="57:1475">
                  <span className="leading-[1.6]">{`Progress is progress, no matter how slow. Keep going, you're getting closer to your goal every day! `}</span>
                  <span className="leading-[1.6]">🎉</span>
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px p-[16px] relative rounded-[16px]" data-node-id="62:1513" data-name="Widget Calories Intake">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="62:1514" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-554px] relative shrink-0" data-node-id="I62:1514;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I62:1514;2:4223">
                    Calories Intake
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I62:1514;2:4225" data-name="Right Section">
                  <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I62:1514;2:4233" data-name="Button More">
                    <div className="relative shrink-0 size-[24px]" data-node-id="I62:1514;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-node-id="62:1634" data-name="Body">
                <div className="relative shrink-0 size-[228px]" data-node-id="62:1515" data-name="Chart">
                  <div className="absolute inset-[0_-0.25%_0_0.25%]" data-node-id="68:1233" data-name="Ellipse Base">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipseBase} />
                  </div>
                  <div className="absolute inset-[7.41%_6.94%_7.41%_7.87%]" data-node-id="62:1516" data-name="Donut Base">
                    <div className="absolute inset-[-1.03%]">
                      <img alt="" className="block max-w-none size-full" src={imgDonutBase1} />
                    </div>
                  </div>
                  <div className="absolute inset-[4.63%_4.17%_4.63%_5.09%]" data-node-id="62:1517" data-name="Donut Progress">
                    <div className="absolute bottom-[8.94%] left-1/2 right-0 top-0">
                      <img alt="" className="block max-w-none size-full" src={imgDonutProgress1} />
                    </div>
                  </div>
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col gap-[8px] items-center left-[calc(50%-0.5px)] top-[calc(50%-8px)] w-[106px]" data-node-id="62:1518" data-name="Info Current Weight">
                    <div className="relative shrink-0 size-[32px]" data-node-id="62:1624" data-name="Icon/Special/Lightning">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialLightning} />
                    </div>
                    <div className="[word-break:break-word] content-stretch flex gap-[3px] items-end leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] whitespace-nowrap" data-node-id="62:1519" data-name="Current Weight">
                      <p className="font-['Poppins:SemiBold'] relative shrink-0" data-node-id="62:1520">
                        1240
                      </p>
                      <p className="font-['Poppins:Regular'] relative shrink-0" data-node-id="62:1521">
                        kcal
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="62:1522">
                      Calories left
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative" data-node-id="62:1643" data-name="Data">
                  <div className="content-stretch flex items-center justify-between pr-[4px] relative shrink-0 w-full" data-node-id="67:728" data-name="Detail Calories">
                    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="62:1645" data-name="Detail Calories">
                      <div className="content-stretch flex gap-[10px] items-center py-[4px] relative shrink-0" data-node-id="62:1627" data-name="Info Eaten Calories">
                        <div className="bg-[#dff9a2] content-stretch flex items-center px-[8px] py-[10px] relative rounded-[20px] shrink-0" data-node-id="67:765" data-name="Icon">
                          <div className="relative shrink-0 size-[16px]" data-node-id="62:1628" data-name="Icon/Special/ForkKnife">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialForkKnife} />
                          </div>
                        </div>
                        <div className="[word-break:break-word] content-stretch flex flex-col items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="62:1664" data-name="Info">
                          <div className="content-stretch flex gap-[3px] items-baseline relative shrink-0 text-[#272932]" data-node-id="62:1629" data-name="Current Weight">
                            <p className="font-['Poppins:SemiBold'] leading-[1.2] relative shrink-0 text-[18px]" data-node-id="62:1630">
                              1750
                            </p>
                            <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[16px]" data-node-id="62:1631">
                              kcal
                            </p>
                          </div>
                          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="62:1632">
                            Eaten calories
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="62:1647" data-name="Detail Calories">
                      <div className="content-stretch flex gap-[10px] items-center py-[4px] relative shrink-0" data-node-id="62:1656" data-name="Info Burned Calories">
                        <div className="bg-[#dff9a2] content-stretch flex items-center px-[8px] py-[10px] relative rounded-[20px] shrink-0" data-node-id="67:766" data-name="Icon">
                          <div className="relative shrink-0 size-[16px]" data-node-id="62:1657" data-name="Icon/Special/Fire">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
                          </div>
                        </div>
                        <div className="[word-break:break-word] content-stretch flex flex-col items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="62:1665" data-name="Info">
                          <div className="content-stretch flex gap-[3px] items-baseline relative shrink-0 text-[#272932]" data-node-id="62:1658" data-name="Current Weight">
                            <p className="font-['Poppins:SemiBold'] leading-[1.2] relative shrink-0 text-[18px]" data-node-id="62:1659">
                              510
                            </p>
                            <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[16px]" data-node-id="62:1660">
                              kcal
                            </p>
                          </div>
                          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="62:1661">
                            Burned calories
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="67:727" data-name="List Macronutrients">
                    <ItemListMacronutrients className="bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] shrink-0 w-full" />
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] shrink-0 w-full" data-node-id="67:707" data-name="Item List Macronutrients">
                      <div className="[word-break:break-word] bg-[#eeeeef] content-stretch flex items-baseline justify-between not-italic px-[12px] py-[8px] relative rounded-[10px] shrink-0 w-[89px] whitespace-nowrap" data-node-id="I67:707;67:675" data-name="Current Weight">
                        <p className="font-['Poppins:Bold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="I67:707;67:676">
                          70
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I67:707;67:677">
                          /75gr
                        </p>
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-node-id="I67:707;67:683" data-name="Main Data">
                        <div className="[word-break:break-word] content-stretch flex items-start justify-between leading-[1.24] not-italic relative shrink-0 text-[11px] w-full whitespace-nowrap" data-node-id="I67:707;67:680" data-name="Header">
                          <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="I67:707;67:678">
                            Proteins
                          </p>
                          <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="I67:707;67:679">
                            93%
                          </p>
                        </div>
                        <div className="bg-white content-stretch flex flex-col items-start pr-[11.34px] relative rounded-[6px] shrink-0 w-full" data-node-id="I67:707;67:682" data-name="Chart">
                          <div className="bg-[#c2e66e] h-[6px] relative rounded-[6px] shrink-0 w-full" data-node-id="I67:707;67:681" data-name="Progress Bar" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] shrink-0 w-full" data-node-id="67:717" data-name="Item List Macronutrients">
                      <div className="[word-break:break-word] bg-[#eeeeef] content-stretch flex items-baseline justify-between not-italic px-[12px] py-[8px] relative rounded-[10px] shrink-0 w-[89px] whitespace-nowrap" data-node-id="I67:717;67:675" data-name="Current Weight">
                        <p className="font-['Poppins:Bold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="I67:717;67:676">
                          20
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I67:717;67:677">
                          /44gr
                        </p>
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-node-id="I67:717;67:683" data-name="Main Data">
                        <div className="[word-break:break-word] content-stretch flex items-start justify-between leading-[1.24] not-italic relative shrink-0 text-[11px] w-full whitespace-nowrap" data-node-id="I67:717;67:680" data-name="Header">
                          <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="I67:717;67:678">
                            Fats
                          </p>
                          <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="I67:717;67:679">
                            45%
                          </p>
                        </div>
                        <div className="bg-white content-stretch flex flex-col items-start pr-[89.1px] relative rounded-[6px] shrink-0 w-full" data-node-id="I67:717;67:682" data-name="Chart">
                          <div className="bg-[#c2e66e] h-[6px] relative rounded-[6px] shrink-0 w-full" data-node-id="I67:717;67:681" data-name="Progress Bar" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="71:1235" data-name="Widget Workout Progress">
            <div className="content-stretch flex items-center justify-between px-[4px] relative shrink-0 w-full" data-node-id="71:1236" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-245px] relative shrink-0" data-node-id="I71:1236;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I71:1236;2:4223">
                  Workout Progress
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I71:1236;2:4225" data-name="Right Section">
                <div className="bg-white content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I71:1236;2:4228" data-name="Button Picker">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I71:1236;2:4228;2:3476" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I71:1236;2:4228;2:3477">
                      This Week
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I71:1236;2:4228;2:3478" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I71:1236;2:4228;2:3479" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="71:1237" data-name="Body">
              <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px p-[16px] relative rounded-[16px] self-stretch" data-node-id="72:1435" data-name="Item List Macronutrients">
                <div className="bg-[#fefcfb] content-stretch flex items-baseline p-[14px] relative rounded-[10px] shrink-0" data-node-id="I72:1435;71:1382" data-name="Icon">
                  <div className="relative shrink-0 size-[32px]" data-node-id="I72:1435;72:1400" data-name="Icon/Special/PersonSimpleRun">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleRun} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] h-full items-start justify-center min-w-px relative" data-node-id="I72:1435;71:1385" data-name="Main Data">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I72:1435;71:1391">
                    Running 10 km
                  </p>
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-node-id="I72:1435;84:1505" data-name="Bottom">
                    <div className="[word-break:break-word] content-stretch flex items-start justify-between not-italic relative shrink-0 text-[#272932] w-full whitespace-nowrap" data-node-id="I72:1435;71:1386" data-name="Header">
                      <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="I72:1435;72:1404" data-name="Numbers">
                        <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I72:1435;71:1388">
                          75%
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px]" data-node-id="I72:1435;71:1387">
                          (7/10)
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px]" data-node-id="I72:1435;72:1403">
                        Cardio
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[6px] items-start relative rounded-[6px] shrink-0 w-full" data-node-id="I72:1435;71:1389" data-name="Chart">
                      <div className="bg-[#fefcfb] flex-[1_0_0] h-[6px] min-w-px relative rounded-[6px]" data-node-id="I72:1435;71:1390" data-name="Progress Bar" />
                      <div className="bg-[#dff9a2] content-stretch flex items-center overflow-clip pr-[40.8px] relative rounded-[8px] shrink-0" data-node-id="I72:1435;72:1480" data-name="Empty Bar">
                        <div className="h-[6px] relative rounded-[6px] shrink-0 w-px" data-node-id="I72:1435;72:1473" data-name="Empty Dot" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px p-[16px] relative rounded-[16px] self-stretch" data-node-id="72:1407" data-name="Item List Macronutrients">
                <div className="bg-[#fefcfb] content-stretch flex items-baseline p-[14px] relative rounded-[10px] shrink-0" data-node-id="I72:1407;71:1382" data-name="Icon">
                  <div className="relative shrink-0 size-[32px]" data-node-id="I72:1407;72:1400" data-name="Icon/Special/PersonSimpleRun">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleDeadlifts} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] h-full items-start justify-center min-w-px relative" data-node-id="I72:1407;71:1385" data-name="Main Data">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I72:1407;71:1391">
                    Squatting 50kg
                  </p>
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-node-id="I72:1407;84:1505" data-name="Bottom">
                    <div className="[word-break:break-word] content-stretch flex items-start justify-between not-italic relative shrink-0 text-[#272932] w-full whitespace-nowrap" data-node-id="I72:1407;71:1386" data-name="Header">
                      <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="I72:1407;72:1404" data-name="Numbers">
                        <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I72:1407;71:1388">
                          60%
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px]" data-node-id="I72:1407;71:1387">
                          (5/8)
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px]" data-node-id="I72:1407;72:1403">
                        Strength
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[6px] items-start relative rounded-[6px] shrink-0 w-full" data-node-id="I72:1407;71:1389" data-name="Chart">
                      <div className="bg-[#fefcfb] flex-[1_0_0] h-[6px] min-w-px relative rounded-[6px]" data-node-id="I72:1407;71:1390" data-name="Progress Bar" />
                      <div className="bg-[#ffe6b5] content-stretch flex items-center overflow-clip pr-[63px] relative rounded-[8px] shrink-0" data-node-id="I72:1407;72:1480" data-name="Empty Bar">
                        <div className="h-[6px] relative rounded-[6px] shrink-0 w-px" data-node-id="I72:1407;72:1473" data-name="Empty Dot" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px p-[16px] relative rounded-[16px] self-stretch" data-node-id="72:1421" data-name="Item List Macronutrients">
                <div className="bg-[#fefcfb] content-stretch flex items-baseline p-[14px] relative rounded-[10px] shrink-0" data-node-id="I72:1421;71:1382" data-name="Icon">
                  <div className="relative shrink-0 size-[32px]" data-node-id="I72:1421;72:1400" data-name="Icon/Special/PersonSimpleRun">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleTaiChi} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] h-full items-start justify-center min-w-px relative" data-node-id="I72:1421;71:1385" data-name="Main Data">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I72:1421;71:1391">
                    Stretching to touch toes
                  </p>
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-node-id="I72:1421;84:1505" data-name="Bottom">
                    <div className="[word-break:break-word] content-stretch flex items-start justify-between not-italic relative shrink-0 text-[#272932] w-full whitespace-nowrap" data-node-id="I72:1421;71:1386" data-name="Header">
                      <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="I72:1421;72:1404" data-name="Numbers">
                        <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I72:1421;71:1388">
                          50%
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px]" data-node-id="I72:1421;71:1387">
                          (3/6)
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px]" data-node-id="I72:1421;72:1403">
                        Flexibility
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[6px] items-start relative rounded-[6px] shrink-0 w-full" data-node-id="I72:1421;71:1389" data-name="Chart">
                      <div className="bg-[#fefcfb] flex-[1_0_0] h-[6px] min-w-px relative rounded-[6px]" data-node-id="I72:1421;71:1390" data-name="Progress Bar" />
                      <div className="bg-[#ffe1c9] content-stretch flex items-center overflow-clip pr-[72px] relative rounded-[8px] shrink-0" data-node-id="I72:1421;72:1480" data-name="Empty Bar">
                        <div className="h-[6px] relative rounded-[6px] shrink-0 w-px" data-node-id="I72:1421;72:1473" data-name="Empty Dot" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="84:1488" data-name="Section Recommendation">
            <div className="bg-white content-stretch flex flex-col gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-[556px]" data-node-id="43:1106" data-name="Widget Recommended Menu">
              <div className="content-stretch flex items-center justify-between px-[4px] relative shrink-0 w-full" data-node-id="43:1107" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-557px] relative shrink-0" data-node-id="I43:1107;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I43:1107;2:4223">
                    Recommended Menu
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I43:1107;2:4225" data-name="Right Section">
                  <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I43:1107;2:4233" data-name="Button More">
                    <div className="relative shrink-0 size-[24px]" data-node-id="I43:1107;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="43:1108" data-name="List Exercise">
                <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative rounded-[16px]" data-node-id="49:601" data-name="Card Recommended Menu">
                  <div className="h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I49:601;43:1174" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I49:601;43:1175" data-name="Place Image Here" />
                    <div className="absolute content-stretch flex gap-[8px] items-center left-[14px] top-[14px]" data-node-id="I49:601;52:898" data-name="Details Info">
                      <div className="bg-[#c2e66e] content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I49:601;48:1199" data-name="Info Meal Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I49:601;48:1201">
                          Breakfast
                        </p>
                      </div>
                      <div className="bg-white content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I49:601;43:1168" data-name="Info Cal">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I49:601;43:1169" data-name="Icon/Special/Fire">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I49:601;43:1170">
                          350 kcal
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[14px] items-start p-[16px] relative shrink-0 w-full" data-node-id="I49:601;43:1165" data-name="Main">
                    <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I49:601;43:1167" data-name="Details">
                      <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-node-id="I49:601;48:1179" data-name="Detail Nutrients">
                        <div className="bg-[#dff9a2] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I49:601;48:1180" data-name="Info Carbs">
                          <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I49:601;48:1181" data-name="Label">
                            <div className="relative shrink-0 size-[12px]" data-node-id="I49:601;48:1182" data-name="Icon/Special/Bread">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                            </div>
                            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I49:601;48:1183">
                              C
                            </p>
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I49:601;48:1184">
                            45g
                          </p>
                        </div>
                        <div className="bg-[#ffe6b5] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I49:601;48:1185" data-name="Info Protein">
                          <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I49:601;48:1186" data-name="Label">
                            <div className="relative shrink-0 size-[12px]" data-node-id="I49:601;48:1187" data-name="Icon/Special/Fish">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                            </div>
                            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I49:601;48:1188">
                              P
                            </p>
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I49:601;48:1189">
                            12g
                          </p>
                        </div>
                        <div className="bg-[#ffe1c9] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I49:601;48:1190" data-name="Info Fats">
                          <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I49:601;48:1191" data-name="Label">
                            <div className="relative shrink-0 size-[12px]" data-node-id="I49:601;48:1192" data-name="Icon/Special/Drop">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                            </div>
                            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I49:601;48:1193">
                              F
                            </p>
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I49:601;48:1194">
                            14g
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start not-italic relative shrink-0 w-full" data-node-id="I49:601;48:1204" data-name="Main Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I49:601;43:1166">
                        Oatmeal with Almond Butter and Berries
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.6] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I49:601;48:1178">
                        High in fiber and antioxidants, providing long-lasting energy and improving digestion.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative rounded-[16px]" data-node-id="48:1206" data-name="Card Recommended Menu">
                  <div className="h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I48:1206;43:1174" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I48:1206;43:1175" data-name="Place Image Here" />
                    <div className="absolute content-stretch flex gap-[8px] items-center left-[14px] top-[14px]" data-node-id="I48:1206;52:898" data-name="Details Info">
                      <div className="bg-[#ffcb65] content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I48:1206;48:1199" data-name="Info Meal Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I48:1206;48:1201">
                          Lunch
                        </p>
                      </div>
                      <div className="bg-white content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I48:1206;43:1168" data-name="Info Cal">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I48:1206;43:1169" data-name="Icon/Special/Fire">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I48:1206;43:1170">
                          450 kcal
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[14px] items-start p-[16px] relative shrink-0 w-full" data-node-id="I48:1206;43:1165" data-name="Main">
                    <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I48:1206;43:1167" data-name="Details">
                      <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-node-id="I48:1206;48:1179" data-name="Detail Nutrients">
                        <div className="bg-[#dff9a2] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I48:1206;48:1180" data-name="Info Carbs">
                          <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I48:1206;48:1181" data-name="Label">
                            <div className="relative shrink-0 size-[12px]" data-node-id="I48:1206;48:1182" data-name="Icon/Special/Bread">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                            </div>
                            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I48:1206;48:1183">
                              C
                            </p>
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I48:1206;48:1184">
                            40g
                          </p>
                        </div>
                        <div className="bg-[#ffe6b5] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I48:1206;48:1185" data-name="Info Protein">
                          <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I48:1206;48:1186" data-name="Label">
                            <div className="relative shrink-0 size-[12px]" data-node-id="I48:1206;48:1187" data-name="Icon/Special/Fish">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                            </div>
                            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I48:1206;48:1188">
                              P
                            </p>
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I48:1206;48:1189">
                            30g
                          </p>
                        </div>
                        <div className="bg-[#ffe1c9] content-stretch flex flex-[1_0_0] gap-[6px] items-center justify-center min-w-px p-[6px] relative rounded-[8px]" data-node-id="I48:1206;48:1190" data-name="Info Fats">
                          <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I48:1206;48:1191" data-name="Label">
                            <div className="relative shrink-0 size-[12px]" data-node-id="I48:1206;48:1192" data-name="Icon/Special/Drop">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                            </div>
                            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I48:1206;48:1193">
                              F
                            </p>
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I48:1206;48:1194">
                            18g
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start not-italic relative shrink-0 w-full" data-node-id="I48:1206;48:1204" data-name="Main Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I48:1206;43:1166">
                        Grilled Chicken Wrap with Avocado and Spinach
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.6] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I48:1206;48:1178">
                        Rich in protein and healthy fats, perfect for muscle recovery and maintaining satiety.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px pt-[8px] relative self-stretch" data-node-id="43:1105" data-name="Widget Recommended Exercises">
              <div className="content-stretch flex items-center justify-between px-[4px] relative shrink-0 w-full" data-node-id="28:284" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-821px] relative shrink-0" data-node-id="I28:284;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I28:284;2:4223">
                    Recommended Exercises
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I28:284;2:4225" data-name="Right Section">
                  <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I28:284;2:4233" data-name="Button More">
                    <div className="relative shrink-0 size-[24px]" data-node-id="I28:284;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px relative w-full" data-node-id="43:1071" data-name="List Exercise">
                <div className="bg-white content-stretch flex gap-[16px] items-end overflow-clip p-[12px] relative rounded-[16px] shrink-0 w-full" data-node-id="43:1029" data-name="Card Recommended Exercise">
                  <div className="flex flex-row items-end self-stretch" data-node-id="I43:1029;41:1023">
                    <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[10px] shrink-0 w-[78px]" data-name="Image">
                      <div className="absolute bg-[#eeeeef] inset-[1.22%_0_0_0]" data-node-id="I43:1029;41:1024" data-name="profile-side-view-strong-sportive-guy-sit-ups-isolated-grey-background" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px pb-[4px] relative" data-node-id="I43:1029;41:1026" data-name="Main">
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I43:1029;52:740" data-name="Main">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#2a2b2a] text-[14px] w-full" data-node-id="I43:1029;41:518">
                        Brisk Walking
                      </p>
                      <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="I43:1029;41:1025" data-name="Details">
                        <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I43:1029;41:1013" data-name="Info Cal">
                          <div className="relative shrink-0 size-[14px]" data-node-id="I43:1029;41:1014" data-name="Icon/Special/Fire">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I43:1029;41:1015">
                            200 kcal
                          </p>
                        </div>
                        <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I43:1029;41:1018" data-name="Info Duration">
                          <div className="relative shrink-0 size-[14px]" data-node-id="I43:1029;41:1019" data-name="Icon/Clock">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I43:1029;41:1020">
                            30 min
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I43:1029;49:634" data-name="Details">
                      <div className="bg-[#c2e66e] content-stretch flex gap-[6px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I43:1029;49:635" data-name="Info Cal">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I43:1029;49:636" data-name="Icon/ChartBar">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I43:1029;49:637">
                          Beginner
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white content-stretch flex gap-[16px] items-end overflow-clip p-[12px] relative rounded-[16px] shrink-0 w-full" data-node-id="43:1043" data-name="Card Recommended Exercise">
                  <div className="flex flex-row items-end self-stretch" data-node-id="I43:1043;41:1023">
                    <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[10px] shrink-0 w-[78px]" data-name="Image">
                      <div className="absolute bg-[#eeeeef] inset-[1.22%_0_0_0]" data-node-id="I43:1043;41:1024" data-name="profile-side-view-strong-sportive-guy-sit-ups-isolated-grey-background" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px pb-[4px] relative" data-node-id="I43:1043;41:1026" data-name="Main">
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I43:1043;52:740" data-name="Main">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#2a2b2a] text-[14px] w-full" data-node-id="I43:1043;41:518">
                        Bodyweight Squats
                      </p>
                      <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="I43:1043;41:1025" data-name="Details">
                        <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I43:1043;41:1013" data-name="Info Cal">
                          <div className="relative shrink-0 size-[14px]" data-node-id="I43:1043;41:1014" data-name="Icon/Special/Fire">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I43:1043;41:1015">
                            180 kcal
                          </p>
                        </div>
                        <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I43:1043;41:1018" data-name="Info Duration">
                          <div className="relative shrink-0 size-[14px]" data-node-id="I43:1043;41:1019" data-name="Icon/Clock">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I43:1043;41:1020">
                            20 min
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I43:1043;49:634" data-name="Details">
                      <div className="bg-[#ffcb65] content-stretch flex gap-[6px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I43:1043;49:635" data-name="Info Cal">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I43:1043;49:636" data-name="Icon/ChartBar">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I43:1043;49:637">
                          Intermediate
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white content-stretch flex gap-[16px] items-end overflow-clip p-[12px] relative rounded-[16px] shrink-0 w-full" data-node-id="43:1057" data-name="Card Recommended Exercise">
                  <div className="flex flex-row items-end self-stretch" data-node-id="I43:1057;41:1023">
                    <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[10px] shrink-0 w-[78px]" data-name="Image">
                      <div className="absolute bg-[#eeeeef] inset-[1.22%_0_0_0]" data-node-id="I43:1057;41:1024" data-name="profile-side-view-strong-sportive-guy-sit-ups-isolated-grey-background" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px pb-[4px] relative" data-node-id="I43:1057;41:1026" data-name="Main">
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I43:1057;52:740" data-name="Main">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#2a2b2a] text-[14px] w-full" data-node-id="I43:1057;41:518">
                        Dumbbell Squat
                      </p>
                      <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="I43:1057;41:1025" data-name="Details">
                        <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I43:1057;41:1013" data-name="Info Cal">
                          <div className="relative shrink-0 size-[14px]" data-node-id="I43:1057;41:1014" data-name="Icon/Special/Fire">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I43:1057;41:1015">
                            300 kcal
                          </p>
                        </div>
                        <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I43:1057;41:1018" data-name="Info Duration">
                          <div className="relative shrink-0 size-[14px]" data-node-id="I43:1057;41:1019" data-name="Icon/Clock">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I43:1057;41:1020">
                            30 min
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="I43:1057;49:634" data-name="Details">
                      <div className="bg-[#ffa257] content-stretch flex gap-[6px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I43:1057;49:635" data-name="Info Cal">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I43:1057;49:636" data-name="Icon/ChartBar">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I43:1057;49:637">
                          Hard
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="84:1633" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="84:1634" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="84:1635">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="84:1636" data-name="Links">
              <p className="relative shrink-0" data-node-id="84:1637">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="84:1638">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="84:1639">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="84:1640" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1641" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1642" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1643" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1644" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1645" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[28px] items-start p-[28px] relative self-stretch shrink-0 w-[325px]" data-node-id="33:1104" data-name="Right Side">
        <div className="content-stretch flex items-center justify-between py-[5px] relative rounded-[28px] shrink-0 w-full" data-node-id="33:1657" data-name="Header Menu">
          <div className="content-stretch flex items-center relative shrink-0" data-node-id="33:1660" data-name="User Profile">
            <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="33:1661" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I33:1661;2:3098" data-name="User Image/12">
                <div className="absolute inset-0 rounded-[12px]" data-node-id="I33:1661;2:3098;2:3159" data-name="Place Image Here" />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic pl-[12px] pr-[8px] relative shrink-0 whitespace-nowrap" data-node-id="33:1662" data-name="User Name">
              <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#2a2b2a] text-[16px]" data-node-id="33:1663">
                Adam Vasylenko
              </p>
              <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="33:1664">
                Member
              </p>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="33:1659" data-name="Button Icon">
            <div className="relative shrink-0 size-[22px]" data-node-id="I33:1659;2:3570" data-name="Icon/ChatTeardropDots">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
            </div>
            <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I33:1659;2:3571" data-name="Badge">
              <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I33:1659;2:3571;2:3270" data-name="Div Red" />
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-node-id="33:1103" data-name="Section Meal Plan">
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-start p-[12px] relative rounded-[12px] shrink-0 w-full" data-node-id="28:962" data-name="Calendar">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="28:378" data-name="Header-Section">
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:SemiBold'] gap-[4px] h-[18px] items-baseline leading-[1.25] not-italic relative shrink-0 text-[14px] whitespace-nowrap" data-node-id="28:379" data-name="Div Title">
                <p className="relative shrink-0 text-[#272932]" data-node-id="28:380">
                  September
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="28:381">
                  2028
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="28:382" data-name="Right Section">
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="28:390" data-name="Button More">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I28:390;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                  </div>
                </div>
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="28:406" data-name="Button More">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I28:406;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                  </div>
                </div>
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex items-center not-italic relative shrink-0 text-center w-full" data-node-id="28:951" data-name="Row Calendar">
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" />
              <CellCalendarDashboard active className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px] text-[#272932]" date="5" day="Tue" />
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" date="6" day="Wed" />
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" date="7" day="Thu" />
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" date="8" day="Fri" />
              <CellCalendarDashboard className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px pb-[6px] pt-[8px] px-[4px] relative rounded-[10px]" date="9" day="Sat" />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-node-id="371:10101" data-name="List Meal Plan">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="371:10102" data-name="Card Meal Plan">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10102;28:999" data-name="Header">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I371:10102;88:3437" data-name="Left Side">
                  <div className="bg-[#eeeeef] content-stretch flex gap-[8px] items-center pr-[8px] relative rounded-[6px] shrink-0" data-node-id="I371:10102;28:997" data-name="Title Meal Time">
                    <div className="relative shrink-0 size-[22px]" data-node-id="I371:10102;28:985" data-name="Checkbox">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheckbox} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10102;28:971">
                      Breakfast
                    </p>
                  </div>
                  <div className="bg-[#eeeeef] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I371:10102;33:1105" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I371:10102;33:1106" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10102;33:1107">
                      300 kcal
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-start p-[3px] relative rounded-[6px] shrink-0" data-node-id="I371:10102;88:3465" data-name="Button More">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I371:10102;88:3465;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="I371:10102;28:996" data-name="Detail Menu">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I371:10102;28:995" data-name="Main Section">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I371:10102;28:963" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I371:10102;100:1974" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I371:10102;28:994" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I371:10102;28:966">{`Scrambled Eggs with Spinach & Whole Grain Toast`}</p>
                    <div className="h-0 relative shrink-0 w-full" data-node-id="I371:10102;33:1484" data-name="Divider">
                      <div className="absolute inset-[-0.5px_0]">
                        <img alt="" className="block max-w-none size-full" src={imgDivider} />
                      </div>
                    </div>
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10102;33:1147" data-name="Detail Nutrients">
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10102;33:1148" data-name="Info Carbs">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10102;33:1293" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10102;33:1262" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10102;33:1149">
                            C
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10102;33:1150">
                          25g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10102;33:1151" data-name="Info Protein">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10102;33:1314" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10102;33:1315" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10102;33:1316">
                            P
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10102;33:1153">
                          20g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10102;33:1154" data-name="Info Fats">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10102;33:1339" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10102;33:1340" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10102;33:1341">
                            F
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10102;33:1156">
                          12g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-node-id="371:10103" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider1} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="371:10104" data-name="Card Meal Plan">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10104;28:999" data-name="Header">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I371:10104;88:3437" data-name="Left Side">
                  <div className="bg-[#c2e66e] content-stretch flex gap-[8px] items-center pr-[8px] relative rounded-[6px] shrink-0" data-node-id="I371:10104;28:997" data-name="Title Meal Time">
                    <div className="relative shrink-0 size-[22px]" data-node-id="I371:10104;28:985" data-name="Checkbox">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheckbox1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10104;28:971">
                      Lunch
                    </p>
                  </div>
                  <div className="bg-[#dff9a2] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I371:10104;33:1105" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I371:10104;33:1106" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10104;33:1107">
                      450 kcal
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-start p-[3px] relative rounded-[6px] shrink-0" data-node-id="I371:10104;88:3465" data-name="Button More">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I371:10104;88:3465;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="I371:10104;28:996" data-name="Detail Menu">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I371:10104;28:995" data-name="Main Section">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I371:10104;28:963" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I371:10104;100:1974" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I371:10104;28:994" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I371:10104;28:966">
                      Grilled Chicken Salad with Avocado and Quinoa
                    </p>
                    <div className="h-0 relative shrink-0 w-full" data-node-id="I371:10104;33:1484" data-name="Divider">
                      <div className="absolute inset-[-0.5px_0]">
                        <img alt="" className="block max-w-none size-full" src={imgDivider} />
                      </div>
                    </div>
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10104;33:1147" data-name="Detail Nutrients">
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10104;33:1148" data-name="Info Carbs">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10104;33:1293" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10104;33:1262" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10104;33:1149">
                            C
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10104;33:1150">
                          40g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10104;33:1151" data-name="Info Protein">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10104;33:1314" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10104;33:1315" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10104;33:1316">
                            P
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10104;33:1153">
                          35g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10104;33:1154" data-name="Info Fats">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10104;33:1339" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10104;33:1340" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10104;33:1341">
                            F
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10104;33:1156">
                          20g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-node-id="371:10105" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider1} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="371:10106" data-name="Card Meal Plan">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10106;28:999" data-name="Header">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I371:10106;88:3437" data-name="Left Side">
                  <div className="bg-[#ffcb65] content-stretch flex gap-[8px] items-center pr-[8px] relative rounded-[6px] shrink-0" data-node-id="I371:10106;28:997" data-name="Title Meal Time">
                    <div className="relative shrink-0 size-[22px]" data-node-id="I371:10106;28:985" data-name="Checkbox">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheckbox2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10106;28:971">
                      Snack
                    </p>
                  </div>
                  <div className="bg-[#ffe6b5] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I371:10106;33:1105" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I371:10106;33:1106" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10106;33:1107">
                      200 kcal
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-start p-[3px] relative rounded-[6px] shrink-0" data-node-id="I371:10106;88:3465" data-name="Button More">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I371:10106;88:3465;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="I371:10106;28:996" data-name="Detail Menu">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I371:10106;28:995" data-name="Main Section">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I371:10106;28:963" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I371:10106;100:1974" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I371:10106;28:994" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I371:10106;28:966">
                      Greek Yogurt with Mixed Berries and Almonds
                    </p>
                    <div className="h-0 relative shrink-0 w-full" data-node-id="I371:10106;33:1484" data-name="Divider">
                      <div className="absolute inset-[-0.5px_0]">
                        <img alt="" className="block max-w-none size-full" src={imgDivider} />
                      </div>
                    </div>
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10106;33:1147" data-name="Detail Nutrients">
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10106;33:1148" data-name="Info Carbs">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10106;33:1293" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10106;33:1262" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10106;33:1149">
                            C
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10106;33:1150">
                          18g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10106;33:1151" data-name="Info Protein">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10106;33:1314" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10106;33:1315" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10106;33:1316">
                            P
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10106;33:1153">
                          12g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10106;33:1154" data-name="Info Fats">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10106;33:1339" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10106;33:1340" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10106;33:1341">
                            F
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10106;33:1156">
                          10g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-node-id="371:10107" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider1} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="371:10108" data-name="Card Meal Plan">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10108;28:999" data-name="Header">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I371:10108;88:3437" data-name="Left Side">
                  <div className="bg-[#ffa257] content-stretch flex gap-[8px] items-center pr-[8px] relative rounded-[6px] shrink-0" data-node-id="I371:10108;28:997" data-name="Title Meal Time">
                    <div className="relative shrink-0 size-[22px]" data-node-id="I371:10108;28:985" data-name="Checkbox">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheckbox3} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10108;28:971">
                      Dinner
                    </p>
                  </div>
                  <div className="bg-[#ffe1c9] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I371:10108;33:1105" data-name="Info Cal">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I371:10108;33:1106" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10108;33:1107">
                      500 kcal
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-start p-[3px] relative rounded-[6px] shrink-0" data-node-id="I371:10108;88:3465" data-name="Button More">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I371:10108;88:3465;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full" data-node-id="I371:10108;28:996" data-name="Detail Menu">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I371:10108;28:995" data-name="Main Section">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I371:10108;28:963" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I371:10108;100:1974" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I371:10108;28:994" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I371:10108;28:966">
                      Grilled Chicken with Sweet Potato and Green Beans
                    </p>
                    <div className="h-0 relative shrink-0 w-full" data-node-id="I371:10108;33:1484" data-name="Divider">
                      <div className="absolute inset-[-0.5px_0]">
                        <img alt="" className="block max-w-none size-full" src={imgDivider} />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-full" data-node-id="I371:10108;33:1147" data-name="Detail Nutrients">
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10108;33:1148" data-name="Info Carbs">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10108;33:1293" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10108;33:1262" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10108;33:1149">
                            C
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10108;33:1150">
                          45g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10108;33:1151" data-name="Info Protein">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10108;33:1314" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10108;33:1315" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10108;33:1316">
                            P
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10108;33:1153">
                          35g
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10108;33:1154" data-name="Info Fats">
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10108;33:1339" data-name="Label">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I371:10108;33:1340" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10108;33:1341">
                            F
                          </p>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10108;33:1156">
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
        <div className="content-stretch flex flex-col gap-[16px] items-start pb-[8px] relative shrink-0 w-full" data-node-id="33:1967" data-name="Section Recent Activity">
          <HeaderSection className="content-stretch flex items-center justify-between relative shrink-0 w-full" showCta={false} showPicker={false} showPicker2={false} showSearchInput={false} showSegmentedButton={false} showSortBy={false} title="Recent Activity" />
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="33:1912" data-name="List Recent Activity">
            <div className="bg-white content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="33:1927" data-name="Item List Recent Activity">
              <div className="content-stretch flex flex-col gap-[4px] items-center pb-[4px] relative self-stretch shrink-0" data-node-id="I33:1927;33:1968" data-name="Left Side">
                <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[20px] shrink-0" data-node-id="I33:1927;33:1866" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I33:1927;33:1891" data-name="Icon/Nav/PersonSimpleTaiChi">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell1} />
                  </div>
                </div>
                <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="I33:1927;33:2004" data-name="Line">
                  <div className="absolute inset-[0_-0.5px]">
                    <img alt="" className="block max-w-none size-full" src={imgLine3} />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col font-['Poppins:Regular'] gap-[4px] items-start min-w-px not-italic pb-[12px] relative" data-node-id="I33:1927;33:1867" data-name="Info">
                <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px] w-full" data-node-id="I33:1927;33:1894">
                  6:00 PM
                </p>
                <p className="leading-[0] relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I33:1927;33:1868">
                  <span className="font-['Poppins:SemiBold'] leading-[1.6] text-[11px]">{`Notification sent: `}</span>
                  <span className="leading-[1.6] text-[11px]">{`"Congratulations! You've reached 75% of your cardio endurance goal!"`}</span>
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="33:1920" data-name="Item List Recent Activity">
              <div className="content-stretch flex flex-col gap-[4px] items-center pb-[4px] relative self-stretch shrink-0" data-node-id="I33:1920;33:1968" data-name="Left Side">
                <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[20px] shrink-0" data-node-id="I33:1920;33:1866" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I33:1920;33:1891" data-name="Icon/Nav/PersonSimpleTaiChi">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi1} />
                  </div>
                </div>
                <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="I33:1920;33:2004" data-name="Line">
                  <div className="absolute inset-[0_-0.5px]">
                    <img alt="" className="block max-w-none size-full" src={imgLine3} />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col font-['Poppins:Regular'] gap-[4px] items-start min-w-px not-italic pb-[12px] relative" data-node-id="I33:1920;33:1867" data-name="Info">
                <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px] w-full" data-node-id="I33:1920;33:1894">
                  5:15 PM
                </p>
                <p className="leading-[0] relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I33:1920;33:1868">
                  <span className="font-['Poppins:SemiBold'] leading-[1.6] text-[11px]">Ladya Mortimov</span>
                  <span className="leading-[1.6] text-[11px]">{` completed her 3rd stretching session for flexibility improvement`}</span>
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="33:1913" data-name="Item List Recent Activity">
              <div className="content-stretch flex flex-col gap-[4px] items-center pb-[4px] relative self-stretch shrink-0" data-node-id="I33:1913;33:1968" data-name="Left Side">
                <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[20px] shrink-0" data-node-id="I33:1913;33:1866" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I33:1913;33:1891" data-name="Icon/Nav/PersonSimpleTaiChi">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleRun1} />
                  </div>
                </div>
                <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="I33:1913;33:2004" data-name="Line">
                  <div className="absolute inset-[0_-0.5px]">
                    <img alt="" className="block max-w-none size-full" src={imgLine3} />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col font-['Poppins:Regular'] gap-[4px] items-start min-w-px not-italic pb-[12px] relative" data-node-id="I33:1913;33:1867" data-name="Info">
                <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px] w-full" data-node-id="I33:1913;33:1894">
                  3:00 PM
                </p>
                <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px] w-full" data-node-id="I33:1913;33:1868">
                  Cardio progress updated – 7.5 km completed out of 10 km goal for endurance improvement
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="33:1905" data-name="Item List Recent Activity">
              <div className="content-stretch flex flex-col items-center pb-[4px] relative self-stretch shrink-0" data-node-id="I33:1905;33:2027" data-name="Left Side">
                <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[20px] shrink-0" data-node-id="I33:1905;33:2028" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I33:1905;33:2029" data-name="Icon/Nav/PersonSimpleTaiChi">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood1} />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col font-['Poppins:Regular'] gap-[4px] items-start min-w-px not-italic relative" data-node-id="I33:1905;33:2031" data-name="Info">
                <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px] w-full" data-node-id="I33:1905;33:2032">
                  12:45 PM
                </p>
                <p className="leading-[0] relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I33:1905;100:2023">
                  <span className="font-['Poppins:SemiBold'] leading-[1.6] text-[11px]">Ladya Mortimov</span>
                  <span className="leading-[1.6] text-[11px]">{` logged her lunch meal: Grilled Chicken Wrap with Avocado and Spinach (450 kcal)`}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
