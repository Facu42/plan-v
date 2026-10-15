import { FigmaInsightDetail } from '../FigmaInsights';
const assetPathPrefix = "/figma/screens/InsightDetailsMobile";
const imgNumber = `${assetPathPrefix}/41ecb.svg`;
const imgIconArrowLeft = `${assetPathPrefix}/7ecad.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
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

export default function Component36InsightDetailsMobile() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="507:17412" data-name="36. Insight Details (Mobile)">
      <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="507:17413" data-name="Navbar">
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I507:17413;463:14294" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I507:17413;463:14295" data-name="Icon/ArrowLeft">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I507:17413;463:14287">
          Detalle del consejo
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I507:17413;463:14288" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I507:17413;463:14289" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[24px] items-start overflow-clip pb-[24px] relative shrink-0 w-full" data-node-id="507:17414" data-name="Content"><FigmaInsightDetail variant="mobile" />
        <footer className="nv-detail-mobile-footer" data-node-id="507:17487" data-name="Section Footer"><div data-node-id="507:17488" data-name="Legal Information"><strong>© 2026 Plan V</strong><span>Política de privacidad</span><span>Términos y condiciones</span><span>Contacto</span></div><div data-node-id="507:17494" data-name="Social Media"><img src={imgFacebookLogo} alt="" /><img src={imgTwitterLogo} alt="" /><img src={imgInstagramLogo} alt="" /><img src={imgYoutubeLogo} alt="" /><img src={imgLinkedinLogo} alt="" /></div></footer>
      </div>
    </div>
  );
}
