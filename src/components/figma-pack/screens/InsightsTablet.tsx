import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaInsightsMain, FigmaInsightsAside } from '../FigmaInsights';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/InsightsTablet";
const imgSeparator = `${assetPathPrefix}/84e4a.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/30242.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/f4cb9.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/4a643.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/d074c.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/f8978.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/80149.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/56b99.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/7679f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/4e45f.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/e9231.svg`;
const imgIconBell = `${assetPathPrefix}/4a0c9.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/44561.svg`;
const imgEllipse4 = `${assetPathPrefix}/b94c5.svg`;
const imgPlay = `${assetPathPrefix}/2a6ab.svg`;
const imgPlay1 = `${assetPathPrefix}/3eeb9.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemListTrendingTagsProps = {
  className?: string;
  align?: "Vertical";
  amount?: string;
  category?: string;
  tags?: string;
};

function ItemListTrendingTags({ className, align = "Vertical", amount = "15 posts", category = "Mental Health & Wellness", tags = "#PostWorkoutNutrition" }: ItemListTrendingTagsProps) {
  return (
    <div className={className || "border-[#e1e1e2] border-b border-solid content-stretch flex flex-col gap-[6px] items-start pb-[16px] relative w-[289px]"} data-node-id="276:8457">
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="276:8437">
        {tags}
      </p>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="276:8451" data-name="Header">
        <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="276:8452" data-name="Info Category">
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="276:8453">
            {category}
          </p>
        </div>
        <div className="relative shrink-0 size-[4px]" data-node-id="276:8454" data-name="Separator">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSeparator} />
        </div>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic overflow-hidden relative shrink-0 text-[#8a8c90] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="276:8455">
          {amount}
        </p>
      </div>
    </div>
  );
}

function ChipsCategory({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px]"} data-node-id="264:8052" data-name="Chips Category">
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="264:8051">
        Tendencias
      </p>
    </div>
  );
}

export default function Component32InsightsTablet() {
  return (
    <div className="bg-white content-stretch flex items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="501:24021" data-name="32. Insights (Tablet)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[28px] relative self-stretch shrink-0" data-node-id="501:24022" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[6px] relative shrink-0" data-node-id="I501:24022;408:17341" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I501:24022;408:17342" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative" data-node-id="I501:24022;408:17343" data-name="Menu Nav">
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17344" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17344;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17345" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17345;408:17513" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17346" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17346;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17347" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17347;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17348" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17348;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17349" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17349;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17350" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17350;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17353" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17353;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17354" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17354;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I501:24022;408:17363" data-name="Button Nav">
          <div className="relative shrink-0 size-[18px]" data-node-id="I501:24022;408:17363;408:17518" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
        </div>
      </div>
      <div className="border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="501:24023" data-name="Content">
        <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="501:24024" data-name="Header">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px py-[2px] relative" data-node-id="I501:24024;418:13843" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="I501:24024;418:13844">
              ​
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I501:24024;418:13846" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:24024;418:13855" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I501:24024;418:13855;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I501:24024;418:13855;2:3559" />
            </div>
            <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I501:24024;418:13857" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I501:24024;418:13857;2:3114" data-name="User Image/12">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I501:24024;418:13857;2:3114;2:3159" data-name="Place Image Here" />
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-node-id="501:24025" data-name="Body"><FigmaInsightsMain variant="tablet" /></div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[32px] items-start p-[28px] relative rounded-[16px] shrink-0 w-full" data-node-id="504:15144" data-name="Right Side"><FigmaInsightsAside variant="tablet" /></div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="504:15120" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="504:15121" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="504:15122">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="504:15123" data-name="Links">
              <p className="relative shrink-0" data-node-id="504:15124">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="504:15125">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="504:15126">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="504:15127" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15128" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15129" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15130" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15131" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15132" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
