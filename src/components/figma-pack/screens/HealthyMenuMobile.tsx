import { FigmaMenuAside, FigmaMenuFeatured, FigmaMenuFilterTrigger, FigmaMenuViewToggle, FigmaMenuFilters, FigmaMenuHeaderSearch, FigmaMenuList, FigmaMenuSort } from '../FigmaHealthyMenu';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/HealthyMenuMobile";
const imgIconSpecialFire = `${assetPathPrefix}/36850.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgStar = `${assetPathPrefix}/c88d0.svg`;
const imgIconNavChartBar = `${assetPathPrefix}/de48f.svg`;
const imgIconSpecialHeartbeat = `${assetPathPrefix}/a0ae2.svg`;
const imgIconSpecialCookingPot = `${assetPathPrefix}/b3caf.svg`;
const imgIconSpecialListNumbers = `${assetPathPrefix}/b5ce2.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/bb986.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/a4b28.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/871ca.svg`;
const imgIconFunnel = `${assetPathPrefix}/e3085.svg`;
const imgIconCaretDown = `${assetPathPrefix}/8e5ed.svg`;
const imgIconChartBar = `${assetPathPrefix}/f55c9.svg`;
const imgIconSpecialFire1 = `${assetPathPrefix}/26c9b.svg`;
const imgSeparator = `${assetPathPrefix}/3dda7.svg`;
const imgIconSpecialBread1 = `${assetPathPrefix}/bcc73.svg`;
const imgIconSpecialFish1 = `${assetPathPrefix}/f2e93.svg`;
const imgIconSpecialDrop1 = `${assetPathPrefix}/b6c86.svg`;
const imgIconPlus = `${assetPathPrefix}/84d5e.svg`;
const imgIconPlus1 = `${assetPathPrefix}/2ac73.svg`;
const imgDivider = `${assetPathPrefix}/31a56.svg`;
const imgIconSpecialFire2 = `${assetPathPrefix}/36936.svg`;
const imgIconSpecialBread2 = `${assetPathPrefix}/0c987.svg`;
const imgIconSpecialFish2 = `${assetPathPrefix}/d6aa7.svg`;
const imgIconSpecialDrop2 = `${assetPathPrefix}/188dc.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemDetailMealValueProps = {
  className?: string;
  amount?: string;
  title?: string;
  unit?: string;
};

function ItemDetailMealValue({ className, amount = "450", title = "Calories", unit = "kcal" }: ItemDetailMealValueProps) {
  return (
    <div className={className || "bg-[#c2e66e] content-stretch flex gap-[8px] h-[314px] items-center p-[12px] relative rounded-[8px] w-[1384px]"} data-node-id="233:8189" data-name="Item Detail Meal Value">
      <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="233:8180" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="233:8181" data-name="Icon/Special/Fire">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
        </div>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="233:8182" data-name="Info">
        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="233:8183">
          {title}
        </p>
        <div className="content-stretch flex gap-[2px] items-baseline relative shrink-0 text-[#272932]" data-node-id="233:8187" data-name="Amount">
          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[14px]" data-node-id="233:8184">
            {amount}
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="233:8186">
            {unit}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Component12HealthyMenuMobile() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="445:10499" data-name="12. Healthy Menu (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="445:10500" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I445:10500;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I445:10500;427:15210" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I445:10500;433:18077">
          Menú saludable
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I445:10500;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I445:10500;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[32px] items-start overflow-clip pb-[24px] relative shrink-0 w-full" data-node-id="445:10501" data-name="Content">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="445:10878" data-name="Widget Featured Menu">
          <div className="bg-white content-stretch flex flex-col gap-[12px] items-start overflow-clip relative shrink-0 w-full" data-node-id="445:10880" data-name="Body"><FigmaMenuFeatured variant="mobile" /></div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-start px-[16px] relative shrink-0 w-full" data-node-id="445:11016" data-name="Widget All Menu">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:11017" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="445:11018" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="445:11019">
                Todos los menús
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="445:11021" data-name="Right Section">
              <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="445:11023" data-name="Button Picker"><FigmaMenuFilterTrigger icon={imgIconFunnel} /></div>
            </div>
          </div>
          <div className="content-stretch flex h-[30px] items-start relative shrink-0 w-full" data-node-id="445:11032" data-name="Left Section">
            <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] gap-[2px] items-start min-w-px relative rounded-[10px]" data-node-id="445:11033" data-name="Segmented Button"><FigmaMenuFilters /></div>
          </div>
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="445:11039" data-name="Right Section">
            <div className="content-stretch flex gap-[10px] items-baseline relative shrink-0" data-node-id="445:11045" data-name="Sort by"><FigmaMenuSort /></div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="445:11050" data-name="List Menu"><FigmaMenuList variant="mobile" /></div>
        </div>
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="445:11785" data-name="Menus">
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-center p-[16px] relative shrink-0 w-full" data-node-id="445:11520" data-name="Widget Popular Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:11521" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I445:11521;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I445:11521;2:4223">
                  Más preparaciones
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I445:11521;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I445:11521;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I445:11521;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="445:11522" data-name="List Menu"><FigmaMenuAside kind="popular" variant="mobile" /></div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-center p-[16px] relative shrink-0 w-full" data-node-id="445:11529" data-name="Widget Recommended Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:11530" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I445:11530;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I445:11530;2:4223">
                  Otras recetas
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I445:11530;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I445:11530;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I445:11530;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="445:11531" data-name="List Menu"><FigmaMenuAside kind="recommended" variant="mobile" /></div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="445:10624" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="445:10625" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="445:10626">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="445:10627" data-name="Links">
              <p className="relative shrink-0" data-node-id="445:10628">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="445:10629">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="445:10630">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="445:10631" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10632" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10633" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10634" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10635" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10636" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
