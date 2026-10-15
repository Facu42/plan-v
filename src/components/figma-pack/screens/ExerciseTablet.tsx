import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaExercisePagination, FigmaExerciseTable, FigmaExerciseToolbar } from '../FigmaExercise';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/ExerciseTablet";
const imgIconSort = `${assetPathPrefix}/5ef2f.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/30242.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/f4cb9.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/4a643.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/d074c.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/f8978.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/80149.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/56b99.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/68717.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/96a22.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/e9231.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/57698.svg`;
const imgIconBell = `${assetPathPrefix}/4a0c9.svg`;
const imgIconMagnifyingGlass1 = `${assetPathPrefix}/843cb.svg`;
const imgIconCaretDown = `${assetPathPrefix}/8e5ed.svg`;
const imgIconPlus = `${assetPathPrefix}/6e435.svg`;
const imgIconSpecialPersonSimpleSquat = `${assetPathPrefix}/28a78.svg`;
const imgIconSpecialPersonSimpleDeadlifts = `${assetPathPrefix}/c4ef9.svg`;
const imgIconSpecialPersonSimpleBenchPress = `${assetPathPrefix}/af529.svg`;
const imgIconSpecialPersonSimplePullUps = `${assetPathPrefix}/21cfd.svg`;
const imgIconSpecialPersonSimplePlank = `${assetPathPrefix}/c909d.svg`;
const imgIconNavPersonSimpleRun = `${assetPathPrefix}/d724b.svg`;
const imgIconSpecialPersonSimpleLunges = `${assetPathPrefix}/92c0e.svg`;
const imgIconSpecialBarbell = `${assetPathPrefix}/5b565.svg`;
const imgIconSpecialPersonSimpleBicepCurls = `${assetPathPrefix}/7f465.svg`;
const imgPersonSimpleBike = `${assetPathPrefix}/e22bc.svg`;
const imgIconSpecialPersonSimpleMountClimbers = `${assetPathPrefix}/916ca.svg`;
const imgIconSpecialPersonYoga = `${assetPathPrefix}/61936.svg`;
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
  device?: "Tablet";
  type?: "Head";
};

function TableRowExercises({ className, device = "Tablet", type = "Head" }: TableRowExercisesProps) {
  return (
    <div className={className || "bg-white content-stretch flex items-center justify-between px-[8px] py-[16px] relative w-[652px]"} data-node-id="501:21655">
      <div className="content-stretch flex items-start relative shrink-0 w-[144px]" data-node-id="501:21656" data-name="Cell-Name">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="501:21657">
          Ejercicio
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="501:21658" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="501:21659" data-name="Cell-Sets">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="501:21660">
          Series
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="501:21661" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[50px]" data-node-id="501:21662" data-name="Cell-Reps">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="501:21663">
          Repeticiones
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="501:21664" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[42px]" data-node-id="501:21665" data-name="Cell-Rest">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="501:21666">
          Descanso
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="501:21667" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[72px]" data-node-id="501:21668" data-name="Cell-Weight">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="501:21669">
          Peso
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="501:21670" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[58px]" data-node-id="501:21671" data-name="Cell-Calories">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="501:21672">
          Calorías
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="501:21673" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="501:21674" data-name="Cell-Status">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="501:21675">
          Estado
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="501:21676" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
    </div>
  );
}

export default function Component29ExerciseTablet() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="498:20328" data-name="29. Exercise (Tablet)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[28px] relative self-stretch shrink-0" data-node-id="498:20329" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[6px] relative shrink-0" data-node-id="I498:20329;408:17341" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I498:20329;408:17342" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative" data-node-id="I498:20329;408:17343" data-name="Menu Nav">
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17344" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17344;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17345" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17345;408:17513" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17346" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17346;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17347" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17347;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17348" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17348;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17349" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17349;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17350" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17350;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17353" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17353;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17354" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17354;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I498:20329;408:17363" data-name="Button Nav">
          <div className="relative shrink-0 size-[18px]" data-node-id="I498:20329;408:17363;408:17518" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px overflow-clip p-[28px] relative self-stretch" data-node-id="498:20330" data-name="Content">
        <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="498:20331" data-name="Header">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px py-[2px] relative" data-node-id="I498:20331;418:13843" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="I498:20331;418:13844">
              Ejercicio
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I498:20331;418:13846" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I498:20331;418:13854" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I498:20331;418:13854;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I498:20331;418:13855" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I498:20331;418:13855;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I498:20331;418:13855;2:3559" />
            </div>
            <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I498:20331;418:13857" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I498:20331;418:13857;2:3114" data-name="User Image/12">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I498:20331;418:13857;2:3114;2:3159" data-name="Place Image Here" />
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start min-h-[888px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:21276" data-name="Body">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="498:21277" data-name="Header-Section"><FigmaExerciseToolbar variant="tablet" /></div>
          <div className="bg-white content-stretch flex flex-col items-start overflow-clip p-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:21278" data-name="Table"><FigmaExerciseTable /></div>
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="498:21292" data-name="Footer"><FigmaExercisePagination /></div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="498:20735" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="498:20736" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="498:20737">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="498:20738" data-name="Links">
              <p className="relative shrink-0" data-node-id="498:20739">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="498:20740">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="498:20741">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="498:20742" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="498:20743" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:20744" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:20745" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:20746" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:20747" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
