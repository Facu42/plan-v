const assetPathPrefix = "https://www.figma.com/api/mcp/asset/bd8d8947-ca96-4aea-8f12-aa16fa685c48";
const imgRow = `${assetPathPrefix}/00da0.svg`;
const imgIconCaretDown = `${assetPathPrefix}/601ba.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/22b1d.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/ac3fd.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/b9ed6.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/2b979.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown2 = `${assetPathPrefix}/20d58.svg`;
const imgPoint = `${assetPathPrefix}/870cf.svg`;
const imgLine = `${assetPathPrefix}/f495a.svg`;
const imgLine1 = `${assetPathPrefix}/0c8c0.svg`;
const imgLine2 = `${assetPathPrefix}/42aba.svg`;
const imgLine3 = `${assetPathPrefix}/cb687.svg`;
const imgLine4 = `${assetPathPrefix}/759b1.svg`;
const imgIconCaretDown3 = `${assetPathPrefix}/16cfa.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgLineArea = `${assetPathPrefix}/8e199.svg`;
const imgLine5 = `${assetPathPrefix}/27b6d.svg`;
const imgPoint1 = `${assetPathPrefix}/445ce.svg`;
const imgRow1 = `${assetPathPrefix}/dee5e.svg`;
const imgRow2 = `${assetPathPrefix}/2d563.svg`;
const imgLeftSide = `${assetPathPrefix}/36709.svg`;
const imgLeftSide1 = `${assetPathPrefix}/595f3.svg`;
const imgChartArea = `${assetPathPrefix}/1eefc.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ChartColumnProps = {
  className?: string;
  label?: string;
  type?: "Default" | "Y-labels";
};

function ChartColumn({ className, label = "Jan", type = "Y-labels" }: ChartColumnProps) {
  const isDefault = type === "Default";
  const isYLabels = type === "Y-labels";
  return (
    <div className={className || `content-stretch flex flex-col gap-[8px] h-[186px] pb-[4px] relative rounded-[6px] ${isDefault ? "items-center w-[45px]" : "items-start"}`} id={isDefault ? "node-2_4024" : "node-2_4010"}>
      <div className={`content-stretch flex flex-[1_0_0] flex-col justify-between min-h-px relative ${isDefault ? "items-center w-full" : "items-start"}`} id={isDefault ? "node-2_4025" : "node-2_4011"} data-name="Lines">
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4026" : "node-2_4012"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4013">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4028" : "node-2_4014"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4015">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4030" : "node-2_4016"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4017">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4032" : "node-2_4018"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4019">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4034" : "node-2_4020"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4021">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
      </div>
      <div className={`content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 ${isDefault ? "w-full" : "pr-[8px] w-[19px]"}`} id={isDefault ? "node-2_4036" : "node-2_4022"} data-name="Row">
        {isDefault && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="2:4037">
            {label}
          </p>
        )}
      </div>
    </div>
  );
}

function IconCaretDown({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[32px]"} data-node-id="2:2983" data-name="Icon/CaretDown">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
    </div>
  );
}

type TableRowProgressProps = {
  className?: string;
  arm?: string;
  chest?: string;
  hips?: string;
  thigh?: string;
  type?: "Body" | "Head";
  waist?: string;
  week?: string;
};

function TableRowProgress({ className, arm = "95.0", chest = "95.0", hips = "95.0", thigh = "95.0", type = "Head", waist = "95.0", week = "Week 1" }: TableRowProgressProps) {
  const isBody = type === "Body";
  const isHead = type === "Head";
  return (
    <div className={className || `content-stretch flex gap-[8px] items-center relative w-[707px] ${isBody ? "pb-[8px]" : "pb-[20px] pt-[8px]"}`} id={isBody ? "node-182_8222" : "node-182_8200"}>
      <div className={`content-stretch flex items-center relative shrink-0 w-[152px] ${isBody ? "" : "gap-[4px]"}`} id={isBody ? "node-182_8223" : "node-182_8428"} data-name="Cell-Week">
        {isHead && (
          <>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="182:8429">
              September 2028
            </p>
            <IconCaretDown className="relative shrink-0 size-[14px]" />
          </>
        )}
        {isBody && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="182:8226">
            {week}
          </p>
        )}
      </div>
      <div className={`content-stretch flex flex-[1_0_0] items-start min-w-px relative ${isBody ? "bg-white px-[12px] py-[10px] rounded-[6px]" : "px-[10px]"}`} id={isBody ? "node-182_8229" : "node-182_8207"} data-name="Cell-Chest">
        {isHead && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="182:8208">
            Chest (cm)
          </p>
        )}
        {isBody && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="182:8230">
            {chest}
          </p>
        )}
      </div>
      <div className={`content-stretch flex flex-[1_0_0] items-start min-w-px relative ${isBody ? "bg-white px-[12px] py-[10px] rounded-[6px]" : "px-[10px]"}`} id={isBody ? "node-182_8259" : "node-182_8262"} data-name="Cell-Arm">
        {isHead && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="182:8263">
            Arm (cm)
          </p>
        )}
        {isBody && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="182:8260">
            {arm}
          </p>
        )}
      </div>
      <div className={`content-stretch flex flex-[1_0_0] items-start min-w-px relative ${isBody ? "bg-white px-[12px] py-[10px] rounded-[6px]" : "px-[10px]"}`} id={isBody ? "node-182_8267" : "node-182_8270"} data-name="Cell-Chest">
        {isHead && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="182:8271">
            Waist (cm)
          </p>
        )}
        {isBody && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="182:8268">
            {waist}
          </p>
        )}
      </div>
      <div className={`content-stretch flex flex-[1_0_0] items-start min-w-px relative ${isBody ? "bg-white px-[12px] py-[10px] rounded-[6px]" : "px-[10px]"}`} id={isBody ? "node-182_8275" : "node-182_8278"} data-name="Cell-Chest">
        {isHead && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="182:8279">
            Hips (cm)
          </p>
        )}
        {isBody && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="182:8276">
            {hips}
          </p>
        )}
      </div>
      <div className={`content-stretch flex flex-[1_0_0] items-start min-w-px relative ${isBody ? "bg-white px-[12px] py-[10px] rounded-[6px]" : "px-[10px]"}`} id={isBody ? "node-182_8283" : "node-182_8286"} data-name="Cell-Chest">
        {isHead && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="182:8287">
            Thigh (cm)
          </p>
        )}
        {isBody && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="182:8284">
            {thigh}
          </p>
        )}
      </div>
    </div>
  );
}

function ItemListPhotoCarousel({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[16px] w-[156px]"} data-node-id="161:6738" data-name="Item List Photo Carousel">
      <div className="[word-break:break-word] content-stretch flex items-baseline justify-between not-italic p-[12px] relative rounded-[12px] shrink-0 w-full whitespace-nowrap" data-node-id="161:6507" data-name="Info Progress">
        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="161:6508">
          July 2028
        </p>
        <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="161:6509" data-name="Current Weight">
          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="161:6510">
            82
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="161:6511">
            Kg
          </p>
        </div>
      </div>
      <div className="bg-[#eeeeef] h-[156px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="161:6737" data-name="Image">
        <div className="absolute bg-[#eeeeef] inset-0" data-node-id="191:5430" data-name="Place Image Here" />
      </div>
    </div>
  );
}

export default function Component25ProgressDesktop() {
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="105:2790" data-name="25. Progress (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="105:2791" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I105:2791;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I105:2791;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I105:2791;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I105:2791;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I105:2791;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I105:2791;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I105:2791;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4500;2:3296">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4505;2:3296">
                Messages
              </p>
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4505;2:3297" data-name="Badge">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I105:2791;2:4505;2:3297;2:3262" data-name="Div Red">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I105:2791;2:4505;2:3297;2:3263">
                  6
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4502;2:3296">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4503;2:3296">
                Meal Plan
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:2791;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I105:2791;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4504;2:3296">
                Food Diary
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4506;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I105:2791;2:4506;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4506;2:3292">
                Progress
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4509;2:3296">
                Exercises
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;12:1059;2:3296">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I105:2791;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I105:2791;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I105:2791;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I105:2791;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:2791;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:2791;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4518;2:3335">
                Claim Now!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4519;2:3296">
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="105:2792" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between relative shrink-0 w-full" data-node-id="105:2793" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I105:2793;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I105:2793;2:4460">
              Progress
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I105:2793;2:4462" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I105:2793;2:4463" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I105:2793;2:4463;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I105:2793;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I105:2793;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I105:2793;2:4464;2:3571" data-name="Badge">
                <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I105:2793;2:4464;2:3571;2:3270" data-name="Div Red" />
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I105:2793;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I105:2793;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I105:2793;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I105:2793;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I105:2793;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I105:2793;2:4468">
                  Adam Vasylenko
                </p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I105:2793;2:4469">
                  Member
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I105:2793;2:4470">
                <div className="bg-white content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I105:2793;2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown2} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-start justify-between min-h-[842px] relative shrink-0 w-full" data-node-id="105:2794" data-name="Body">
          <div className="bg-white content-stretch flex flex-col gap-[20px] items-start overflow-clip p-[16px] relative rounded-[16px] shrink-0 w-[767px]" data-node-id="182:8506" data-name="Main Section">
            <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="182:8505" data-name="Main Info">
              <div className="flex-[1_0_0] h-[674px] min-w-px overflow-clip relative" data-node-id="161:6761" data-name="Image Area">
                <div className="absolute contents left-[-56.43px] top-[22px]" data-node-id="189:5380">
                  <div className="absolute bg-[#eeeeef] h-[674px] left-[220px] top-[22px] w-[276.428px]" data-node-id="189:5378" data-name="freepik-export-20240925003141nI3f 1" />
                  <div className="absolute flex h-[674px] items-center justify-center left-[-56.43px] top-[22px] w-[276.428px]" data-node-id="189:5379">
                    <div className="-scale-y-100 flex-none rotate-180">
                      <div className="bg-[#eeeeef] h-[674px] relative w-[276.428px]" data-name="freepik-export-20240925003141nI3f 2" />
                    </div>
                  </div>
                </div>
                <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] items-start left-[354px] not-italic px-[8px] rounded-[12px] top-[100px] whitespace-nowrap" data-node-id="189:5381" data-name="Info Progress">
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="189:5382">
                    Chest
                  </p>
                  <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="189:5383" data-name="Current Weight">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="189:5384">
                      93.0
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="189:5385">
                      cm
                    </p>
                  </div>
                </div>
                <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] items-start left-[356px] not-italic px-[8px] rounded-[12px] top-[210px] whitespace-nowrap" data-node-id="189:5395" data-name="Info Progress">
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="189:5396">
                    Waist
                  </p>
                  <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="189:5397" data-name="Current Weight">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="189:5398">
                      77.5
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="189:5399">
                      cm
                    </p>
                  </div>
                </div>
                <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] items-start left-[20px] not-italic px-[8px] rounded-[12px] top-[374px] whitespace-nowrap" data-node-id="189:5409" data-name="Info Progress">
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="189:5410">
                    Hips
                  </p>
                  <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="189:5411" data-name="Current Weight">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="189:5412">
                      98.0
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="189:5413">
                      cm
                    </p>
                  </div>
                </div>
                <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] items-start left-[20px] not-italic px-[8px] rounded-[12px] top-[167px] whitespace-nowrap" data-node-id="189:5389" data-name="Info Progress">
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="189:5390">
                    Arm
                  </p>
                  <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="189:5391" data-name="Current Weight">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="189:5392">
                      28.5
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="189:5393">
                      cm
                    </p>
                  </div>
                </div>
                <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] items-start left-[354px] not-italic px-[8px] rounded-[12px] top-[464px] whitespace-nowrap" data-node-id="189:5414" data-name="Info Progress">
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="189:5415">
                    Thigh
                  </p>
                  <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="189:5416" data-name="Current Weight">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="189:5417">
                      58.5
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="189:5418">
                      cm
                    </p>
                  </div>
                </div>
                <div className="absolute left-[140px] size-[12px] top-[218px]" data-node-id="189:5388" data-name="Point">
                  <div className="absolute inset-[-16.67%]">
                    <img alt="" className="block max-w-none size-full" src={imgPoint} />
                  </div>
                </div>
                <div className="absolute h-[38.5px] left-[20px] top-[185.5px] w-[126px]" data-node-id="189:5394" data-name="Line">
                  <div className="absolute inset-[-1.3%_-0.27%_-0.95%_0]">
                    <img alt="" className="block max-w-none size-full" src={imgLine} />
                  </div>
                </div>
                <div className="absolute left-[214px] size-[12px] top-[182px]" data-node-id="189:5386" data-name="Point">
                  <div className="absolute inset-[-16.67%]">
                    <img alt="" className="block max-w-none size-full" src={imgPoint} />
                  </div>
                </div>
                <div className="absolute left-[214px] size-[12px] top-[255px]" data-node-id="189:5405" data-name="Point">
                  <div className="absolute inset-[-16.67%]">
                    <img alt="" className="block max-w-none size-full" src={imgPoint} />
                  </div>
                </div>
                <div className="absolute left-[244px] size-[12px] top-[418px]" data-node-id="189:5419" data-name="Point">
                  <div className="absolute inset-[-16.67%]">
                    <img alt="" className="block max-w-none size-full" src={imgPoint} />
                  </div>
                </div>
                <div className="absolute left-[214px] size-[12px] top-[325px]" data-node-id="189:5407" data-name="Point">
                  <div className="absolute inset-[-16.67%]">
                    <img alt="" className="block max-w-none size-full" src={imgPoint} />
                  </div>
                </div>
                <div className="absolute h-[69.5px] left-[220px] top-[118.5px] w-[206px]" data-node-id="189:5387" data-name="Line">
                  <div className="absolute inset-[-0.72%_0_-0.61%_-0.13%]">
                    <img alt="" className="block max-w-none size-full" src={imgLine1} />
                  </div>
                </div>
                <div className="absolute h-[58px] left-[250px] top-[424px] w-[176px]" data-node-id="189:5420" data-name="Line">
                  <div className="absolute inset-[-0.7%_0_-0.86%_-0.17%]">
                    <img alt="" className="block max-w-none size-full" src={imgLine2} />
                  </div>
                </div>
                <div className="absolute h-[32px] left-[220px] top-[228.5px] w-[206.5px]" data-node-id="189:5406" data-name="Line">
                  <div className="absolute inset-[-1.56%_0_-1.5%_0]">
                    <img alt="" className="block max-w-none size-full" src={imgLine3} />
                  </div>
                </div>
                <div className="absolute h-[61.5px] left-[20.5px] top-[331px] w-[199.5px]" data-node-id="189:5408" data-name="Line">
                  <div className="absolute inset-[-0.68%_-0.14%_-0.81%_0]">
                    <img alt="" className="block max-w-none size-full" src={imgLine4} />
                  </div>
                </div>
                <div className="absolute bg-[#c2e66e] content-stretch flex gap-[2px] items-center left-0 pl-[10px] pr-[8px] py-[6px] rounded-[8px] top-0" data-node-id="189:5421" data-name="Button Picker">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I189:5421;2:3326" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I189:5421;2:3327">
                      Today
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I189:5421;2:3328" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I189:5421;2:3329" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown3} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[275px]" data-node-id="182:8504" data-name="Side Section">
                <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="159:6143" data-name="Widget Weight Tracking">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="159:6144" data-name="Header-Section">
                    <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-830px] relative shrink-0" data-node-id="I159:6144;2:4222" data-name="Div Title">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I159:6144;2:4223">
                        Weight Tracking
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I159:6144;2:4225" data-name="Right Section">
                      <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I159:6144;2:4233" data-name="Button More">
                        <div className="relative shrink-0 size-[24px]" data-node-id="I159:6144;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-node-id="159:6494" data-name="Body">
                    <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="159:6483" data-name="Info Weights">
                      <div className="content-stretch flex items-center justify-between relative rounded-[12px] shrink-0 w-full" data-node-id="159:6472" data-name="Item Info Weight">
                        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="159:6473">
                          Start Weight
                        </p>
                        <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="159:6474" data-name="Current Weight">
                          <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="159:6475">
                            85
                          </p>
                          <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="159:6476">
                            Kg
                          </p>
                        </div>
                      </div>
                      <div className="content-stretch flex items-center justify-between relative rounded-[12px] shrink-0 w-full" data-node-id="159:6478" data-name="Item Info Weight">
                        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="159:6479">
                          Current Weight
                        </p>
                        <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="159:6480" data-name="Current Weight">
                          <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="159:6481">
                            78
                          </p>
                          <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="159:6482">
                            Kg
                          </p>
                        </div>
                      </div>
                      <div className="content-stretch flex items-center justify-between relative rounded-[12px] shrink-0 w-full" data-node-id="159:6484" data-name="Item Info Weight">
                        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="159:6485">
                          Weight Goal
                        </p>
                        <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="159:6486" data-name="Current Weight">
                          <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="159:6487">
                            65
                          </p>
                          <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="159:6488">
                            Kg
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex h-[181px] items-start relative shrink-0 w-full" data-node-id="159:6145" data-name="Chart">
                      <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Apr" type="Default" />
                      <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="May" type="Default" />
                      <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Jun" type="Default" />
                      <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Jul" type="Default" />
                      <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Aug" type="Default" />
                      <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Sep" type="Default" />
                      <div className="absolute inset-[13.26%_0.42%_17.13%_0.21%]" data-node-id="182:8478" data-name="Line Area">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLineArea} />
                      </div>
                      <div className="absolute inset-[13.26%_0.42%_47.21%_0.21%]" data-node-id="182:8449" data-name="Line">
                        <div className="absolute inset-[-1.4%_-0.41%]">
                          <img alt="" className="block max-w-none size-full" src={imgLine5} />
                        </div>
                      </div>
                      <div className="absolute content-stretch flex inset-0 items-center" data-node-id="182:8450" data-name="Columns">
                        <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[164px] relative" data-node-id="182:8451" data-name="Column">
                          <div className="relative shrink-0 size-[10px]" data-node-id="182:8452" data-name="Tooltip">
                            <div className="absolute left-px size-[8px] top-px" data-node-id="182:8453" data-name="Point">
                              <div className="absolute inset-[-25%]">
                                <img alt="" className="block max-w-none size-full" src={imgPoint1} />
                              </div>
                            </div>
                            <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-1/2 not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="182:8454">
                              85 kg
                            </p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[146px] relative" data-node-id="182:8489" data-name="Column">
                          <div className="relative shrink-0 size-[10px]" data-node-id="182:8490" data-name="Tooltip">
                            <div className="absolute left-px size-[8px] top-px" data-node-id="182:8491" data-name="Point">
                              <div className="absolute inset-[-25%]">
                                <img alt="" className="block max-w-none size-full" src={imgPoint1} />
                              </div>
                            </div>
                            <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-[calc(50%+0.5px)] not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="182:8492">
                              83 kg
                            </p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[129px] relative" data-node-id="182:8484" data-name="Column">
                          <div className="relative shrink-0 size-[10px]" data-node-id="182:8485" data-name="Tooltip">
                            <div className="absolute left-px size-[8px] top-px" data-node-id="182:8486" data-name="Point">
                              <div className="absolute inset-[-25%]">
                                <img alt="" className="block max-w-none size-full" src={imgPoint1} />
                              </div>
                            </div>
                            <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-1/2 not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="182:8487">
                              80 kg
                            </p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[93px] relative" data-node-id="182:8494" data-name="Column">
                          <div className="relative shrink-0 size-[10px]" data-node-id="182:8495" data-name="Tooltip">
                            <div className="absolute left-px size-[8px] top-px" data-node-id="182:8496" data-name="Point">
                              <div className="absolute inset-[-25%]">
                                <img alt="" className="block max-w-none size-full" src={imgPoint1} />
                              </div>
                            </div>
                            <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-1/2 not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="182:8497">
                              73 kg
                            </p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[129px] relative" data-node-id="182:8479" data-name="Column">
                          <div className="relative shrink-0 size-[10px]" data-node-id="182:8480" data-name="Tooltip">
                            <div className="absolute left-px size-[8px] top-px" data-node-id="182:8481" data-name="Point">
                              <div className="absolute inset-[-25%]">
                                <img alt="" className="block max-w-none size-full" src={imgPoint1} />
                              </div>
                            </div>
                            <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-1/2 not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="182:8482">
                              80 kg
                            </p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[115px] relative" data-node-id="182:8499" data-name="Column">
                          <div className="relative shrink-0 size-[10px]" data-node-id="182:8500" data-name="Tooltip">
                            <div className="absolute left-px size-[8px] top-px" data-node-id="182:8501" data-name="Point">
                              <div className="absolute inset-[-25%]">
                                <img alt="" className="block max-w-none size-full" src={imgPoint1} />
                              </div>
                            </div>
                            <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-[calc(50%+0.5px)] not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="182:8502">
                              78 kg
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[20px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="161:6503" data-name="Widget Progress Photos">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="161:6504" data-name="Header-Section">
                    <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-798px] relative shrink-0" data-node-id="I161:6504;2:4222" data-name="Div Title">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I161:6504;2:4223">
                        Progress Photos
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I161:6504;2:4225" data-name="Right Section">
                      <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I161:6504;2:4228" data-name="Button Picker">
                        <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I161:6504;2:4228;2:3331" data-name="Text">
                          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I161:6504;2:4228;2:3332">{`View All `}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full" data-node-id="161:6505" data-name="Body">
                    <div className="content-stretch flex gap-[16px] items-start overflow-clip relative shrink-0 w-full" data-node-id="161:6506" data-name="Carousel">
                      <ItemListPhotoCarousel className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[156px]" />
                      <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[156px]" data-node-id="161:6739" data-name="Item List Photo Carousel">
                        <div className="[word-break:break-word] content-stretch flex items-baseline justify-between not-italic p-[12px] relative rounded-[12px] shrink-0 w-full whitespace-nowrap" data-node-id="I161:6739;161:6507" data-name="Info Progress">
                          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="I161:6739;161:6508">
                            Sept 2028
                          </p>
                          <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="I161:6739;161:6509" data-name="Current Weight">
                            <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I161:6739;161:6510">
                              82
                            </p>
                            <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I161:6739;161:6511">
                              Kg
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#eeeeef] h-[156px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I161:6739;161:6737" data-name="Image">
                          <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I161:6739;191:5430" data-name="Place Image Here" />
                        </div>
                      </div>
                      <ItemListPhotoCarousel className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[156px]" />
                      <div className="absolute bg-gradient-to-l bottom-0 from-[rgba(39,41,50,0.06)] right-0 to-[rgba(39,41,50,0)] top-0 w-[24px]" data-node-id="161:6754" />
                    </div>
                    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[6px] shrink-0 w-full" data-node-id="161:6756" data-name="Slider">
                      <div className="bg-[#e1e1e2] h-[8px] relative rounded-[6px] shrink-0 w-[80px]" data-node-id="161:6755" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start pb-[8px] pt-[16px] px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="182:8021" data-name="Section Table Body Measurement">
              <TableRowProgress className="content-stretch flex gap-[8px] items-center pb-[20px] pt-[8px] relative shrink-0 w-full" />
              <TableRowProgress arm="30.0" className="content-stretch flex gap-[8px] items-center pb-[8px] relative shrink-0 w-full" hips="100.0" thigh="60.0" type="Body" waist="80.0" />
              <TableRowProgress arm="29.5" chest="94.0" className="content-stretch flex gap-[8px] items-center pb-[8px] relative shrink-0 w-full" hips="99.0" thigh="59.5" type="Body" waist="79.0" week="Week 2" />
              <TableRowProgress arm="29.0" chest="93.5" className="content-stretch flex gap-[8px] items-center pb-[8px] relative shrink-0 w-full" hips="98.5" thigh="59.0" type="Body" waist="78.0" week="Week 3" />
              <TableRowProgress arm="28.5" chest="93.0" className="content-stretch flex gap-[8px] items-center pb-[8px] relative shrink-0 w-full" hips="98.0" thigh="58.5" type="Body" waist="77.5" week="Week 4" />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[374px]" data-node-id="182:8651">
            <div className="bg-white content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="173:7165" data-name="Widget Calories Activities">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="173:7166" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-731px] relative shrink-0" data-node-id="I173:7166;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I173:7166;2:4223">
                    Calories Activities
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I173:7166;2:4225" data-name="Right Section">
                  <div className="bg-[#c2e66e] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I173:7166;2:4228" data-name="Button Picker">
                    <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I173:7166;2:4228;2:3326" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I173:7166;2:4228;2:3327">
                        Last 4 Days
                      </p>
                    </div>
                    <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I173:7166;2:4228;2:3328" data-name="Icon">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I173:7166;2:4228;2:3329" data-name="Icon/CaretDown">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-h-px relative rounded-[16px] w-full" data-node-id="173:7167" data-name="Body">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="179:7681" data-name="Top Row">
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start not-italic relative rounded-[12px] shrink-0 whitespace-nowrap" data-node-id="179:7682" data-name="Info Total Item">
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="179:7684" data-name="Current Weight">
                      <p className="font-['Poppins:SemiBold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="179:7685">
                        450
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="179:7686">
                        kcal left
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="179:7683">
                      Calorie Goal: 2,000 kcal
                    </p>
                  </div>
                  <div className="flex flex-row items-center self-stretch" data-node-id="173:7314">
                    <div className="content-stretch flex flex-col gap-[6px] h-full items-start pr-[8px] relative shrink-0" data-name="Legends">
                      <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="173:7318" data-name="Item Category">
                        <div className="bg-[#ffcb65] relative rounded-[2px] shrink-0 size-[6px]" data-node-id="173:7319" data-name="Color Category" />
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="173:7320">
                          Consumed
                        </p>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="173:7315" data-name="Item Category">
                        <div className="bg-[#ffa257] relative rounded-[2px] shrink-0 size-[6px]" data-node-id="173:7316" data-name="Color Category" />
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="173:7317">
                          Burned
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] items-center min-h-px relative w-full" data-node-id="179:7688" data-name="Body">
                  <div className="content-stretch flex flex-col gap-[8px] h-full items-start pb-[4px] relative rounded-[6px] shrink-0" data-node-id="179:7689" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px relative" data-node-id="I179:7689;2:4011" data-name="Lines">
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I179:7689;2:4012" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I179:7689;2:4013">
                          2000
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I179:7689;2:4014" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I179:7689;2:4015">
                          1500
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I179:7689;2:4016" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I179:7689;2:4017">
                          1000
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I179:7689;2:4018" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I179:7689;2:4019">
                          500
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I179:7689;2:4020" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I179:7689;2:4021">
                          0
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0 w-[19px]" data-node-id="I179:7689;2:4022" data-name="Row" />
                  </div>
                  <ChartColumn className="content-stretch flex flex-col gap-[8px] h-full items-center pb-[4px] relative rounded-[6px] shrink-0 w-[8px]" label="" type="Default" />
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="179:7690" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I179:7690;2:4098" data-name="Lines">
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7690;2:4099" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7690;2:4101" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7690;2:4103" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7690;2:4105" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7690;2:4107" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="absolute content-stretch flex inset-[3.73%_15.56%] items-end justify-center" data-node-id="I179:7690;2:4109" data-name="Div Bar">
                        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[25px] relative" data-node-id="I179:7690;2:4110" data-name="Bar 1">
                          <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I179:7690;2:4111" data-name="Bar 1" />
                        </div>
                        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[32px] relative" data-node-id="I179:7690;2:4112" data-name="Bar 2">
                          <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I179:7690;2:4113" data-name="Bar 1" />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I179:7690;2:4114" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I179:7690;2:4115">
                        Mon
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="179:7691" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I179:7691;2:4098" data-name="Lines">
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7691;2:4099" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7691;2:4101" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7691;2:4103" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7691;2:4105" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7691;2:4107" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="absolute content-stretch flex inset-[3.73%_15.56%] isolate items-end justify-center" data-node-id="I179:7691;2:4109" data-name="Div Bar">
                        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px pt-[13px] relative z-[2]" data-node-id="I179:7691;2:4110" data-name="Bar 1">
                          <div className="bg-[#ffcb65] border-[#ffefd0] border-l-6 border-r-6 border-solid border-t-6 flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I179:7691;2:4111" data-name="Bar 1" />
                        </div>
                        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[21px] relative z-[1]" data-node-id="I179:7691;2:4112" data-name="Bar 2">
                          <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I179:7691;2:4113" data-name="Bar 1" />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I179:7691;2:4114" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I179:7691;2:4115">
                        Tue
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="179:7692" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I179:7692;2:4098" data-name="Lines">
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7692;2:4099" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7692;2:4101" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7692;2:4103" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7692;2:4105" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7692;2:4107" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="absolute content-stretch flex inset-[3.73%_15.56%] items-end justify-center" data-node-id="I179:7692;2:4109" data-name="Div Bar">
                        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[13px] relative" data-node-id="I179:7692;2:4110" data-name="Bar 1">
                          <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I179:7692;2:4111" data-name="Bar 1" />
                        </div>
                        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[24px] relative" data-node-id="I179:7692;2:4112" data-name="Bar 2">
                          <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I179:7692;2:4113" data-name="Bar 1" />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I179:7692;2:4114" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I179:7692;2:4115">
                        Wed
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="179:7693" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I179:7693;2:4098" data-name="Lines">
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7693;2:4099" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7693;2:4101" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7693;2:4103" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7693;2:4105" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="I179:7693;2:4107" data-name="Row">
                        <div className="absolute inset-[0_-1.11%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow} />
                        </div>
                      </div>
                      <div className="absolute content-stretch flex inset-[3.73%_15.56%] items-end justify-center" data-node-id="I179:7693;2:4109" data-name="Div Bar">
                        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[26px] relative" data-node-id="I179:7693;2:4110" data-name="Bar 1">
                          <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I179:7693;2:4111" data-name="Bar 1" />
                        </div>
                        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[64px] relative" data-node-id="I179:7693;2:4112" data-name="Bar 2">
                          <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I179:7693;2:4113" data-name="Bar 1" />
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I179:7693;2:4114" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I179:7693;2:4115">
                        Thu
                      </p>
                    </div>
                  </div>
                  <ChartColumn className="content-stretch flex flex-col gap-[8px] h-full items-center pb-[4px] relative rounded-[6px] shrink-0 w-[8px]" label="" type="Default" />
                  <div className="[word-break:break-word] absolute bg-[#f6f6f7] content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex flex-col gap-[4px] items-start left-[142px] not-italic px-[10px] py-[8px] rounded-br-[10px] rounded-tl-[10px] rounded-tr-[10px] top-[-2px] whitespace-nowrap" data-node-id="179:7698" data-name="Tooltip">
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" dir="auto" data-node-id="179:7699">
                      Consumed
                    </p>
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="179:7954" data-name="Info Amount">
                      <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#52545b] text-[12px]" dir="auto" data-node-id="179:7700">
                        1,755
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" dir="auto" data-node-id="179:7953">
                        kcal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="167:6762" data-name="Widget Sleep Statistics">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="167:6763" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-731px] relative shrink-0" data-node-id="I167:6763;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I167:6763;2:4223">
                    Sleep Statistics
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I167:6763;2:4225" data-name="Right Section">
                  <div className="bg-[#c2e66e] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I167:6763;2:4228" data-name="Button Picker">
                    <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I167:6763;2:4228;2:3326" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I167:6763;2:4228;2:3327">
                        Last 5 Days
                      </p>
                    </div>
                    <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I167:6763;2:4228;2:3328" data-name="Icon">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I167:6763;2:4228;2:3329" data-name="Icon/CaretDown">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[20px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="167:6764" data-name="Body">
                <div className="content-stretch flex items-start justify-between pr-[8px] relative shrink-0 w-full" data-node-id="167:6765" data-name="Info Weights">
                  <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="167:6766" data-name="Info Total Item">
                    <div className="bg-[#ffa257] h-[4px] relative rounded-[2px] shrink-0 w-[10px]" data-node-id="167:6995" />
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="167:6767">
                      Deep Sleep
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="167:7007" data-name="Info Total Item">
                    <div className="bg-[#ffcb65] h-[4px] relative rounded-[2px] shrink-0 w-[10px]" data-node-id="167:7008" />
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="167:7009">
                      Light Sleep
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="167:6999" data-name="Info Total Item">
                    <div className="bg-[#c2e66e] h-[4px] relative rounded-[2px] shrink-0 w-[10px]" data-node-id="167:7000" />
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="167:7001">
                      REM Phase
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="167:7003" data-name="Info Total Item">
                    <div className="bg-[#e1e1e2] h-[4px] relative rounded-[2px] shrink-0 w-[10px]" data-node-id="167:7004" />
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="167:7005">
                      Awake
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="167:6781" data-name="Chart">
                  <div className="content-stretch flex flex-col gap-[8px] items-start pb-[4px] relative rounded-[6px] shrink-0" data-node-id="168:7024" data-name="Chart Column">
                    <div className="content-stretch flex flex-col h-[177px] items-start justify-between relative shrink-0" data-node-id="168:7025" data-name="Lines">
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="168:7026" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="168:7027">
                          9:00 PM
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="168:7028" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="168:7029">
                          11:00 PM
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="168:7030" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="168:7031">
                          1:00 AM
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="168:7032" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="168:7033">
                          3:00 AM
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="168:7034" data-name="Row">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="168:7035">
                          5:00 AM
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col h-[26px] items-center justify-center pr-[8px] relative shrink-0 w-[19px]" data-node-id="168:7036" data-name="Row" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="168:7010" data-name="Chart Column">
                    <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="168:7011" data-name="Lines">
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="168:7012" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="168:7014" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="168:7016" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="168:7018" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="168:7020" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%-0.1px)] overflow-clip py-[6px] top-0" data-node-id="168:7039" data-name="Bars Stage">
                        <div className="bg-[#ffcb65] h-[20px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="168:7042" data-name="Light" />
                        <div className="bg-[#ffa257] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="168:7043" data-name="Deep" />
                        <div className="bg-[#c2e66e] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="168:7041" data-name="REM" />
                        <div className="bg-[#ffa257] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="168:7045" data-name="Deep" />
                        <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="168:7044" data-name="Light" />
                        <div className="bg-[#c2e66e] h-[8px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="168:7046" data-name="REM" />
                        <div className="bg-[#ffa257] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="179:7674" data-name="Deep" />
                        <div className="bg-[#ffcb65] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="168:7053" data-name="Light" />
                        <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="168:7040" data-name="Awake" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="168:7022" data-name="Row">
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="168:7038">
                        6h 45m
                      </p>
                      <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="168:7023">
                        Sun
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="172:7081" data-name="Chart Column">
                    <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="172:7082" data-name="Lines">
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7083" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7085" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7087" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7089" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7091" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%-0.1px)] overflow-clip py-[6px] top-0" data-node-id="172:7093" data-name="Bars Stage">
                        <div className="bg-[#e1e1e2] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7094" data-name="Awake" />
                        <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7095" data-name="Light" />
                        <div className="bg-[#c2e66e] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7096" data-name="REM" />
                        <div className="bg-[#ffa257] h-[13px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7098" data-name="Deep" />
                        <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7134" data-name="Light" />
                        <div className="bg-[#e1e1e2] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="179:7675" data-name="Awake" />
                        <div className="bg-[#ffcb65] h-[17px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="179:7676" data-name="Light" />
                        <div className="bg-[#ffa257] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7100" data-name="Deep" />
                        <div className="bg-[#c2e66e] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7099" data-name="REM" />
                        <div className="bg-[#ffcb65] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7101" data-name="Light" />
                        <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="172:7102" data-name="Awake" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="172:7103" data-name="Row">
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="172:7104">
                        7h 25m
                      </p>
                      <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="172:7105">
                        Mon
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="172:7055" data-name="Chart Column">
                    <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="172:7056" data-name="Lines">
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7057" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7059" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7061" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7063" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7065" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow1} />
                        </div>
                      </div>
                      <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%-0.1px)] overflow-clip py-[6px] top-0" data-node-id="172:7067" data-name="Bars Stage">
                        <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7069" data-name="Light" />
                        <div className="bg-[#ffa257] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7072" data-name="Deep" />
                        <div className="bg-[#c2e66e] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7070" data-name="REM" />
                        <div className="bg-[#ffcb65] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7071" data-name="Light" />
                        <div className="bg-[#e1e1e2] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="179:7677" data-name="Awake" />
                        <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="179:7679" data-name="Light" />
                        <div className="bg-[#ffa257] h-[24px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7074" data-name="Deep" />
                        <div className="bg-[#c2e66e] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7137" data-name="REM" />
                        <div className="bg-[#ffcb65] h-[20px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7075" data-name="Light" />
                        <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="172:7076" data-name="Awake" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="172:7077" data-name="Row">
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="172:7078">
                        7h 55m
                      </p>
                      <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="172:7079">
                        Tue
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="172:7107" data-name="Chart Column">
                    <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="172:7108" data-name="Lines">
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7109" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7111" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7113" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7115" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="172:7117" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%-0.1px)] overflow-clip py-[6px] top-0" data-node-id="172:7119" data-name="Bars Stage">
                        <div className="bg-[#e1e1e2] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7120" data-name="Awake" />
                        <div className="bg-[#ffcb65] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7121" data-name="Light" />
                        <div className="bg-[#c2e66e] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7122" data-name="REM" />
                        <div className="bg-[#ffcb65] h-[22px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7123" data-name="Light" />
                        <div className="bg-[#ffa257] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7124" data-name="Deep" />
                        <div className="bg-[#c2e66e] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7125" data-name="REM" />
                        <div className="bg-[#ffa257] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7126" data-name="Deep" />
                        <div className="bg-[#ffcb65] h-[20px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="172:7127" data-name="Light" />
                        <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="172:7128" data-name="Awake" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="172:7129" data-name="Row">
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="172:7130">
                        6h 0m
                      </p>
                      <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="172:7131">
                        Wed
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="173:7139" data-name="Chart Column">
                    <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="173:7140" data-name="Lines">
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="173:7141" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="173:7143" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="173:7145" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="173:7147" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="h-[13px] relative shrink-0 w-full" data-node-id="173:7149" data-name="Row">
                        <div className="absolute inset-[0_-0.86%]">
                          <img alt="" className="block max-w-none size-full" src={imgRow2} />
                        </div>
                      </div>
                      <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%-0.1px)] overflow-clip py-[6px] top-0" data-node-id="173:7151" data-name="Bars Stage">
                        <div className="bg-[#ffcb65] h-[24px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7153" data-name="Light" />
                        <div className="bg-[#ffa257] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7156" data-name="Deep" />
                        <div className="bg-[#e1e1e2] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7152" data-name="Awake" />
                        <div className="bg-[#c2e66e] h-[4px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7154" data-name="REM" />
                        <div className="bg-[#ffcb65] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7155" data-name="Light" />
                        <div className="bg-[#c2e66e] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7157" data-name="REM" />
                        <div className="bg-[#ffcb65] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7159" data-name="Light" />
                        <div className="bg-[#ffa257] h-[22px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7158" data-name="Deep" />
                        <div className="bg-[#ffcb65] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="173:7164" data-name="Light" />
                        <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="173:7160" data-name="Awake" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="173:7161" data-name="Row">
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="173:7162">
                        6h 50m
                      </p>
                      <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="173:7163">
                        Thu
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="173:7403" data-name="Widget Hydration">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="173:7404" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-731px] relative shrink-0" data-node-id="I173:7404;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I173:7404;2:4223">
                    Hydration
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I173:7404;2:4225" data-name="Right Section">
                  <div className="bg-[#c2e66e] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I173:7404;2:4228" data-name="Button Picker">
                    <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I173:7404;2:4228;2:3326" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I173:7404;2:4228;2:3327">
                        This Week
                      </p>
                    </div>
                    <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I173:7404;2:4228;2:3328" data-name="Icon">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I173:7404;2:4228;2:3329" data-name="Icon/CaretDown">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-h-px relative rounded-[16px] w-full" data-node-id="182:8507" data-name="Body">
                <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-node-id="182:8508" data-name="Top Row">
                  <div className="content-stretch flex gap-[8px] items-center relative rounded-[12px] shrink-0" data-node-id="182:8509" data-name="Info Detail">
                    <div className="h-[38px] relative shrink-0 w-[34px]" data-node-id="186:5372" data-name="Left Side">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLeftSide} />
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="184:5576" data-name="Info">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center whitespace-nowrap" data-node-id="182:8513">
                        Hydration Level
                      </p>
                      <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="182:8510" data-name="Value">
                        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="182:8511">
                          Normal
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-center relative rounded-[12px] shrink-0" data-node-id="182:8646" data-name="Info Detail">
                    <div className="h-[38px] relative shrink-0 w-[34px]" data-node-id="186:5366" data-name="Left Side">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLeftSide1} />
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="184:5577" data-name="Info">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center whitespace-nowrap" data-node-id="182:8647">
                        Intake
                      </p>
                      <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="182:8648" data-name="Value">
                        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="182:8649">
                          2.0 L
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] items-center min-h-px relative w-full" data-node-id="182:8521" data-name="Body">
                  <div className="absolute inset-[0_0_18.82%_0]" data-node-id="184:5544" data-name="Chart Area">
                    <div className="absolute inset-[0_-2.53%]">
                      <img alt="" className="block max-w-none size-full" src={imgChartArea} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="182:8524" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I182:8524;2:4072" data-name="Lines">
                      <div className="bg-[rgba(238,238,239,0.64)] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I182:8524;2:4073" data-name="Div Bar">
                        <div className="content-stretch flex flex-col items-center justify-end pt-[20px] relative shrink-0 w-full" data-node-id="I182:8524;2:4074" data-name="Amount">
                          <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I182:8524;2:4075">
                            <p className="leading-[1.35]" dir="auto">
                              100%
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I182:8524;2:4076" data-name="Bar 1" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I182:8524;2:4077" data-name="Row">
                      <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I182:8524;182:8758">
                        <p className="leading-[1.35]" dir="auto">
                          2.0 L
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I182:8524;2:4078">
                        Mon
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="182:8525" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I182:8525;2:4072" data-name="Lines">
                      <div className="bg-[rgba(238,238,239,0.64)] content-stretch flex flex-[1_0_0] flex-col gap-[4px] isolate items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I182:8525;2:4073" data-name="Div Bar">
                        <div className="content-stretch flex flex-col items-center justify-end pt-[30px] relative shrink-0 w-full z-[2]" data-node-id="I182:8525;2:4074" data-name="Amount">
                          <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I182:8525;2:4075">
                            <p className="leading-[1.35]" dir="auto">
                              90%
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full z-[1]" data-node-id="I182:8525;2:4076" data-name="Bar 1" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I182:8525;2:4077" data-name="Row">
                      <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I182:8525;182:8758">
                        <p className="leading-[1.35]" dir="auto">
                          1.8 L
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I182:8525;2:4078">
                        Tue
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="182:8526" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I182:8526;2:4072" data-name="Lines">
                      <div className="bg-[rgba(238,238,239,0.64)] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I182:8526;2:4073" data-name="Div Bar">
                        <div className="content-stretch flex flex-col items-center justify-end pt-[10px] relative shrink-0 w-full" data-node-id="I182:8526;2:4074" data-name="Amount">
                          <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I182:8526;2:4075">
                            <p className="leading-[1.35]" dir="auto">
                              110%
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I182:8526;2:4076" data-name="Bar 1" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I182:8526;2:4077" data-name="Row">
                      <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I182:8526;182:8758">
                        <p className="leading-[1.35]" dir="auto">
                          2.2 L
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I182:8526;2:4078">
                        Wed
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="182:8527" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I182:8527;2:4072" data-name="Lines">
                      <div className="bg-[rgba(238,238,239,0.64)] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I182:8527;2:4073" data-name="Div Bar">
                        <div className="content-stretch flex flex-col items-center justify-end pt-[40px] relative shrink-0 w-full" data-node-id="I182:8527;2:4074" data-name="Amount">
                          <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I182:8527;2:4075">
                            <p className="leading-[1.35]" dir="auto">
                              80%
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I182:8527;2:4076" data-name="Bar 1" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I182:8527;2:4077" data-name="Row">
                      <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I182:8527;182:8758">
                        <p className="leading-[1.35]" dir="auto">
                          1.6 L
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I182:8527;2:4078">
                        Thu
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="182:8652" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I182:8652;2:4072" data-name="Lines">
                      <div className="bg-[rgba(238,238,239,0.64)] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I182:8652;2:4073" data-name="Div Bar">
                        <div className="content-stretch flex flex-col items-center justify-end pt-[20px] relative shrink-0 w-full" data-node-id="I182:8652;2:4074" data-name="Amount">
                          <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I182:8652;2:4075">
                            <p className="leading-[1.35]" dir="auto">
                              100%
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I182:8652;2:4076" data-name="Bar 1" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I182:8652;2:4077" data-name="Row">
                      <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I182:8652;182:8758">
                        <p className="leading-[1.35]" dir="auto">
                          2.0 L
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I182:8652;2:4078">
                        Fri
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="182:8671" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I182:8671;2:4072" data-name="Lines">
                      <div className="bg-[rgba(238,238,239,0.64)] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I182:8671;2:4073" data-name="Div Bar">
                        <div className="content-stretch flex flex-col items-center justify-end pt-[25px] relative shrink-0 w-full" data-node-id="I182:8671;2:4074" data-name="Amount">
                          <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I182:8671;2:4075">
                            <p className="leading-[1.35]" dir="auto">
                              95%
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I182:8671;2:4076" data-name="Bar 1" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I182:8671;2:4077" data-name="Row">
                      <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I182:8671;182:8758">
                        <p className="leading-[1.35]" dir="auto">
                          1.9 L
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I182:8671;2:4078">
                        Sat
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="182:8672" data-name="Chart Column">
                    <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I182:8672;2:4072" data-name="Lines">
                      <div className="bg-[rgba(238,238,239,0.64)] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I182:8672;2:4073" data-name="Div Bar">
                        <div className="content-stretch flex flex-col items-center justify-end pt-[15px] relative shrink-0 w-full" data-node-id="I182:8672;2:4074" data-name="Amount">
                          <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I182:8672;2:4075">
                            <p className="leading-[1.35]" dir="auto">
                              105%
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I182:8672;2:4076" data-name="Bar 1" />
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I182:8672;2:4077" data-name="Row">
                      <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I182:8672;182:8758">
                        <p className="leading-[1.35]" dir="auto">
                          2.1 L
                        </p>
                      </div>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I182:8672;2:4078">
                        Sun
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="105:2795" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="105:2796" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="105:2797">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="105:2798" data-name="Links">
              <p className="relative shrink-0" data-node-id="105:2799">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="105:2800">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="105:2801">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="105:2802" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2803" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2804" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2805" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2806" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2807" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
