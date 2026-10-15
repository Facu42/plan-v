import { FigmaDiaryMetric, FigmaDiaryPagination, FigmaDiaryTable, FigmaDiaryToolbar } from '../FigmaFoodDiary';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/FoodDiaryMobile";
const imgStateDefaultSizeDefault = `${assetPathPrefix}/14b51.svg`;
const imgIconSort = `${assetPathPrefix}/5ef2f.svg`;
const imgIconNote = `${assetPathPrefix}/59f84.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconSpecialFire = `${assetPathPrefix}/5b866.svg`;
const imgIconTrendUp = `${assetPathPrefix}/dd2f5.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/e0a2c.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/fe941.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/fd123.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconFunnel = `${assetPathPrefix}/055c8.svg`;
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

export default function Component24FoodDiaryMobile() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="492:14886" data-name="24. Food Diary (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="492:14887" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I492:14887;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I492:14887;427:15210" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I492:14887;433:18077">
          Diario de comidas
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I492:14887;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I492:14887;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[24px] items-start overflow-clip px-[16px] py-[24px] relative shrink-0 w-full" data-node-id="492:14888" data-name="Content">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="492:14889" data-name="Section Data Chart">
          <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:15727" data-name="Section Statistic">
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="492:15728" data-name="Card Statistic - Food Diary"><FigmaDiaryMetric kind="kcal" icon={imgIconSpecialFire} /></div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="492:15729" data-name="Card Statistic - Food Diary"><FigmaDiaryMetric kind="carbs" icon={imgIconSpecialBread} /></div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="492:15730" data-name="Card Statistic - Food Diary"><FigmaDiaryMetric kind="protein" icon={imgIconSpecialFish} /></div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="492:15731" data-name="Card Statistic - Food Diary"><FigmaDiaryMetric kind="fat" icon={imgIconSpecialDrop} /></div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[20px] items-start min-h-[888px] overflow-clip p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:15789" data-name="Widget Grocery list">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="498:16351" data-name="Header-Section"><FigmaDiaryToolbar variant="mobile" /></div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="492:15791" data-name="Table"><FigmaDiaryTable /></div>
          <div className="content-stretch flex items-center justify-center px-[16px] relative shrink-0 w-full" data-node-id="492:15806" data-name="Footer"><FigmaDiaryPagination /></div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="492:14999" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="492:15000" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="492:15001">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="492:15002" data-name="Links">
              <p className="relative shrink-0" data-node-id="492:15003">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="492:15004">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="492:15005">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="492:15006" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="492:15007" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="492:15008" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="492:15009" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="492:15010" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="492:15011" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
