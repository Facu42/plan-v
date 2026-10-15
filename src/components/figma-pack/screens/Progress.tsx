import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaProgressBodyMap, FigmaProgressWeight, FigmaProgressPhotos, FigmaProgressMeasurements, FigmaProgressCalories, FigmaProgressSleep, FigmaProgressHydration } from '../FigmaProgress';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/Progress";
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

export default function Component25ProgressDesktop() {
  const patientName = useFigmaPatientName();
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="105:2790" data-name="25. Progress (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="105:2791" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I105:2791;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I105:2791;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I105:2791;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4501;2:3296">
                Calendario
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4505;2:3296">
                Mensajes
              </p>
            </div>
            <FigmaPatientUnreadBadge variant="nav" className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" nodeId="I105:2791;2:4505;2:3297" />
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4502;2:3296">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4503;2:3296">
                Plan de comidas
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
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4506;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I105:2791;2:4506;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4506;2:3292">
                Progreso
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4509;2:3296">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2791;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2791;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2791;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2791;12:1059;2:3296">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I105:2791;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I105:2791;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I105:2791;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I105:2791;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:2791;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:2791;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I105:2791;2:4518;2:3335">
                Enviar mensaje
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
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="105:2792" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between relative shrink-0 w-full" data-node-id="105:2793" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I105:2793;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I105:2793;2:4460">
              Progreso
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
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I105:2793;2:4464;2:3571" />
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I105:2793;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I105:2793;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I105:2793;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I105:2793;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I105:2793;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I105:2793;2:4468">{patientName}</p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I105:2793;2:4469">
                  Miembro
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
              <div className="flex-[1_0_0] h-[674px] min-w-px overflow-clip relative" data-node-id="161:6761" data-name="Image Area"><FigmaProgressBodyMap variant="desktop" /></div>
              <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[275px]" data-node-id="182:8504" data-name="Side Section">
                <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="159:6143" data-name="Widget Weight Tracking"><FigmaProgressWeight /></div>
                <div className="content-stretch flex flex-col gap-[20px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="161:6503" data-name="Widget Progress Photos"><FigmaProgressPhotos /></div>
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start pb-[8px] pt-[16px] px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="182:8021" data-name="Section Table Body Measurement"><FigmaProgressMeasurements /></div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[374px]" data-node-id="182:8651">
            <div className="bg-white content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="173:7165" data-name="Widget Calories Activities"><FigmaProgressCalories /></div>
            <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="167:6762" data-name="Widget Sleep Statistics"><FigmaProgressSleep /></div>
            <div className="bg-white content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="173:7403" data-name="Widget Hydration"><FigmaProgressHydration /></div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="105:2795" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="105:2796" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="105:2797">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="105:2798" data-name="Links">
              <p className="relative shrink-0" data-node-id="105:2799">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="105:2800">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="105:2801">
                Contacto
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
