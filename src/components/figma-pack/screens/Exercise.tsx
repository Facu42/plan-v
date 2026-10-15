import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaExercisePagination, FigmaExerciseTable, FigmaExerciseToolbar } from '../FigmaExercise';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/Exercise";
const imgIconSort = `${assetPathPrefix}/5ef2f.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/22b1d.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/ac3fd.svg`;
const imgIconCaretDown = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/e3c39.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconCaretDown2 = `${assetPathPrefix}/8e5ed.svg`;
const imgIconPlus = `${assetPathPrefix}/6e435.svg`;
const imgIconSpecialPersonSimpleSquat = `${assetPathPrefix}/a4ab3.svg`;
const imgIconSpecialPersonSimpleDeadlifts = `${assetPathPrefix}/7a56a.svg`;
const imgIconSpecialPersonSimpleBenchPress = `${assetPathPrefix}/a719f.svg`;
const imgIconSpecialPersonSimplePullUps = `${assetPathPrefix}/bfb23.svg`;
const imgIconSpecialPersonSimplePlank = `${assetPathPrefix}/b7687.svg`;
const imgIconNavPersonSimpleRun = `${assetPathPrefix}/deeef.svg`;
const imgIconSpecialPersonSimpleLunges = `${assetPathPrefix}/e4162.svg`;
const imgIconSpecialBarbell = `${assetPathPrefix}/3a24d.svg`;
const imgIconSpecialPersonSimpleBicepCurls = `${assetPathPrefix}/f832d.svg`;
const imgPersonSimpleBike = `${assetPathPrefix}/0626b.svg`;
const imgIconSpecialPersonSimpleMountClimbers = `${assetPathPrefix}/5cc72.svg`;
const imgIconSpecialPersonYoga = `${assetPathPrefix}/39546.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/40729.svg`;
const imgIconCaretRight = `${assetPathPrefix}/27dfe.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type BadgeStatusExercisesProps = {
  className?: string;
  status?: "Completed" | "Not Started";
};

function BadgeStatusExercises({ className, status = "Completed" }: BadgeStatusExercisesProps) {
  const isNotStarted = status === "Not Started";
  return (
    <div className={className || `content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] ${isNotStarted ? "bg-[#e1e1e2]" : "bg-[#c2e66e]"}`} id={isNotStarted ? "node-105_5057" : "node-105_5055"}>
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" id={isNotStarted ? "node-105_5058" : "node-105_5056"}>
        {isNotStarted ? "Not Started" : "Completed"}
      </p>
    </div>
  );
}

type TableRowExercisesProps = {
  className?: string;
  device?: "Desktop";
  type?: "Head";
};

function TableRowExercises({ className, device = "Desktop", type = "Head" }: TableRowExercisesProps) {
  return (
    <div className={className || "bg-white content-stretch flex items-center justify-between px-[8px] py-[16px] relative w-[1166px]"} data-node-id="105:4647">
      <div className="content-stretch flex items-start relative shrink-0 w-[162px]" data-node-id="105:4648" data-name="Cell-Name">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4649">
          Ejercicio
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4650" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="105:4651" data-name="Cell-Sets">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4652">
          Series
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4653" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[88px]" data-node-id="105:4654" data-name="Cell-Reps">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4655">
          Repeticiones
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4656" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[70px]" data-node-id="105:4657" data-name="Cell-Rest">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4658">
          Descanso
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4659" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[90px]" data-node-id="105:4660" data-name="Cell-Weight">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4661">
          Peso
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4662" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[58px]" data-node-id="105:4663" data-name="Cell-Calories">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4664">
          Calorías
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4665" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="105:4666" data-name="Cell-Status">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4667">
          Estado
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4668" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
    </div>
  );
}

export default function Component28ExerciseDesktop() {
  const patientName = useFigmaPatientName();
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative size-full" data-node-id="105:2931" data-name="28. Exercise (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="105:2932" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I105:2932;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I105:2932;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I105:2932;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4501;2:3296">
                Calendario
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4505;2:3296">
                Mensajes
              </p>
            </div>
            <FigmaPatientUnreadBadge variant="nav" className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" nodeId="I105:2932;2:4505;2:3297" />
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4502;2:3296">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4503;2:3296">
                Plan de comidas
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:2932;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I105:2932;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4504;2:3296">
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4506;2:3296">
                Progreso
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4509;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I105:2932;2:4509;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4509;2:3292">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;12:1059;2:3296">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I105:2932;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I105:2932;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I105:2932;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I105:2932;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:2932;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:2932;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4518;2:3335">
                Enviar mensaje
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4519;2:3296">
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="105:2933" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="105:2934" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I105:2934;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I105:2934;2:4460">
              Ejercicios
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I105:2934;2:4462" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I105:2934;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I105:2934;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I105:2934;2:4464;2:3571" />
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I105:2934;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I105:2934;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I105:2934;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I105:2934;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I105:2934;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I105:2934;2:4468">{patientName}</p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I105:2934;2:4469">
                  Miembro
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I105:2934;2:4470">
                <div className="bg-white content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I105:2934;2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start min-h-[888px] relative rounded-[16px] shrink-0 w-full" data-node-id="105:4232" data-name="Body">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="105:4234" data-name="Header-Section"><FigmaExerciseToolbar variant="desktop" /></div>
          <div className="bg-white content-stretch flex flex-col items-start overflow-clip px-[16px] py-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="105:4235" data-name="Table"><FigmaExerciseTable /></div>
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="105:4249" data-name="Footer"><FigmaExercisePagination /></div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="105:2936" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="105:2937" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="105:2938">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="105:2939" data-name="Links">
              <p className="relative shrink-0" data-node-id="105:2940">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="105:2941">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="105:2942">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="105:2943" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2944" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2945" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2946" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2947" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2948" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
