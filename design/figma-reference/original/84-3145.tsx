const assetPathPrefix = "https://www.figma.com/api/mcp/asset/a9ea6a1f-6390-4b49-ac2a-0af47797cd1f";
const imgIconSpecialFire = `${assetPathPrefix}/36850.svg`;
const imgLine = `${assetPathPrefix}/9d354.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/2ee85.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/bf5d8.svg`;
const imgIconCaretDown = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconArrowLeft = `${assetPathPrefix}/980a2.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/2b979.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgIconClock = `${assetPathPrefix}/1f647.svg`;
const imgIconSpecialKnife = `${assetPathPrefix}/246bc.svg`;
const imgIconSpecialCookingPot = `${assetPathPrefix}/33cab.svg`;
const imgIconChartBar = `${assetPathPrefix}/a1d03.svg`;
const imgIconSpecialListNumbers = `${assetPathPrefix}/7a7e7.svg`;
const imgIconNavHeartbeat1 = `${assetPathPrefix}/5a044.svg`;
const imgDivider = `${assetPathPrefix}/c1f05.svg`;
const imgStar = `${assetPathPrefix}/c88d0.svg`;
const imgStar1 = `${assetPathPrefix}/71b23.svg`;
const imgStar2 = `${assetPathPrefix}/d98b5.svg`;
const imgDot = `${assetPathPrefix}/f0f58.svg`;
const imgIconMinus = `${assetPathPrefix}/4425e.svg`;
const imgIconPlus = `${assetPathPrefix}/2ac73.svg`;
const imgDivider1 = `${assetPathPrefix}/aeaa7.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/bb986.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/a4b28.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/871ca.svg`;
const imgIconDotsThree = `${assetPathPrefix}/1fb9c.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

function ItemDetailMealValueRecipeDetails({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#c2e66e] content-stretch flex flex-col gap-[16px] items-center p-[12px] relative rounded-[16px] w-[64.75px]"} data-node-id="251:6518" data-name="Item Detail Meal Value - Recipe Details">
      <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="251:6510" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="251:6511" data-name="Icon/Special/Fire">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
        </div>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="251:6512" data-name="Info">
        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="251:6513">
          Calories
        </p>
        <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="251:6514" data-name="Amount">
          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="251:6515">
            450
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[10px]" data-node-id="251:6516">
            kcal
          </p>
        </div>
      </div>
    </div>
  );
}

type ItemListSimpleProps = {
  className?: string;
  item?: string;
  number?: string;
  type?: "Circle" | "Square";
};

function ItemListSimple({ className, item = "Saucepan for cooking brown rice", number = "1", type = "Circle" }: ItemListSimpleProps) {
  const isSquare = type === "Square";
  return (
    <div className={className || "content-stretch flex gap-[12px] items-center min-h-[32px] relative w-[206.5px]"} id={isSquare ? "node-370_9863" : "node-256_7875"}>
      <div className={`content-stretch flex flex-col items-center justify-center p-[6px] relative shrink-0 ${isSquare ? "border border-[#8a8c90] border-solid rounded-[7px]" : "bg-[#ffa257] rounded-[20px]"}`} id={isSquare ? "node-370_9867" : "node-256_7872"} data-name="Number">
        {type === "Circle" && (
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] text-center w-[16px]" data-node-id="256:7873">
            {number}
          </p>
        )}
        {isSquare && (
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] text-center w-[16px]" data-node-id="370:9868">
            {number}
          </p>
        )}
      </div>
      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#52545b] text-[12px]" data-node-id="256:7874">
        {item}
      </p>
    </div>
  );
}

type ItemListDirectionsProps = {
  className?: string;
  desc?: string;
  showLine?: boolean;
  step?: string;
  title?: string;
};

function ItemListDirections({ className, desc = "Crack the eggs into a mixing bowl, add a pinch of salt and pepper, and whisk until fully blended.", showLine = true, step = "1", title = "Prep the Ingredients" }: ItemListDirectionsProps) {
  return (
    <div className={className || "content-stretch flex gap-[12px] items-start relative w-[425px]"} data-node-id="256:7349" data-name="Item List Directions">
      <div className="content-stretch flex flex-col gap-[4px] items-center pb-[4px] relative self-stretch shrink-0" data-node-id="256:7342" data-name="Left Side">
        <div className="bg-[#ffcb65] content-stretch flex flex-col items-center justify-center p-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="256:7343" data-name="Number">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#52545b] text-[14px] text-center w-full" data-node-id="256:7344">
            {step}
          </p>
        </div>
        {showLine && (
          <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="256:7345" data-name="Line">
            <div className="absolute inset-[0_-0.5px]">
              <img alt="" className="block max-w-none size-full" src={imgLine} />
            </div>
          </div>
        )}
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic pb-[14px] pt-[6px] relative" data-node-id="256:7346" data-name="Content">
        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px] w-full" data-node-id="256:7347">
          {title}
        </p>
        <p className="font-['Poppins:Regular'] leading-[1.5] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="256:7348">
          {desc}
        </p>
      </div>
    </div>
  );
}

export default function Component13RecipeDetailsDesktop() {
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="84:3145" data-name="13. Recipe Details (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="84:3146" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I84:3146;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I84:3146;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I84:3146;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I84:3146;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I84:3146;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I84:3146;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I84:3146;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4500;2:3296">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4505;2:3296">
                Messages
              </p>
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4505;2:3297" data-name="Badge">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I84:3146;2:4505;2:3297;2:3262" data-name="Div Red">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I84:3146;2:4505;2:3297;2:3263">
                  6
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4502;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:3146;2:4502;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4502;2:3292">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4503;2:3296">
                Meal Plan
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I84:3146;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I84:3146;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4504;2:3296">
                Food Diary
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4506;2:3296">
                Progress
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4509;2:3296">
                Exercises
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;12:1059;2:3296">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I84:3146;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I84:3146;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I84:3146;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I84:3146;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I84:3146;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I84:3146;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4518;2:3335">
                Claim Now!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:3146;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I84:3146;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:3146;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:3146;2:4519;2:3296">
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="84:3147" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="84:3148" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I84:3148;2:4472" data-name="Title">
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I84:3148;2:4473" data-name="Back Button">
              <div className="relative shrink-0 size-[16px]" data-node-id="I84:3148;2:4474" data-name="Icon/ArrowLeft">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I84:3148;2:4475">
                Back to Menu
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] min-w-full not-italic relative shrink-0 text-[#272932] text-[22px] w-[min-content]" data-node-id="I84:3148;2:4476">
              Recipe Details
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I84:3148;2:4477" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:3148;2:4478" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:3148;2:4478;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:3148;2:4479" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:3148;2:4479;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I84:3148;2:4479;2:3571" data-name="Badge">
                <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I84:3148;2:4479;2:3571;2:3270" data-name="Div Red" />
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I84:3148;33:1604" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I84:3148;33:1605" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I84:3148;33:1605;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I84:3148;33:1605;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I84:3148;33:1606" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I84:3148;33:1607">
                  Adam Vasylenko
                </p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I84:3148;33:1608">
                  Member
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I84:3148;33:1609">
                <div className="bg-[#f9f4f2] content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I84:3148;33:1609;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-start min-h-[842px] relative shrink-0 w-full" data-node-id="84:3149" data-name="Body">
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-[275px]" data-node-id="256:7534" data-name="Left Side">
            <div className="bg-[#eeeeef] h-[275px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="248:9520" data-name="Image">
              <div className="absolute inset-[-0.36%_-0.36%_0_0]" data-node-id="371:10269" data-name="Place Image Here" />
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="250:9614" data-name="Section Info">
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="371:9996" data-name="List Info">
                <div className="content-stretch flex h-[24px] items-center justify-between relative rounded-[8px] shrink-0 w-full" data-node-id="256:7542" data-name="Item Detail Info">
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="256:7543" data-name="Label">
                    <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="256:7544" data-name="Icon">
                      <div className="relative shrink-0 size-[12px]" data-node-id="256:7545" data-name="Icon/Clock">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="256:7546">
                      Eat Time
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="256:7547">
                    12:30 PM
                  </p>
                </div>
                <div className="content-stretch flex h-[24px] items-center justify-between relative rounded-[8px] shrink-0 w-full" data-node-id="256:7548" data-name="Item Detail Info">
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="256:7549" data-name="Label">
                    <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="256:7550" data-name="Icon">
                      <div className="relative shrink-0 size-[12px]" data-node-id="256:7551" data-name="Icon/Special/Knife">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialKnife} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="256:7552">
                      Prep Time
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="256:7553">
                    10 minutes
                  </p>
                </div>
                <div className="content-stretch flex h-[24px] items-center justify-between relative rounded-[8px] shrink-0 w-full" data-node-id="256:7554" data-name="Item Detail Info">
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="256:7555" data-name="Label">
                    <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="256:7556" data-name="Icon">
                      <div className="relative shrink-0 size-[12px]" data-node-id="256:7557" data-name="Icon/Special/CookingPot">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialCookingPot} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="256:7558">
                      Cook Time
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="256:7559">
                    15 minutes
                  </p>
                </div>
                <div className="content-stretch flex h-[24px] items-center justify-between relative rounded-[8px] shrink-0 w-full" data-node-id="371:9968" data-name="Item Detail Info">
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="371:9969" data-name="Label">
                    <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="371:9970" data-name="Icon">
                      <div className="relative shrink-0 size-[12px]" data-node-id="371:9971" data-name="Icon/ChartBar">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="371:9972">
                      Difficulty
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="371:9973">
                    Medium
                  </p>
                </div>
                <div className="content-stretch flex h-[24px] items-center justify-between relative rounded-[8px] shrink-0 w-full" data-node-id="371:9974" data-name="Item Detail Info">
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="371:9975" data-name="Label">
                    <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="371:9976" data-name="Icon">
                      <div className="relative shrink-0 size-[12px]" data-node-id="371:9977" data-name="Icon/Special/ListNumbers">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialListNumbers} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="371:9978">
                      Total Steps
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="371:9979">
                    5 steps
                  </p>
                </div>
                <div className="content-stretch flex h-[24px] items-center justify-between relative rounded-[8px] shrink-0 w-full" data-node-id="371:9980" data-name="Item Detail Info">
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="371:9981" data-name="Label">
                    <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="371:9982" data-name="Icon">
                      <div className="relative shrink-0 size-[12px]" data-node-id="371:9983" data-name="Icon/Nav/Heartbeat">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat1} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#8a8c90] text-[14px] whitespace-nowrap" data-node-id="371:9984">
                      Health Score
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="371:9985">
                    9/10
                  </p>
                </div>
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-node-id="371:10059" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start justify-center p-[16px] relative shrink-0 w-full" data-node-id="371:10026" data-name="Section Reviews">
              <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="371:10027" data-name="Total Servings">
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="371:10039" data-name="Title">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="371:10028">
                    Reviews
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="371:10038">
                    by 125 People
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="371:10058" data-name="Ratings">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="371:10040" data-name="Stars">
                    <div className="relative shrink-0 size-[14px]" data-node-id="371:10041" data-name="Star">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                    </div>
                    <div className="relative shrink-0 size-[14px]" data-node-id="371:10043" data-name="Star">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                    </div>
                    <div className="relative shrink-0 size-[14px]" data-node-id="371:10045" data-name="Star">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                    </div>
                    <div className="relative shrink-0 size-[14px]" data-node-id="371:10047" data-name="Star">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                    </div>
                    <div className="relative shrink-0 size-[14px]" data-node-id="371:10049" data-name="Star">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar1} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="371:10054" data-name="Info Rating">
                    <p className="leading-[1.3] relative shrink-0 text-[#52545b] text-[12px]" data-node-id="371:10055">
                      4.8
                    </p>
                    <p className="leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="371:10056">
                      /5
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start overflow-clip relative shrink-0 w-full" data-node-id="371:9997" data-name="List Review">
                <div className="bg-[#fefcfb] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="371:9998" data-name="Card Reviews - Receipt Details">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.5] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I371:9998;256:7697">
                    Very easy to make, and the portion was just right. I added a little garlic to the rice for extra flavor. This will be a regular meal in my meal prep rotation.
                  </p>
                  <div className="content-stretch flex gap-[13px] items-end relative shrink-0 w-full" data-node-id="I371:9998;256:7687" data-name="Header">
                    <div className="bg-[#c2e66e] overflow-clip relative rounded-[24px] shrink-0 size-[36px]" data-node-id="I371:9998;256:7688" data-name="Image">
                      <div className="absolute inset-0 rounded-[32px]" data-node-id="I371:9998;256:7689" data-name="Avatar">
                        <div className="absolute bg-[#c2e66e] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I371:9998;256:7689;2:3102" data-name="User Image/16" />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I371:9998;256:7690" data-name="Title Info">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] min-w-full not-italic relative shrink-0 text-[#52545b] text-[12px] w-[min-content]" data-node-id="I371:9998;256:7691">
                        Sarah Murad
                      </p>
                      <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I371:9998;256:7692" data-name="Badge Meal Category">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I371:9998;256:7693" data-name="Star">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar2} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:9998;256:7695">
                          5/5
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#fefcfb] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="371:9999" data-name="Card Reviews - Receipt Details">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.5] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I371:9999;256:7697">
                    This is my go-to lunch recipe now! Simple, nutritious, and delicious. I love how quickly it comes together on busy days.
                  </p>
                  <div className="content-stretch flex gap-[13px] items-end relative shrink-0 w-full" data-node-id="I371:9999;256:7687" data-name="Header">
                    <div className="bg-[#ffa257] overflow-clip relative rounded-[24px] shrink-0 size-[36px]" data-node-id="I371:9999;256:7688" data-name="Image">
                      <div className="absolute inset-0 rounded-[32px]" data-node-id="I371:9999;256:7689" data-name="Avatar">
                        <div className="absolute bg-[#ffa257] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I371:9999;256:7689;2:3102" data-name="User Image/08" />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I371:9999;256:7690" data-name="Title Info">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] min-w-full not-italic relative shrink-0 text-[#52545b] text-[12px] w-[min-content]" data-node-id="I371:9999;256:7691">
                        Linda Rawls
                      </p>
                      <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I371:9999;256:7692" data-name="Badge Meal Category">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I371:9999;256:7693" data-name="Star">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar2} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:9999;256:7695">
                          4.7/5
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col gap-[24px] items-start px-[28px] py-[4px] relative rounded-[16px] self-stretch shrink-0 w-[591px]" data-node-id="248:9522" data-name="Content">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="248:9523">
              Grilled Turkey Breast with Steamed Asparagus and Brown Rice
            </p>
            <div className="bg-[#f6f6f7] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="371:9991" data-name="Section About">
              <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="371:9992" data-name="Badge Meal Category">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#52545b] text-[14px] whitespace-nowrap" data-node-id="371:9993">
                  Lunch
                </p>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="371:9994">
                A lean and balanced meal that’s perfect for a post-workout lunch or a healthy midday option. This meal provides a great balance of protein, fiber, and healthy fats while being low in calories. The grilled turkey breast offers a rich source of lean protein, while the steamed asparagus and brown rice provide essential vitamins and minerals.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[24px] items-start py-[16px] relative shrink-0 w-full" data-node-id="371:10060" data-name="Tools & Direction">
              <div className="content-stretch flex gap-[16px] items-start pb-[16px] relative rounded-[28px] shrink-0 w-full" data-node-id="256:7830" data-name="Section Tools">
                <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="256:7831" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] w-[90px]" data-node-id="256:7832">{`Tools & Equipment`}</p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-start min-w-px relative" data-node-id="256:7833" data-name="List Nutrition Facts">
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="256:7834" data-name="Column 1">
                    <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Grill pan or outdoor grill" />
                    <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Medium pot for steaming" number="2" />
                    <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" number="3" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="256:7838" data-name="Column 2">
                    <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Tongs for turning turkey" number="4" />
                    <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Cutting board" number="5" />
                    <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Knife" number="6" />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[16px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="256:7741" data-name="Section Directions">
                <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="256:7742" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] w-[90px]" data-node-id="256:7743">
                    Directions
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="256:7744" data-name="List Nutrition Facts">
                  <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="Season the turkey breast with olive oil, salt, and pepper. Set aside." title="Prepare the Turkey" />
                  <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="In a saucepan, cook 1/2 cup of brown rice in 1 cup of water. Let it simmer for 15 minutes or until fully cooked." step="2" title="Cook the Brown Rice" />
                  <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="Preheat the grill pan over medium heat. Grill the turkey breast for 6-7 minutes on each side until fully cooked (internal temp: 165°F)." step="3" title="Grill the Turkey" />
                  <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="In a medium pot, steam the asparagus for 5 minutes or until tender." step="4" title="Steam the Asparagus" />
                  <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="Arrange the turkey breast, brown rice, and asparagus on a plate. Garnish with a lemon wedge." showLine={false} step="5" title="Serve and Garnish" />
                </div>
              </div>
              <div className="content-stretch flex gap-[16px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="369:9818" data-name="Section Notes">
                <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="369:9819" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] w-[90px]" data-node-id="369:9820">
                    Notes
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="369:9821" data-name="List Nutrition Facts">
                  <div className="content-stretch flex gap-[16px] items-center min-h-[32px] relative shrink-0 w-full" data-node-id="369:9822" data-name="Item List Simple">
                    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[20px] shrink-0" data-node-id="I369:9822;370:9871" data-name="Icon">
                      <div className="relative shrink-0 size-[28px]" data-node-id="I369:9822;370:9875" data-name="Dot">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgDot} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative" data-node-id="I369:9822;371:9890" data-name="Info Text">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#52545b] text-[12px]" data-node-id="I369:9822;370:9873">
                        For added flavor, marinate the turkey in lemon juice and garlic for 30 minutes before grilling.
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[16px] items-center min-h-[32px] relative shrink-0 w-full" data-node-id="369:9823" data-name="Item List Simple">
                    <div className="content-stretch flex flex-col items-center justify-center relative rounded-[20px] shrink-0" data-node-id="I369:9823;370:9871" data-name="Icon">
                      <div className="relative shrink-0 size-[28px]" data-node-id="I369:9823;370:9875" data-name="Dot">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgDot} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative" data-node-id="I369:9823;371:9890" data-name="Info Text">
                      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#52545b] text-[12px]" data-node-id="I369:9823;370:9873">
                        You can replace brown rice with quinoa or couscous for variety.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start relative self-stretch shrink-0 w-[295px]" data-node-id="251:7273" data-name="Right Side">
            <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="256:7453" data-name="Block Total Servings">
              <div className="content-stretch flex gap-[75px] items-center relative shrink-0" data-node-id="256:7913" data-name="Total Servings">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="256:7458">
                  Total Servings
                </p>
                <div className="bg-[#fefcfb] content-stretch flex gap-[10px] items-center p-[4px] relative rounded-[9px] shrink-0" data-node-id="256:7454" data-name="Label">
                  <div className="bg-[#c2e66e] content-stretch flex items-start p-[5px] relative rounded-[7px] shrink-0" data-node-id="256:7491" data-name="Button Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I256:7491;2:3580" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#878a94] text-[12px] whitespace-nowrap" data-node-id="256:7457">
                    2
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-start p-[5px] relative rounded-[7px] shrink-0" data-node-id="256:7486" data-name="Button Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I256:7486;2:3580" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-0 relative shrink-0 w-full" data-node-id="256:7936" data-name="Divider">
                <div className="absolute inset-[-0.5px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgDivider1} />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="371:9901" data-name="Section Ingredients">
                <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="371:9902" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] w-[90px]" data-node-id="371:9903">
                    Ingredients
                  </p>
                </div>
                <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="371:9904" data-name="List Nutrition Facts">
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="200 g turkey breast" type="Square" />
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="1 cup asparagus (steamed)" number="2" type="Square" />
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="1/2 cup cooked brown rice" number="3" type="Square" />
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="1 tbsp olive oil" number="4" type="Square" />
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Salt and pepper to taste" number="5" type="Square" />
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Lemon for garnish" number="6" type="Square" />
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] h-[118px] items-start relative shrink-0 w-full" data-node-id="251:6471" data-name="Details">
              <ItemDetailMealValueRecipeDetails className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px p-[12px] relative rounded-[16px]" />
              <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px p-[12px] relative rounded-[16px]" data-node-id="251:6519" data-name="Item Detail Meal Value - Recipe Details">
                <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I251:6519;251:6510" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I251:6519;251:6511" data-name="Icon/Special/Fire">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I251:6519;251:6512" data-name="Info">
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I251:6519;251:6513">
                    Carbs
                  </p>
                  <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="I251:6519;251:6514" data-name="Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I251:6519;251:6515">
                      40
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[10px]" data-node-id="I251:6519;251:6516">
                      gr
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px p-[12px] relative rounded-[16px]" data-node-id="251:6528" data-name="Item Detail Meal Value - Recipe Details">
                <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I251:6528;251:6510" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I251:6528;251:6511" data-name="Icon/Special/Fire">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I251:6528;251:6512" data-name="Info">
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I251:6528;251:6513">
                    Protein
                  </p>
                  <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="I251:6528;251:6514" data-name="Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I251:6528;251:6515">
                      35
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[10px]" data-node-id="I251:6528;251:6516">
                      gr
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#e1e1e2] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px p-[12px] relative rounded-[16px]" data-node-id="251:6537" data-name="Item Detail Meal Value - Recipe Details">
                <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I251:6537;251:6510" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I251:6537;251:6511" data-name="Icon/Special/Fire">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I251:6537;251:6512" data-name="Info">
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I251:6537;251:6513">
                    Fats
                  </p>
                  <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="I251:6537;251:6514" data-name="Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I251:6537;251:6515">
                      12
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[10px]" data-node-id="I251:6537;251:6516">
                      gr
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px p-[16px] relative rounded-[16px] w-full" data-node-id="251:6942" data-name="Widget Nutrition Facts">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="251:6943" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-810px] relative shrink-0" data-node-id="I251:6943;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="I251:6943;2:4223">
                    Nutrition Facts
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I251:6943;2:4225" data-name="Right Section">
                  <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I251:6943;2:4233" data-name="Button More">
                    <div className="relative shrink-0 size-[24px]" data-node-id="I251:6943;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px relative w-full" data-node-id="251:6944" data-name="List Nutrition Facts">
                <div className="[word-break:break-word] content-stretch flex items-end justify-between mb-[-1.875px] not-italic pb-[14px] relative shrink-0 w-full whitespace-nowrap" data-node-id="251:6945" data-name="Info Cal">
                  <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="251:6946">
                    Calories
                  </p>
                  <div className="content-stretch flex flex-col gap-[2px] items-end relative shrink-0" data-node-id="251:6947" data-name="Info">
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="251:6948">
                      Per Serving
                    </p>
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="251:6949">
                      450 kcal
                    </p>
                  </div>
                </div>
                <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="251:6950" data-name="Info Cal">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6951">
                    Carbohydrates
                  </p>
                  <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="251:6952" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6953">
                      40 gr
                    </p>
                  </div>
                </div>
                <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="251:6962" data-name="Info Cal">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6963">
                    Protein
                  </p>
                  <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="251:6964" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6965">
                      35 gr
                    </p>
                  </div>
                </div>
                <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="251:6966" data-name="Info Cal">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6967">
                    Total Fat
                  </p>
                  <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="251:6968" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6969">
                      12 gr
                    </p>
                  </div>
                </div>
                <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="251:6998" data-name="Info Cal">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6999">
                    Fiber
                  </p>
                  <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="251:7000" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:7001">
                      7 gr
                    </p>
                  </div>
                </div>
                <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="251:6982" data-name="Info Cal">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6983">
                    Sodium
                  </p>
                  <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="251:6984" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6985">
                      420 mg
                    </p>
                  </div>
                </div>
                <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="251:6978" data-name="Info Cal">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6979">
                    Cholesterol
                  </p>
                  <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="251:6980" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6981">
                      75 mg
                    </p>
                  </div>
                </div>
                <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="251:6986" data-name="Info Cal">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6987">
                    Sugars
                  </p>
                  <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="251:6988" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="251:6989">
                      4 gr
                    </p>
                  </div>
                </div>
                <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="371:10061" data-name="Info Cal">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="371:10062">
                    Vitamin C
                  </p>
                  <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="371:10063" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="371:10064">
                      20% DV
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="84:3150" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="84:3151" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="84:3152">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="84:3153" data-name="Links">
              <p className="relative shrink-0" data-node-id="84:3154">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="84:3155">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="84:3156">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="84:3157" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3158" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3159" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3160" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3161" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3162" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
