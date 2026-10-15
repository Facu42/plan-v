import { FigmaExercisePagination, FigmaExerciseTable, FigmaExerciseToolbar } from '../FigmaExercise';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/ExerciseMobile";
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconDotsThree = `${assetPathPrefix}/b443c.svg`;
const imgIconPlus = `${assetPathPrefix}/6e435.svg`;
const imgIconSort = `${assetPathPrefix}/5ef2f.svg`;
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

export default function Component30ExerciseMobile() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="501:22824" data-name="30. Exercise (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="501:22825" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I501:22825;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I501:22825;427:15210" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I501:22825;433:18077">
          Ejercicio
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I501:22825;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I501:22825;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[24px] items-start overflow-clip px-[16px] py-[24px] relative shrink-0 w-full" data-node-id="501:22826" data-name="Content">
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-node-id="501:23671" data-name="Header-Section"><FigmaExerciseToolbar variant="mobile" /></div>
        <div className="bg-white content-stretch flex flex-col items-start overflow-x-auto overflow-y-clip py-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="501:23703" data-name="Table"><FigmaExerciseTable /><FigmaExercisePagination /></div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="501:23221" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="501:23222" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="501:23223">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="501:23224" data-name="Links">
              <p className="relative shrink-0" data-node-id="501:23225">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="501:23226">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="501:23227">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="501:23228" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23229" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23230" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23231" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23232" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23233" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
