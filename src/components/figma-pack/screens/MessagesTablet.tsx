import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaMessagesCompose, FigmaMessagesEmptyThread, FigmaMessagesList, FigmaMessagesProfile, FigmaMessagesSearch, useFigmaMessages } from '../FigmaMessages';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/MessagesTablet";
const imgIconGlobe = `${assetPathPrefix}/19e03.svg`;
const imgIconCopySimple = `${assetPathPrefix}/151c2.svg`;
const imgIconFilePdf = `${assetPathPrefix}/1a24d.svg`;
const imgChecks = `${assetPathPrefix}/2cef5.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/d5060.svg`;
const imgUserImage01 = `${assetPathPrefix}/c6ddd.png`;
const imgIconNavSquaresFour = `${assetPathPrefix}/30242.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/f4cb9.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/32209.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/d074c.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/f8978.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/80149.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/56b99.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/7679f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/96a22.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/e9231.svg`;
const imgIconBell = `${assetPathPrefix}/4a0c9.svg`;
const imgIconFadersHorizontal = `${assetPathPrefix}/96637.svg`;
const imgIconPhone = `${assetPathPrefix}/d99b5.svg`;
const imgIconVideoCamera = `${assetPathPrefix}/38345.svg`;
const imgIconSidebarSimple = `${assetPathPrefix}/0aba1.svg`;
const imgIconPaperPlaneRight = `${assetPathPrefix}/619e6.svg`;
const imgIconNotePencil = `${assetPathPrefix}/66831.svg`;
const imgIconX = `${assetPathPrefix}/bede3.svg`;
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
  device?: "Mobile";
  message?: string;
  showChecks?: boolean;
  showImage?: boolean;
  time?: string;
  type?: "1" | "2";
};

function BubbleChat({ className, device = "Mobile", message = "", showChecks = true, showImage = false, time = "", type = "1" }: BubbleChatProps) {
  const is1AndMobile = type === "1" && device === "Mobile";
  const is2AndMobile = type === "2" && device === "Mobile";
  return (
    <div className={className || `content-stretch flex py-[4px] relative w-[460px] ${is2AndMobile ? "items-start" : "items-end justify-end"}`} id={is2AndMobile ? "node-433_19878" : "node-433_19886"}>
      <div className={`content-stretch flex flex-[1_0_0] flex-col gap-[8px] justify-end min-w-px relative ${is2AndMobile ? "items-start" : "items-end"}`} id={is2AndMobile ? "node-433_19879" : "node-433_19887"} data-name="Main">
        {is1AndMobile && (
          <>
            <div className="bg-[#ffcb65] content-stretch flex items-center justify-center max-w-[320px] pb-[14px] pt-[13px] px-[16px] relative rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="433:19888" data-name="Bubble">
              <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="433:19889">
                {message}
              </p>
            </div>
            <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0" data-node-id="433:19890" data-name="Footer">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="433:19891">
                {time}
              </p>
              {showChecks && (
                <div className="relative shrink-0 size-[14px]" data-node-id="433:19892" data-name="Checks">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChecks} />
                </div>
              )}
            </div>
          </>
        )}
        {is2AndMobile && showImage && (
          <div className="bg-[#fefcfb] content-stretch flex items-center justify-center max-w-[480px] p-[8px] relative rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="433:19880" data-name="Image">
            <div className="bg-[#eeeeef] overflow-clip relative rounded-bl-[6px] rounded-br-[6px] rounded-tr-[6px] shrink-0 size-[148px]" data-node-id="433:19881" data-name="Image/Car Type/Sedan" />
          </div>
        )}
        {is2AndMobile && (
          <>
            <div className="bg-[#fefcfb] content-stretch flex items-center justify-center max-w-[320px] pb-[14px] pt-[13px] px-[16px] relative rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="433:19883" data-name="Bubble">
              <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="433:19884">
                {message}
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="433:19885">
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
  size?: "Medium";
};

function InputSearch({ className, placeholder = "Buscar…", size = "Medium" }: InputSearchProps) {
  return (
    <div className={className || "bg-[#f6f6f7] content-stretch flex gap-[6px] items-center px-[12px] py-[8px] relative rounded-[10px] w-[237px]"} data-node-id="2:3941">
      <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="2:3942" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="2:3943" data-name="Icon/MagnifyingGlass">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] items-center min-w-px px-[2px] relative" data-node-id="2:3944" data-name="Text">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="2:3945">
          {placeholder}
        </p>
      </div>
    </div>
  );
}

export default function Component08MessagesTablet() {
  const messagesData = useFigmaMessages();
  return (
    <div className="bg-white content-stretch flex items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="433:18545" data-name="08. Messages (Tablet)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[28px] relative self-stretch shrink-0" data-node-id="433:18546" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[6px] relative shrink-0" data-node-id="I433:18546;408:17341" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I433:18546;408:17342" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative" data-node-id="I433:18546;408:17343" data-name="Menu Nav">
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17344" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17344;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17345" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17345;408:17513" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17346" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17346;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17347" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17347;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17348" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17348;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17349" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17349;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17350" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17350;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17353" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17353;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17354" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17354;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I433:18546;408:17363" data-name="Button Nav">
          <div className="relative shrink-0 size-[18px]" data-node-id="I433:18546;408:17363;408:17518" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px overflow-clip pr-[20px] py-[28px] relative self-stretch" data-node-id="433:18547" data-name="Content">
        <div className="content-stretch flex gap-[20px] items-start min-h-[985px] relative rounded-[28px] shrink-0 w-full" data-node-id="433:18991" data-name="Body">
          <div className="content-stretch flex flex-col gap-[16px] items-start overflow-clip relative shrink-0 w-[285px]" data-node-id="433:18992" data-name="Section Messages">
            <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="433:19967" data-name="Header">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px py-[2px] relative" data-node-id="I433:19967;418:13843" data-name="Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="I433:19967;418:13844">
                  Mensajes
                </p>
              </div>
              <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I433:19967;418:13846" data-name="Header Menu">
                <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I433:19967;418:13855" data-name="Button Icon">
                  <div className="relative shrink-0 size-[20px]" data-node-id="I433:19967;418:13855;2:3558" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
                  </div>
                  <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I433:19967;418:13855;2:3559" />
                </div>
                <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I433:19967;418:13857" data-name="Avatar">
                  <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I433:19967;418:13857;2:3114" data-name="User Image/12">
                    <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I433:19967;418:13857;2:3114;2:3159" data-name="Place Image Here" />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[10px] items-start pt-[8px] relative shrink-0 w-full" data-node-id="433:18993" data-name="Header">
              <FigmaMessagesSearch className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px px-[12px] py-[8px] relative rounded-[10px]" icon={imgIconMagnifyingGlass} />
              <div className="bg-[#eeeeef] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="433:18995" data-name="Button Icon" role="button" tabIndex={0} aria-label="Mostrar solo conversaciones sin leer" aria-pressed={messagesData.unreadOnly} onClick={messagesData.toggleUnreadOnly} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); messagesData.toggleUnreadOnly(); } }}>
                <div className="relative shrink-0 size-[20px]" data-node-id="I433:18995;2:3558" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFadersHorizontal} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-node-id="433:18996" data-name="List Messages"><FigmaMessagesList variant="tablet" /></div>
            <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="433:19005" data-name="Footer">
              <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[14px] py-[8px] relative rounded-[10px]" data-node-id="433:19006" data-name="Button" role="button" tabIndex={0} aria-label="Escribir mensaje" onClick={messagesData.focusComposer} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); messagesData.focusComposer(); } }}>
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I433:19006;2:3334" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I433:19006;2:3335">
                    Nuevo mensaje
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col items-start min-w-px overflow-clip relative rounded-[16px] self-stretch" data-node-id="433:19007" data-name="Center Section">
            <div className="content-stretch flex items-center justify-center p-[16px] relative shrink-0 w-full" data-node-id="433:19008" data-name="Header">
              <div className="bg-white content-stretch flex flex-[1_0_0] items-center justify-between min-w-px p-[16px] relative rounded-[16px]" data-node-id="433:19009">
                <div className="content-stretch flex gap-[14px] items-center relative shrink-0" data-node-id="433:19010" data-name="User">
                  <div className="relative rounded-[32px] shrink-0 size-[28px]" data-node-id="433:19011" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-[-3.57%] overflow-clip rounded-[24px]" data-node-id="I433:19011;2:3120" data-name="User Image/01" />
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="433:19012" data-name="Main">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="433:19013">{messagesData.contactName}</p>
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="433:19014">Tu nutricionista</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-node-id="433:19015" data-name="Buttons"><button type="button" className="figma-messages-refresh" aria-label="Actualizar conversación" onClick={() => void messagesData.refresh()}><img alt="" src={imgIconSidebarSimple} /></button></div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px overflow-clip px-[20px] relative w-full" data-node-id="433:19019" data-name="Chat Area">{messagesData.thread.length ? messagesData.thread.map((item) => <BubbleChat key={item.id} className={item.own ? 'content-stretch flex items-end justify-end py-[4px] relative shrink-0 w-full' : 'content-stretch flex items-start py-[4px] relative shrink-0 w-full'} message={item.text} showImage={false} showChecks={item.own && item.receipt === 'Leído'} time={item.time + (item.own ? ' · ' + item.receipt : '')} type={item.own ? '1' : '2'} />) : <FigmaMessagesEmptyThread />}</div>
            <div className="content-stretch flex flex-col items-start p-[16px] relative shrink-0 w-full" data-node-id="433:19030" data-name="Footer">
              <div className="bg-white content-stretch flex items-center overflow-clip pl-[4px] pr-[9px] py-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="433:19031" data-name="Type Board"><FigmaMessagesCompose /></div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[20px] items-start min-h-[985px] relative rounded-[28px] shrink-0 w-full" data-node-id="536:18294" data-name="Body">
          <div className="content-stretch flex flex-col gap-[16px] items-start overflow-clip relative shrink-0 w-[285px]" data-node-id="536:18295" data-name="Section Messages">
            <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="536:18296" data-name="Header">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px py-[2px] relative" data-node-id="I536:18296;418:13843" data-name="Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="I536:18296;418:13844">
                  Mensajes
                </p>
              </div>
              <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I536:18296;418:13846" data-name="Header Menu">
                <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I536:18296;418:13855" data-name="Button Icon">
                  <div className="relative shrink-0 size-[20px]" data-node-id="I536:18296;418:13855;2:3558" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
                  </div>
                  <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I536:18296;418:13855;2:3559" />
                </div>
                <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I536:18296;418:13857" data-name="Avatar">
                  <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I536:18296;418:13857;2:3114" data-name="User Image/12">
                    <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I536:18296;418:13857;2:3114;2:3159" data-name="Place Image Here" />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[10px] items-start pt-[8px] relative shrink-0 w-full" data-node-id="536:18297" data-name="Header">
              <FigmaMessagesSearch className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px px-[12px] py-[8px] relative rounded-[10px]" icon={imgIconMagnifyingGlass} />
              <div className="bg-[#eeeeef] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="536:18299" data-name="Button Icon" role="button" tabIndex={0} aria-label="Mostrar solo conversaciones sin leer" aria-pressed={messagesData.unreadOnly} onClick={messagesData.toggleUnreadOnly} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); messagesData.toggleUnreadOnly(); } }}>
                <div className="relative shrink-0 size-[20px]" data-node-id="I536:18299;2:3558" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFadersHorizontal} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-node-id="536:18300" data-name="List Messages"><FigmaMessagesList variant="tablet" /></div>
            <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="536:18311" data-name="Footer">
              <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[14px] py-[8px] relative rounded-[10px]" data-node-id="536:18312" data-name="Button" role="button" tabIndex={0} aria-label="Escribir mensaje" onClick={messagesData.focusComposer} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); messagesData.focusComposer(); } }}>
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I536:18312;2:3334" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I536:18312;2:3335">
                    Nuevo mensaje
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col items-start min-w-px overflow-clip relative rounded-[16px] self-stretch" data-node-id="536:18313" data-name="Center Section">
            <div className="content-stretch flex items-center justify-center p-[16px] relative shrink-0 w-full" data-node-id="536:18314" data-name="Header">
              <div className="bg-white content-stretch flex flex-[1_0_0] items-center justify-between min-w-px p-[16px] relative rounded-[16px]" data-node-id="536:18315">
                <div className="content-stretch flex gap-[14px] items-center relative shrink-0" data-node-id="536:18316" data-name="User">
                  <div className="relative rounded-[32px] shrink-0 size-[28px]" data-node-id="536:18317" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-[-3.57%] overflow-clip rounded-[24px]" data-node-id="I536:18317;2:3120" data-name="User Image/01">
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <img alt="" className="absolute h-[180.34%] left-[-85.48%] max-w-none top-[3.57%] w-[270.96%]" src={imgUserImage01} />
                      </div>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="536:18318" data-name="Main">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="536:18319">{messagesData.contactName}</p>
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="536:18320">Tu nutricionista</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-node-id="536:18321" data-name="Buttons"><button type="button" className="figma-messages-refresh" aria-label="Actualizar conversación" onClick={() => void messagesData.refresh()}><img alt="" src={imgIconSidebarSimple} /></button></div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px overflow-clip px-[20px] relative w-full" data-node-id="536:18325" data-name="Chat Area">{messagesData.thread.length ? messagesData.thread.map((item) => <BubbleChat key={item.id} className={item.own ? 'content-stretch flex items-end justify-end py-[4px] relative shrink-0 w-full' : 'content-stretch flex items-start py-[4px] relative shrink-0 w-full'} message={item.text} showImage={false} showChecks={item.own && item.receipt === 'Leído'} time={item.time + (item.own ? ' · ' + item.receipt : '')} type={item.own ? '1' : '2'} />) : <FigmaMessagesEmptyThread />}</div>
            <div className="content-stretch flex flex-col items-start p-[16px] relative shrink-0 w-full" data-node-id="536:18336" data-name="Footer">
              <div className="bg-white content-stretch flex items-center overflow-clip pl-[4px] pr-[9px] py-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="536:18337" data-name="Type Board"><FigmaMessagesCompose /></div>
            </div>
            <div className="absolute bg-[rgba(39,41,50,0.08)] h-[1062px] left-0 top-0 w-[399px]" data-node-id="536:18715" data-name="BG" />
            <div className="-translate-x-1/2 absolute bg-white content-stretch flex flex-col gap-[24px] items-start left-1/2 p-[16px] rounded-[16px] top-[16px] w-[367px]" data-node-id="536:18570" data-name="Center Section"><FigmaMessagesProfile /></div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="433:18681" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="433:18682" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="433:18683">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="433:18684" data-name="Links">
              <p className="relative shrink-0" data-node-id="433:18685">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="433:18686">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="433:18687">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="433:18688" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="433:18689" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:18690" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:18691" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:18692" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:18693" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
