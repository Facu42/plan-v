import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaDiaryMetric, FigmaDiaryPagination, FigmaDiaryTable, FigmaDiaryToolbar } from '../FigmaFoodDiary';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/FoodDiary";
const imgStateDefaultSizeDefault = `${assetPathPrefix}/14b51.svg`;
const imgIconSort = `${assetPathPrefix}/5ef2f.svg`;
const imgIconNote = `${assetPathPrefix}/59f84.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/22b1d.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/ac3fd.svg`;
const imgIconCaretDown = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/4fef5.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgIconSpecialFire = `${assetPathPrefix}/5b866.svg`;
const imgIconTrendUp = `${assetPathPrefix}/dd2f5.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/e0a2c.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/fe941.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/fd123.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconFunnel = `${assetPathPrefix}/e3085.svg`;
const imgIconCaretDown2 = `${assetPathPrefix}/8e5ed.svg`;
const imgIconCalendarBlank = `${assetPathPrefix}/145ae.svg`;
const imgIconPlus = `${assetPathPrefix}/6e435.svg`;
const imgCheckbox = `${assetPathPrefix}/be0f6.svg`;
const imgCheckbox1 = `${assetPathPrefix}/a4d92.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/40729.svg`;
const imgIconCaretRight = `${assetPathPrefix}/27dfe.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type CheckboxProps = {
  className?: string;
  size?: "Default";
  state?: "Default";
};

function Checkbox({ className, size = "Default", state = "Default" }: CheckboxProps) {
  return (
    <div className={className || "relative size-[12px]"} data-node-id="2:3983">
      <div className="absolute inset-[-8.33%]">
        <img alt="" className="block max-w-none size-full" src={imgStateDefaultSizeDefault} />
      </div>
    </div>
  );
}

type BadgeCategoryMealTimeProps = {
  className?: string;
  status?: "Breakfast";
};

function BadgeCategoryMealTime({ className, status = "Breakfast" }: BadgeCategoryMealTimeProps) {
  return (
    <div className={className || "bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px]"} data-node-id="143:4943">
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="143:4944">
        Desayuno
      </p>
    </div>
  );
}

type TableRowFoodDiaryProps = {
  className?: string;
  amount?: string;
  amountUnit?: string;
  calories?: string;
  carbs?: string;
  date?: string;
  fats?: string;
  menu?: string;
  protein?: string;
  sugar?: string;
  thought?: string;
  time?: string;
  type?: "Body" | "Head";
};

function TableRowFoodDiary({ className, amount = "2", amountUnit = "Serving", calories = "50", carbs = "50", date = "2028-09-01", fats = "50", menu = "Scrambled Eggs with Spinach & Whole Grain Toast", protein = "50", sugar = "50", thought = "Uncomfortable", time = "12:30 PM", type = "Head" }: TableRowFoodDiaryProps) {
  const isBody = type === "Body";
  const isHead = type === "Head";
  return (
    <div className={className || `border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-[1166px] ${isBody ? "bg-white" : ""}`} id={isBody ? "node-141_4185" : "node-141_4163"}>
      <Checkbox className="relative shrink-0 size-[12px]" />
      <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" id={isBody ? "node-152_4500" : "node-152_5845"} data-name="Cells">
        <div className={`content-stretch flex items-start relative shrink-0 w-[82px] ${isBody ? '[word-break:break-word] flex-col font-["Poppins:Regular"] gap-[4px] justify-center leading-[1.3] not-italic text-[12px] whitespace-nowrap' : ""}`} id={isBody ? "node-141_4204" : "node-141_4176"} data-name="Cell-Date">
          {isHead && (
            <>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="141:4177">{`Fecha y hora`}</p>
              <div className="relative shrink-0 size-[14px]" data-node-id="141:4178" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </>
          )}
          {isBody && (
            <>
              <p className="relative shrink-0 text-[#272932]" data-node-id="141:4206">
                {date}
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="146:4576">
                {time}
              </p>
            </>
          )}
        </div>
        <div className="content-stretch flex items-start relative shrink-0 w-[78px]" id={isBody ? "node-141_4190" : "node-141_4167"} data-name="Cell-Category">
          {isHead && (
            <>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="141:4168">
                Categoría
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="141:4169" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </>
          )}
          {isBody && <BadgeCategoryMealTime className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" />}
        </div>
        <div className={`content-stretch flex relative shrink-0 w-[176px] ${isBody ? "items-center" : "items-start"}`} id={isBody ? "node-141_4186" : "node-141_4164"} data-name="Cell-Menu">
          {isHead && (
            <>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="141:4165">
                Menú
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="141:4166" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </>
          )}
          {isBody && (
            <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="141:4189">
              {menu}
            </p>
          )}
        </div>
        <div className={`content-stretch flex relative shrink-0 w-[58px] ${isBody ? '[word-break:break-word] font-["Poppins:Regular"] gap-[4px] items-center leading-[1.3] not-italic text-[12px] whitespace-nowrap' : "items-start"}`} id={isBody ? "node-141_4207" : "node-141_4179"} data-name="Cell-Amount">
          {isHead && (
            <>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="141:4180">
                Cantidad
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="141:4181" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </>
          )}
          {isBody && (
            <>
              <p className="relative shrink-0 text-[#272932]" data-node-id="141:4209">
                {amount}
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="141:4208">
                {amountUnit}
              </p>
            </>
          )}
        </div>
        <div className={`content-stretch flex items-start relative shrink-0 w-[56px] ${isBody ? '[word-break:break-word] font-["Poppins:Regular"] gap-[4px] leading-[1.3] not-italic text-[12px] whitespace-nowrap' : ""}`} id={isBody ? "node-141_4201" : "node-141_4173"} data-name="Cell-Calories">
          {isHead && (
            <>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="141:4174">
                Calorías
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="141:4175" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </>
          )}
          {isBody && (
            <>
              <p className="relative shrink-0 text-[#272932]" data-node-id="141:4202">
                {calories}
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="146:5003">
                kcal
              </p>
            </>
          )}
        </div>
        <div className={`[word-break:break-word] content-stretch flex font-["Poppins:Regular"] items-center not-italic relative shrink-0 w-[184px] ${isBody ? "gap-[8px] leading-[1.3] rounded-[8px] text-[12px] whitespace-nowrap" : "flex-col gap-[4px] leading-[1.24] text-[#8a8c90] text-[11px]"}`} id={isBody ? "node-141_4192" : "node-141_4170"} data-name="Cell-Qty">
          {isHead && (
            <>
              <p className="relative shrink-0 whitespace-nowrap" data-node-id="141:4171">
                Macronutrientes
              </p>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex gap-[8px] items-start pt-[4px] relative shrink-0 text-center" data-node-id="143:5295" data-name="Subtitle">
                <p className="relative shrink-0 w-[56px]" data-node-id="143:5282">
                  Carbohidratos
                </p>
                <p className="relative shrink-0 w-[56px]" data-node-id="143:5288">
                  Proteínas
                </p>
                <p className="relative shrink-0 w-[56px]" data-node-id="143:5303">
                  Grasas
                </p>
              </div>
            </>
          )}
          {isBody && (
            <>
              <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="143:5170" data-name="Data-Carbs">
                <p className="relative shrink-0 text-[#272932]" data-node-id="143:5171">
                  {carbs}
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="143:5172">
                  gr
                </p>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="143:5031" data-name="Data-Protein">
                <p className="relative shrink-0 text-[#272932]" data-node-id="143:5032">
                  {protein}
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="143:5033">
                  gr
                </p>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="143:5083" data-name="Data-Fats">
                <p className="relative shrink-0 text-[#272932]" data-node-id="143:5084">
                  {fats}
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="143:5085">
                  gr
                </p>
              </div>
            </>
          )}
        </div>
        <div className={`content-stretch flex items-start relative shrink-0 w-[48px] ${isBody ? '[word-break:break-word] font-["Poppins:Regular"] gap-[4px] leading-[1.3] not-italic text-[12px] whitespace-nowrap' : ""}`} id={isBody ? "node-143_4244" : "node-143_4241"} data-name="Cell-Sugar">
          {isHead && (
            <>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="143:4242">
                Azúcar
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="143:4243" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </>
          )}
          {isBody && (
            <>
              <p className="relative shrink-0 text-[#272932]" data-node-id="143:4245">
                {sugar}
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="143:4248">
                gr
              </p>
            </>
          )}
        </div>
        <div className={`content-stretch flex relative shrink-0 w-[136px] ${isBody ? "bg-[#fff2e8] gap-[6px] items-center px-[8px] py-[7px] rounded-[6px]" : "items-start"}`} id={isBody ? "node-141_4210" : "node-141_4182"} data-name="Cell-Thoughts">
          {isHead && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="141:4183">
              Pensamientos
            </p>
          )}
          {isBody && (
            <>
              <div className="relative shrink-0 size-[14px]" data-node-id="143:4285" data-name="Icon/Note">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="143:4251">
                {thought}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Component22FoodDiaryDesktop() {
  const patientName = useFigmaPatientName();
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="105:2649" data-name="22. Food Diary (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="105:2650" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I105:2650;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I105:2650;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I105:2650;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4501;2:3296">
                Calendario
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4505;2:3296">
                Mensajes
              </p>
            </div>
            <FigmaPatientUnreadBadge variant="nav" className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" nodeId="I105:2650;2:4505;2:3297" />
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4502;2:3296">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4503;2:3296">
                Plan de comidas
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:2650;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I105:2650;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4504;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I105:2650;2:4504;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4504;2:3292">
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4506;2:3296">
                Progreso
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4509;2:3296">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;12:1059;2:3296">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I105:2650;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I105:2650;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I105:2650;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I105:2650;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:2650;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:2650;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4518;2:3335">
                Enviar mensaje
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4519;2:3296">
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="105:2651" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="105:2652" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I105:2652;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I105:2652;2:4460">
              Diario de comidas
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I105:2652;2:4462" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I105:2652;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I105:2652;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I105:2652;2:4464;2:3571" />
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I105:2652;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I105:2652;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I105:2652;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I105:2652;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I105:2652;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I105:2652;2:4468">{patientName}</p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I105:2652;2:4469">
                  Miembro
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I105:2652;2:4470">
                <div className="bg-white content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I105:2652;2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start min-h-[842px] relative shrink-0 w-full" data-node-id="105:2653" data-name="Body">
          <div className="bg-white content-stretch flex items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="141:3523" data-name="Section Statistic">
            <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px relative" data-node-id="141:3471" data-name="Card Statistic - Food Diary"><FigmaDiaryMetric kind="kcal" icon={imgIconSpecialFire} /></div>
            <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px relative" data-node-id="141:3484" data-name="Card Statistic - Food Diary"><FigmaDiaryMetric kind="carbs" icon={imgIconSpecialBread} /></div>
            <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px relative" data-node-id="141:3497" data-name="Card Statistic - Food Diary"><FigmaDiaryMetric kind="protein" icon={imgIconSpecialFish} /></div>
            <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px relative" data-node-id="141:3510" data-name="Card Statistic - Food Diary"><FigmaDiaryMetric kind="fat" icon={imgIconSpecialDrop} /></div>
          </div>
          <div className="bg-white content-stretch flex flex-col gap-[20px] items-start min-h-[888px] p-[16px] relative rounded-[16px] shrink-0 w-[1161px]" data-node-id="141:3562" data-name="Widget Grocery list">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="141:3563" data-name="Header-Section"><FigmaDiaryToolbar variant="desktop" /></div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start overflow-clip relative rounded-tl-[14px] rounded-tr-[14px] shrink-0 w-full" data-node-id="146:5031" data-name="Table"><FigmaDiaryTable /></div>
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="141:3598" data-name="Footer"><FigmaDiaryPagination /></div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="105:2654" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="105:2655" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="105:2656">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="105:2657" data-name="Links">
              <p className="relative shrink-0" data-node-id="105:2658">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="105:2659">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="105:2660">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="105:2661" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2662" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2663" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2664" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2665" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2666" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
