import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaRecipeDetail } from '../FigmaHealthyMenu';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/RecipeDetailsTablet";
const imgLine = `${assetPathPrefix}/9d354.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/30242.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/f4cb9.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/4a643.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/4c8d1.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/f8978.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/80149.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/56b99.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/7679f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/96a22.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/e9231.svg`;
const imgIconArrowLeft = `${assetPathPrefix}/4a093.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/57698.svg`;
const imgIconBell = `${assetPathPrefix}/4a0c9.svg`;
const imgIconClock = `${assetPathPrefix}/1f647.svg`;
const imgIconSpecialKnife = `${assetPathPrefix}/246bc.svg`;
const imgIconSpecialCookingPot = `${assetPathPrefix}/33cab.svg`;
const imgIconChartBar = `${assetPathPrefix}/a1d03.svg`;
const imgIconSpecialListNumbers = `${assetPathPrefix}/7a7e7.svg`;
const imgIconNavHeartbeat1 = `${assetPathPrefix}/5a044.svg`;
const imgStar = `${assetPathPrefix}/c88d0.svg`;
const imgStar1 = `${assetPathPrefix}/71b23.svg`;
const imgStar2 = `${assetPathPrefix}/d98b5.svg`;
const imgIconMinus = `${assetPathPrefix}/4425e.svg`;
const imgIconPlus = `${assetPathPrefix}/2ac73.svg`;
const imgDivider = `${assetPathPrefix}/0227d.svg`;
const imgIconSpecialFire = `${assetPathPrefix}/36850.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/bb986.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/a4b28.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/871ca.svg`;
const imgIconDotsThree = `${assetPathPrefix}/1fb9c.svg`;
const imgDot = `${assetPathPrefix}/f0f58.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemListDirectionsProps = {
  className?: string;
  desc?: string;
  showLine?: boolean;
  step?: string;
  title?: string;
};

function ItemListDirections({ className, desc = "Crack the eggs into a mixing bowl, add a pinch of salt and pepper, and whisk until fully blended.", showLine = true, step = "1", title = "Prep the Ingredients" }: ItemListDirectionsProps) {
  return (
    <div className={className || "content-stretch flex gap-[12px] items-start relative w-[425px]"} data-node-id="256:7349" data-name="Item List Directions">
      <div className="content-stretch flex flex-col gap-[4px] items-center pb-[4px] relative self-stretch shrink-0" data-node-id="256:7342" data-name="Left Side">
        <div className="bg-[#ffcb65] content-stretch flex flex-col items-center justify-center p-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="256:7343" data-name="Number">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#52545b] text-[14px] text-center w-full" data-node-id="256:7344">
            {step}
          </p>
        </div>
        {showLine && (
          <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="256:7345" data-name="Line">
            <div className="absolute inset-[0_-0.5px]">
              <img alt="" className="block max-w-none size-full" src={imgLine} />
            </div>
          </div>
        )}
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic pb-[14px] pt-[6px] relative" data-node-id="256:7346" data-name="Content">
        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px] w-full" data-node-id="256:7347">
          {title}
        </p>
        <p className="font-['Poppins:Regular'] leading-[1.5] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="256:7348">
          {desc}
        </p>
      </div>
    </div>
  );
}

type ItemListSimpleProps = {
  className?: string;
  item?: string;
  number?: string;
  type?: "Circle" | "Square";
};

function ItemListSimple({ className, item = "Saucepan for cooking brown rice", number = "1", type = "Circle" }: ItemListSimpleProps) {
  const isSquare = type === "Square";
  return (
    <div className={className || "content-stretch flex gap-[12px] items-center min-h-[32px] relative w-[206.5px]"} id={isSquare ? "node-370_9863" : "node-256_7875"}>
      <div className={`content-stretch flex flex-col items-center justify-center p-[6px] relative shrink-0 ${isSquare ? "border border-[#8a8c90] border-solid rounded-[7px]" : "bg-[#ffa257] rounded-[20px]"}`} id={isSquare ? "node-370_9867" : "node-256_7872"} data-name="Number">
        {type === "Circle" && (
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] text-center w-[16px]" data-node-id="256:7873">
            {number}
          </p>
        )}
        {isSquare && (
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] text-center w-[16px]" data-node-id="370:9868">
            {number}
          </p>
        )}
      </div>
      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#52545b] text-[12px]" data-node-id="256:7874">
        {item}
      </p>
    </div>
  );
}

export default function Component14RecipeDetailsTablet() {
  return (
    <div className="bg-white content-stretch flex items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="453:12042" data-name="14. Recipe Details (Tablet)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[28px] relative self-stretch shrink-0" data-node-id="453:12043" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[6px] relative shrink-0" data-node-id="I453:12043;408:17341" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I453:12043;408:17342" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative" data-node-id="I453:12043;408:17343" data-name="Menu Nav">
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17344" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17344;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17345" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17345;408:17513" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17346" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17346;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17347" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17347;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17348" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17348;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17349" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17349;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17350" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17350;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17353" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17353;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17354" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17354;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I453:12043;408:17363" data-name="Button Nav">
          <div className="relative shrink-0 size-[18px]" data-node-id="I453:12043;408:17363;408:17518" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
        </div>
      </div>
      <div className="border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px overflow-clip p-[28px] relative self-stretch" data-node-id="453:12044" data-name="Content">
        <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="453:12045" data-name="Header">
          <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px py-[2px] relative" data-node-id="I453:12045;453:12764" data-name="Title">
            <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I453:12045;453:12781" data-name="Button Icon">
              <div className="relative shrink-0 size-[24px]" data-node-id="I453:12045;453:12781;2:3576" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] whitespace-nowrap" data-node-id="I453:12045;453:12765">
              Detalle de receta
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I453:12045;453:12767" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I453:12045;453:12768" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I453:12045;453:12768;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I453:12045;453:12769" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I453:12045;453:12769;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I453:12045;453:12769;2:3559" />
            </div>
            <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I453:12045;453:12770" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I453:12045;453:12770;2:3114" data-name="User Image/12">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I453:12045;453:12770;2:3114;2:3159" data-name="Place Image Here" />
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full" data-node-id="453:12050" data-name="Body"><FigmaRecipeDetail variant="tablet" /></div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="453:12137" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="453:12138" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="453:12139">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="453:12140" data-name="Links">
              <p className="relative shrink-0" data-node-id="453:12141">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="453:12142">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="453:12143">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="453:12144" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="453:12145" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="453:12146" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="453:12147" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="453:12148" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="453:12149" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
