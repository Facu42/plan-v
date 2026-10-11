const assetPathPrefix = "https://www.figma.com/api/mcp/asset/e1a9b794-85a2-45bc-b4d6-a9dd1ea0b343";
const imgIconCaretDown = `${assetPathPrefix}/8e5ed.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/2be86.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/ac3fd.svg`;
const imgIconCaretUp = `${assetPathPrefix}/49e1d.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/6e80c.svg`;
const imgIconCaretRight = `${assetPathPrefix}/27dfe.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconFunnel = `${assetPathPrefix}/e3085.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type TableRowMealPlanProps = {
  className?: string;
  size?: "Default";
  type?: "Head";
};

function TableRowMealPlan({ className, size = "Default", type = "Head" }: TableRowMealPlanProps) {
  return (
    <div className={className || "content-stretch flex gap-[16px] h-[40px] items-center relative w-[1172px]"} data-node-id="100:1660">
      <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start px-[16px] py-[5px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="100:1616" data-name="Cell-X-Picker">
        <div className="content-stretch flex items-center justify-between px-[2px] py-[6px] relative shrink-0 w-full" data-node-id="100:1617" data-name="Button Picker">
          <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I100:1617;2:3534" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I100:1617;2:3535">
              Week 2
            </p>
          </div>
          <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I100:1617;2:3536" data-name="Icon">
            <div className="relative shrink-0 size-[14px]" data-node-id="I100:1617;2:3537" data-name="Icon/CaretDown">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative rounded-[14px]" data-node-id="100:1618" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="100:1619">
          Breakfast
        </p>
      </div>
      <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative rounded-[14px]" data-node-id="100:1620" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="100:1621">
          Lunch
        </p>
      </div>
      <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative rounded-[14px]" data-node-id="100:1622" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="100:1623">
          Snack
        </p>
      </div>
      <div className="bg-[#e1e1e2] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[10px] py-[12px] relative rounded-[14px]" data-node-id="100:1624" data-name="Cell-X-Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="100:1625">
          Dinner
        </p>
      </div>
    </div>
  );
}

export default function Component16MealPlanDesktop() {
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="84:2994" data-name="16. Meal Plan (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="84:2995" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I84:2995;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I84:2995;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I84:2995;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I84:2995;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I84:2995;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I84:2995;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I84:2995;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4500;2:3296">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4505;2:3296">
                Messages
              </p>
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4505;2:3297" data-name="Badge">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I84:2995;2:4505;2:3297;2:3262" data-name="Div Red">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I84:2995;2:4505;2:3297;2:3263">
                  6
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4502;2:3296">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[2px] items-start justify-center p-[2px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4503" data-name="Button Nav">
            <div className="content-stretch flex gap-[12px] items-center pb-[10px] pl-[14px] pr-[8px] pt-[8px] relative shrink-0 w-full" data-node-id="I84:2995;2:4503;302:7527" data-name="Menu">
              <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4503;302:7523" data-name="Icon/Nav/SquaresFour">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
              </div>
              <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4503;302:7524" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4503;302:7525">
                  Meal Plan
                </p>
              </div>
              <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I84:2995;2:4503;302:7558" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I84:2995;2:4503;302:7559" data-name="Icon/CaretUp">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                </div>
              </div>
            </div>
            <div className="bg-[#c2e66e] content-stretch flex items-center pl-[56px] pr-[8px] py-[13px] relative rounded-[12px] shrink-0 w-full" data-node-id="I84:2995;2:4503;302:7539" data-name="SubMenu">
              <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:2995;2:4503;302:7541" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4503;302:7542">
                  Meal Plan
                </p>
              </div>
            </div>
            <div className="content-stretch flex items-center pl-[56px] pr-[8px] py-[13px] relative rounded-[12px] shrink-0 w-full" data-node-id="I84:2995;2:4503;302:7544" data-name="SubMenu">
              <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:2995;2:4503;302:7545" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4503;302:7546">
                  Grocery List
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4504;2:3296">
                Food Diary
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4506;2:3296">
                Progress
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4509;2:3296">
                Exercises
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;12:1059;2:3296">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I84:2995;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I84:2995;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I84:2995;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I84:2995;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I84:2995;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I84:2995;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4518;2:3335">
                Claim Now!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2995;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I84:2995;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2995;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2995;2:4519;2:3296">
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="84:2996" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="84:2997" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I84:2997;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I84:2997;2:4460">
              Meal Plan
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I84:2997;2:4462" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:2997;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:2997;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I84:2997;2:4464;2:3571" data-name="Badge">
                <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I84:2997;2:4464;2:3571;2:3270" data-name="Div Red" />
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I84:2997;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I84:2997;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I84:2997;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I84:2997;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I84:2997;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I84:2997;2:4468">
                  Adam Vasylenko
                </p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I84:2997;2:4469">
                  Member
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I84:2997;2:4470">
                <div className="bg-[#f9f4f2] content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I84:2997;2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[28px] items-start min-h-[842px] relative shrink-0 w-full" data-node-id="84:2998" data-name="Body">
          <div className="bg-[#f9f4f2] content-stretch flex items-center justify-between p-[12px] relative rounded-[14px] shrink-0 w-full" data-node-id="89:3810" data-name="Header-Section">
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-node-id="89:3853" data-name="Left Section">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="89:3887" data-name="Buttons">
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="89:3846" data-name="Button Picker">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I89:3846;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                  </div>
                </div>
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="89:3878" data-name="Button Picker">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I89:3878;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[4px] h-[18px] items-center relative shrink-0" data-node-id="89:3811" data-name="Div Title">
                <div className="[word-break:break-word] content-stretch flex gap-[4px] items-center leading-[1.25] not-italic relative shrink-0 text-[14px] whitespace-nowrap" data-node-id="89:3886" data-name="Title">
                  <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="89:3812">
                    September
                  </p>
                  <p className="font-['Poppins:Regular'] relative shrink-0 text-[#868f9b]" data-node-id="89:3813">
                    2028
                  </p>
                </div>
                <div className="content-stretch flex items-center relative shrink-0" data-node-id="89:3882" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="89:3883" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="89:3814" data-name="Right Section">
              <div className="bg-white content-stretch flex gap-[4px] items-center px-[8px] py-[6px] relative rounded-[8px] shrink-0 w-[223px]" data-node-id="89:3815" data-name="Input-search">
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I89:3815;2:3947" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I89:3815;2:3948" data-name="Icon/MagnifyingGlass">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                  </div>
                </div>
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I89:3815;2:3949" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I89:3815;2:3950">
                    Search placeholder
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex gap-[2px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="89:3817" data-name="Button Picker">
                <div className="content-stretch flex items-center pr-[2px] py-[2px] relative shrink-0" data-node-id="I89:3817;2:3507" data-name="Icon Left">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I89:3817;2:3508" data-name="Icon/CalendarBlank">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFunnel} />
                  </div>
                </div>
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I89:3817;2:3509" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I89:3817;2:3510">
                    Filter
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I89:3817;2:3511" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I89:3817;2:3512" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="89:3823" data-name="Button CTA">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I89:3823;2:3331" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I89:3823;2:3332">
                    Add Menu
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="373:10642" data-name="Table">
            <TableRowMealPlan className="content-stretch flex gap-[16px] h-[40px] items-center relative shrink-0 w-full" />
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10644" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10644;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10644;100:1663">
                  Sunday
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10644;100:1664">
                  3 Sep
                </p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10644;100:1675" data-name="Cell-Menu-Breakfast">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10644;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10644;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10644;100:1679">{`Scrambled Eggs with Spinach & Whole Grain Toast`}</p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10644;100:1670" data-name="Cell-Menu-Lunch">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10644;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10644;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10644;100:1674">
                    Grilled Chicken Wrap with Avocado and Spinach
                  </p>
                </div>
              </div>
              <div className="bg-[#fff2e8] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10644;100:1681" data-name="Cell-Menu-Snack">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10644;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10644;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10644;100:1685">
                    Greek Yogurt with Mixed Berries and Almonds
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10644;100:1665" data-name="Cell-Menu-Dinner">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10644;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10644;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10644;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10644;100:1669">
                    Baked Salmon with Steamed Broccoli and Sweet Potatoes
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10645" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10645;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10645;100:1663">
                  Monday
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10645;100:1664">
                  4 Sep
                </p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10645;100:1675" data-name="Cell-Menu-Breakfast">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10645;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10645;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10645;100:1679">
                    Avocado Toast with Poached Egg
                  </p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10645;100:1670" data-name="Cell-Menu-Lunch">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10645;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10645;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10645;100:1674">
                    Quinoa Salad with Roasted Vegetables and Feta
                  </p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10645;100:1681" data-name="Cell-Menu-Snack">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10645;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10645;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10645;100:1685">
                    Apple Slices with Peanut Butter
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10645;100:1665" data-name="Cell-Menu-Dinner">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10645;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10645;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10645;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10645;100:1669">
                    Grilled Turkey Breast with Steamed Asparagus and Brown Rice
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10646" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10646;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10646;100:1663">
                  Tuesday
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10646;100:1664">
                  5 Sep
                </p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10646;100:1675" data-name="Cell-Menu-Breakfast">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10646;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10646;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10646;100:1679">
                    Blueberry Protein Smoothie
                  </p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10646;100:1670" data-name="Cell-Menu-Lunch">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10646;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10646;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10646;100:1674">
                    Greek Salad with Feta and Olives
                  </p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10646;100:1681" data-name="Cell-Menu-Snack">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10646;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10646;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10646;100:1685">
                    Hummus with Carrot Sticks
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10646;100:1665" data-name="Cell-Menu-Dinner">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10646;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10646;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10646;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10646;100:1669">
                    Baked Sweet Potato with Black Beans and Avocado
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10647" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10647;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10647;100:1663">
                  Wednesday
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10647;100:1664">
                  6 Sep
                </p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10647;100:1675" data-name="Cell-Menu-Breakfast">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10647;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10647;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10647;100:1679">
                    Oatmeal with Almond Butter and Berries
                  </p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10647;100:1670" data-name="Cell-Menu-Lunch">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10647;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10647;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10647;100:1674">
                    Veggie Stir-Fry with Tofu and Brown Rice
                  </p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10647;100:1681" data-name="Cell-Menu-Snack">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10647;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10647;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10647;100:1685">
                    Almonds and a Banana
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10647;100:1665" data-name="Cell-Menu-Dinner">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10647;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10647;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10647;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10647;100:1669">
                    Grilled Shrimp Tacos with Mango Salsa
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10648" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10648;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10648;100:1663">
                  Thursday
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10648;100:1664">
                  7 Sep
                </p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10648;100:1675" data-name="Cell-Menu-Breakfast">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10648;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10648;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10648;100:1679">
                    Greek Yogurt with Granola and Honey
                  </p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10648;100:1670" data-name="Cell-Menu-Lunch">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10648;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10648;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10648;100:1674">
                    Baked Chicken Breast with Quinoa and Kale
                  </p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10648;100:1681" data-name="Cell-Menu-Snack">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10648;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10648;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10648;100:1685">
                    Cottage Cheese with Pineapple
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10648;100:1665" data-name="Cell-Menu-Dinner">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10648;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10648;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10648;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10648;100:1669">
                    Lemon Garlic Tilapia with Roasted Brussels Sprouts
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10649" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10649;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10649;100:1663">
                  Friday
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10649;100:1664">
                  8 Sep
                </p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10649;100:1675" data-name="Cell-Menu-Breakfast">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10649;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10649;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10649;100:1679">
                    Smoothie Bowl with Mixed Fruits and Chia Seeds
                  </p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10649;100:1670" data-name="Cell-Menu-Lunch">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10649;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10649;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10649;100:1674">
                    Tuna Salad with Spinach and Chickpeas
                  </p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10649;100:1681" data-name="Cell-Menu-Snack">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10649;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10649;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10649;100:1685">
                    Dark Chocolate and Walnuts
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10649;100:1665" data-name="Cell-Menu-Dinner">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10649;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10649;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10649;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10649;100:1669">
                    Grilled Chicken with Sweet Potato and Green Beans
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] h-[96px] items-center relative shrink-0 w-full" data-node-id="373:10650" data-name="Table-row-meal plan">
              <div className="[word-break:break-word] bg-[#f9f4f2] content-stretch flex flex-col h-full items-start justify-between not-italic p-[16px] relative rounded-[14px] shrink-0 w-[120px]" data-node-id="I373:10650;100:1662" data-name="Cell-Y - Meal Plan">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I373:10650;100:1663">
                  Saturday
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I373:10650;100:1664">
                  9 Sep
                </p>
              </div>
              <div className="bg-[#edffc4] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10650;100:1675" data-name="Cell-Menu-Breakfast">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10650;100:1676" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1677" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1677;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10650;100:1678" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10650;100:1679">
                    Chia Pudding with Strawberries
                  </p>
                </div>
              </div>
              <div className="bg-[#ffedc9] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10650;100:1670" data-name="Cell-Menu-Lunch">
                <div className="bg-[#f9f4f2] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10650;100:1671" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1672" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1672;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10650;100:1673" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10650;100:1674">
                    Mediterranean Couscous Salad with Grilled Vegetables
                  </p>
                </div>
              </div>
              <div className="bg-[#ffeedf] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10650;100:1681" data-name="Cell-Menu-Snack">
                <div className="bg-[#f9f4f2] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10650;100:1682" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1683" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1683;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10650;100:1684" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10650;100:1685">
                    Trail Mix with Dried Fruit and Seeds
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-start min-w-px relative rounded-[14px]" data-node-id="I373:10650;100:1665" data-name="Cell-Menu-Dinner">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] self-stretch shrink-0 w-[88px]" data-node-id="I373:10650;100:1666" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1667" data-name="Image-Meal Plan">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10650;100:1667;93:3927" data-name="Place Image Here" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[96px] items-center justify-center min-w-px px-[16px] py-[12px] relative" data-node-id="I373:10650;100:1668" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#272932] text-[12px] text-ellipsis" data-node-id="I373:10650;100:1669">
                    Roasted Veggie Bowl with Lentils and Avocado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="84:2999" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="84:3000" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="84:3001">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="84:3002" data-name="Links">
              <p className="relative shrink-0" data-node-id="84:3003">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="84:3004">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="84:3005">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="84:3006" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3007" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3008" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3009" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3010" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:3011" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
