import { FigmaInsightsMain, FigmaInsightsAside } from '../FigmaInsights';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/InsightsMobile";
const imgIconList = `${assetPathPrefix}/91e78.svg`;
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
  align?: "Horizontal";
  amount?: string;
  category?: string;
  tags?: string;
};

function ItemListTrendingTags({ className, align = "Horizontal", amount = "15 posts", category = "Mental Health & Wellness", tags = "#PostWorkoutNutrition" }: ItemListTrendingTagsProps) {
  return (
    <div className={className || "border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between py-[8px] relative w-[408px]"} data-node-id="507:16554">
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="507:16555">
        {tags}
      </p>
      <div className="content-stretch flex flex-col gap-[2px] items-end relative shrink-0" data-node-id="507:16556" data-name="Header">
        <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="507:16557" data-name="Info Category">
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#73a107] text-[11px] whitespace-nowrap" data-node-id="507:16558">
            {category}
          </p>
        </div>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic overflow-hidden relative shrink-0 text-[#8a8c90] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="507:16560">
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

export default function Component33InsightsMobile() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="504:15334" data-name="33. Insights (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="504:15335" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I504:15335;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I504:15335;427:15210" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I504:15335;433:18077">
          Consejos de salud
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I504:15335;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I504:15335;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="bg-white content-stretch flex flex-col gap-[24px] items-start overflow-clip pb-[24px] relative shrink-0 w-full" data-node-id="504:15336" data-name="Content"><FigmaInsightsMain variant="mobile" /><FigmaInsightsAside variant="mobile" />
        <footer className="nv-insights-mobile-footer" data-node-id="504:15358" data-name="Section Footer"><div data-node-id="504:15359" data-name="Legal Information"><strong>© 2026 Plan V</strong><span>Política de privacidad</span><span>Términos y condiciones</span><span>Contacto</span></div><div data-node-id="504:15365" data-name="Social Media"><img src={imgFacebookLogo} alt="" /><img src={imgTwitterLogo} alt="" /><img src={imgInstagramLogo} alt="" /><img src={imgYoutubeLogo} alt="" /><img src={imgLinkedinLogo} alt="" /></div></footer>
      </div>
    </div>
  );
}
