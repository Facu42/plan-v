import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaProgressBodyMap, FigmaProgressWeight, FigmaProgressPhotos, FigmaProgressMeasurements, FigmaProgressCalories, FigmaProgressSleep, FigmaProgressHydration } from '../FigmaProgress';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/ProgressTablet";
const imgRow = `${assetPathPrefix}/00da0.svg`;
const imgIconCaretDown = `${assetPathPrefix}/601ba.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/30242.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/f4cb9.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/4a643.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/d074c.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/f8978.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/80149.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/2393f.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/7679f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/96a22.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/e9231.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/57698.svg`;
const imgIconBell = `${assetPathPrefix}/4a0c9.svg`;
const imgPoint = `${assetPathPrefix}/870cf.svg`;
const imgLine = `${assetPathPrefix}/f495a.svg`;
const imgLine1 = `${assetPathPrefix}/0c8c0.svg`;
const imgLine2 = `${assetPathPrefix}/42aba.svg`;
const imgLine3 = `${assetPathPrefix}/cb687.svg`;
const imgLine4 = `${assetPathPrefix}/759b1.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/16cfa.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgLineArea = `${assetPathPrefix}/476aa.svg`;
const imgLine5 = `${assetPathPrefix}/da0fd.svg`;
const imgPoint1 = `${assetPathPrefix}/445ce.svg`;
const imgRow1 = `${assetPathPrefix}/8c2c8.svg`;
const imgLeftSide = `${assetPathPrefix}/36709.svg`;
const imgLeftSide1 = `${assetPathPrefix}/595f3.svg`;
const imgChartArea = `${assetPathPrefix}/05440.svg`;
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
              Septiembre de 2028
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
            Pecho (cm)
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
            Brazo (cm)
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
            Cintura (cm)
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
            Cadera (cm)
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
            Muslo (cm)
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
          Julio de 2028
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

export default function Component26ProgressTablet() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="498:16416" data-name="26. Progress (Tablet)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[28px] relative self-stretch shrink-0" data-node-id="498:16417" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[6px] relative shrink-0" data-node-id="I498:16417;408:17341" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I498:16417;408:17342" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative" data-node-id="I498:16417;408:17343" data-name="Menu Nav">
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17344" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17344;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17345" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17345;408:17513" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17346" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17346;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17347" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17347;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17348" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17348;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17349" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17349;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17350" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17350;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17353" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17353;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17354" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17354;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:16417;408:17363" data-name="Button Nav">
          <div className="relative shrink-0 size-[18px]" data-node-id="I498:16417;408:17363;408:17518" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px overflow-clip p-[28px] relative self-stretch" data-node-id="498:16418" data-name="Content">
        <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="498:16419" data-name="Header">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px py-[2px] relative" data-node-id="I498:16419;418:13843" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="I498:16419;418:13844">
              Progreso
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I498:16419;418:13846" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I498:16419;418:13854" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I498:16419;418:13854;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I498:16419;418:13855" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I498:16419;418:13855;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I498:16419;418:13855;2:3559" />
            </div>
            <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I498:16419;418:13857" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I498:16419;418:13857;2:3114" data-name="User Image/12">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I498:16419;418:13857;2:3114;2:3159" data-name="Place Image Here" />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[20px] items-start overflow-clip p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:17108" data-name="Main Section">
          <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="498:17109" data-name="Main Info">
            <div className="flex-[1_0_0] h-[674px] min-w-px overflow-clip relative" data-node-id="498:17110" data-name="Image Area"><FigmaProgressBodyMap variant="tablet" /></div>
            <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[224px]" data-node-id="498:17216" data-name="Side Section">
              <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:17217" data-name="Widget Weight Tracking"><FigmaProgressWeight /></div>
              <div className="content-stretch flex flex-col gap-[20px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="498:17271" data-name="Widget Progress Photos"><FigmaProgressPhotos /></div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start pb-[8px] pt-[16px] px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:17281" data-name="Section Table Body Measurement"><FigmaProgressMeasurements /></div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:17722" data-name="Widget Calories Activities"><FigmaProgressCalories /></div>
        <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:17751" data-name="Widget Sleep Statistics"><FigmaProgressSleep /></div>
        <div className="bg-white content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:17911" data-name="Widget Hydration"><FigmaProgressHydration /></div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="498:16453" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="498:16454" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="498:16455">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="498:16456" data-name="Links">
              <p className="relative shrink-0" data-node-id="498:16457">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="498:16458">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="498:16459">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="498:16460" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="498:16461" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:16462" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:16463" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:16464" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:16465" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
