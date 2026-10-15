import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaRecipeDetail } from '../FigmaHealthyMenu';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/RecipeDetails";
const imgIconSpecialFire = `${assetPathPrefix}/36850.svg`;
const imgLine = `${assetPathPrefix}/9d354.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/2ee85.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/bf5d8.svg`;
const imgIconCaretDown = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconArrowLeft = `${assetPathPrefix}/980a2.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/2b979.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgIconClock = `${assetPathPrefix}/1f647.svg`;
const imgIconSpecialKnife = `${assetPathPrefix}/246bc.svg`;
const imgIconSpecialCookingPot = `${assetPathPrefix}/33cab.svg`;
const imgIconChartBar = `${assetPathPrefix}/a1d03.svg`;
const imgIconSpecialListNumbers = `${assetPathPrefix}/7a7e7.svg`;
const imgIconNavHeartbeat1 = `${assetPathPrefix}/5a044.svg`;
const imgDivider = `${assetPathPrefix}/c1f05.svg`;
const imgStar = `${assetPathPrefix}/c88d0.svg`;
const imgStar1 = `${assetPathPrefix}/71b23.svg`;
const imgStar2 = `${assetPathPrefix}/d98b5.svg`;
const imgDot = `${assetPathPrefix}/f0f58.svg`;
const imgIconMinus = `${assetPathPrefix}/4425e.svg`;
const imgIconPlus = `${assetPathPrefix}/2ac73.svg`;
const imgDivider1 = `${assetPathPrefix}/aeaa7.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/bb986.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/a4b28.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/871ca.svg`;
const imgIconDotsThree = `${assetPathPrefix}/1fb9c.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

function ItemDetailMealValueRecipeDetails({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#c2e66e] content-stretch flex flex-col gap-[16px] items-center p-[12px] relative rounded-[16px] w-[64.75px]"} data-node-id="251:6518" data-name="Item Detail Meal Value - Recipe Details">
      <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="251:6510" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="251:6511" data-name="Icon/Special/Fire">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
        </div>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="251:6512" data-name="Info">
        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="251:6513">
          Calorías
        </p>
        <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="251:6514" data-name="Amount">
          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="251:6515">
            450
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[10px]" data-node-id="251:6516">
            kcal
          </p>
        </div>
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

export default function Component13RecipeDetailsDesktop() {
  const patientName = useFigmaPatientName();
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="84:3145" data-name="13. Recipe Details (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="84:3146" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I84:3146;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I84:3146;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I84:3146;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4501;2:3296">
                Calendario
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4505;2:3296">
                Mensajes
              </p>
            </div>
            <FigmaPatientUnreadBadge variant="nav" className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" nodeId="I84:3146;2:4505;2:3297" />
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4502;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:3146;2:4502;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4502;2:3292">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4503;2:3296">
                Plan de comidas
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I84:3146;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I84:3146;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4504;2:3296">
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4506;2:3296">
                Progreso
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4509;2:3296">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;12:1059;2:3296">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I84:3146;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I84:3146;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I84:3146;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I84:3146;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I84:3146;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I84:3146;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4518;2:3335">
                Enviar mensaje
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4519;2:3296">
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="84:3147" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="84:3148" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I84:3148;2:4472" data-name="Title">
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I84:3148;2:4473" data-name="Back Button">
              <div className="relative shrink-0 size-[16px]" data-node-id="I84:3148;2:4474" data-name="Icon/ArrowLeft">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I84:3148;2:4475">
                Volver al menú
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] min-w-full not-italic relative shrink-0 text-[#272932] text-[22px] w-[min-content]" data-node-id="I84:3148;2:4476">
              Detalle de receta
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I84:3148;2:4477" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:3148;2:4478" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:3148;2:4478;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:3148;2:4479" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:3148;2:4479;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I84:3148;2:4479;2:3571" />
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I84:3148;33:1604" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I84:3148;33:1605" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I84:3148;33:1605;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I84:3148;33:1605;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I84:3148;33:1606" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I84:3148;33:1607">{patientName}</p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I84:3148;33:1608">
                  Miembro
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I84:3148;33:1609">
                <div className="bg-[#f9f4f2] content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I84:3148;33:1609;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-start min-h-[842px] relative shrink-0 w-full" data-node-id="84:3149" data-name="Body"><FigmaRecipeDetail variant="desktop" /></div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="84:3150" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="84:3151" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="84:3152">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="84:3153" data-name="Links">
              <p className="relative shrink-0" data-node-id="84:3154">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="84:3155">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="84:3156">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="84:3157" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3158" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3159" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3160" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3161" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3162" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
