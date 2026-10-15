import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaMenuAside, FigmaMenuFeatured, FigmaMenuFilterTrigger, FigmaMenuViewToggle, FigmaMenuFilters, FigmaMenuHeaderSearch, FigmaMenuList, FigmaMenuMobileSearch, FigmaMenuSort } from '../FigmaHealthyMenu';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/HealthyMenuTablet";
const imgIconSpecialFire = `${assetPathPrefix}/36850.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/30242.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/f4cb9.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/4a643.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/4c8d1.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/f8978.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/80149.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/56b99.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/7679f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/96a22.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/e9231.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/57698.svg`;
const imgIconBell = `${assetPathPrefix}/4a0c9.svg`;
const imgIconMagnifyingGlass1 = `${assetPathPrefix}/f08ac.svg`;
const imgIconFadersHorizontal = `${assetPathPrefix}/0639e.svg`;
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
const imgIconGridFour = `${assetPathPrefix}/2a9e0.svg`;
const imgIconList = `${assetPathPrefix}/07fed.svg`;
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

export default function Component11HealthyMenuTablet() {
  return (
    <div className="bg-white content-stretch flex items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="445:8608" data-name="11. Healthy Menu (Tablet)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[28px] relative self-stretch shrink-0" data-node-id="445:8609" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[6px] relative shrink-0" data-node-id="I445:8609;408:17341" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I445:8609;408:17342" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative" data-node-id="I445:8609;408:17343" data-name="Menu Nav">
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17344" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17344;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17345" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17345;408:17513" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17346" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17346;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17347" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17347;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17348" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17348;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17349" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17349;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17350" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17350;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17353" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17353;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17354" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17354;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I445:8609;408:17363" data-name="Button Nav">
          <div className="relative shrink-0 size-[18px]" data-node-id="I445:8609;408:17363;408:17518" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
        </div>
      </div>
      <div className="border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px overflow-clip p-[28px] relative self-stretch" data-node-id="445:8947" data-name="Content">
        <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="445:8948" data-name="Header">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px py-[2px] relative" data-node-id="I445:8948;418:13843" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="I445:8948;418:13844">
              Menú saludable
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I445:8948;418:13846" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I445:8948;418:13854" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I445:8948;418:13854;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I445:8948;418:13855" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I445:8948;418:13855;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I445:8948;418:13855;2:3559" />
            </div>
            <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I445:8948;418:13857" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I445:8948;418:13857;2:3114" data-name="User Image/12">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I445:8948;418:13857;2:3114;2:3159" data-name="Place Image Here" />
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0 w-full" data-node-id="445:9373" data-name="Header Menu"><FigmaMenuHeaderSearch searchIcon={imgIconMagnifyingGlass1} filterIcon={imgIconFadersHorizontal} nodeIds={{ search: '445:9374', filter: '445:9375', plan: '445:9376' }} /></div>
        <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full" data-node-id="445:10009" data-name="Body">
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="445:9389" data-name="Widget Featured Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:9390" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-405px] relative shrink-0" data-node-id="I445:9390;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I445:9390;2:4223">
                  Menú destacado
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I445:9390;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I445:9390;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I445:9390;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col gap-[12px] items-start overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="445:9391" data-name="Body"><FigmaMenuFeatured variant="tablet" /></div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="445:9418" data-name="Widget All Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:9419" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="445:9420" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="445:9421">
                  Todos los menús
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="445:9423" data-name="Right Section">
                <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="445:9425" data-name="Button Picker"><FigmaMenuFilterTrigger icon={imgIconFunnel} /></div>
                <div className="bg-[#f6f6f7] content-stretch flex items-start relative rounded-[10px] shrink-0" data-node-id="445:9426" data-name="Segmented Button"><FigmaMenuViewToggle gridIcon={imgIconGridFour} listIcon={imgIconList} /></div>
              </div>
            </div>
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:9433" data-name="Header-Section">
              <div className="content-stretch flex h-[30px] items-start relative shrink-0" data-node-id="445:9434" data-name="Left Section">
                <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-start relative rounded-[10px] shrink-0" data-node-id="445:9435" data-name="Segmented Button"><FigmaMenuFilters /></div>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="445:9441" data-name="Right Section">
                <div className="content-stretch flex gap-[10px] items-baseline relative shrink-0" data-node-id="445:9447" data-name="Sort by">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="445:9448"><FigmaMenuSort /></p>
                  <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="445:9449" data-name="Button Picker">
                    <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I445:9449;2:3476" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I445:9449;2:3477">
                        Calorías
                      </p>
                    </div>
                    <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I445:9449;2:3478" data-name="Icon">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I445:9449;2:3479" data-name="Icon/CaretDown">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="445:9452" data-name="List Menu"><FigmaMenuList variant="tablet" /></div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:10010" data-name="Widget Popular Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:10011" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-437px] relative shrink-0" data-node-id="I445:10011;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I445:10011;2:4223">
                  Más preparaciones
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I445:10011;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I445:10011;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I445:10011;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="445:10012" data-name="List Menu"><FigmaMenuAside kind="popular" variant="tablet" /></div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:10144" data-name="Widget Recommended Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:10145" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-437px] relative shrink-0" data-node-id="I445:10145;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I445:10145;2:4223">
                  Otras recetas
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I445:10145;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I445:10145;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I445:10145;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="445:10146" data-name="List Menu"><FigmaMenuAside kind="recommended" variant="tablet" /></div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="445:9081" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="445:9082" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="445:9083">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="445:9084" data-name="Links">
              <p className="relative shrink-0" data-node-id="445:9085">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="445:9086">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="445:9087">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="445:9088" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="445:9089" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:9090" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:9091" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:9092" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:9093" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
