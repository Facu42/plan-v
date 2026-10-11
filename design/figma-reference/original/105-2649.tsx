const assetPathPrefix = "https://www.figma.com/api/mcp/asset/f75b1215-4357-409f-af9a-1890667a20fb";
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

export default function Component22FoodDiaryDesktop() {
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="105:2649" data-name="22. Food Diary (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="105:2650" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I105:2650;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I105:2650;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I105:2650;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I105:2650;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I105:2650;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I105:2650;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I105:2650;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4500;2:3296">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4505;2:3296">
                Messages
              </p>
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4505;2:3297" data-name="Badge">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I105:2650;2:4505;2:3297;2:3262" data-name="Div Red">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I105:2650;2:4505;2:3297;2:3263">
                  6
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4502;2:3296">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4503;2:3296">
                Meal Plan
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
                Food Diary
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4506;2:3296">
                Progress
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4509;2:3296">
                Exercises
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2650;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2650;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2650;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2650;12:1059;2:3296">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I105:2650;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I105:2650;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I105:2650;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I105:2650;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:2650;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:2650;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I105:2650;2:4518;2:3335">
                Claim Now!
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
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="105:2651" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="105:2652" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I105:2652;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I105:2652;2:4460">
              Food Diary
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I105:2652;2:4462" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I105:2652;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I105:2652;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I105:2652;2:4464;2:3571" data-name="Badge">
                <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I105:2652;2:4464;2:3571;2:3270" data-name="Div Red" />
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I105:2652;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I105:2652;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I105:2652;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I105:2652;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I105:2652;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I105:2652;2:4468">
                  Adam Vasylenko
                </p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I105:2652;2:4469">
                  Member
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
            <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px relative" data-node-id="141:3471" data-name="Card Statistic - Food Diary">
              <div className="bg-[#c2e66e] content-stretch flex items-center p-[24px] relative rounded-[16px] shrink-0" data-node-id="I141:3471;141:3442" data-name="Icon">
                <div className="relative shrink-0 size-[24px]" data-node-id="I141:3471;141:3443" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I141:3471;141:3456" data-name="Main">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I141:3471;141:3445">
                  Total Calories
                </p>
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-end not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I141:3471;141:3446" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I141:3471;141:3447">
                    12,615
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[16px]" data-node-id="I141:3471;141:3448">
                    kcal
                  </p>
                </div>
                <div className="content-stretch flex gap-[4px] items-center py-px relative shrink-0 w-full" data-node-id="I141:3471;141:3455" data-name="Section Percentage">
                  <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I141:3471;141:3449" data-name="Info Percentage">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I141:3471;141:3529" data-name="Icon/TrendUp">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTrendUp} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I141:3471;141:3450">
                      +1.45%
                    </p>
                  </div>
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="I141:3471;141:3454">
                    vs last week
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px relative" data-node-id="141:3484" data-name="Card Statistic - Food Diary">
              <div className="bg-[#ffcb65] content-stretch flex items-center p-[24px] relative rounded-[16px] shrink-0" data-node-id="I141:3484;141:3442" data-name="Icon">
                <div className="relative shrink-0 size-[24px]" data-node-id="I141:3484;141:3443" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I141:3484;141:3456" data-name="Main">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I141:3484;141:3445">
                  Total Carb
                </p>
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-end not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I141:3484;141:3446" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I141:3484;141:3447">
                    2,100
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[16px]" data-node-id="I141:3484;141:3448">
                    gr
                  </p>
                </div>
                <div className="content-stretch flex gap-[4px] items-center py-px relative shrink-0 w-full" data-node-id="I141:3484;141:3455" data-name="Section Percentage">
                  <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I141:3484;141:3449" data-name="Info Percentage">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I141:3484;141:3529" data-name="Icon/TrendUp">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTrendUp} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I141:3484;141:3450">
                      +0.78%
                    </p>
                  </div>
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="I141:3484;141:3454">
                    vs last week
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px relative" data-node-id="141:3497" data-name="Card Statistic - Food Diary">
              <div className="bg-[#ffa257] content-stretch flex items-center p-[24px] relative rounded-[16px] shrink-0" data-node-id="I141:3497;141:3442" data-name="Icon">
                <div className="relative shrink-0 size-[24px]" data-node-id="I141:3497;141:3443" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I141:3497;141:3456" data-name="Main">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I141:3497;141:3445">
                  Total Proteins
                </p>
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-end not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I141:3497;141:3446" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I141:3497;141:3447">
                    498
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[16px]" data-node-id="I141:3497;141:3448">
                    gr
                  </p>
                </div>
                <div className="content-stretch flex gap-[4px] items-center py-px relative shrink-0 w-full" data-node-id="I141:3497;141:3455" data-name="Section Percentage">
                  <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I141:3497;141:3449" data-name="Info Percentage">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I141:3497;141:3529" data-name="Icon/TrendUp">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTrendUp} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I141:3497;141:3450">
                      -2.84%
                    </p>
                  </div>
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="I141:3497;141:3454">
                    vs last week
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px relative" data-node-id="141:3510" data-name="Card Statistic - Food Diary">
              <div className="bg-[#e1e1e2] content-stretch flex items-center p-[24px] relative rounded-[16px] shrink-0" data-node-id="I141:3510;141:3442" data-name="Icon">
                <div className="relative shrink-0 size-[24px]" data-node-id="I141:3510;141:3443" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I141:3510;141:3456" data-name="Main">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I141:3510;141:3445">
                  Total Fats
                </p>
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-end not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I141:3510;141:3446" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I141:3510;141:3447">
                    285
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[16px]" data-node-id="I141:3510;141:3448">
                    gr
                  </p>
                </div>
                <div className="content-stretch flex gap-[4px] items-center py-px relative shrink-0 w-full" data-node-id="I141:3510;141:3455" data-name="Section Percentage">
                  <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[6px] shrink-0" data-node-id="I141:3510;141:3449" data-name="Info Percentage">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I141:3510;141:3529" data-name="Icon/TrendUp">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTrendUp} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I141:3510;141:3450">
                      +4.16%
                    </p>
                  </div>
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="I141:3510;141:3454">
                    vs last week
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col gap-[20px] items-start min-h-[888px] p-[16px] relative rounded-[16px] shrink-0 w-[1161px]" data-node-id="141:3562" data-name="Widget Grocery list">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="141:3563" data-name="Header-Section">
              <div className="flex flex-row items-center self-stretch" data-node-id="I141:3563;2:4236">
                <div className="content-stretch flex gap-[10px] h-full items-center relative shrink-0" data-name="Left Section">
                  <div className="bg-[#eeeeef] content-stretch flex gap-[4px] items-center px-[8px] py-[6px] relative rounded-[8px] shrink-0 w-[224px]" data-node-id="I141:3563;2:4237" data-name="Input-search">
                    <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I141:3563;2:4237;2:3947" data-name="Icon">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I141:3563;2:4237;2:3948" data-name="Icon/MagnifyingGlass">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                      </div>
                    </div>
                    <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I141:3563;2:4237;2:3949" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3563;2:4237;2:3950">
                        Search menu
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#eeeeef] content-stretch flex gap-[2px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I141:3563;2:4238" data-name="Button Picker">
                    <div className="content-stretch flex items-center pr-[2px] py-[2px] relative shrink-0" data-node-id="I141:3563;2:4238;2:3507" data-name="Icon Left">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I141:3563;2:4238;2:3508" data-name="Icon/CalendarBlank">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFunnel} />
                      </div>
                    </div>
                    <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I141:3563;2:4238;2:3509" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3563;2:4238;2:3510">
                        Filter
                      </p>
                    </div>
                    <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I141:3563;2:4238;2:3511" data-name="Icon">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I141:3563;2:4238;2:3512" data-name="Icon/CaretDown">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I141:3563;2:4240" data-name="Right Section">
                <div className="bg-[#eeeeef] content-stretch flex gap-[2px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I141:3563;2:4241" data-name="Button Picker">
                  <div className="content-stretch flex items-center pr-[2px] py-[2px] relative shrink-0" data-node-id="I141:3563;2:4241;2:3507" data-name="Icon Left">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I141:3563;2:4241;2:3508" data-name="Icon/CalendarBlank">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCalendarBlank} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I141:3563;2:4241;2:3509" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3563;2:4241;2:3510">
                      This Week
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I141:3563;2:4241;2:3511" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I141:3563;2:4241;2:3512" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown2} />
                    </div>
                  </div>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex gap-[4px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I141:3563;2:4247" data-name="Button CTA">
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I141:3563;2:4247;2:3314" data-name="Icon Left">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I141:3563;2:4247;2:3315" data-name="Icon/CalendarBlank">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I141:3563;2:4247;2:3316" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3563;2:4247;2:3317">
                      Add
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start overflow-clip relative rounded-tl-[14px] rounded-tr-[14px] shrink-0 w-full" data-node-id="146:5031" data-name="Table">
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4984" data-name="Table-Row-Food Diary">
                <div className="relative shrink-0 size-[12px]" data-node-id="I143:4984;152:5886" data-name="Checkbox">
                  <div className="absolute inset-[-8.33%]">
                    <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4984;152:5845" data-name="Cells">
                  <div className="content-stretch flex items-start relative shrink-0 w-[82px]" data-node-id="I143:4984;141:4176" data-name="Cell-Date">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I143:4984;141:4177">{`Date & Time`}</p>
                    <div className="relative shrink-0 size-[14px]" data-node-id="I143:4984;141:4178" data-name="Icon/Sort">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4984;141:4167" data-name="Cell-Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I143:4984;141:4168">
                      Category
                    </p>
                    <div className="relative shrink-0 size-[14px]" data-node-id="I143:4984;141:4169" data-name="Icon/Sort">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[176px]" data-node-id="I143:4984;141:4164" data-name="Cell-Menu">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I143:4984;141:4165">
                      Menu
                    </p>
                    <div className="relative shrink-0 size-[14px]" data-node-id="I143:4984;141:4166" data-name="Icon/Sort">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[58px]" data-node-id="I143:4984;141:4179" data-name="Cell-Amount">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I143:4984;141:4180">
                      Amount
                    </p>
                    <div className="relative shrink-0 size-[14px]" data-node-id="I143:4984;141:4181" data-name="Icon/Sort">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[56px]" data-node-id="I143:4984;141:4173" data-name="Cell-Calories">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I143:4984;141:4174">
                      Cals
                    </p>
                    <div className="relative shrink-0 size-[14px]" data-node-id="I143:4984;141:4175" data-name="Icon/Sort">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] w-[184px]" data-node-id="I143:4984;141:4170" data-name="Cell-Qty">
                    <p className="relative shrink-0 whitespace-nowrap" data-node-id="I143:4984;141:4171">
                      Macronutrients
                    </p>
                    <div className="border-[#e1e1e2] border-solid border-t content-stretch flex gap-[8px] items-start pt-[4px] relative shrink-0 text-center" data-node-id="I143:4984;143:5295" data-name="Subtitle">
                      <p className="relative shrink-0 w-[56px]" data-node-id="I143:4984;143:5282">
                        Carbs
                      </p>
                      <p className="relative shrink-0 w-[56px]" data-node-id="I143:4984;143:5288">
                        Protein
                      </p>
                      <p className="relative shrink-0 w-[56px]" data-node-id="I143:4984;143:5303">
                        Fats
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[48px]" data-node-id="I143:4984;143:4241" data-name="Cell-Sugar">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I143:4984;143:4242">
                      Sugar
                    </p>
                    <div className="relative shrink-0 size-[14px]" data-node-id="I143:4984;143:4243" data-name="Icon/Sort">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-[136px]" data-node-id="I143:4984;141:4182" data-name="Cell-Thoughts">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I143:4984;141:4183">
                      Thoughts
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-node-id="141:3584" data-name="Table-Body">
                <TableRowFoodDiary amountUnit="Slices" calories="300" carbs="25" className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" fats="12" protein="20" sugar="3" thought="Energized" time="7:30 AM" type="Body" />
                <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4742" data-name="Table-Row-Food Diary">
                  <Checkbox className="relative shrink-0 size-[12px]" />
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4742;152:4500" data-name="Cells">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I143:4742;141:4204" data-name="Cell-Date">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4742;141:4206">
                        2028-09-01
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4742;146:4576">
                        12:30 PM
                      </p>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4742;141:4190" data-name="Cell-Category">
                      <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I143:4742;143:4957" data-name="Badge Category - Meal Time">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I143:4742;143:4957;143:4946">
                          Lunch
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I143:4742;141:4186" data-name="Cell-Menu">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I143:4742;141:4189">
                        Grilled Chicken Wrap with Avocado
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I143:4742;141:4207" data-name="Cell-Amount">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4742;141:4209">
                        1
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4742;141:4208">
                        Wrap
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I143:4742;141:4201" data-name="Cell-Calories">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4742;141:4202">
                        450
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4742;146:5003">
                        kcal
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I143:4742;141:4192" data-name="Cell-Qty">
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4742;143:5170" data-name="Data-Carbs">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4742;143:5171">
                          40
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4742;143:5172">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4742;143:5031" data-name="Data-Protein">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4742;143:5032">
                          30
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4742;143:5033">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4742;143:5083" data-name="Data-Fats">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4742;143:5084">
                          18
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4742;143:5085">
                          gr
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I143:4742;143:4244" data-name="Cell-Sugar">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4742;143:4245">
                        4
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4742;143:4248">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I143:4742;141:4210" data-name="Cell-Thoughts">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I143:4742;143:4285" data-name="Icon/Note">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I143:4742;143:4251">
                        Quite Satisfied
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#f9f4f2] border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4642" data-name="Table-Row-Food Diary">
                  <div className="relative shrink-0 size-[12px]" data-node-id="I143:4642;152:4885" data-name="Checkbox">
                    <div className="absolute inset-[-8.33%]">
                      <img alt="" className="block max-w-none size-full" src={imgCheckbox1} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4642;152:4500" data-name="Cells">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I143:4642;141:4204" data-name="Cell-Date">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4642;141:4206">
                        2028-09-01
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4642;146:4576">
                        4:00 PM
                      </p>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4642;141:4190" data-name="Cell-Category">
                      <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I143:4642;143:4957" data-name="Badge Category - Meal Time">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I143:4642;143:4957;143:4948">
                          Snacks
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I143:4642;141:4186" data-name="Cell-Menu">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I143:4642;141:4189">
                        Greek Yogurt with Mixed Berries
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I143:4642;141:4207" data-name="Cell-Amount">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4642;141:4209">
                        1
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4642;141:4208">
                        Cup
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I143:4642;141:4201" data-name="Cell-Calories">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4642;141:4202">
                        200
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4642;146:5003">
                        kcal
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I143:4642;141:4192" data-name="Cell-Qty">
                      <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4642;143:5170" data-name="Data-Carbs">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4642;143:5171">
                          18
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4642;143:5172">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4642;143:5031" data-name="Data-Protein">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4642;143:5032">
                          12
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4642;143:5033">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4642;143:5083" data-name="Data-Fats">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4642;143:5084">
                          10
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4642;143:5085">
                          gr
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I143:4642;143:4244" data-name="Cell-Sugar">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4642;143:4245">
                        16
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4642;143:4248">
                        gr
                      </p>
                    </div>
                    <div className="bg-white content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I143:4642;141:4210" data-name="Cell-Thoughts">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I143:4642;143:4285" data-name="Icon/Note">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I143:4642;143:4251">
                        Quite Satisfied
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#f9f4f2] border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4792" data-name="Table-Row-Food Diary">
                  <div className="relative shrink-0 size-[12px]" data-node-id="I143:4792;152:4885" data-name="Checkbox">
                    <div className="absolute inset-[-8.33%]">
                      <img alt="" className="block max-w-none size-full" src={imgCheckbox1} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4792;152:4500" data-name="Cells">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I143:4792;141:4204" data-name="Cell-Date">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4792;141:4206">
                        2028-09-01
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4792;146:4576">
                        7:00 PM
                      </p>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4792;141:4190" data-name="Cell-Category">
                      <div className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I143:4792;143:4957" data-name="Badge Category - Meal Time">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I143:4792;143:4957;143:4954">
                          Dinner
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I143:4792;141:4186" data-name="Cell-Menu">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I143:4792;141:4189">
                        Cheeseburger and Fries
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I143:4792;141:4207" data-name="Cell-Amount">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4792;141:4209">
                        1
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4792;141:4208">
                        Serving
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I143:4792;141:4201" data-name="Cell-Calories">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4792;141:4202">
                        700
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4792;146:5003">
                        kcal
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I143:4792;141:4192" data-name="Cell-Qty">
                      <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4792;143:5170" data-name="Data-Carbs">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4792;143:5171">
                          55
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4792;143:5172">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4792;143:5031" data-name="Data-Protein">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4792;143:5032">
                          35
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4792;143:5033">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4792;143:5083" data-name="Data-Fats">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4792;143:5084">
                          35
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4792;143:5085">
                          gr
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I143:4792;143:4244" data-name="Cell-Sugar">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4792;143:4245">
                        5
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4792;143:4248">
                        gr
                      </p>
                    </div>
                    <div className="bg-white content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I143:4792;141:4210" data-name="Cell-Thoughts">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I143:4792;143:4285" data-name="Icon/Note">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I143:4792;143:4251">
                        Guilty
                      </p>
                    </div>
                  </div>
                </div>
                <TableRowFoodDiary amountUnit="Slices" calories="320" carbs="30" className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" date="2028-09-02" fats="18" menu="Avocado Toast with Poached Egg" protein="14" sugar="2" thought="Satisfied" time="8:00 AM" type="Body" />
                <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4842" data-name="Table-Row-Food Diary">
                  <Checkbox className="relative shrink-0 size-[12px]" />
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4842;152:4500" data-name="Cells">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I143:4842;141:4204" data-name="Cell-Date">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4842;141:4206">
                        2028-09-02
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4842;146:4576">
                        1:00 PM
                      </p>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4842;141:4190" data-name="Cell-Category">
                      <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I143:4842;143:4957" data-name="Badge Category - Meal Time">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I143:4842;143:4957;143:4946">
                          Lunch
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I143:4842;141:4186" data-name="Cell-Menu">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I143:4842;141:4189">{`Quinoa Salad with Roasted Veggies & Feta`}</p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I143:4842;141:4207" data-name="Cell-Amount">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4842;141:4209">
                        1
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4842;141:4208">
                        Bowl
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I143:4842;141:4201" data-name="Cell-Calories">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4842;141:4202">
                        450
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4842;146:5003">
                        kcal
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I143:4842;141:4192" data-name="Cell-Qty">
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4842;143:5170" data-name="Data-Carbs">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4842;143:5171">
                          50
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4842;143:5172">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4842;143:5031" data-name="Data-Protein">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4842;143:5032">
                          15
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4842;143:5033">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4842;143:5083" data-name="Data-Fats">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4842;143:5084">
                          12
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4842;143:5085">
                          gr
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I143:4842;143:4244" data-name="Cell-Sugar">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4842;143:4245">
                        6
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4842;143:4248">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I143:4842;141:4210" data-name="Cell-Thoughts">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I143:4842;143:4285" data-name="Icon/Note">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I143:4842;143:4251">
                        Quite Satisfied
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4817" data-name="Table-Row-Food Diary">
                  <Checkbox className="relative shrink-0 size-[12px]" />
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4817;152:4500" data-name="Cells">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I143:4817;141:4204" data-name="Cell-Date">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4817;141:4206">
                        2028-09-02
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4817;146:4576">
                        3:30 PM
                      </p>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4817;141:4190" data-name="Cell-Category">
                      <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I143:4817;143:4957" data-name="Badge Category - Meal Time">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I143:4817;143:4957;143:4948">
                          Snacks
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I143:4817;141:4186" data-name="Cell-Menu">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I143:4817;141:4189">
                        Apple Slices with Peanut Butter
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I143:4817;141:4207" data-name="Cell-Amount">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4817;141:4209">
                        1
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4817;141:4208">
                        Apple
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I143:4817;141:4201" data-name="Cell-Calories">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4817;141:4202">
                        200
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4817;146:5003">
                        kcal
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I143:4817;141:4192" data-name="Cell-Qty">
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4817;143:5170" data-name="Data-Carbs">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4817;143:5171">
                          30
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4817;143:5172">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4817;143:5031" data-name="Data-Protein">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4817;143:5032">
                          6
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4817;143:5033">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4817;143:5083" data-name="Data-Fats">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4817;143:5084">
                          10
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4817;143:5085">
                          gr
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I143:4817;143:4244" data-name="Cell-Sugar">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4817;143:4245">
                        19
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4817;143:4248">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I143:4817;141:4210" data-name="Cell-Thoughts">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I143:4817;143:4285" data-name="Icon/Note">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I143:4817;143:4251">
                        Energized
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4717" data-name="Table-Row-Food Diary">
                  <Checkbox className="relative shrink-0 size-[12px]" />
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4717;152:4500" data-name="Cells">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I143:4717;141:4204" data-name="Cell-Date">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4717;141:4206">
                        2028-09-02
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4717;146:4576">
                        6:30 PM
                      </p>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4717;141:4190" data-name="Cell-Category">
                      <div className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I143:4717;143:4957" data-name="Badge Category - Meal Time">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I143:4717;143:4957;143:4954">
                          Dinner
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I143:4717;141:4186" data-name="Cell-Menu">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I143:4717;141:4189">
                        Pasta Alfredo with Garlic Bread
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I143:4717;141:4207" data-name="Cell-Amount">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4717;141:4209">
                        1
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4717;141:4208">
                        Plate
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I143:4717;141:4201" data-name="Cell-Calories">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4717;141:4202">
                        650
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4717;146:5003">
                        kcal
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I143:4717;141:4192" data-name="Cell-Qty">
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4717;143:5170" data-name="Data-Carbs">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4717;143:5171">
                          80
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4717;143:5172">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4717;143:5031" data-name="Data-Protein">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4717;143:5032">
                          20
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4717;143:5033">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4717;143:5083" data-name="Data-Fats">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4717;143:5084">
                          30
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4717;143:5085">
                          gr
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I143:4717;143:4244" data-name="Cell-Sugar">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4717;143:4245">
                        4
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4717;143:4248">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I143:4717;141:4210" data-name="Cell-Thoughts">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I143:4717;143:4285" data-name="Icon/Note">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I143:4717;143:4251">
                        Uncomfortable
                      </p>
                    </div>
                  </div>
                </div>
                <TableRowFoodDiary amount="1" amountUnit="Glass" calories="300" className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" date="2028-09-03" fats="10" menu="Blueberry Protein Smoothie" protein="20" sugar="24" thought="Energized" time="7:15 AM" type="Body" />
                <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4667" data-name="Table-Row-Food Diary">
                  <Checkbox className="relative shrink-0 size-[12px]" />
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4667;152:4500" data-name="Cells">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I143:4667;141:4204" data-name="Cell-Date">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4667;141:4206">
                        2028-09-03
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4667;146:4576">
                        12:00 PM
                      </p>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4667;141:4190" data-name="Cell-Category">
                      <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I143:4667;143:4957" data-name="Badge Category - Meal Time">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I143:4667;143:4957;143:4946">
                          Lunch
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I143:4667;141:4186" data-name="Cell-Menu">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I143:4667;141:4189">
                        Greek Salad with Feta and Olives
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I143:4667;141:4207" data-name="Cell-Amount">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4667;141:4209">
                        1
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4667;141:4208">
                        Bowl
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I143:4667;141:4201" data-name="Cell-Calories">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4667;141:4202">
                        400
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4667;146:5003">
                        kcal
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I143:4667;141:4192" data-name="Cell-Qty">
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4667;143:5170" data-name="Data-Carbs">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4667;143:5171">
                          40
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4667;143:5172">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4667;143:5031" data-name="Data-Protein">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4667;143:5032">
                          12
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4667;143:5033">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4667;143:5083" data-name="Data-Fats">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4667;143:5084">
                          20
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4667;143:5085">
                          gr
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I143:4667;143:4244" data-name="Cell-Sugar">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4667;143:4245">
                        4
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4667;143:4248">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I143:4667;141:4210" data-name="Cell-Thoughts">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I143:4667;143:4285" data-name="Icon/Note">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I143:4667;143:4251">
                        Satisfied
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4892" data-name="Table-Row-Food Diary">
                  <Checkbox className="relative shrink-0 size-[12px]" />
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4892;152:4500" data-name="Cells">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I143:4892;141:4204" data-name="Cell-Date">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4892;141:4206">
                        2028-09-03
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4892;146:4576">
                        4:15 PM
                      </p>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4892;141:4190" data-name="Cell-Category">
                      <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I143:4892;143:4957" data-name="Badge Category - Meal Time">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I143:4892;143:4957;143:4948">
                          Snacks
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I143:4892;141:4186" data-name="Cell-Menu">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I143:4892;141:4189">
                        Hummus with Carrot Sticks
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I143:4892;141:4207" data-name="Cell-Amount">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4892;141:4209">
                        1
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4892;141:4208">
                        Serving
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I143:4892;141:4201" data-name="Cell-Calories">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4892;141:4202">
                        180
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4892;146:5003">
                        kcal
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I143:4892;141:4192" data-name="Cell-Qty">
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4892;143:5170" data-name="Data-Carbs">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4892;143:5171">
                          20
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4892;143:5172">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4892;143:5031" data-name="Data-Protein">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4892;143:5032">
                          8
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4892;143:5033">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4892;143:5083" data-name="Data-Fats">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4892;143:5084">
                          7
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4892;143:5085">
                          gr
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I143:4892;143:4244" data-name="Cell-Sugar">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4892;143:4245">
                        2
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4892;143:4248">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I143:4892;141:4210" data-name="Cell-Thoughts">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I143:4892;143:4285" data-name="Icon/Note">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I143:4892;143:4251">
                        Quite Satisfied
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative shrink-0 w-full" data-node-id="143:4917" data-name="Table-Row-Food Diary">
                  <Checkbox className="relative shrink-0 size-[12px]" />
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-w-px relative" data-node-id="I143:4917;152:4500" data-name="Cells">
                    <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[4px] items-start justify-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[82px] whitespace-nowrap" data-node-id="I143:4917;141:4204" data-name="Cell-Date">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4917;141:4206">
                        2028-09-03
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4917;146:4576">
                        7:00 PM
                      </p>
                    </div>
                    <div className="content-stretch flex items-start relative shrink-0 w-[78px]" data-node-id="I143:4917;141:4190" data-name="Cell-Category">
                      <div className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="I143:4917;143:4957" data-name="Badge Category - Meal Time">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I143:4917;143:4957;143:4954">
                          Dinner
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-[176px]" data-node-id="I143:4917;141:4186" data-name="Cell-Menu">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I143:4917;141:4189">
                        Chocolate Cake and Ice Cream
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I143:4917;141:4207" data-name="Cell-Amount">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4917;141:4209">
                        1
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4917;141:4208">
                        Serving
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[56px] whitespace-nowrap" data-node-id="I143:4917;141:4201" data-name="Cell-Calories">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4917;141:4202">
                        600
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4917;146:5003">
                        kcal
                      </p>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[8px] items-center leading-[1.3] not-italic relative rounded-[8px] shrink-0 text-[12px] w-[184px] whitespace-nowrap" data-node-id="I143:4917;141:4192" data-name="Cell-Qty">
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4917;143:5170" data-name="Data-Carbs">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4917;143:5171">
                          75
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4917;143:5172">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4917;143:5031" data-name="Data-Protein">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4917;143:5032">
                          8
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4917;143:5033">
                          gr
                        </p>
                      </div>
                      <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-start px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[56px]" data-node-id="I143:4917;143:5083" data-name="Data-Fats">
                        <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4917;143:5084">
                          25
                        </p>
                        <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4917;143:5085">
                          gr
                        </p>
                      </div>
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[48px] whitespace-nowrap" data-node-id="I143:4917;143:4244" data-name="Cell-Sugar">
                      <p className="relative shrink-0 text-[#272932]" data-node-id="I143:4917;143:4245">
                        50
                      </p>
                      <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I143:4917;143:4248">
                        gr
                      </p>
                    </div>
                    <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center px-[8px] py-[7px] relative rounded-[6px] shrink-0 w-[136px]" data-node-id="I143:4917;141:4210" data-name="Cell-Thoughts">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I143:4917;143:4285" data-name="Icon/Note">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNote} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I143:4917;143:4251">
                        Guilty
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="141:3598" data-name="Footer">
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="141:3599" data-name="Section Result">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="141:3600">
                  Showing
                </p>
                <div className="bg-[#eeeeef] content-stretch flex gap-[4px] items-center pl-[8px] pr-[6px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="141:3601" data-name="Button">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I141:3601;2:3476" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3601;2:3477">
                      12
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I141:3601;2:3478" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I141:3601;2:3479" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown2} />
                    </div>
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="141:3602">
                  out of 84
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="141:3603" data-name="Pagination">
                <div className="bg-[#f6f6f7] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I141:3603;2:4524" data-name="Button Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I141:3603;2:4524;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                  </div>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I141:3603;2:4525" data-name="Button">
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I141:3603;2:4525;2:3331" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3603;2:4525;2:3332">
                      1
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I141:3603;2:4526" data-name="Button">
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I141:3603;2:4526;2:3481" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3603;2:4526;2:3482">
                      2
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I141:3603;2:4527" data-name="Button">
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I141:3603;2:4527;2:3481" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3603;2:4527;2:3482">
                      3
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0 w-[30px]" data-node-id="I141:3603;2:4528" data-name="Button">
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I141:3603;2:4528;2:3551" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3603;2:4528;2:3552">
                      ...
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I141:3603;2:4529" data-name="Button">
                  <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I141:3603;2:4529;2:3481" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I141:3603;2:4529;2:3482">
                      7
                    </p>
                  </div>
                </div>
                <div className="bg-[#eeeeef] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I141:3603;2:4530" data-name="Button Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I141:3603;2:4530;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="105:2654" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="105:2655" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="105:2656">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="105:2657" data-name="Links">
              <p className="relative shrink-0" data-node-id="105:2658">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="105:2659">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="105:2660">
                Contact
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
