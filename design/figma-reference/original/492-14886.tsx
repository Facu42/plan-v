const assetPathPrefix = "https://www.figma.com/api/mcp/asset/94f09165-8688-406c-bd82-8b2959b1b170";
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
        Breakfast
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
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="141:4177">{`Date & Time`}</p>
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
                Category
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
                Menu
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
                Amount
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
                Cals
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
                Macronutrients
              </p>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex gap-[8px] items-start pt-[4px] relative shrink-0 text-center" data-node-id="143:5295" data-name="Subtitle">
                <p className="relative shrink-0 w-[56px]" data-node-id="143:5282">
                  Carbs
                </p>
                <p className="relative shrink-0 w-[56px]" data-node-id="143:5288">
                  Protein
                </p>
                <p className="relative shrink-0 w-[56px]" data-node-id="143:5303">
                  Fats
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
                Sugar
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
              Thoughts
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
            <div className="absolute inset-[6.25%]" data-node-id="I492:14887;427:15210;408:17493" data-name="symbol">
              <div className="absolute bg-[#c2e66e] inset-[53.57%_7.14%_-3.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I492:14887;427:15210;408:17494" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] inset-[-3.57%_7.14%_53.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I492:14887;427:15210;408:17495" data-name="Bowl" />
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I492:14887;433:18077">
          Food Diary
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
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="492:15728" data-name="Card Statistic - Food Diary">
              <div className="bg-[#c2e66e] content-stretch flex items-center p-[24px] relative rounded-[16px] shrink-0" data-node-id="I492:15728;141:3442" data-name="Icon">
                <div className="relative shrink-0 size-[24px]" data-node-id="I492:15728;141:3443" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I492:15728;141:3456" data-name="Main">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I492:15728;141:3445">
                  Total Calories
                </p>
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-end not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I492:15728;141:3446" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I492:15728;141:3447">
                    12,615
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[16px]" data-node-id="I492:15728;141:3448">
                    kcal
                  </p>
                </div>
                <div className="content-stretch flex gap-[4px] items-center py-px relative shrink-0 w-full" data-node-id="I492:15728;141:3455" data-name="Section Percentage">
                  <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I492:15728;141:3449" data-name="Info Percentage">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15728;141:3529" data-name="Icon/TrendUp">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTrendUp} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I492:15728;141:3450">
                      +1.45%
                    </p>
                  </div>
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="I492:15728;141:3454">
                    vs last week
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="492:15729" data-name="Card Statistic - Food Diary">
              <div className="bg-[#ffcb65] content-stretch flex items-center p-[24px] relative rounded-[16px] shrink-0" data-node-id="I492:15729;141:3442" data-name="Icon">
                <div className="relative shrink-0 size-[24px]" data-node-id="I492:15729;141:3443" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I492:15729;141:3456" data-name="Main">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I492:15729;141:3445">
                  Total Carb
                </p>
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-end not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I492:15729;141:3446" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I492:15729;141:3447">
                    2,100
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[16px]" data-node-id="I492:15729;141:3448">
                    gr
                  </p>
                </div>
                <div className="content-stretch flex gap-[4px] items-center py-px relative shrink-0 w-full" data-node-id="I492:15729;141:3455" data-name="Section Percentage">
                  <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I492:15729;141:3449" data-name="Info Percentage">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15729;141:3529" data-name="Icon/TrendUp">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTrendUp} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I492:15729;141:3450">
                      +0.78%
                    </p>
                  </div>
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="I492:15729;141:3454">
                    vs last week
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="492:15730" data-name="Card Statistic - Food Diary">
              <div className="bg-[#ffa257] content-stretch flex items-center p-[24px] relative rounded-[16px] shrink-0" data-node-id="I492:15730;141:3442" data-name="Icon">
                <div className="relative shrink-0 size-[24px]" data-node-id="I492:15730;141:3443" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I492:15730;141:3456" data-name="Main">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I492:15730;141:3445">
                  Total Proteins
                </p>
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-end not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I492:15730;141:3446" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I492:15730;141:3447">
                    498
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[16px]" data-node-id="I492:15730;141:3448">
                    gr
                  </p>
                </div>
                <div className="content-stretch flex gap-[4px] items-center py-px relative shrink-0 w-full" data-node-id="I492:15730;141:3455" data-name="Section Percentage">
                  <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I492:15730;141:3449" data-name="Info Percentage">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15730;141:3529" data-name="Icon/TrendUp">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTrendUp} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I492:15730;141:3450">
                      -2.84%
                    </p>
                  </div>
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="I492:15730;141:3454">
                    vs last week
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="492:15731" data-name="Card Statistic - Food Diary">
              <div className="bg-[#e1e1e2] content-stretch flex items-center p-[24px] relative rounded-[16px] shrink-0" data-node-id="I492:15731;141:3442" data-name="Icon">
                <div className="relative shrink-0 size-[24px]" data-node-id="I492:15731;141:3443" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I492:15731;141:3456" data-name="Main">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I492:15731;141:3445">
                  Total Fats
                </p>
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-end not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I492:15731;141:3446" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I492:15731;141:3447">
                    285
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[16px]" data-node-id="I492:15731;141:3448">
                    gr
                  </p>
                </div>
                <div className="content-stretch flex gap-[4px] items-center py-px relative shrink-0 w-full" data-node-id="I492:15731;141:3455" data-name="Section Percentage">
                  <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I492:15731;141:3449" data-name="Info Percentage">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15731;141:3529" data-name="Icon/TrendUp">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTrendUp} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I492:15731;141:3450">
                      +4.16%
                    </p>
                  </div>
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="I492:15731;141:3454">
                    vs last week
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[20px] items-start min-h-[888px] overflow-clip p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:15789" data-name="Widget Grocery list">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="498:16351" data-name="Header-Section">
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-node-id="498:16352" data-name="Left Section">
              <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px px-[8px] py-[6px] relative rounded-[8px]" data-node-id="498:16353" data-name="Input-search">
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I498:16353;2:3947" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I498:16353;2:3948" data-name="Icon/MagnifyingGlass">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                  </div>
                </div>
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I498:16353;2:3949" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I498:16353;2:3950">
                    Search menu
                  </p>
                </div>
              </div>
              <div className="bg-[#eeeeef] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="498:16354" data-name="Button Picker">
                <div className="relative shrink-0 size-[18px]" data-node-id="I498:16354;2:3578" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFunnel} />
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex gap-[4px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="498:16401" data-name="Button CTA">
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I498:16401;2:3314" data-name="Icon Left">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I498:16401;2:3315" data-name="Icon/CalendarBlank">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                  </div>
                </div>
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I498:16401;2:3316" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I498:16401;2:3317">
                    Add
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="492:15791" data-name="Table">
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center pb-[16px] pt-[8px] px-[20px] relative shrink-0 w-[980px]" data-node-id="492:15792" data-name="Table-Row-Food Diary">
              <div className="relative shrink-0 size-[12px]" data-node-id="I492:15792;152:5886" data-name="Checkbox">
                <div className="absolute inset-[-8.33%]">
                  <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15792;152:5845" data-name="Cells">
                <div className="content-stretch flex items-start relative shrink-0 w-[82px]" data-node-id="I492:15792;141:4176" data-name="Cell-Date">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:15792;141:4177">{`Date & Time`}</p>
                  <div className="relative shrink-0 size-[14px]" data-node-id="I492:15792;141:4178" data-name="Icon/Sort">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                  </div>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15792;141:4167" data-name="Cell-Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:15792;141:4168">
                    Category
                  </p>
                  <div className="relative shrink-0 size-[14px]" data-node-id="I492:15792;141:4169" data-name="Icon/Sort">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                  </div>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[176px]" data-node-id="I492:15792;141:4164" data-name="Cell-Menu">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:15792;141:4165">
                    Menu
                  </p>
                  <div className="relative shrink-0 size-[14px]" data-node-id="I492:15792;141:4166" data-name="Icon/Sort">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                  </div>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[58px]" data-node-id="I492:15792;141:4179" data-name="Cell-Amount">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:15792;141:4180">
                    Amount
                  </p>
                  <div className="relative shrink-0 size-[14px]" data-node-id="I492:15792;141:4181" data-name="Icon/Sort">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                  </div>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[56px]" data-node-id="I492:15792;141:4173" data-name="Cell-Calories">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:15792;141:4174">
                    Cals
                  </p>
                  <div className="relative shrink-0 size-[14px]" data-node-id="I492:15792;141:4175" data-name="Icon/Sort">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] w-[184px]" data-node-id="I492:15792;141:4170" data-name="Cell-Qty">
                  <p className="relative shrink-0 whitespace-nowrap" data-node-id="I492:15792;141:4171">
                    Macronutrients
                  </p>
                  <div className="border-[#e1e1e2] border-solid border-t content-stretch flex gap-[8px] items-start pt-[4px] relative shrink-0 text-center" data-node-id="I492:15792;143:5295" data-name="Subtitle">
                    <p className="relative shrink-0 w-[56px]" data-node-id="I492:15792;143:5282">
                      Carbs
                    </p>
                    <p className="relative shrink-0 w-[56px]" data-node-id="I492:15792;143:5288">
                      Protein
                    </p>
                    <p className="relative shrink-0 w-[56px]" data-node-id="I492:15792;143:5303">
                      Fats
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[48px]" data-node-id="I492:15792;143:4241" data-name="Cell-Sugar">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:15792;143:4242">
                    Sugar
                  </p>
                  <div className="relative shrink-0 size-[14px]" data-node-id="I492:15792;143:4243" data-name="Icon/Sort">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                  </div>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[136px]" data-node-id="I492:15792;141:4182" data-name="Cell-Thoughts">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:15792;141:4183">
                    Thoughts
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-[980px]" data-node-id="492:15793" data-name="Table-Body">
              <TableRowFoodDiary amountUnit="Slices" calories="300" carbs="25" className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" fats="12" protein="20" sugar="3" thought="Energized" time="7:30 AM" type="Body" />
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="492:15795" data-name="Table-Row-Food Diary">
                <Checkbox className="relative shrink-0 size-[12px]" />
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15795;152:4500" data-name="Cells">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I492:15795;141:4204" data-name="Cell-Date">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15795;141:4206">
                      2028-09-01
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15795;146:4576">
                      12:30 PM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15795;141:4190" data-name="Cell-Category">
                    <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I492:15795;143:4957" data-name="Badge Category - Meal Time">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:15795;143:4957;143:4946">
                        Lunch
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I492:15795;141:4186" data-name="Cell-Menu">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:15795;141:4189">
                      Grilled Chicken Wrap with Avocado
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I492:15795;141:4207" data-name="Cell-Amount">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15795;141:4209">
                      1
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15795;141:4208">
                      Wrap
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I492:15795;141:4201" data-name="Cell-Calories">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15795;141:4202">
                      450
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15795;146:5003">
                      kcal
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I492:15795;141:4192" data-name="Cell-Qty">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15795;143:5170" data-name="Data-Carbs">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15795;143:5171">
                        40
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15795;143:5172">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15795;143:5031" data-name="Data-Protein">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15795;143:5032">
                        30
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15795;143:5033">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15795;143:5083" data-name="Data-Fats">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15795;143:5084">
                        18
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15795;143:5085">
                        gr
                      </p>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I492:15795;143:4244" data-name="Cell-Sugar">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15795;143:4245">
                      4
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15795;143:4248">
                      gr
                    </p>
                  </div>
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I492:15795;141:4210" data-name="Cell-Thoughts">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15795;143:4285" data-name="Icon/Note">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:15795;143:4251">
                      Quite Satisfied
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#f9f4f2] border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="492:15796" data-name="Table-Row-Food Diary">
                <div className="relative shrink-0 size-[12px]" data-node-id="I492:15796;152:4885" data-name="Checkbox">
                  <div className="absolute inset-[-8.33%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox1} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15796;152:4500" data-name="Cells">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I492:15796;141:4204" data-name="Cell-Date">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15796;141:4206">
                      2028-09-01
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15796;146:4576">
                      4:00 PM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15796;141:4190" data-name="Cell-Category">
                    <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I492:15796;143:4957" data-name="Badge Category - Meal Time">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:15796;143:4957;143:4948">
                        Snacks
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I492:15796;141:4186" data-name="Cell-Menu">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:15796;141:4189">
                      Greek Yogurt with Mixed Berries
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I492:15796;141:4207" data-name="Cell-Amount">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15796;141:4209">
                      1
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15796;141:4208">
                      Cup
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I492:15796;141:4201" data-name="Cell-Calories">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15796;141:4202">
                      200
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15796;146:5003">
                      kcal
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I492:15796;141:4192" data-name="Cell-Qty">
                    <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15796;143:5170" data-name="Data-Carbs">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15796;143:5171">
                        18
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15796;143:5172">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15796;143:5031" data-name="Data-Protein">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15796;143:5032">
                        12
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15796;143:5033">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15796;143:5083" data-name="Data-Fats">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15796;143:5084">
                        10
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15796;143:5085">
                        gr
                      </p>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I492:15796;143:4244" data-name="Cell-Sugar">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15796;143:4245">
                      16
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15796;143:4248">
                      gr
                    </p>
                  </div>
                  <div className="bg-white content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I492:15796;141:4210" data-name="Cell-Thoughts">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15796;143:4285" data-name="Icon/Note">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:15796;143:4251">
                      Quite Satisfied
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#f9f4f2] border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="492:15797" data-name="Table-Row-Food Diary">
                <div className="relative shrink-0 size-[12px]" data-node-id="I492:15797;152:4885" data-name="Checkbox">
                  <div className="absolute inset-[-8.33%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox1} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15797;152:4500" data-name="Cells">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I492:15797;141:4204" data-name="Cell-Date">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15797;141:4206">
                      2028-09-01
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15797;146:4576">
                      7:00 PM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15797;141:4190" data-name="Cell-Category">
                    <div className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I492:15797;143:4957" data-name="Badge Category - Meal Time">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:15797;143:4957;143:4954">
                        Dinner
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I492:15797;141:4186" data-name="Cell-Menu">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:15797;141:4189">
                      Cheeseburger and Fries
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I492:15797;141:4207" data-name="Cell-Amount">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15797;141:4209">
                      1
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15797;141:4208">
                      Serving
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I492:15797;141:4201" data-name="Cell-Calories">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15797;141:4202">
                      700
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15797;146:5003">
                      kcal
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I492:15797;141:4192" data-name="Cell-Qty">
                    <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15797;143:5170" data-name="Data-Carbs">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15797;143:5171">
                        55
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15797;143:5172">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15797;143:5031" data-name="Data-Protein">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15797;143:5032">
                        35
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15797;143:5033">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15797;143:5083" data-name="Data-Fats">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15797;143:5084">
                        35
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15797;143:5085">
                        gr
                      </p>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I492:15797;143:4244" data-name="Cell-Sugar">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15797;143:4245">
                      5
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15797;143:4248">
                      gr
                    </p>
                  </div>
                  <div className="bg-white content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I492:15797;141:4210" data-name="Cell-Thoughts">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15797;143:4285" data-name="Icon/Note">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:15797;143:4251">
                      Guilty
                    </p>
                  </div>
                </div>
              </div>
              <TableRowFoodDiary amountUnit="Slices" calories="320" carbs="30" className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" date="2028-09-02" fats="18" menu="Avocado Toast with Poached Egg" protein="14" sugar="2" thought="Satisfied" time="8:00 AM" type="Body" />
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="492:15799" data-name="Table-Row-Food Diary">
                <Checkbox className="relative shrink-0 size-[12px]" />
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15799;152:4500" data-name="Cells">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I492:15799;141:4204" data-name="Cell-Date">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15799;141:4206">
                      2028-09-02
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15799;146:4576">
                      1:00 PM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15799;141:4190" data-name="Cell-Category">
                    <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I492:15799;143:4957" data-name="Badge Category - Meal Time">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:15799;143:4957;143:4946">
                        Lunch
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I492:15799;141:4186" data-name="Cell-Menu">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:15799;141:4189">{`Quinoa Salad with Roasted Veggies & Feta`}</p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I492:15799;141:4207" data-name="Cell-Amount">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15799;141:4209">
                      1
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15799;141:4208">
                      Bowl
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I492:15799;141:4201" data-name="Cell-Calories">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15799;141:4202">
                      450
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15799;146:5003">
                      kcal
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I492:15799;141:4192" data-name="Cell-Qty">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15799;143:5170" data-name="Data-Carbs">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15799;143:5171">
                        50
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15799;143:5172">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15799;143:5031" data-name="Data-Protein">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15799;143:5032">
                        15
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15799;143:5033">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15799;143:5083" data-name="Data-Fats">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15799;143:5084">
                        12
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15799;143:5085">
                        gr
                      </p>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I492:15799;143:4244" data-name="Cell-Sugar">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15799;143:4245">
                      6
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15799;143:4248">
                      gr
                    </p>
                  </div>
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I492:15799;141:4210" data-name="Cell-Thoughts">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15799;143:4285" data-name="Icon/Note">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:15799;143:4251">
                      Quite Satisfied
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="492:15800" data-name="Table-Row-Food Diary">
                <Checkbox className="relative shrink-0 size-[12px]" />
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15800;152:4500" data-name="Cells">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I492:15800;141:4204" data-name="Cell-Date">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15800;141:4206">
                      2028-09-02
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15800;146:4576">
                      3:30 PM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15800;141:4190" data-name="Cell-Category">
                    <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I492:15800;143:4957" data-name="Badge Category - Meal Time">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:15800;143:4957;143:4948">
                        Snacks
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I492:15800;141:4186" data-name="Cell-Menu">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:15800;141:4189">
                      Apple Slices with Peanut Butter
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I492:15800;141:4207" data-name="Cell-Amount">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15800;141:4209">
                      1
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15800;141:4208">
                      Apple
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I492:15800;141:4201" data-name="Cell-Calories">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15800;141:4202">
                      200
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15800;146:5003">
                      kcal
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I492:15800;141:4192" data-name="Cell-Qty">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15800;143:5170" data-name="Data-Carbs">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15800;143:5171">
                        30
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15800;143:5172">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15800;143:5031" data-name="Data-Protein">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15800;143:5032">
                        6
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15800;143:5033">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15800;143:5083" data-name="Data-Fats">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15800;143:5084">
                        10
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15800;143:5085">
                        gr
                      </p>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I492:15800;143:4244" data-name="Cell-Sugar">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15800;143:4245">
                      19
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15800;143:4248">
                      gr
                    </p>
                  </div>
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I492:15800;141:4210" data-name="Cell-Thoughts">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15800;143:4285" data-name="Icon/Note">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:15800;143:4251">
                      Energized
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="492:15801" data-name="Table-Row-Food Diary">
                <Checkbox className="relative shrink-0 size-[12px]" />
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15801;152:4500" data-name="Cells">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I492:15801;141:4204" data-name="Cell-Date">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15801;141:4206">
                      2028-09-02
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15801;146:4576">
                      6:30 PM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15801;141:4190" data-name="Cell-Category">
                    <div className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I492:15801;143:4957" data-name="Badge Category - Meal Time">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:15801;143:4957;143:4954">
                        Dinner
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I492:15801;141:4186" data-name="Cell-Menu">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:15801;141:4189">
                      Pasta Alfredo with Garlic Bread
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I492:15801;141:4207" data-name="Cell-Amount">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15801;141:4209">
                      1
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15801;141:4208">
                      Plate
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I492:15801;141:4201" data-name="Cell-Calories">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15801;141:4202">
                      650
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15801;146:5003">
                      kcal
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I492:15801;141:4192" data-name="Cell-Qty">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15801;143:5170" data-name="Data-Carbs">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15801;143:5171">
                        80
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15801;143:5172">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15801;143:5031" data-name="Data-Protein">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15801;143:5032">
                        20
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15801;143:5033">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15801;143:5083" data-name="Data-Fats">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15801;143:5084">
                        30
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15801;143:5085">
                        gr
                      </p>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I492:15801;143:4244" data-name="Cell-Sugar">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15801;143:4245">
                      4
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15801;143:4248">
                      gr
                    </p>
                  </div>
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I492:15801;141:4210" data-name="Cell-Thoughts">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15801;143:4285" data-name="Icon/Note">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:15801;143:4251">
                      Uncomfortable
                    </p>
                  </div>
                </div>
              </div>
              <TableRowFoodDiary amount="1" amountUnit="Glass" calories="300" className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" date="2028-09-03" fats="10" menu="Blueberry Protein Smoothie" protein="20" sugar="24" thought="Energized" time="7:15 AM" type="Body" />
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="492:15803" data-name="Table-Row-Food Diary">
                <Checkbox className="relative shrink-0 size-[12px]" />
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15803;152:4500" data-name="Cells">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I492:15803;141:4204" data-name="Cell-Date">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15803;141:4206">
                      2028-09-03
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15803;146:4576">
                      12:00 PM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15803;141:4190" data-name="Cell-Category">
                    <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I492:15803;143:4957" data-name="Badge Category - Meal Time">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:15803;143:4957;143:4946">
                        Lunch
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I492:15803;141:4186" data-name="Cell-Menu">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:15803;141:4189">
                      Greek Salad with Feta and Olives
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I492:15803;141:4207" data-name="Cell-Amount">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15803;141:4209">
                      1
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15803;141:4208">
                      Bowl
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I492:15803;141:4201" data-name="Cell-Calories">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15803;141:4202">
                      400
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15803;146:5003">
                      kcal
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I492:15803;141:4192" data-name="Cell-Qty">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15803;143:5170" data-name="Data-Carbs">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15803;143:5171">
                        40
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15803;143:5172">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15803;143:5031" data-name="Data-Protein">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15803;143:5032">
                        12
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15803;143:5033">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15803;143:5083" data-name="Data-Fats">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15803;143:5084">
                        20
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15803;143:5085">
                        gr
                      </p>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I492:15803;143:4244" data-name="Cell-Sugar">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15803;143:4245">
                      4
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15803;143:4248">
                      gr
                    </p>
                  </div>
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I492:15803;141:4210" data-name="Cell-Thoughts">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15803;143:4285" data-name="Icon/Note">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:15803;143:4251">
                      Satisfied
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="492:15804" data-name="Table-Row-Food Diary">
                <Checkbox className="relative shrink-0 size-[12px]" />
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15804;152:4500" data-name="Cells">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I492:15804;141:4204" data-name="Cell-Date">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15804;141:4206">
                      2028-09-03
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15804;146:4576">
                      4:15 PM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15804;141:4190" data-name="Cell-Category">
                    <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I492:15804;143:4957" data-name="Badge Category - Meal Time">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:15804;143:4957;143:4948">
                        Snacks
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I492:15804;141:4186" data-name="Cell-Menu">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:15804;141:4189">
                      Hummus with Carrot Sticks
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I492:15804;141:4207" data-name="Cell-Amount">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15804;141:4209">
                      1
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15804;141:4208">
                      Serving
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I492:15804;141:4201" data-name="Cell-Calories">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15804;141:4202">
                      180
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15804;146:5003">
                      kcal
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I492:15804;141:4192" data-name="Cell-Qty">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15804;143:5170" data-name="Data-Carbs">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15804;143:5171">
                        20
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15804;143:5172">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15804;143:5031" data-name="Data-Protein">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15804;143:5032">
                        8
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15804;143:5033">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15804;143:5083" data-name="Data-Fats">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15804;143:5084">
                        7
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15804;143:5085">
                        gr
                      </p>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I492:15804;143:4244" data-name="Cell-Sugar">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15804;143:4245">
                      2
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15804;143:4248">
                      gr
                    </p>
                  </div>
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I492:15804;141:4210" data-name="Cell-Thoughts">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15804;143:4285" data-name="Icon/Note">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:15804;143:4251">
                      Quite Satisfied
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="492:15805" data-name="Table-Row-Food Diary">
                <Checkbox className="relative shrink-0 size-[12px]" />
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I492:15805;152:4500" data-name="Cells">
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I492:15805;141:4204" data-name="Cell-Date">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15805;141:4206">
                      2028-09-03
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15805;146:4576">
                      7:00 PM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I492:15805;141:4190" data-name="Cell-Category">
                    <div className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I492:15805;143:4957" data-name="Badge Category - Meal Time">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:15805;143:4957;143:4954">
                        Dinner
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I492:15805;141:4186" data-name="Cell-Menu">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:15805;141:4189">
                      Chocolate Cake and Ice Cream
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I492:15805;141:4207" data-name="Cell-Amount">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15805;141:4209">
                      1
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15805;141:4208">
                      Serving
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I492:15805;141:4201" data-name="Cell-Calories">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15805;141:4202">
                      600
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15805;146:5003">
                      kcal
                    </p>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I492:15805;141:4192" data-name="Cell-Qty">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15805;143:5170" data-name="Data-Carbs">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15805;143:5171">
                        75
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15805;143:5172">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15805;143:5031" data-name="Data-Protein">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15805;143:5032">
                        8
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15805;143:5033">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I492:15805;143:5083" data-name="Data-Fats">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15805;143:5084">
                        25
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15805;143:5085">
                        gr
                      </p>
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I492:15805;143:4244" data-name="Cell-Sugar">
                    <p className="relative shrink-0 text-[#272932]" data-node-id="I492:15805;143:4245">
                      50
                    </p>
                    <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:15805;143:4248">
                      gr
                    </p>
                  </div>
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I492:15805;141:4210" data-name="Cell-Thoughts">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:15805;143:4285" data-name="Icon/Note">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:15805;143:4251">
                      Guilty
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start justify-center pb-[4px] relative shrink-0 w-[326px]" data-node-id="498:16412" data-name="Section Slider">
                <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start pr-[202px] relative rounded-[8px] shrink-0 w-full" data-node-id="498:16413" data-name="Slider">
                  <div className="bg-[#e1e1e2] h-[6px] relative rounded-[8px] shrink-0 w-full" data-node-id="498:16414" data-name="Bar" />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center px-[16px] relative shrink-0 w-full" data-node-id="492:15806" data-name="Footer">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="492:15811" data-name="Pagination">
              <div className="bg-[#f6f6f7] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:15811;2:4524" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I492:15811;2:4524;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I492:15811;2:4525" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:15811;2:4525;2:3331" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:15811;2:4525;2:3332">
                    1
                  </p>
                </div>
              </div>
              <div className="bg-[#eeeeef] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I492:15811;2:4526" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:15811;2:4526;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:15811;2:4526;2:3482">
                    2
                  </p>
                </div>
              </div>
              <div className="bg-[#eeeeef] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I492:15811;2:4527" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:15811;2:4527;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:15811;2:4527;2:3482">
                    3
                  </p>
                </div>
              </div>
              <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0 w-[30px]" data-node-id="I492:15811;2:4528" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:15811;2:4528;2:3551" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:15811;2:4528;2:3552">
                    ...
                  </p>
                </div>
              </div>
              <div className="bg-[#eeeeef] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I492:15811;2:4529" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:15811;2:4529;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:15811;2:4529;2:3482">
                    7
                  </p>
                </div>
              </div>
              <div className="bg-[#eeeeef] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:15811;2:4530" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I492:15811;2:4530;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="492:14999" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="492:15000" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="492:15001">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="492:15002" data-name="Links">
              <p className="relative shrink-0" data-node-id="492:15003">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="492:15004">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="492:15005">
                Contact
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
