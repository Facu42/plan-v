import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaInsightDetail } from '../FigmaInsights';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/InsightDetailsTablet";
const imgNumber = `${assetPathPrefix}/41ecb.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/30242.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/d5f5f.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/4a643.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/d074c.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/f8978.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/80149.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/56b99.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/7679f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/96a22.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/e9231.svg`;
const imgIconArrowLeft = `${assetPathPrefix}/4a093.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/57698.svg`;
const imgIconBell = `${assetPathPrefix}/4a0c9.svg`;
const imgEllipse4 = `${assetPathPrefix}/b94c5.svg`;
const imgIconLink = `${assetPathPrefix}/e1e1f.svg`;
const imgIconFacebookLogo = `${assetPathPrefix}/74650.svg`;
const imgIconInstagramLogo = `${assetPathPrefix}/b8fc5.svg`;
const imgIconTwitterLogo = `${assetPathPrefix}/51979.svg`;
const imgPlay = `${assetPathPrefix}/e6a2a.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemListTextParagraphProps = {
  className?: string;
  number?: string;
  text?: string;
  type?: "Number" | "Bullet";
};

function ItemListTextParagraph({ className, number = "1.", text = "Regulates Body Temperature: Water is crucial for maintaining body temperature, especially during exercise or in hot environments.", type = "Number" }: ItemListTextParagraphProps) {
  const isBullet = type === "Bullet";
  return (
    <div className={className || "content-stretch flex gap-[4px] items-start px-[8px] relative w-[698px]"} id={isBullet ? "node-286_7198" : "node-286_7138"}>
      <div className={`relative shrink-0 ${isBullet ? "size-[20px]" : "content-stretch flex flex-col items-center justify-center px-[6px] py-px rounded-[20px] w-[20px]"}`} id={isBullet ? "node-286_7199" : "node-286_7134"} data-name="Number">
        {type === "Number" && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#52545b] text-[14px] text-center w-[16px]" data-node-id="286:7135">
            {number}
          </p>
        )}
        {isBullet && <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgNumber} />}
      </div>
      <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative" id={isBullet ? "node-286_7201" : "node-286_7137"} data-name="Text">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.4] min-w-px not-italic relative text-[#52545b] text-[14px]" data-node-id="286:7136">
          {text}
        </p>
      </div>
    </div>
  );
}

export default function Component35InsightDetailsTablet() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="507:16615" data-name="35. Insight Details (Tablet)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[28px] relative self-stretch shrink-0" data-node-id="507:16616" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[6px] relative shrink-0" data-node-id="I507:16616;408:17341" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I507:16616;408:17342" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative" data-node-id="I507:16616;408:17343" data-name="Menu Nav">
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17344" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17344;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17345" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17345;408:17513" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17346" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17346;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17347" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17347;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17348" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17348;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17349" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17349;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17350" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17350;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17353" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17353;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17354" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17354;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I507:16616;408:17363" data-name="Button Nav">
          <div className="relative shrink-0 size-[18px]" data-node-id="I507:16616;408:17363;408:17518" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px overflow-clip p-[28px] relative self-stretch" data-node-id="507:16617" data-name="Content">
        <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="507:16618" data-name="Header">
          <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px py-[2px] relative" data-node-id="I507:16618;453:12764" data-name="Title">
            <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I507:16618;453:12781" data-name="Button Icon">
              <div className="relative shrink-0 size-[24px]" data-node-id="I507:16618;453:12781;2:3576" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] whitespace-nowrap" data-node-id="I507:16618;453:12765">
              Detalle del consejo
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I507:16618;453:12767" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I507:16618;453:12768" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I507:16618;453:12768;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I507:16618;453:12769" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I507:16618;453:12769;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I507:16618;453:12769;2:3559" />
            </div>
            <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I507:16618;453:12770" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I507:16618;453:12770;2:3114" data-name="User Image/12">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I507:16618;453:12770;2:3114;2:3159" data-name="Place Image Here" />
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start min-h-[888px] relative rounded-[16px] shrink-0 w-full" data-node-id="507:16619" data-name="Body"><FigmaInsightDetail variant="tablet" /></div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="507:16641" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="507:16642" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="507:16643">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="507:16644" data-name="Links">
              <p className="relative shrink-0" data-node-id="507:16645">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="507:16646">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="507:16647">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="507:16648" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="507:16649" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="507:16650" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="507:16651" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="507:16652" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="507:16653" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
