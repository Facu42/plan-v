import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import { useFigmaMealPlan } from '../FigmaMealPlan';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/MealPlan";
const imgIconCaretDown = `${assetPathPrefix}/8e5ed.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/2be86.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/ac3fd.svg`;
const imgIconCaretUp = `${assetPathPrefix}/49e1d.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/6e80c.svg`;
const imgIconCaretRight = `${assetPathPrefix}/27dfe.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconFunnel = `${assetPathPrefix}/e3085.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type TableRowMealPlanProps = {
  className?: string;
  size?: "Default";
  type?: "Head";
};

function TableRowMealPlan({ className, size = "Default", type = "Head" }: TableRowMealPlanProps) {
  return (
    <div className={className || "content-stretch flex gap-[16px] h-[40px] items-center relative w-[1172px]"} data-node-id="100:1660">
      <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start px-[16px] py-[5px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="100:1616" data-name="Cell-X-Picker">
        <div className="content-stretch flex items-center justify-between px-[2px] py-[6px] relative shrink-0 w-full" data-node-id="100:1617" data-name="Button Picker">
          <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I100:1617;2:3534" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I100:1617;2:3535">
              Semana actual
            </p>
          </div>
          <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I100:1617;2:3536" data-name="Icon">
            <div className="relative shrink-0 size-[14px]" data-node-id="I100:1617;2:3537" data-name="Icon/CaretDown">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative rounded-[14px]" data-node-id="100:1618" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="100:1619">
          Desayuno
        </p>
      </div>
      <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative rounded-[14px]" data-node-id="100:1620" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="100:1621">
          Almuerzo
        </p>
      </div>
      <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative rounded-[14px]" data-node-id="100:1622" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="100:1623">
          Colación
        </p>
      </div>
      <div className="bg-[#e1e1e2] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative rounded-[14px]" data-node-id="100:1624" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="100:1625">
          Cena
        </p>
      </div>
    </div>
  );
}

export default function Component16MealPlanDesktop() {
  const patientName = useFigmaPatientName();
  const plan = useFigmaMealPlan();
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="84:2994" data-name="16. Meal Plan (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="84:2995" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I84:2995;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I84:2995;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I84:2995;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4501;2:3296">
                Calendario
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4505;2:3296">
                Mensajes
              </p>
            </div>
            <FigmaPatientUnreadBadge variant="nav" className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" nodeId="I84:2995;2:4505;2:3297" />
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4502;2:3296">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[2px] items-start justify-center p-[2px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4503" data-name="Button Nav">
            <div className="content-stretch flex gap-[12px] items-center pb-[10px] pl-[14px] pr-[8px] pt-[8px] relative shrink-0 w-full" data-node-id="I84:2995;2:4503;302:7527" data-name="Menu">
              <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4503;302:7523" data-name="Icon/Nav/SquaresFour">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
              </div>
              <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4503;302:7524" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4503;302:7525">
                  Plan de comidas
                </p>
              </div>
              <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I84:2995;2:4503;302:7558" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I84:2995;2:4503;302:7559" data-name="Icon/CaretUp">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                </div>
              </div>
            </div>
            <div className="bg-[#c2e66e] content-stretch flex items-center pl-[56px] pr-[8px] py-[13px] relative rounded-[12px] shrink-0 w-full" data-node-id="I84:2995;2:4503;302:7539" data-name="SubMenu">
              <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:2995;2:4503;302:7541" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4503;302:7542">
                  Plan de comidas
                </p>
              </div>
            </div>
            <div className="content-stretch flex items-center pl-[56px] pr-[8px] py-[13px] relative rounded-[12px] shrink-0 w-full" data-node-id="I84:2995;2:4503;302:7544" data-name="SubMenu">
              <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:2995;2:4503;302:7545" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4503;302:7546">
                  Lista de compras
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4504;2:3296">
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4506;2:3296">
                Progreso
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4509;2:3296">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;12:1059;2:3296">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I84:2995;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I84:2995;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I84:2995;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I84:2995;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I84:2995;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I84:2995;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4518;2:3335">
                Enviar mensaje
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4519;2:3296">
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="84:2996" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="84:2997" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I84:2997;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I84:2997;2:4460">
              Plan de comidas
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I84:2997;2:4462" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:2997;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:2997;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I84:2997;2:4464;2:3571" />
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I84:2997;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I84:2997;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I84:2997;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I84:2997;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I84:2997;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I84:2997;2:4468">{patientName}</p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I84:2997;2:4469">
                  Miembro
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I84:2997;2:4470">
                <div className="bg-[#f9f4f2] content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I84:2997;2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[28px] items-start min-h-[842px] relative shrink-0 w-full" data-node-id="84:2998" data-name="Body">
          <div className="bg-[#f9f4f2] content-stretch flex items-center justify-between p-[12px] relative rounded-[14px] shrink-0 w-full" data-node-id="89:3810" data-name="Header-Section">
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-node-id="89:3853" data-name="Left Section">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="89:3887" data-name="Buttons">
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="89:3846" data-name="Button Picker">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I89:3846;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                  </div>
                </div>
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="89:3878" data-name="Button Picker">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I89:3878;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[4px] h-[18px] items-center relative shrink-0" data-node-id="89:3811" data-name="Div Title">
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-center leading-[1.25] not-italic relative shrink-0 text-[14px] whitespace-nowrap" data-node-id="89:3886" data-name="Title">
                  <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="89:3812">{plan.month}</p>
                  <p className="font-['Poppins:Regular'] relative shrink-0 text-[#868f9b]" data-node-id="89:3813">{plan.year}</p>
                </div>
                <div className="content-stretch flex items-center relative shrink-0" data-node-id="89:3882" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="89:3883" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="89:3814" data-name="Right Section">
              <div className="bg-white content-stretch flex gap-[4px] items-center px-[8px] py-[6px] relative rounded-[8px] shrink-0 w-[223px]" data-node-id="89:3815" data-name="Input-search" role="button" tabIndex={0} onClick={plan.openSearch} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openSearch(); } }}>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I89:3815;2:3947" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I89:3815;2:3948" data-name="Icon/MagnifyingGlass">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                  </div>
                </div>
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I89:3815;2:3949" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I89:3815;2:3950">
                    Buscar
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex gap-[2px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="89:3817" data-name="Button Picker" role="button" tabIndex={0} onClick={plan.openFilter} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openFilter(); } }}>
                <div className="content-stretch flex items-center pr-[2px] py-[2px] relative shrink-0" data-node-id="I89:3817;2:3507" data-name="Icon Left">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I89:3817;2:3508" data-name="Icon/CalendarBlank">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFunnel} />
                  </div>
                </div>
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I89:3817;2:3509" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I89:3817;2:3510">
                    Filtrar
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I89:3817;2:3511" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I89:3817;2:3512" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="89:3823" data-name="Button CTA" role="button" tabIndex={0} onClick={plan.openShopping} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openShopping(); } }}>
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I89:3823;2:3331" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I89:3823;2:3332">
                    Lista de compras
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="373:10642" data-name="Table">
            <TableRowMealPlan className="content-stretch flex gap-[16px] h-[40px] items-center relative shrink-0 w-full" />
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10644" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10644;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10644;100:1663">{plan.days[0]?.day ?? ''}</p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10644;100:1664">{plan.days[0]?.date ?? ''}</p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10644;100:1675" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(0, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(0, 'Desayuno'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10644;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10644;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10644;100:1679">{plan.mealTitle(0, 'Desayuno')}</p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10644;100:1670" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(0, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(0, 'Almuerzo'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10644;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10644;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10644;100:1674">{plan.mealTitle(0, 'Almuerzo')}</p>
                </div>
              </div>
              <div className="bg-[#fff2e8] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10644;100:1681" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(0, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(0, 'Colación'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10644;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10644;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10644;100:1685">{plan.mealTitle(0, 'Colación')}</p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10644;100:1665" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(0, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(0, 'Cena'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10644;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10644;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10644;100:1669">{plan.mealTitle(0, 'Cena')}</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10645" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10645;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10645;100:1663">{plan.days[1]?.day ?? ''}</p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10645;100:1664">{plan.days[1]?.date ?? ''}</p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10645;100:1675" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(1, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(1, 'Desayuno'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10645;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10645;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10645;100:1679">{plan.mealTitle(1, 'Desayuno')}</p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10645;100:1670" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(1, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(1, 'Almuerzo'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10645;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10645;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10645;100:1674">{plan.mealTitle(1, 'Almuerzo')}</p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10645;100:1681" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(1, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(1, 'Colación'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10645;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10645;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10645;100:1685">{plan.mealTitle(1, 'Colación')}</p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10645;100:1665" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(1, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(1, 'Cena'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10645;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10645;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10645;100:1669">{plan.mealTitle(1, 'Cena')}</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10646" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10646;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10646;100:1663">{plan.days[2]?.day ?? ''}</p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10646;100:1664">{plan.days[2]?.date ?? ''}</p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10646;100:1675" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(2, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(2, 'Desayuno'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10646;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10646;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10646;100:1679">{plan.mealTitle(2, 'Desayuno')}</p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10646;100:1670" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(2, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(2, 'Almuerzo'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10646;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10646;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10646;100:1674">{plan.mealTitle(2, 'Almuerzo')}</p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10646;100:1681" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(2, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(2, 'Colación'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10646;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10646;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10646;100:1685">{plan.mealTitle(2, 'Colación')}</p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10646;100:1665" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(2, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(2, 'Cena'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10646;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10646;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10646;100:1669">{plan.mealTitle(2, 'Cena')}</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10647" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10647;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10647;100:1663">{plan.days[3]?.day ?? ''}</p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10647;100:1664">{plan.days[3]?.date ?? ''}</p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10647;100:1675" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(3, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(3, 'Desayuno'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10647;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10647;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10647;100:1679">{plan.mealTitle(3, 'Desayuno')}</p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10647;100:1670" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(3, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(3, 'Almuerzo'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10647;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10647;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10647;100:1674">{plan.mealTitle(3, 'Almuerzo')}</p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10647;100:1681" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(3, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(3, 'Colación'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10647;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10647;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10647;100:1685">{plan.mealTitle(3, 'Colación')}</p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10647;100:1665" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(3, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(3, 'Cena'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10647;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10647;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10647;100:1669">{plan.mealTitle(3, 'Cena')}</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10648" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10648;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10648;100:1663">{plan.days[4]?.day ?? ''}</p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10648;100:1664">{plan.days[4]?.date ?? ''}</p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10648;100:1675" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(4, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(4, 'Desayuno'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10648;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10648;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10648;100:1679">{plan.mealTitle(4, 'Desayuno')}</p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10648;100:1670" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(4, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(4, 'Almuerzo'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10648;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10648;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10648;100:1674">{plan.mealTitle(4, 'Almuerzo')}</p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10648;100:1681" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(4, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(4, 'Colación'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10648;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10648;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10648;100:1685">{plan.mealTitle(4, 'Colación')}</p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10648;100:1665" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(4, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(4, 'Cena'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10648;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10648;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10648;100:1669">{plan.mealTitle(4, 'Cena')}</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10649" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10649;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10649;100:1663">{plan.days[5]?.day ?? ''}</p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10649;100:1664">{plan.days[5]?.date ?? ''}</p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10649;100:1675" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(5, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(5, 'Desayuno'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10649;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10649;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10649;100:1679">{plan.mealTitle(5, 'Desayuno')}</p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10649;100:1670" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(5, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(5, 'Almuerzo'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10649;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10649;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10649;100:1674">{plan.mealTitle(5, 'Almuerzo')}</p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10649;100:1681" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(5, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(5, 'Colación'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10649;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10649;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10649;100:1685">{plan.mealTitle(5, 'Colación')}</p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10649;100:1665" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(5, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(5, 'Cena'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10649;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10649;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10649;100:1669">{plan.mealTitle(5, 'Cena')}</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10650" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10650;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10650;100:1663">{plan.days[6]?.day ?? ''}</p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10650;100:1664">{plan.days[6]?.date ?? ''}</p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10650;100:1675" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(6, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(6, 'Desayuno'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10650;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10650;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10650;100:1679">{plan.mealTitle(6, 'Desayuno')}</p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10650;100:1670" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(6, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(6, 'Almuerzo'); } }}>
                <div className="bg-[#f9f4f2] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10650;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10650;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10650;100:1674">{plan.mealTitle(6, 'Almuerzo')}</p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10650;100:1681" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(6, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(6, 'Colación'); } }}>
                <div className="bg-[#f9f4f2] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10650;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10650;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10650;100:1685">{plan.mealTitle(6, 'Colación')}</p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10650;100:1665" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(6, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(6, 'Cena'); } }}>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10650;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10650;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10650;100:1669">{plan.mealTitle(6, 'Cena')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="84:2999" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="84:3000" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="84:3001">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="84:3002" data-name="Links">
              <p className="relative shrink-0" data-node-id="84:3003">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="84:3004">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="84:3005">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="84:3006" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3007" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3008" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3009" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3010" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3011" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
