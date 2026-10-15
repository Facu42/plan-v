import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaMenuAside, FigmaMenuFeatured, FigmaMenuFilterTrigger, FigmaMenuViewToggle, FigmaMenuFilters, FigmaMenuHeaderSearch, FigmaMenuList, FigmaMenuMobileSearch, FigmaMenuSort } from '../FigmaHealthyMenu';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/HealthyMenu";
const imgIconSpecialFire = `${assetPathPrefix}/36850.svg`;
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
const imgIconMagnifyingGlass = `${assetPathPrefix}/f08ac.svg`;
const imgIconFadersHorizontal = `${assetPathPrefix}/0639e.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgStar = `${assetPathPrefix}/c88d0.svg`;
const imgIconNavChartBar = `${assetPathPrefix}/de48f.svg`;
const imgIconSpecialHeartbeat = `${assetPathPrefix}/a0ae2.svg`;
const imgIconSpecialCookingPot = `${assetPathPrefix}/b3caf.svg`;
const imgIconSpecialListNumbers = `${assetPathPrefix}/b5ce2.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/bb986.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/a4b28.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/871ca.svg`;
const imgIconFunnel = `${assetPathPrefix}/e3085.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/8e5ed.svg`;
const imgIconGridFour = `${assetPathPrefix}/2a9e0.svg`;
const imgIconList = `${assetPathPrefix}/07fed.svg`;
const imgIconChartBar = `${assetPathPrefix}/f55c9.svg`;
const imgIconSpecialFire1 = `${assetPathPrefix}/26c9b.svg`;
const imgSeparator = `${assetPathPrefix}/3dda7.svg`;
const imgIconSpecialBread1 = `${assetPathPrefix}/bcc73.svg`;
const imgIconSpecialFish1 = `${assetPathPrefix}/f2e93.svg`;
const imgIconSpecialDrop1 = `${assetPathPrefix}/b6c86.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;
const imgIconBell = `${assetPathPrefix}/dfce3.svg`;
const imgIconPlus = `${assetPathPrefix}/84d5e.svg`;
const imgIconPlus1 = `${assetPathPrefix}/2ac73.svg`;
const imgDivider = `${assetPathPrefix}/31a56.svg`;
const imgIconSpecialFire2 = `${assetPathPrefix}/36936.svg`;
const imgIconSpecialBread2 = `${assetPathPrefix}/0c987.svg`;
const imgIconSpecialFish2 = `${assetPathPrefix}/d6aa7.svg`;
const imgIconSpecialDrop2 = `${assetPathPrefix}/188dc.svg`;

type ItemDetailMealValueProps = {
  className?: string;
  amount?: string;
  title?: string;
  unit?: string;
};

function ItemDetailMealValue({ className, amount = "450", title = "Calories", unit = "kcal" }: ItemDetailMealValueProps) {
  return (
    <div className={className || "bg-[#c2e66e] content-stretch flex gap-[8px] h-[69.5px] items-center p-[12px] relative rounded-[8px] w-[134px]"} data-node-id="233:8189" data-name="Item Detail Meal Value">
      <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="233:8180" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="233:8181" data-name="Icon/Special/Fire">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
        </div>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="233:8182" data-name="Info">
        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="233:8183">
          {title}
        </p>
        <div className="content-stretch flex gap-[2px] items-baseline relative shrink-0 text-[#272932]" data-node-id="233:8187" data-name="Amount">
          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[14px]" data-node-id="233:8184">
            {amount}
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="233:8186">
            {unit}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Component10HealthyMenuDesktop() {
  const patientName = useFigmaPatientName();
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative size-full" data-node-id="84:2716" data-name="10. Healthy Menu (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="84:2717" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I84:2717;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I84:2717;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I84:2717;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4501;2:3296">
                Calendario
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4505;2:3296">
                Mensajes
              </p>
            </div>
            <FigmaPatientUnreadBadge variant="nav" className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" nodeId="I84:2717;2:4505;2:3297" />
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4502;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:2717;2:4502;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4502;2:3292">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4503;2:3296">
                Plan de comidas
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I84:2717;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I84:2717;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4504;2:3296">
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4506;2:3296">
                Progreso
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4509;2:3296">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;12:1059;2:3296">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I84:2717;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I84:2717;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I84:2717;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I84:2717;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I84:2717;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I84:2717;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4518;2:3335">
                Enviar mensaje
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4519;2:3296">
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="226:5860" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="226:6301" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[200px]" data-node-id="226:6302" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="226:6303">
              Menú saludable
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0 w-[380px]" data-node-id="226:6305" data-name="Header Menu"><FigmaMenuHeaderSearch searchIcon={imgIconMagnifyingGlass} filterIcon={imgIconFadersHorizontal} /></div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start min-h-[842px] relative shrink-0 w-full" data-node-id="226:5862" data-name="Body">
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="232:8108" data-name="Widget Featured Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="232:7994" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-257px] relative shrink-0" data-node-id="I232:7994;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I232:7994;2:4223">
                  Menú destacado
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I232:7994;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I232:7994;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I232:7994;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="232:7934" data-name="Body"><FigmaMenuFeatured variant="desktop" /></div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="233:8220" data-name="Widget All Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="243:9399" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="243:9400" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="243:9401">
                  Todos los menús
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="243:9403" data-name="Right Section">
                <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="243:9406" data-name="Button Picker"><FigmaMenuFilterTrigger icon={imgIconFunnel} /></div>
                <div className="bg-[#f6f6f7] content-stretch flex items-start relative rounded-[10px] shrink-0" data-node-id="243:9405" data-name="Segmented Button"><FigmaMenuViewToggle gridIcon={imgIconGridFour} listIcon={imgIconList} /></div>
              </div>
            </div>
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="236:8627" data-name="Header-Section">
              <div className="content-stretch flex h-[30px] items-start relative shrink-0" data-node-id="236:8628" data-name="Left Section">
                <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-start relative rounded-[10px] shrink-0" data-node-id="236:8684" data-name="Segmented Button"><FigmaMenuFilters /></div>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="236:8630" data-name="Right Section">
                <div className="content-stretch flex gap-[10px] items-baseline relative shrink-0" data-node-id="236:8636" data-name="Sort by"><FigmaMenuSort /></div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="373:10388" data-name="List Menu"><FigmaMenuList variant="desktop" /></div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="226:5949" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="226:5950" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="226:5951">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="226:5952" data-name="Links">
              <p className="relative shrink-0" data-node-id="226:5953">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="226:5954">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="226:5955">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="226:5956" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5957" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5958" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5959" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5960" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5961" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[28px] items-start p-[28px] relative self-stretch shrink-0 w-[345px]" data-node-id="226:5962" data-name="Right Side">
        <div className="content-stretch flex items-center justify-between py-[5px] relative rounded-[28px] shrink-0 w-full" data-node-id="226:6332" data-name="Header Menu">
          <div className="content-stretch flex items-center relative shrink-0" data-node-id="226:6333" data-name="User Profile">
            <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="226:6334" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I226:6334;2:3098" data-name="User Image/12">
                <div className="absolute inset-0 rounded-[12px]" data-node-id="I226:6334;2:3098;2:3159" data-name="Place Image Here" />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic pl-[12px] pr-[8px] relative shrink-0 whitespace-nowrap" data-node-id="226:6335" data-name="User Name">
              <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#2a2b2a] text-[16px]" data-node-id="226:6336">{patientName}</p>
              <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="226:6337">
                Miembro
              </p>
            </div>
          </div>
          <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="226:6339" data-name="Button Icon">
            <div className="relative shrink-0 size-[22px]" data-node-id="I226:6339;2:3570" data-name="Icon/ChatTeardropDots">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
            </div>
            <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I226:6339;2:3571" />
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-center relative rounded-[16px] shrink-0 w-full" data-node-id="228:6432" data-name="Widget Popular Menu">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="228:6433" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-784px] relative shrink-0" data-node-id="I228:6433;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I228:6433;2:4223">
                Más preparaciones
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I228:6433;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I228:6433;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I228:6433;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="373:10583" data-name="List Menu"><FigmaMenuAside kind="popular" variant="desktop" /></div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-center relative rounded-[16px] shrink-0 w-full" data-node-id="228:7363" data-name="Widget Popular Menu">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="228:7364" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-784px] relative shrink-0" data-node-id="I228:7364;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I228:7364;2:4223">
                Otras recetas
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I228:7364;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I228:7364;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I228:7364;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="371:10271" data-name="List Menu"><FigmaMenuAside kind="recommended" variant="desktop" /></div>
        </div>
      </div>
    </div>
  );
}
