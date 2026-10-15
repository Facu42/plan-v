import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaMessagesCompose, FigmaMessagesEmptyThread, FigmaMessagesList, FigmaMessagesProfile, FigmaMessagesSearch, useFigmaMessages } from '../FigmaMessages';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/Messages";
const imgIconGlobe = `${assetPathPrefix}/19e03.svg`;
const imgIconCopySimple = `${assetPathPrefix}/151c2.svg`;
const imgIconFilePdf = `${assetPathPrefix}/1a24d.svg`;
const imgChecks = `${assetPathPrefix}/5a341.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/f08ac.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/103fd.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/2be86.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/bf5d8.svg`;
const imgIconCaretDown = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconMagnifyingGlass1 = `${assetPathPrefix}/2b979.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgIconFadersHorizontal = `${assetPathPrefix}/5c06e.svg`;
const imgIconPhone = `${assetPathPrefix}/87f30.svg`;
const imgIconVideoCamera = `${assetPathPrefix}/2e9a9.svg`;
const imgIconSidebarSimple = `${assetPathPrefix}/9f190.svg`;
const imgIconPaperPlaneRight = `${assetPathPrefix}/a79eb.svg`;
const imgIconNotePencil = `${assetPathPrefix}/66831.svg`;
const imgIconInfo = `${assetPathPrefix}/5e8cc.svg`;
const imgIconImageSquare = `${assetPathPrefix}/e2ca4.svg`;
const imgPlay = `${assetPathPrefix}/c1f26.svg`;
const imgIconFileText = `${assetPathPrefix}/ca195.svg`;
const imgIconFileXls = `${assetPathPrefix}/754d7.svg`;
const imgIconLink = `${assetPathPrefix}/d2da4.svg`;
const imgIconInstagramLogo = `${assetPathPrefix}/17de0.svg`;
const imgIconYoutubeLogo = `${assetPathPrefix}/f3528.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemListLinksProps = {
  className?: string;
  link?: string;
};

function ItemListLinks({ className, link = "http://www.alexfosterfitness.com/" }: ItemListLinksProps) {
  return (
    <div className={className || "bg-[#f9f4f2] content-stretch flex items-center px-[2px] py-[4px] relative rounded-[8px] w-[275px]"} data-node-id="210:5737" data-name="Item List Links">
      <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="210:5698" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="210:5699" data-name="Icon/Globe">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconGlobe} />
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="210:5700" data-name="Main">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="210:5701">
          {link}
        </p>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="210:6072" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="210:6073" data-name="Icon/CopySimple">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCopySimple} />
        </div>
      </div>
    </div>
  );
}

type ItemListDocsProps = {
  className?: string;
  docs?: string;
  size?: string;
};

function ItemListDocs({ className, docs = "Sin archivo", size = "" }: ItemListDocsProps) {
  return (
    <div className={className || "bg-[#f9f4f2] content-stretch flex gap-[12px] items-center p-[12px] relative rounded-[16px] w-[264px]"} data-node-id="209:5633" data-name="Item List Docs">
      <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="207:7121" data-name="Icon">
        <div className="relative shrink-0 size-[24px]" data-node-id="207:7122" data-name="Icon/FilePdf">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFilePdf} />
        </div>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic relative whitespace-nowrap" data-node-id="207:7123" data-name="Main">
        <p className="font-['Poppins:Medium'] leading-[1.3] min-w-full overflow-hidden relative shrink-0 text-[#52545b] text-[12px] text-ellipsis w-[min-content]" data-node-id="207:7124">
          {docs}
        </p>
        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="207:7125">
          {size}
        </p>
      </div>
    </div>
  );
}

type BubbleChatProps = {
  className?: string;
  device?: "Desktop";
  message?: string;
  showChecks?: boolean;
  showImage?: boolean;
  time?: string;
  type?: "1" | "2";
};

function BubbleChat({ className, device = "Desktop", message = "", showChecks = true, showImage = false, time = "", type = "1" }: BubbleChatProps) {
  const is1AndDesktop = type === "1" && device === "Desktop";
  const is2AndDesktop = type === "2" && device === "Desktop";
  return (
    <div className={className || `content-stretch flex py-[4px] relative w-[460px] ${is2AndDesktop ? "items-start" : "items-end justify-end"}`} id={is2AndDesktop ? "node-2_4288" : "node-2_4280"}>
      <div className={`content-stretch flex flex-[1_0_0] flex-col gap-[8px] justify-end min-w-px relative ${is2AndDesktop ? "items-start" : "items-end"}`} id={is2AndDesktop ? "node-2_4291" : "node-2_4281"} data-name="Main">
        {is1AndDesktop && (
          <>
            <div className="bg-[#ffcb65] content-stretch flex items-center justify-center max-w-[408px] pb-[14px] pt-[13px] px-[16px] relative rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="2:4286" data-name="Bubble">
              <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="2:4287">
                {message}
              </p>
            </div>
            <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0" data-node-id="2:4282" data-name="Footer">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="2:4283">
                {time}
              </p>
              {showChecks && (
                <div className="relative shrink-0 size-[16px]" data-node-id="2:4284" data-name="Checks">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChecks} />
                </div>
              )}
            </div>
          </>
        )}
        {is2AndDesktop && showImage && (
          <div className="bg-[#fefcfb] content-stretch flex items-center justify-center max-w-[480px] p-[8px] relative rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="2:4293" data-name="Image">
            <div className="bg-[#eeeeef] overflow-clip relative rounded-bl-[6px] rounded-br-[6px] rounded-tr-[6px] shrink-0 size-[148px]" data-node-id="2:4294" data-name="Image/Car Type/Sedan" />
          </div>
        )}
        {is2AndDesktop && (
          <>
            <div className="bg-[#fefcfb] content-stretch flex items-center justify-center max-w-[408px] pb-[14px] pt-[13px] px-[16px] relative rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="2:4296" data-name="Bubble">
              <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="2:4297">
                {message}
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="2:4292">
              {time}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

type BadgeProps = {
  className?: string;
  number?: string;
  size?: "Medium";
  withNumber?: boolean;
};

function Badge({ className, number = "5", size = "Medium", withNumber = true }: BadgeProps) {
  return (
    <div className={className || "content-stretch flex flex-col items-center justify-center p-[4px] relative size-[20px]"} data-node-id="2:3261">
      <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="2:3262" data-name="Div Red">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="2:3263">
          {number}
        </p>
      </div>
    </div>
  );
}

type InputSearchProps = {
  className?: string;
  placeholder?: string;
  size?: "Large";
};

function InputSearch({ className, placeholder = "Buscar…", size = "Large" }: InputSearchProps) {
  return (
    <div className={className || "bg-[#f6f6f7] content-stretch flex gap-[6px] items-center px-[13px] py-[9px] relative rounded-[12px] w-[237px]"} data-node-id="2:3936">
      <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="2:3937" data-name="Icon">
        <div className="relative shrink-0 size-[18px]" data-node-id="2:3938" data-name="Icon/MagnifyingGlass">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] items-center min-w-px px-[2px] relative" data-node-id="2:3939" data-name="Text">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.25] min-w-px not-italic relative text-[#8a8c90] text-[14px]" data-node-id="2:3940">
          {placeholder}
        </p>
      </div>
    </div>
  );
}

export default function Component07MessagesDesktop() {
  const messagesData = useFigmaMessages();
  const patientName = useFigmaPatientName();
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="84:2565" data-name="07. Messages (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="84:2566" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I84:2566;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I84:2566;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I84:2566;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4501;2:3296">
                Calendario
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4505;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:2566;2:4505;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4505;2:3292">
                Mensajes
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4502;2:3296">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4503;2:3296">
                Plan de comidas
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I84:2566;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I84:2566;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4504;2:3296">
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4506;2:3296">
                Progreso
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4509;2:3296">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;12:1059;2:3296">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I84:2566;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I84:2566;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I84:2566;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I84:2566;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I84:2566;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I84:2566;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4518;2:3335">
                Enviar mensaje
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4519;2:3296">
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="84:2567" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="84:2568" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I84:2568;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I84:2568;2:4460">
              Mensajes
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I84:2568;2:4462" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:2568;2:4463" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:2568;2:4463;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass1} />
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:2568;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:2568;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I84:2568;2:4464;2:3571" />
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I84:2568;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I84:2568;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I84:2568;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I84:2568;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I84:2568;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I84:2568;2:4468">{patientName}</p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I84:2568;2:4469">
                  Miembro
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I84:2568;2:4470">
                <div className="bg-[#f9f4f2] content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I84:2568;2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[20px] items-start min-h-[842px] relative rounded-[28px] shrink-0 w-full" data-node-id="198:5968" data-name="Body">
          <div className="content-stretch flex flex-col gap-[8px] items-start overflow-clip relative shrink-0 w-[299px]" data-node-id="198:5969" data-name="Section Messages">
            <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-node-id="198:5970" data-name="Header">
              <FigmaMessagesSearch className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px px-[13px] py-[9px] relative rounded-[12px]" icon={imgIconMagnifyingGlass} />
              <div className="bg-[#eeeeef] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="198:5973" data-name="Button Icon" role="button" tabIndex={0} aria-label="Mostrar solo conversaciones sin leer" aria-pressed={messagesData.unreadOnly} onClick={messagesData.toggleUnreadOnly} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); messagesData.toggleUnreadOnly(); } }}>
                <div className="relative shrink-0 size-[22px]" data-node-id="I198:5973;2:3570" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFadersHorizontal} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-node-id="198:5978" data-name="List Messages"><FigmaMessagesList variant="desktop" /></div>
            <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="207:7097" data-name="Footer">
              <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[16px] py-[10px] relative rounded-[12px]" data-node-id="207:7100" data-name="Button" role="button" tabIndex={0} aria-label="Escribir mensaje" onClick={messagesData.focusComposer} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); messagesData.focusComposer(); } }}>
                <div className="content-stretch flex h-[20px] items-center py-[2px] relative shrink-0" data-node-id="I207:7100;2:3405" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I207:7100;2:3406">
                    Nuevo mensaje
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col items-start min-w-px overflow-clip relative rounded-[16px] self-stretch" data-node-id="198:5995" data-name="Center Section">
            <div className="content-stretch flex items-center justify-center p-[16px] relative shrink-0 w-full" data-node-id="198:5996" data-name="Header">
              <div className="bg-white content-stretch flex flex-[1_0_0] items-center justify-between min-w-px p-[16px] relative rounded-[16px]" data-node-id="207:6390">
                <div className="content-stretch flex gap-[14px] items-center relative shrink-0" data-node-id="198:5997" data-name="User">
                  <div className="relative rounded-[32px] shrink-0 size-[36px]" data-node-id="198:5998" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I198:5998;2:3102" data-name="User Image/01" />
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="198:5999" data-name="Main">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#212738] text-[14px]" data-node-id="198:6000">{messagesData.contactName}</p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#878a94] text-[12px]" data-node-id="198:6001">Tu nutricionista</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-node-id="198:6002" data-name="Buttons"><button type="button" className="figma-messages-refresh" aria-label="Actualizar conversación" onClick={() => void messagesData.refresh()}><img alt="" src={imgIconSidebarSimple} /></button></div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-end min-h-px overflow-clip px-[20px] relative w-full" data-node-id="198:6007" data-name="Chat Area">{messagesData.thread.length ? messagesData.thread.map((item) => <BubbleChat key={item.id} className={item.own ? 'content-stretch flex items-end justify-end py-[4px] relative shrink-0 w-full' : 'content-stretch flex items-start py-[4px] relative shrink-0 w-full'} message={item.text} showImage={false} showChecks={item.own && item.receipt === 'Leído'} time={item.time + (item.own ? ' · ' + item.receipt : '')} type={item.own ? '1' : '2'} />) : <FigmaMessagesEmptyThread />}</div>
            <div className="content-stretch flex flex-col items-start p-[16px] relative shrink-0 w-full" data-node-id="198:6020" data-name="Footer">
              <div className="bg-white content-stretch flex items-center overflow-clip pl-[4px] pr-[9px] py-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="198:6021" data-name="Type Board"><FigmaMessagesCompose /></div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col items-start justify-between relative rounded-[12px] self-stretch shrink-0 w-[275px]" data-node-id="207:6722" data-name="Center Section"><FigmaMessagesProfile /></div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="84:2570" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="84:2571" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="84:2572">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="84:2573" data-name="Links">
              <p className="relative shrink-0" data-node-id="84:2574">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="84:2575">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="84:2576">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="84:2577" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2578" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2579" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2580" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2581" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2582" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
