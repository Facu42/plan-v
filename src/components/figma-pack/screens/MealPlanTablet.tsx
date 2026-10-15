import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { useFigmaMealPlan } from '../FigmaMealPlan';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/MealPlanTablet";
const imgIconCaretDown = `${assetPathPrefix}/8e5ed.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/30242.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/f4cb9.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/4a643.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/d074c.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/ce164.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/80149.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/56b99.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/7679f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/96a22.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/e9231.svg`;
const imgIconBell = `${assetPathPrefix}/4a0c9.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/44561.svg`;
const imgIconFunnel = `${assetPathPrefix}/b7cbe.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type TableRowMealPlanProps = {
  className?: string;
  size?: "Small";
  type?: "Head";
};

function TableRowMealPlan({ className, size = "Small", type = "Head" }: TableRowMealPlanProps) {
  return (
    <div className={className || "content-stretch flex gap-[16px] items-center relative w-[668px]"} data-node-id="463:15269">
      <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start px-[16px] relative rounded-[14px] shrink-0 w-[108px]" data-node-id="463:15270" data-name="Cell-X-Picker">
        <div className="content-stretch flex items-center justify-between px-[2px] py-[6px] relative shrink-0 w-full" data-node-id="463:15271" data-name="Button Picker">
          <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I463:15271;2:3534" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I463:15271;2:3535">
              Semana actual
            </p>
          </div>
          <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I463:15271;2:3536" data-name="Icon">
            <div className="relative shrink-0 size-[14px]" data-node-id="I463:15271;2:3537" data-name="Icon/CaretDown">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px overflow-clip px-[10px] py-[8px] relative rounded-[14px]" data-node-id="463:15272" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="463:15273">
          Desayuno
        </p>
      </div>
      <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px overflow-clip px-[10px] py-[8px] relative rounded-[14px]" data-node-id="463:15274" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="463:15275">
          Almuerzo
        </p>
      </div>
      <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px overflow-clip px-[10px] py-[8px] relative rounded-[14px]" data-node-id="463:15276" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="463:15277">
          Colación
        </p>
      </div>
      <div className="bg-[#e1e1e2] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px overflow-clip px-[10px] py-[8px] relative rounded-[14px]" data-node-id="463:15278" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="463:15279">
          Cena
        </p>
      </div>
    </div>
  );
}

export default function Component17MealPlanTablet() {
  const plan = useFigmaMealPlan();
  return (
    <div className="bg-white content-stretch flex items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="463:14306" data-name="17. Meal Plan (Tablet)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[28px] relative self-stretch shrink-0" data-node-id="463:14307" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[6px] relative shrink-0" data-node-id="I463:14307;408:17341" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I463:14307;408:17342" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative" data-node-id="I463:14307;408:17343" data-name="Menu Nav">
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17344" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17344;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17345" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17345;408:17513" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17346" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17346;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17347" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17347;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17348" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17348;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17349" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17349;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17350" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17350;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17353" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17353;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
          </div>
          <div className="content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17354" data-name="Button Nav">
            <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17354;408:17518" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex items-center p-[8px] relative rounded-[12px] shrink-0 w-full" data-node-id="I463:14307;408:17363" data-name="Button Nav">
          <div className="relative shrink-0 size-[18px]" data-node-id="I463:14307;408:17363;408:17518" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
        </div>
      </div>
      <div className="border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px overflow-clip p-[28px] relative self-stretch" data-node-id="463:14308" data-name="Content">
        <div className="content-stretch flex h-[36px] items-center justify-between relative shrink-0 w-full" data-node-id="463:14309" data-name="Header">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px py-[2px] relative" data-node-id="I463:14309;418:13843" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="I463:14309;418:13844">
              Plan de comidas
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-start justify-end relative rounded-[28px] shrink-0" data-node-id="I463:14309;418:13846" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="I463:14309;418:13855" data-name="Button Icon">
              <div className="relative shrink-0 size-[20px]" data-node-id="I463:14309;418:13855;2:3558" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[2px] size-[20px] top-[2px]" nodeId="I463:14309;418:13855;2:3559" />
            </div>
            <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I463:14309;418:13857" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I463:14309;418:13857;2:3114" data-name="User Image/12">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I463:14309;418:13857;2:3114;2:3159" data-name="Place Image Here" />
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full" data-node-id="463:14310" data-name="Body">
          <div className="bg-[#f9f4f2] content-stretch flex items-center justify-between p-[12px] relative rounded-[14px] shrink-0 w-full" data-node-id="463:14767" data-name="Header-Section">
            <div className="content-stretch flex items-center relative shrink-0" data-node-id="463:14768" data-name="Left Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-center relative shrink-0" data-node-id="463:14772" data-name="Div Title">
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-center leading-[1.25] not-italic relative shrink-0 text-[14px] whitespace-nowrap" data-node-id="463:14773" data-name="Title">
                  <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="463:14774">{plan.month}</p>
                  <p className="font-['Poppins:Regular'] relative shrink-0 text-[#868f9b]" data-node-id="463:14775">{plan.year}</p>
                </div>
                <div className="content-stretch flex items-center relative shrink-0" data-node-id="463:14776" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="463:14777" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="463:14778" data-name="Right Section">
              <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="463:14815" data-name="Button Picker" role="button" tabIndex={0} aria-label="Buscar en el plan" onClick={plan.openSearch} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openSearch(); } }}>
                <div className="relative shrink-0 size-[18px]" data-node-id="I463:14815;2:3578" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                </div>
              </div>
              <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="463:14831" data-name="Button Picker" role="button" tabIndex={0} aria-label="Filtrar comidas" onClick={plan.openFilter} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openFilter(); } }}>
                <div className="relative shrink-0 size-[18px]" data-node-id="I463:14831;2:3578" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFunnel} />
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="463:14786" data-name="Button CTA" role="button" tabIndex={0} onClick={plan.openShopping} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openShopping(); } }}>
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I463:14786;2:3331" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I463:14786;2:3332">
                    Lista de compras
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="463:14835" data-name="Table">
            <TableRowMealPlan className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" />
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="463:14837" data-name="Table-row-meal plan">
              <div className="flex flex-row items-center self-stretch" data-node-id="I463:14837;463:15050">
                <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col gap-[8px] h-full items-start not-italic p-[16px] relative rounded-[14px] shrink-0 w-[108px]" data-name="Cell-Y - Meal Plan">
                  <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I463:14837;463:15051">{plan.days[0]?.day ?? ''}</p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I463:14837;463:15052">{plan.days[0]?.date ?? ''}</p>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14837;463:15053">
                <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(0, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(0, 'Desayuno'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14837;463:15054" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14837;463:15055" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14837;463:15055;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14837;463:15056" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14837;463:15057">{plan.mealTitle(0, 'Desayuno')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14837;463:15058">
                <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(0, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(0, 'Almuerzo'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14837;463:15059" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14837;463:15060" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14837;463:15060;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14837;463:15061" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14837;463:15062">{plan.mealTitle(0, 'Almuerzo')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14837;463:15063">
                <div className="bg-[#fff2e8] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(0, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(0, 'Colación'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14837;463:15064" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14837;463:15065" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14837;463:15065;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14837;463:15066" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14837;463:15067">{plan.mealTitle(0, 'Colación')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14837;463:15068">
                <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(0, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(0, 'Cena'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14837;463:15069" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14837;463:15070" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14837;463:15070;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14837;463:15071" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14837;463:15072">{plan.mealTitle(0, 'Cena')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="463:14838" data-name="Table-row-meal plan">
              <div className="flex flex-row items-center self-stretch" data-node-id="I463:14838;463:15050">
                <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col gap-[8px] h-full items-start not-italic p-[16px] relative rounded-[14px] shrink-0 w-[108px]" data-name="Cell-Y - Meal Plan">
                  <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I463:14838;463:15051">{plan.days[1]?.day ?? ''}</p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I463:14838;463:15052">{plan.days[1]?.date ?? ''}</p>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14838;463:15053">
                <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(1, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(1, 'Desayuno'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14838;463:15054" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14838;463:15055" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14838;463:15055;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14838;463:15056" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14838;463:15057">{plan.mealTitle(1, 'Desayuno')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14838;463:15058">
                <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(1, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(1, 'Almuerzo'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14838;463:15059" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14838;463:15060" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14838;463:15060;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14838;463:15061" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14838;463:15062">{plan.mealTitle(1, 'Almuerzo')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14838;463:15063">
                <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(1, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(1, 'Colación'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14838;463:15064" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14838;463:15065" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14838;463:15065;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14838;463:15066" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14838;463:15067">{plan.mealTitle(1, 'Colación')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14838;463:15068">
                <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(1, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(1, 'Cena'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14838;463:15069" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14838;463:15070" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14838;463:15070;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14838;463:15071" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14838;463:15072">{plan.mealTitle(1, 'Cena')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="463:14839" data-name="Table-row-meal plan">
              <div className="flex flex-row items-center self-stretch" data-node-id="I463:14839;463:15050">
                <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col gap-[8px] h-full items-start not-italic p-[16px] relative rounded-[14px] shrink-0 w-[108px]" data-name="Cell-Y - Meal Plan">
                  <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I463:14839;463:15051">{plan.days[2]?.day ?? ''}</p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I463:14839;463:15052">{plan.days[2]?.date ?? ''}</p>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14839;463:15053">
                <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(2, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(2, 'Desayuno'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14839;463:15054" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14839;463:15055" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14839;463:15055;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14839;463:15056" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14839;463:15057">{plan.mealTitle(2, 'Desayuno')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14839;463:15058">
                <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(2, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(2, 'Almuerzo'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14839;463:15059" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14839;463:15060" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14839;463:15060;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14839;463:15061" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14839;463:15062">{plan.mealTitle(2, 'Almuerzo')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14839;463:15063">
                <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(2, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(2, 'Colación'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14839;463:15064" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14839;463:15065" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14839;463:15065;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14839;463:15066" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14839;463:15067">{plan.mealTitle(2, 'Colación')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14839;463:15068">
                <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(2, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(2, 'Cena'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14839;463:15069" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14839;463:15070" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14839;463:15070;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14839;463:15071" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14839;463:15072">{plan.mealTitle(2, 'Cena')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="463:14840" data-name="Table-row-meal plan">
              <div className="flex flex-row items-center self-stretch" data-node-id="I463:14840;463:15050">
                <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col gap-[8px] h-full items-start not-italic p-[16px] relative rounded-[14px] shrink-0 w-[108px]" data-name="Cell-Y - Meal Plan">
                  <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I463:14840;463:15051">{plan.days[3]?.day ?? ''}</p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I463:14840;463:15052">{plan.days[3]?.date ?? ''}</p>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14840;463:15053">
                <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(3, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(3, 'Desayuno'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14840;463:15054" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14840;463:15055" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14840;463:15055;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14840;463:15056" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14840;463:15057">{plan.mealTitle(3, 'Desayuno')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14840;463:15058">
                <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(3, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(3, 'Almuerzo'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14840;463:15059" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14840;463:15060" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14840;463:15060;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14840;463:15061" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14840;463:15062">{plan.mealTitle(3, 'Almuerzo')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14840;463:15063">
                <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(3, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(3, 'Colación'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14840;463:15064" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14840;463:15065" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14840;463:15065;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14840;463:15066" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14840;463:15067">{plan.mealTitle(3, 'Colación')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14840;463:15068">
                <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(3, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(3, 'Cena'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14840;463:15069" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14840;463:15070" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14840;463:15070;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14840;463:15071" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14840;463:15072">{plan.mealTitle(3, 'Cena')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="463:14841" data-name="Table-row-meal plan">
              <div className="flex flex-row items-center self-stretch" data-node-id="I463:14841;463:15050">
                <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col gap-[8px] h-full items-start not-italic p-[16px] relative rounded-[14px] shrink-0 w-[108px]" data-name="Cell-Y - Meal Plan">
                  <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I463:14841;463:15051">{plan.days[4]?.day ?? ''}</p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I463:14841;463:15052">{plan.days[4]?.date ?? ''}</p>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14841;463:15053">
                <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(4, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(4, 'Desayuno'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14841;463:15054" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14841;463:15055" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14841;463:15055;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14841;463:15056" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14841;463:15057">{plan.mealTitle(4, 'Desayuno')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14841;463:15058">
                <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(4, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(4, 'Almuerzo'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14841;463:15059" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14841;463:15060" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14841;463:15060;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14841;463:15061" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14841;463:15062">{plan.mealTitle(4, 'Almuerzo')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14841;463:15063">
                <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(4, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(4, 'Colación'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14841;463:15064" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14841;463:15065" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14841;463:15065;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14841;463:15066" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14841;463:15067">{plan.mealTitle(4, 'Colación')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14841;463:15068">
                <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(4, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(4, 'Cena'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14841;463:15069" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14841;463:15070" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14841;463:15070;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14841;463:15071" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14841;463:15072">{plan.mealTitle(4, 'Cena')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="463:14842" data-name="Table-row-meal plan">
              <div className="flex flex-row items-center self-stretch" data-node-id="I463:14842;463:15050">
                <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col gap-[8px] h-full items-start not-italic p-[16px] relative rounded-[14px] shrink-0 w-[108px]" data-name="Cell-Y - Meal Plan">
                  <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I463:14842;463:15051">{plan.days[5]?.day ?? ''}</p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I463:14842;463:15052">{plan.days[5]?.date ?? ''}</p>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14842;463:15053">
                <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(5, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(5, 'Desayuno'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14842;463:15054" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14842;463:15055" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14842;463:15055;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14842;463:15056" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14842;463:15057">{plan.mealTitle(5, 'Desayuno')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14842;463:15058">
                <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(5, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(5, 'Almuerzo'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14842;463:15059" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14842;463:15060" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14842;463:15060;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14842;463:15061" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14842;463:15062">{plan.mealTitle(5, 'Almuerzo')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14842;463:15063">
                <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(5, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(5, 'Colación'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14842;463:15064" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14842;463:15065" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14842;463:15065;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14842;463:15066" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14842;463:15067">{plan.mealTitle(5, 'Colación')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14842;463:15068">
                <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(5, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(5, 'Cena'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14842;463:15069" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14842;463:15070" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14842;463:15070;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14842;463:15071" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14842;463:15072">{plan.mealTitle(5, 'Cena')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="463:14843" data-name="Table-row-meal plan">
              <div className="flex flex-row items-center self-stretch" data-node-id="I463:14843;463:15050">
                <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col gap-[8px] h-full items-start not-italic p-[16px] relative rounded-[14px] shrink-0 w-[108px]" data-name="Cell-Y - Meal Plan">
                  <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I463:14843;463:15051">{plan.days[6]?.day ?? ''}</p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I463:14843;463:15052">{plan.days[6]?.date ?? ''}</p>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14843;463:15053">
                <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Breakfast" role="button" tabIndex={0} onClick={() => plan.openMeal(6, 'Desayuno')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(6, 'Desayuno'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14843;463:15054" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14843;463:15055" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14843;463:15055;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14843;463:15056" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14843;463:15057">{plan.mealTitle(6, 'Desayuno')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14843;463:15058">
                <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Lunch" role="button" tabIndex={0} onClick={() => plan.openMeal(6, 'Almuerzo')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(6, 'Almuerzo'); } }}>
                  <div className="bg-[#f9f4f2] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14843;463:15059" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14843;463:15060" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14843;463:15060;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14843;463:15061" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14843;463:15062">{plan.mealTitle(6, 'Almuerzo')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14843;463:15063">
                <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Snack" role="button" tabIndex={0} onClick={() => plan.openMeal(6, 'Colación')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(6, 'Colación'); } }}>
                  <div className="bg-[#f9f4f2] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14843;463:15064" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14843;463:15065" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14843;463:15065;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14843;463:15066" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14843;463:15067">{plan.mealTitle(6, 'Colación')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I463:14843;463:15068">
                <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-px relative rounded-[14px]" data-name="Cell-Menu-Dinner" role="button" tabIndex={0} onClick={() => plan.openMeal(6, 'Cena')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); plan.openMeal(6, 'Cena'); } }}>
                  <div className="bg-[#eeeeef] h-[88px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="I463:14843;463:15069" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14843;463:15070" data-name="Image-Meal Plan">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I463:14843;463:15070;93:3927" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center p-[12px] relative shrink-0 w-full" data-node-id="I463:14843;463:15071" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="I463:14843;463:15072">{plan.mealTitle(6, 'Cena')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="463:14506" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="463:14507" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="463:14508">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="463:14509" data-name="Links">
              <p className="relative shrink-0" data-node-id="463:14510">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="463:14511">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="463:14512">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="463:14513" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="463:14514" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="463:14515" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="463:14516" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="463:14517" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="463:14518" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
