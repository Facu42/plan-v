import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaCalendarCell, FigmaCalendarDetails, FigmaCalendarExtraRow, useFigmaCalendar } from '../FigmaCalendar';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/Calendar";
const imgVector = `${assetPathPrefix}/7d323.svg`;
const imgDivider = `${assetPathPrefix}/02e4a.svg`;
const imgIconSpecialForkKnife = `${assetPathPrefix}/7e5b8.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/2b979.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown = `${assetPathPrefix}/20d58.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/a71fb.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/de8e1.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/2be86.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/bf5d8.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconSpecialPersonSimpleRun = `${assetPathPrefix}/6a619.svg`;
const imgIconSpecialCalendarCheck = `${assetPathPrefix}/c167e.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/4f1bf.svg`;
const imgIconCaretRight = `${assetPathPrefix}/35078.svg`;
const imgIconCaretDown2 = `${assetPathPrefix}/16cfa.svg`;
const imgCheckbox = `${assetPathPrefix}/63c07.svg`;
const imgCheckbox1 = `${assetPathPrefix}/51dee.svg`;
const imgCheckbox2 = `${assetPathPrefix}/5abdb.svg`;
const imgVector1 = `${assetPathPrefix}/cb8f9.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;
const imgIconX = `${assetPathPrefix}/eef3b.svg`;
const imgIconNavCalendarDots1 = `${assetPathPrefix}/b3414.svg`;
const imgIconClock = `${assetPathPrefix}/148cc.svg`;
const imgIconMapPinArea = `${assetPathPrefix}/f9b60.svg`;
const imgDivider1 = `${assetPathPrefix}/5314e.svg`;

type CellCalendarBodyProps = {
  className?: string;
  date?: string;
  variant?: "Default" | "Off Day";
};

function CellCalendarBody({ className, date = "", variant = "Off Day" }: CellCalendarBodyProps) {
  const isDefault = variant === "Default";
  const isOffDay = variant === "Off Day";
  return (
    <div className={className || `border-[#e1e1e2] border-r border-solid content-stretch flex flex-col h-[125px] items-start p-[4px] relative w-[122px] ${isDefault ? "bg-white" : "bg-[#f6f6f7] gap-[10px] overflow-clip"}`} id={isDefault ? "node-217_7508" : "node-217_7504"}>
      {isOffDay && (
        <div className="absolute inset-[-6.74%_calc(-87.5%-1.87px)_-6.74%_calc(-86.46%-0.86px)]" data-node-id="217:7505" data-name="Vector">
          <div className="absolute inset-[-0.24%_-0.11%]">
            <img alt="" className="block max-w-none size-full" src={imgVector} />
          </div>
        </div>
      )}
      <div className={`content-stretch flex items-center justify-center p-[2px] relative shrink-0 w-[18px] ${isDefault ? "" : "overflow-clip"}`} id={isDefault ? "node-217_7509" : "node-217_7506"} data-name="Day">
        {isOffDay && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#bebfc2] text-[10px] whitespace-nowrap" data-node-id="217:7507">
            {date}
          </p>
        )}
        {isDefault && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="217:7510">
            {date}
          </p>
        )}
      </div>
    </div>
  );
}

type CellCalendarHeadProps = {
  className?: string;
  day?: string;
  model?: "Default";
};

function CellCalendarHead({ className, day = "Sun", model = "Default" }: CellCalendarHeadProps) {
  return (
    <div className={className || "bg-white border-r border-solid border-white content-stretch flex items-center justify-center px-[10px] py-[12px] relative w-[96px]"} data-node-id="217:7500">
      <div className="content-stretch flex h-[16px] items-center justify-center pb-px relative shrink-0" data-node-id="217:7501" data-name="Day">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="217:7502">
          {day}
        </p>
      </div>
    </div>
  );
}

type CardStatisticCalendarProps = {
  className?: string;
  amount?: string;
  category?: string;
  model?: "Default";
};

function CardStatisticCalendar({ className, amount = "0", category = "Total Physical Activities Schedule", model = "Default" }: CardStatisticCalendarProps) {
  return (
    <div className={className || "bg-white content-stretch flex flex-col gap-[12px] items-start justify-center p-[16px] relative rounded-[16px] w-[275px]"} data-node-id="214:5650">
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="214:5638">
        {category}
      </p>
      <div className="h-0 relative shrink-0 w-full" data-node-id="214:5649" data-name="Divider">
        <div className="absolute inset-[-0.5px_0]">
          <img alt="" className="block max-w-none size-full" src={imgDivider} />
        </div>
      </div>
      <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="214:5645" data-name="Bottom">
        <div className="bg-[#c2e66e] content-stretch flex items-center p-[10px] relative rounded-[10px] shrink-0" data-node-id="214:5635" data-name="Icon">
          <div className="relative shrink-0 size-[16px]" data-node-id="214:5636" data-name="Icon/Special/ForkKnife">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialForkKnife} />
          </div>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px not-italic relative whitespace-nowrap" data-node-id="214:5639" data-name="Info Amount">
          <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="214:5640">
            {amount}
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="214:5641">{'comidas'}</p>
        </div>
      </div>
    </div>
  );
}

type HeaderProps = {
  className?: string;
  device?: "Desktop";
  showSearchIcon?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  title?: string;
  variant?: "Default";
};

function Header({ className, device = "Desktop", showSearchIcon = true, showSubtitle = true, subtitle = "Welcome and Let’s do some workout today!", title = "Hello, Wingman!  👋", variant = "Default" }: HeaderProps) {
  const patientName = useFigmaPatientName();
  return (
    <div className={className || "content-stretch flex h-[50px] items-center justify-between pl-[4px] relative w-[1171px]"} data-node-id="2:4458">
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[6px] items-start not-italic py-[2px] relative shrink-0 w-[340px]" data-node-id="2:4459" data-name="Title">
        <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px] w-full whitespace-pre-wrap" data-node-id="2:4460">
          {title}
        </p>
        {showSubtitle && (
          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="2:4461">
            {subtitle}
          </p>
        )}
      </div>
      <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="2:4462" data-name="Header Menu">
        {showSearchIcon && (
          <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="2:4463" data-name="Button Icon">
            <div className="relative shrink-0 size-[22px]" data-node-id="I2:4463;2:3570" data-name="Icon/ChatTeardropDots">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
            </div>
          </div>
        )}
        <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="2:4464" data-name="Button Icon">
          <div className="relative shrink-0 size-[22px]" data-node-id="I2:4464;2:3570" data-name="Icon/ChatTeardropDots">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
          </div>
          <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I2:4464;2:3571" />
        </div>
        <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="2:4465" data-name="User Profile">
          <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="2:4466" data-name="Avatar">
            <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I2:4466;2:3098" data-name="User Image/12">
              <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I2:4466;2:3098;2:3159" data-name="Place Image Here" />
            </div>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="2:4467" data-name="User Name">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="2:4468">{patientName}</p>
            <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="2:4469">
              Miembro
            </p>
          </div>
          <div className="flex flex-row items-center self-stretch" data-node-id="2:4470">
            <div className="bg-white content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
              <div className="relative shrink-0 size-[16px]" data-node-id="I2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Component04CalendarDesktop() {
  const calendarData = useFigmaCalendar();
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative size-full" data-node-id="84:1666" data-name="04. Calendar (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="84:1667" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I84:1667;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I84:1667;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I84:1667;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:1667;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;2:4501;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:1667;2:4501;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4501;2:3292">
                Calendario
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:1667;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4505;2:3296">
                Mensajes
              </p>
            </div>
            <FigmaPatientUnreadBadge variant="nav" className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" nodeId="I84:1667;2:4505;2:3297" />
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:1667;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4502;2:3296">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:1667;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4503;2:3296">
                Plan de comidas
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I84:1667;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I84:1667;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:1667;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4504;2:3296">
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:1667;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4506;2:3296">
                Progreso
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:1667;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4509;2:3296">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:1667;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;12:1059;2:3296">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I84:1667;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I84:1667;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I84:1667;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I84:1667;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I84:1667;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I84:1667;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4518;2:3335">
                Enviar mensaje
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:1667;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I84:1667;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:1667;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:1667;2:4519;2:3296">
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="84:1668" data-name="Content">
        <Header className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" showSubtitle={false} title="Calendario" />
        <div className="content-stretch flex flex-col gap-[20px] items-start min-h-[842px] relative shrink-0 w-full" data-node-id="84:1670" data-name="Body">
          <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="214:5671" data-name="Section Statistics">
            <CardStatisticCalendar category="Planificación de comidas" className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]"  amount={String(calendarData.stats[0])}/>
            <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]" data-node-id="214:5651" data-name="Card Statistic - Calendar">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I214:5651;214:5638">
                Agenda de actividades físicas
              </p>
              <div className="h-0 relative shrink-0 w-full" data-node-id="I214:5651;214:5649" data-name="Divider">
                <div className="absolute inset-[-0.5px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgDivider} />
                </div>
              </div>
              <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I214:5651;214:5645" data-name="Bottom">
                <div className="bg-[#ffcb65] content-stretch flex items-center p-[10px] relative rounded-[10px] shrink-0" data-node-id="I214:5651;214:5635" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I214:5651;214:5636" data-name="Icon/Special/ForkKnife">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleRun} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px not-italic relative whitespace-nowrap" data-node-id="I214:5651;214:5639" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I214:5651;214:5640">{calendarData.stats[1]}</p>
                  <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="I214:5651;214:5641">
                    actividades
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start justify-center min-w-px p-[16px] relative rounded-[16px]" data-node-id="214:5672" data-name="Card Statistic - Calendar">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I214:5672;214:5638">
                Agenda de citas y eventos
              </p>
              <div className="h-0 relative shrink-0 w-full" data-node-id="I214:5672;214:5649" data-name="Divider">
                <div className="absolute inset-[-0.5px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgDivider} />
                </div>
              </div>
              <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="I214:5672;214:5645" data-name="Bottom">
                <div className="bg-[#ffa257] content-stretch flex items-center p-[10px] relative rounded-[10px] shrink-0" data-node-id="I214:5672;214:5635" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I214:5672;214:5636" data-name="Icon/Special/ForkKnife">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialCalendarCheck} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px not-italic relative whitespace-nowrap" data-node-id="I214:5672;214:5639" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I214:5672;214:5640">{calendarData.stats[2]}</p>
                  <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="I214:5672;214:5641">{'citas'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="217:6452" data-name="Section Calendar">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="217:6453" data-name="Header-Section">
              <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-node-id="217:6454" data-name="Left Section">
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="217:6455" data-name="Buttons">
                  <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="217:6456" data-name="Button Icon" aria-label="Mes anterior" role="button" tabIndex={0} onClick={() => calendarData.shift(-1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.shift(-1); } }}>
                    <div className="relative shrink-0 size-[18px]" data-node-id="I217:6456;2:3586" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                    </div>
                  </div>
                  <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="217:6457" data-name="Button Icon" aria-label="Mes siguiente" role="button" tabIndex={0} onClick={() => calendarData.shift(1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.shift(1); } }}>
                    <div className="relative shrink-0 size-[18px]" data-node-id="I217:6457;2:3586" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[4px] h-[18px] items-center relative shrink-0" data-node-id="217:6458" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="217:6459">{calendarData.monthName}</p>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="217:6460">{calendarData.year}</p>
                  <div className="relative shrink-0 size-[14px]" data-node-id="217:6461" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown2} />
                  </div>
                <input type="month" aria-label="Elegir mes" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={calendarData.year + '-' + String(calendarData.month.getMonth() + 1).padStart(2, '0')} onChange={(event) => calendarData.chooseMonth(event.target.value)} /></div>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="217:6462" data-name="Right Section">
                <div className="bg-white content-stretch flex gap-[2px] items-start relative rounded-[10px] shrink-0" data-node-id="217:6464" data-name="Segmented Button">
                  <div className="bg-white content-stretch flex items-center justify-center pl-[16px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I217:6464;2:3607" data-name="Button Picker" role="button" tabIndex={0} aria-pressed={calendarData.view === 'day'} style={{ backgroundColor: calendarData.view === 'day' ? '#c2e66e' : '#fff' }} onClick={() => calendarData.setView('day')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.setView('day'); } }}>
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I217:6464;2:3607;2:3481" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I217:6464;2:3607;2:3482">
                        Día
                      </p>
                    </div>
                  </div>
                  <div className="bg-white content-stretch flex items-center justify-center px-[16px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I217:6464;2:3608" data-name="Button Picker" role="button" tabIndex={0} aria-pressed={calendarData.view === 'week'} style={{ backgroundColor: calendarData.view === 'week' ? '#c2e66e' : '#fff' }} onClick={() => calendarData.setView('week')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.setView('week'); } }}>
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I217:6464;2:3608;2:3481" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I217:6464;2:3608;2:3482">
                        Semana
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I217:6464;2:3609" data-name="Button Picker" role="button" tabIndex={0} aria-pressed={calendarData.view === 'month'} style={{ backgroundColor: calendarData.view === 'month' ? '#c2e66e' : '#fff' }} onClick={() => calendarData.setView('month')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.setView('month'); } }}>
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I217:6464;2:3609;2:3331" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I217:6464;2:3609;2:3332">
                        Mes
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="217:6471" data-name="Button CTA" role="button" tabIndex={0} onClick={() => calendarData.newActivity()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.newActivity(); } }}>
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I217:6471;2:3331" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I217:6471;2:3332">
                      Nueva actividad
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="217:6490" data-name="Calendar">
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[24px] items-center p-[16px] relative shrink-0 w-full" data-node-id="217:6472" data-name="Category List">
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="217:6474" data-name="Category" role="button" tabIndex={0} aria-pressed={calendarData.categories[0]} style={{ opacity: calendarData.categories[0] ? 1 : 0.45 }} onClick={() => calendarData.toggleCategory(0)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.toggleCategory(0); } }}>
                  <div className="relative shrink-0 size-[16px]" data-node-id="217:6475" data-name="Checkbox">
                    <div className="absolute inset-[-6.25%]">
                      <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                    </div>
                  </div>
                  <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="217:6476" data-name="Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="217:6477">
                      Planificación de comidas
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="217:6478" data-name="Category" role="button" tabIndex={0} aria-pressed={calendarData.categories[1]} style={{ opacity: calendarData.categories[1] ? 1 : 0.45 }} onClick={() => calendarData.toggleCategory(1)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.toggleCategory(1); } }}>
                  <div className="relative shrink-0 size-[16px]" data-node-id="217:6479" data-name="Checkbox">
                    <div className="absolute inset-[-6.25%]">
                      <img alt="" className="block max-w-none size-full" src={imgCheckbox1} />
                    </div>
                  </div>
                  <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="217:6480" data-name="Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="217:6481">
                      Actividades físicas
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[6px] shrink-0" data-node-id="217:6482" data-name="Category" role="button" tabIndex={0} aria-pressed={calendarData.categories[2]} style={{ opacity: calendarData.categories[2] ? 1 : 0.45 }} onClick={() => calendarData.toggleCategory(2)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendarData.toggleCategory(2); } }}>
                  <div className="relative shrink-0 size-[16px]" data-node-id="217:6483" data-name="Checkbox">
                    <div className="absolute inset-[-6.25%]">
                      <img alt="" className="block max-w-none size-full" src={imgCheckbox2} />
                    </div>
                  </div>
                  <div className="content-stretch flex h-[16px] items-center relative shrink-0" data-node-id="217:6484" data-name="Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="217:6485">
                      Citas y eventos
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center overflow-clip relative shrink-0 w-full" data-node-id="217:6491" data-name="Row-Calendar-Head">
                <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative"  day="Dom"/>
                <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Lun" />
                <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Mar" />
                <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Mié" />
                <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Jue" />
                <CellCalendarHead className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" day="Vie" />
                <div className="bg-white content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative" data-node-id="217:6498" data-name="Cell-Calendar-Head">
                  <div className="content-stretch flex h-[16px] items-center justify-center pb-px relative shrink-0" data-node-id="I217:6498;217:7501" data-name="Day">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I217:6498;217:7502">
                      Sáb
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="217:6499" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[0] ? undefined : 'none' }}>
                <FigmaCalendarCell index={0} nodeId="217:6501" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={1} nodeId="217:6502" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={2} nodeId="217:6503" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={3} nodeId="217:6504" className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={4} className="bg-[#f6f6f7] border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px overflow-clip p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={5} nodeId="217:6506" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={6} nodeId="217:6500" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="217:6507" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[7] ? undefined : 'none' }}>
                <FigmaCalendarCell index={7} nodeId="217:6509" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={8} nodeId="217:6510" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={9} nodeId="217:6511" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={10} nodeId="217:6512" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={11} nodeId="217:6513" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={12} nodeId="217:6514" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={13} nodeId="217:6508" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="217:6515" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[14] ? undefined : 'none' }}>
                <FigmaCalendarCell index={14} nodeId="217:6517" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={15} className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={16} nodeId="217:6519" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={17} nodeId="217:6520" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={18} className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={19} nodeId="217:6522" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={20} nodeId="217:6516" className="bg-white border-r border-solid border-white content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="217:6523" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[21] ? undefined : 'none' }}>
                <FigmaCalendarCell index={21} nodeId="217:6525" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={22} nodeId="217:6526" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={23} nodeId="217:6527" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={24} nodeId="217:6528" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={25} nodeId="217:6529" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={26} nodeId="217:6530" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={27} nodeId="217:6524" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              </div>
              <div className="content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-node-id="217:6531" data-name="Row-Calendar-Body" style={{ display: calendarData.cells[28] ? undefined : 'none' }}>
                <FigmaCalendarCell index={28} nodeId="217:6533" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={29} nodeId="217:6534" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={30} nodeId="217:6535" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={31} nodeId="217:6536" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={32} nodeId="217:6537" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={33} nodeId="217:6538" className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
                <FigmaCalendarCell index={34} nodeId="217:6532" className="bg-white content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px p-[4px] relative" assetPathPrefix={assetPathPrefix} />
              </div>
            <FigmaCalendarExtraRow assetPathPrefix={assetPathPrefix} /></div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="84:1906" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="84:1907" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="84:1908">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="84:1909" data-name="Links">
              <p className="relative shrink-0" data-node-id="84:1910">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="84:1911">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="84:1912">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="84:1913" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1914" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1915" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1916" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1917" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:1918" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[325px]" data-node-id="215:5682" data-name="Right Side">
        <div className="content-stretch flex items-center justify-between px-[8px] relative shrink-0 w-full" data-node-id="217:8223" data-name="Header-Section">
          <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-804px] relative shrink-0" data-node-id="I217:8223;2:4222" data-name="Div Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I217:8223;2:4223">
              Detalles de la agenda
            </p>
          </div>
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I217:8223;2:4225" data-name="Right Section">
            <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I217:8223;2:4233" data-name="Button More">
              <div className="relative shrink-0 size-[24px]" data-node-id="I217:8223;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconX} />
              </div>
            </div>
          </div>
        </div>
        <FigmaCalendarDetails />
        
      </div>
    </div>
  );
}
