const assetPathPrefix = "https://www.figma.com/api/mcp/asset/4e72b7d3-3629-411f-af75-28a987afeece";
const imgSeparator = `${assetPathPrefix}/84e4a.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/22b1d.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/ac3fd.svg`;
const imgIconCaretDown = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/1e657.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/33c19.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/44561.svg`;
const imgEllipse4 = `${assetPathPrefix}/b94c5.svg`;
const imgPlay = `${assetPathPrefix}/2a6ab.svg`;
const imgPlay1 = `${assetPathPrefix}/3eeb9.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;
const imgIconBell = `${assetPathPrefix}/dfce3.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;

type ItemListTrendingTagsProps = {
  className?: string;
  align?: "Vertical";
  amount?: string;
  category?: string;
  tags?: string;
};

function ItemListTrendingTags({ className, align = "Vertical", amount = "15 posts", category = "Mental Health & Wellness", tags = "#PostWorkoutNutrition" }: ItemListTrendingTagsProps) {
  return (
    <div className={className || "border-[#e1e1e2] border-b border-solid content-stretch flex flex-col gap-[6px] items-start pb-[16px] relative w-[289px]"} data-node-id="276:8457">
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="276:8437">
        {tags}
      </p>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="276:8451" data-name="Header">
        <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="276:8452" data-name="Info Category">
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="276:8453">
            {category}
          </p>
        </div>
        <div className="relative shrink-0 size-[4px]" data-node-id="276:8454" data-name="Separator">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSeparator} />
        </div>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic overflow-hidden relative shrink-0 text-[#8a8c90] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="276:8455">
          {amount}
        </p>
      </div>
    </div>
  );
}

function ChipsCategory({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px]"} data-node-id="264:8052" data-name="Chips Category">
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="264:8051">
        Trending
      </p>
    </div>
  );
}

export default function Component31InsightsDesktop() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative size-full" data-node-id="263:6588" data-name="31. Insights (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="263:6589" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I263:6589;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I263:6589;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I263:6589;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I263:6589;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I263:6589;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I263:6589;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I263:6589;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I263:6589;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4500;2:3296">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I263:6589;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I263:6589;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4505;2:3296">
                Messages
              </p>
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4505;2:3297" data-name="Badge">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I263:6589;2:4505;2:3297;2:3262" data-name="Div Red">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I263:6589;2:4505;2:3297;2:3263">
                  6
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I263:6589;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4502;2:3296">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I263:6589;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4503;2:3296">
                Meal Plan
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I263:6589;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I263:6589;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I263:6589;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4504;2:3296">
                Food Diary
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I263:6589;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4506;2:3296">
                Progress
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I263:6589;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4509;2:3296">
                Exercises
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;12:1059;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I263:6589;12:1059;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;12:1059;2:3292">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I263:6589;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I263:6589;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I263:6589;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I263:6589;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I263:6589;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I263:6589;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4518;2:3335">
                Claim Now!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I263:6589;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I263:6589;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I263:6589;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I263:6589;2:4519;2:3296">
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[36px] items-start min-w-px overflow-clip pb-[38px] pt-[28px] px-[28px] relative" data-node-id="263:7113" data-name="Content">
        <div className="content-stretch flex flex-col gap-[28px] items-start relative shrink-0 w-full" data-node-id="566:16408" data-name="Header & Body">
          <div className="bg-[#eeeeef] content-stretch flex flex-col gap-[24px] items-center px-[64px] py-[32px] relative rounded-[16px] shrink-0 w-full" data-node-id="371:10069" data-name="Header">
            <div className="content-stretch flex flex-col items-start py-[2px] relative shrink-0 w-[200px]" data-node-id="371:10070" data-name="Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] text-center w-full" data-node-id="371:10071">
                Healthy Insights
              </p>
            </div>
            <div className="bg-white content-stretch flex gap-[8px] items-center p-[8px] relative rounded-[14px] shrink-0 w-full" data-node-id="371:10072" data-name="Header Menu">
              <div className="bg-white content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px px-[8px] py-[6px] relative rounded-[8px]" data-node-id="371:10073" data-name="Input-search">
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I371:10073;2:3949" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I371:10073;2:3950">
                    Search articles
                  </p>
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="371:10074" data-name="Button More">
                <div className="relative shrink-0 size-[18px]" data-node-id="I371:10074;2:3578" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="371:10075" data-name="Categories">
              <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="371:10076" data-name="Chips Category">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10076;264:8051">
                  Recent
                </p>
              </div>
              <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="371:10077" data-name="Chips Category">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10077;264:8051">
                  Featured
                </p>
              </div>
              <ChipsCategory className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" />
              <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="371:10079" data-name="Chips Category">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10079;264:8051">
                  Popular
                </p>
              </div>
              <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="371:10080" data-name="Chips Category">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10080;264:8051">
                  Recommended
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[28px] items-start pb-[8px] relative shrink-0 w-full" data-node-id="276:9284" data-name="Body">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-[856px]" data-node-id="265:8064" data-name="Tab">
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="265:8066" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I265:8066;2:3334" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I265:8066;2:3335">
                    All
                  </p>
                </div>
              </div>
              <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="265:8068" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I265:8068;2:3484" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[12px] text-center whitespace-nowrap" data-node-id="I265:8068;2:3485">{`Nutrition & Wellness`}</p>
                </div>
              </div>
              <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="265:8070" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I265:8070;2:3484" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[12px] text-center whitespace-nowrap" data-node-id="I265:8070;2:3485">{`Health & Lifestyle`}</p>
                </div>
              </div>
              <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="265:8072" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I265:8072;2:3484" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[12px] text-center whitespace-nowrap" data-node-id="I265:8072;2:3485">{`Fitness & Nutrition`}</p>
                </div>
              </div>
              <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="265:8074" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I265:8074;2:3484" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[12px] text-center whitespace-nowrap" data-node-id="I265:8074;2:3485">{`Health & Wellness`}</p>
                </div>
              </div>
              <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="265:8076" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I265:8076;2:3484" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[12px] text-center whitespace-nowrap" data-node-id="I265:8076;2:3485">{`Mental Health & Wellness`}</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="263:7123" data-name="Widget Featured Menu">
              <div className="bg-white content-stretch flex gap-[28px] items-start relative shrink-0 w-full" data-node-id="263:7125" data-name="Body">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start justify-center min-w-px overflow-clip relative" data-node-id="263:7126" data-name="Featured Articles">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="276:9080" data-name="Header-Section">
                    <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-732px] relative shrink-0" data-node-id="I276:9080;2:4222" data-name="Div Title">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I276:9080;2:4223">
                        Featured Article
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[10px] h-[30px] items-center relative shrink-0 w-[987px]" data-node-id="I276:9080;2:4225" data-name="Right Section" />
                  </div>
                  <div className="bg-[#eeeeef] h-[196px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="263:7127" data-name="Image" />
                  <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="263:7129" data-name="Content">
                    <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="267:8256" data-name="Header">
                      <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="267:8257" data-name="Left Info">
                        <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="267:8258" data-name="Info Category">
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="267:8259">{`Health & Wellness`}</p>
                        </div>
                        <div className="relative shrink-0 size-[3px]" data-node-id="267:8260">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
                        </div>
                        <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="267:8261" data-name="Info Date">
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="267:8262">
                            Sept 15, 2028
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="263:7130">
                      The Importance of Hydration for Optimal Health
                    </p>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.5] not-italic overflow-hidden relative shrink-0 text-[#8a8c90] text-[12px] text-ellipsis w-full" data-node-id="265:8107">
                      Learn how proper hydration impacts your overall health, energy levels, and mental clarity, and get tips on how to stay hydrated throughout the day. Discover the signs of dehydration and how to prevent it with simple daily habits.
                    </p>
                    <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="267:8264" data-name="Footer">
                      <div className="content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="267:8266" data-name="Info Author">
                        <div className="relative rounded-[32px] shrink-0 size-[20px]" data-node-id="267:8267" data-name="Avatar">
                          <div className="absolute bg-[#ffcb65] inset-[-5%] overflow-clip rounded-[20px]" data-node-id="I267:8267;2:3126" data-name="User Image/14" />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="267:8268">
                          Dr. Amelia Johnson
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-[459px]" data-node-id="267:8131" data-name="Widget Popular Menu">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="267:8132" data-name="Header-Section">
                    <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I267:8132;2:4222" data-name="Div Title">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I267:8132;2:4223">
                        Popular Insights
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I267:8132;2:4225" data-name="Right Section">
                      <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="I267:8132;2:4234" data-name="Button CTA">
                        <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I267:8132;2:4234;2:3551" data-name="Text">
                          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I267:8132;2:4234;2:3552">
                            See All
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[28px] items-start justify-center relative shrink-0 w-full" data-node-id="267:8133" data-name="List Menu">
                    <div className="bg-white content-stretch flex gap-[16px] h-[168px] items-center relative rounded-[16px] shrink-0 w-full" data-node-id="267:8294" data-name="Card Popular Insights">
                      <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[16px] shrink-0 w-[165px]" data-node-id="I267:8294;267:8206" data-name="Image">
                        <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I267:8294;267:8207" data-name="Place Image Here" />
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px py-[4px] relative" data-node-id="I267:8294;267:8208" data-name="Info">
                        <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I267:8294;267:8228" data-name="Header">
                          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I267:8294;267:8229" data-name="Left Info">
                            <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I267:8294;267:8234" data-name="Info Category">
                              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I267:8294;267:8235">{`Fitness & Nutrition`}</p>
                            </div>
                            <div className="relative shrink-0 size-[3px]" data-node-id="I267:8294;267:8233">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
                            </div>
                            <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I267:8294;267:8253" data-name="Info Date">
                              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I267:8294;267:8254">
                                Sept 20, 2028
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-h-px not-italic relative w-full" data-node-id="I267:8294;267:8320" data-name="Body">
                          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I267:8294;267:8210">
                            How Nutrient Timing Affects Your Workout Performance
                          </p>
                          <p className="font-['Poppins:Regular'] leading-[1.5] overflow-hidden relative shrink-0 text-[#8a8c90] text-[12px] text-ellipsis w-full" data-node-id="I267:8294;267:8226">
                            Discover the science behind nutrient timing and how it can improve your workout results. Learn the best times to eat for energy, recovery, and muscle growth.
                          </p>
                        </div>
                        <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I267:8294;267:8241" data-name="Footer">
                          <div className="content-stretch flex items-center relative shrink-0" data-node-id="I267:8294;267:8242" data-name="Left Info">
                            <div className="content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I267:8294;267:8243" data-name="Info Date">
                              <div className="relative rounded-[32px] shrink-0 size-[20px]" data-node-id="I267:8294;267:8244" data-name="Avatar">
                                <div className="absolute bg-[#ffcb65] inset-[-5%] overflow-clip rounded-[20px]" data-node-id="I267:8294;267:8244;2:3126" data-name="User Image/19" />
                              </div>
                              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="I267:8294;267:8245">
                                Coach Daniel Green
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white content-stretch flex gap-[16px] h-[168px] items-center relative rounded-[16px] shrink-0 w-full" data-node-id="267:8273" data-name="Card Popular Insights">
                      <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[16px] shrink-0 w-[165px]" data-node-id="I267:8273;267:8206" data-name="Image">
                        <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I267:8273;267:8207" data-name="Place Image Here" />
                        <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.5px)] size-[52px] top-1/2" data-node-id="I267:8273;297:7946" data-name="Play">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay} />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px py-[4px] relative" data-node-id="I267:8273;267:8208" data-name="Info">
                        <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I267:8273;267:8228" data-name="Header">
                          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="I267:8273;267:8229" data-name="Left Info">
                            <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I267:8273;267:8234" data-name="Info Category">
                              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I267:8273;267:8235">
                                Health Tips
                              </p>
                            </div>
                            <div className="relative shrink-0 size-[3px]" data-node-id="I267:8273;267:8233">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
                            </div>
                            <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I267:8273;267:8253" data-name="Info Date">
                              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I267:8273;267:8254">
                                Sept 18, 2028
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-h-px not-italic relative w-full" data-node-id="I267:8273;267:8320" data-name="Body">
                          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I267:8273;267:8210">
                            Hydration Hacks for a Busy Lifestyle
                          </p>
                          <p className="font-['Poppins:Regular'] leading-[1.5] overflow-hidden relative shrink-0 text-[#8a8c90] text-[12px] text-ellipsis w-full" data-node-id="I267:8273;267:8226">
                            This video shares quick and practical hydration tips to help you stay hydrated even with a hectic schedule. Perfect for on-the-go individuals!
                          </p>
                        </div>
                        <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I267:8273;267:8241" data-name="Footer">
                          <div className="content-stretch flex items-center relative shrink-0" data-node-id="I267:8273;267:8242" data-name="Left Info">
                            <div className="content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I267:8273;267:8243" data-name="Info Date">
                              <div className="relative rounded-[32px] shrink-0 size-[20px]" data-node-id="I267:8273;267:8244" data-name="Avatar">
                                <div className="absolute bg-[#ffa257] inset-[-5%] overflow-clip rounded-[20px]" data-node-id="I267:8273;267:8244;2:3126" data-name="User Image/09" />
                              </div>
                              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="I267:8273;267:8245">
                                Dr. Emily Stevens
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[28px] items-start relative shrink-0 w-full" data-node-id="276:9217" data-name="Section Recomendation">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px relative rounded-[16px]" data-node-id="276:8898" data-name="Widget Recommnded Article">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="276:8899" data-name="Header-Section">
                  <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I276:8899;2:4222" data-name="Div Title">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I276:8899;2:4223">
                      Recommended Article
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I276:8899;2:4225" data-name="Right Section">
                    <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="I276:8899;2:4234" data-name="Button CTA">
                      <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I276:8899;2:4234;2:3551" data-name="Text">
                        <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I276:8899;2:4234;2:3552">
                          See All
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[20px] items-center relative shrink-0 w-full" data-node-id="276:8900" data-name="List Rcommendation">
                  <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="276:9174" data-name="Card Recommended Insights">
                    <div className="bg-[#eeeeef] h-[124px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I276:9174;276:9109" data-name="Image">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I276:9174;276:9110" data-name="Place Image Here" />
                    </div>
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I276:9174;276:9111" data-name="Info">
                      <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I276:9174;276:9114" data-name="Info Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I276:9174;276:9115">{`Nutrition & Wellness`}</p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I276:9174;276:9120">
                        Superfoods for Better Brain Function
                      </p>
                      <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I276:9174;276:9117" data-name="Info Date">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I276:9174;276:9118">
                          Sept 5, 2028
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="276:9155" data-name="Card Recommended Insights">
                    <div className="bg-[#eeeeef] h-[124px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I276:9155;276:9109" data-name="Image">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I276:9155;276:9110" data-name="Place Image Here" />
                    </div>
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I276:9155;276:9111" data-name="Info">
                      <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I276:9155;276:9114" data-name="Info Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I276:9155;276:9115">{`Health & Lifestyle`}</p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I276:9155;276:9120">
                        The Benefits of Intermittent Fasting for Longevity
                      </p>
                      <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I276:9155;276:9117" data-name="Info Date">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I276:9155;276:9118">
                          Aug 30, 2028
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px relative rounded-[16px]" data-node-id="276:9183" data-name="Widget Recommnded Article">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="276:9184" data-name="Header-Section">
                  <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I276:9184;2:4222" data-name="Div Title">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I276:9184;2:4223">
                      Recommended Video
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I276:9184;2:4225" data-name="Right Section">
                    <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="I276:9184;2:4234" data-name="Button CTA">
                      <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I276:9184;2:4234;2:3551" data-name="Text">
                        <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I276:9184;2:4234;2:3552">
                          See All
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[20px] items-center relative shrink-0 w-full" data-node-id="276:9185" data-name="List Rcommendation">
                  <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="276:9186" data-name="Card Recommended Insights">
                    <div className="bg-[#eeeeef] h-[124px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I276:9186;276:9109" data-name="Image">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I276:9186;276:9110" data-name="Place Image Here" />
                      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.5px)] size-[48px] top-1/2" data-node-id="I276:9186;297:7931" data-name="Play">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay1} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I276:9186;276:9111" data-name="Info">
                      <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I276:9186;276:9114" data-name="Info Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I276:9186;276:9115">
                          Fitness Tips
                        </p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I276:9186;276:9120">
                        Stretching Routines to Boost Flexibility
                      </p>
                      <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I276:9186;276:9117" data-name="Info Date">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I276:9186;276:9118">
                          Sept 3, 2028
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="276:9187" data-name="Card Recommended Insights">
                    <div className="bg-[#eeeeef] h-[124px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I276:9187;276:9109" data-name="Image">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I276:9187;276:9110" data-name="Place Image Here" />
                      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.5px)] size-[48px] top-1/2" data-node-id="I276:9187;297:7931" data-name="Play">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay1} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I276:9187;276:9111" data-name="Info">
                      <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I276:9187;276:9114" data-name="Info Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I276:9187;276:9115">
                          Nutrition Hacks
                        </p>
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I276:9187;276:9120">{`Quick & Healthy Breakfast Ideas for Busy Mornings`}</p>
                      <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I276:9187;276:9117" data-name="Info Date">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I276:9187;276:9118">
                          Aug 25, 2028
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="263:7191" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="263:7192" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="263:7193">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="263:7194" data-name="Links">
              <p className="relative shrink-0" data-node-id="263:7195">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="263:7196">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="263:7197">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="263:7198" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="263:7199" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="263:7200" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="263:7201" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="263:7202" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="263:7203" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[32px] items-start p-[28px] relative self-stretch shrink-0 w-[305px]" data-node-id="263:7204" data-name="Right Side">
        <div className="content-stretch flex items-center justify-between relative rounded-[28px] shrink-0 w-full" data-node-id="263:7205" data-name="Header Menu">
          <div className="content-stretch flex items-center relative shrink-0" data-node-id="263:7206" data-name="User Profile">
            <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="263:7207" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I263:7207;2:3098" data-name="User Image/12">
                <div className="absolute inset-0 rounded-[12px]" data-node-id="I263:7207;2:3098;2:3159" data-name="Place Image Here" />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic pl-[12px] pr-[8px] relative shrink-0 whitespace-nowrap" data-node-id="263:7208" data-name="User Name">
              <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="263:7209">
                Adam Vasylenko
              </p>
              <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="263:7210">
                Member
              </p>
            </div>
          </div>
          <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="263:7212" data-name="Button Icon">
            <div className="relative shrink-0 size-[22px]" data-node-id="I263:7212;2:3570" data-name="Icon/ChatTeardropDots">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
            </div>
            <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I263:7212;2:3571" data-name="Badge">
              <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I263:7212;2:3571;2:3270" data-name="Div Red" />
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="263:7213" data-name="Widget Trending Tags">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="263:7214" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I263:7214;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I263:7214;2:4223">
                Trending Tags
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I263:7214;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I263:7214;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I263:7214;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="263:7215" data-name="List Menu">
            <ItemListTrendingTags amount="8 posts" category="Health & Wellness" className="border-[#e1e1e2] border-b border-solid content-stretch flex flex-col gap-[6px] items-start pb-[16px] relative shrink-0 w-full" tags="#Hydration" />
            <ItemListTrendingTags amount="12 posts" category="Health & Lifestyle" className="border-[#e1e1e2] border-b border-solid content-stretch flex flex-col gap-[6px] items-start pb-[16px] relative shrink-0 w-full" tags="#IntermittentFasting" />
            <ItemListTrendingTags category="Nutrition & Wellness" className="border-[#e1e1e2] border-b border-solid content-stretch flex flex-col gap-[6px] items-start pb-[16px] relative shrink-0 w-full" tags="#Superfoods" />
            <ItemListTrendingTags amount="6 posts" className="border-[#e1e1e2] border-b border-solid content-stretch flex flex-col gap-[6px] items-start pb-[16px] relative shrink-0 w-full" tags="#MindfulEating" />
            <ItemListTrendingTags amount="5 posts" className="border-[#e1e1e2] border-b border-solid content-stretch flex flex-col gap-[6px] items-start pb-[16px] relative shrink-0 w-full" tags="#BalancedBites" />
            <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-node-id="276:8486" data-name="Item List Trending Tags">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I276:8486;276:8437">
                #PostWorkoutNutrition
              </p>
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="I276:8486;276:8451" data-name="Header">
                <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I276:8486;276:8452" data-name="Info Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I276:8486;276:8453">{`Fitness & Nutrition`}</p>
                </div>
                <div className="relative shrink-0 size-[4px]" data-node-id="I276:8486;276:8454" data-name="Separator">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSeparator} />
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic overflow-hidden relative shrink-0 text-[#8a8c90] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="I276:8486;276:8455">
                  10 posts
                </p>
              </div>
            </div>
          </div>
          <div className="border border-[#e1e1e2] border-solid content-stretch flex items-center justify-center px-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="276:8493" data-name="Button">
            <div className="content-stretch flex items-center px-[2px] py-[3px] relative shrink-0" data-node-id="I276:8493;2:3519" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I276:8493;2:3520">
                Show More
              </p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="276:8517" data-name="Widget Top Author">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="276:8518" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I276:8518;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I276:8518;2:4223">
                Top Author
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I276:8518;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I276:8518;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I276:8518;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="276:8519" data-name="List Menu">
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-[249px]" data-node-id="276:8748" data-name="User Profile">
              <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I276:8748;276:8854" data-name="Image">
                <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I276:8748;276:8705" data-name="Avatar">
                  <div className="absolute bg-[#c2e66e] inset-0" data-node-id="I276:8748;276:8705;2:3114" data-name="User Image/05" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I276:8748;276:8706" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I276:8748;276:8707">
                  Chef Michael Harris
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I276:8748;276:8708">
                  90K Followers
                </p>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-[249px]" data-node-id="276:8775" data-name="User Profile">
              <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I276:8775;276:8854" data-name="Image">
                <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I276:8775;276:8705" data-name="Avatar">
                  <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I276:8775;276:8705;2:3114" data-name="User Image/18" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I276:8775;276:8706" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I276:8775;276:8707">
                  Dr. Sarah Collins
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I276:8775;276:8708">
                  85K Followers
                </p>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-[249px]" data-node-id="276:8757" data-name="User Profile">
              <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I276:8757;276:8854" data-name="Image">
                <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I276:8757;276:8705" data-name="Avatar">
                  <div className="absolute bg-[#ffa257] inset-0" data-node-id="I276:8757;276:8705;2:3114" data-name="User Image/19" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I276:8757;276:8706" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I276:8757;276:8707">
                  Coach Daniel Green
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I276:8757;276:8708">
                  72K Followers
                </p>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-[249px]" data-node-id="276:8766" data-name="User Profile">
              <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I276:8766;276:8854" data-name="Image">
                <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I276:8766;276:8705" data-name="Avatar">
                  <div className="absolute bg-[#c2e66e] inset-0" data-node-id="I276:8766;276:8705;2:3114" data-name="User Image/08" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I276:8766;276:8706" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I276:8766;276:8707">
                  Jane Murray
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I276:8766;276:8708">
                  65K Followers
                </p>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-[249px]" data-node-id="276:8739" data-name="User Profile">
              <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I276:8739;276:8854" data-name="Image">
                <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I276:8739;276:8705" data-name="Avatar">
                  <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I276:8739;276:8705;2:3114" data-name="User Image/07" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I276:8739;276:8706" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I276:8739;276:8707">
                  Dr. Emily Thompson
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I276:8739;276:8708">
                  58K Followers
                </p>
              </div>
            </div>
            <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-[249px]" data-node-id="276:9292" data-name="User Profile">
              <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I276:9292;276:8854" data-name="Image">
                <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I276:9292;276:8705" data-name="Avatar">
                  <div className="absolute bg-[#ffa257] inset-0" data-node-id="I276:9292;276:8705;2:3114" data-name="User Image/06">
                    <div className="absolute inset-[0_0.28%_0_0]" data-node-id="I276:9292;276:8705;2:3114;2:3147" data-name="Place Image Here" />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I276:9292;276:8706" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I276:9292;276:8707">
                  Coach Adam Maes
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I276:9292;276:8708">
                  46K Followers
                </p>
              </div>
            </div>
          </div>
          <div className="border border-[#e1e1e2] border-solid content-stretch flex items-center justify-center px-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="276:8525" data-name="Button">
            <div className="content-stretch flex items-center px-[2px] py-[3px] relative shrink-0" data-node-id="I276:8525;2:3519" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I276:8525;2:3520">
                Show More
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
