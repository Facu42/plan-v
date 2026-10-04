const assetPathPrefix = "https://www.figma.com/api/mcp/asset/dd81ff8a-9750-40d1-8bc2-750ff18a59f8";
const imgNumber = `${assetPathPrefix}/41ecb.svg`;
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
const imgIconArrowLeft = `${assetPathPrefix}/980a2.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/2b979.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgEllipse4 = `${assetPathPrefix}/b94c5.svg`;
const imgIconLink = `${assetPathPrefix}/e1e1f.svg`;
const imgIconFacebookLogo = `${assetPathPrefix}/74650.svg`;
const imgIconInstagramLogo = `${assetPathPrefix}/b8fc5.svg`;
const imgIconTwitterLogo = `${assetPathPrefix}/51979.svg`;
const imgPlay = `${assetPathPrefix}/e6a2a.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

function ChipsTag({ className }: { className?: string }) {
  return (
    <div className={className || '[word-break:break-word] bg-[#f9f4f2] content-stretch flex font-["Poppins:Regular"] gap-[4px] items-center justify-center not-italic pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] whitespace-nowrap'} data-node-id="286:7322" data-name="Chips Tag">
      <p className="leading-[1.35] relative shrink-0 text-[#bebfc2] text-[10px]" data-node-id="286:7320">
        #
      </p>
      <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="286:7321">
        Hydration
      </p>
    </div>
  );
}

type ItemListTextParagraphProps = {
  className?: string;
  number?: string;
  text?: string;
  type?: "Number" | "Bullet";
};

function ItemListTextParagraph({ className, number = "1.", text = "Regulates Body Temperature: Water is crucial for maintaining body temperature, especially during exercise or in hot environments.", type = "Number" }: ItemListTextParagraphProps) {
  const isBullet = type === "Bullet";
  return (
    <div className={className || "content-stretch flex gap-[4px] items-start px-[8px] relative w-[698px]"} id={isBullet ? "node-286_7198" : "node-286_7138"}>
      <div className={`relative shrink-0 ${isBullet ? "size-[20px]" : "content-stretch flex flex-col items-center justify-center px-[6px] py-px rounded-[20px] w-[20px]"}`} id={isBullet ? "node-286_7199" : "node-286_7134"} data-name="Number">
        {type === "Number" && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#52545b] text-[14px] text-center w-[16px]" data-node-id="286:7135">
            {number}
          </p>
        )}
        {isBullet && <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgNumber} />}
      </div>
      <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative" id={isBullet ? "node-286_7201" : "node-286_7137"} data-name="Text">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.4] min-w-px not-italic relative text-[#52545b] text-[14px]" data-node-id="286:7136">
          {text}
        </p>
      </div>
    </div>
  );
}

export default function Component34InsightDetailsDesktop() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative size-full" data-node-id="279:9301" data-name="34. Insight Details (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="279:9302" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I279:9302;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I279:9302;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I279:9302;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I279:9302;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I279:9302;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I279:9302;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I279:9302;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4500;2:3296">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4505;2:3296">
                Messages
              </p>
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4505;2:3297" data-name="Badge">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I279:9302;2:4505;2:3297;2:3262" data-name="Div Red">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I279:9302;2:4505;2:3297;2:3263">
                  6
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4502;2:3296">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4503;2:3296">
                Meal Plan
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I279:9302;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I279:9302;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4504;2:3296">
                Food Diary
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4506;2:3296">
                Progress
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4509;2:3296">
                Exercises
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;12:1059;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I279:9302;12:1059;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;12:1059;2:3292">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I279:9302;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I279:9302;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I279:9302;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I279:9302;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I279:9302;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I279:9302;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4518;2:3335">
                Claim Now!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4519;2:3296">
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="279:9303" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="281:9776" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I281:9776;2:4472" data-name="Title">
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I281:9776;2:4473" data-name="Back Button">
              <div className="relative shrink-0 size-[16px]" data-node-id="I281:9776;2:4474" data-name="Icon/ArrowLeft">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I281:9776;2:4475">
                Back to Health Insights
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] min-w-full not-italic relative shrink-0 text-[#272932] text-[22px] w-[min-content]" data-node-id="I281:9776;2:4476">
              Insight Details
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I281:9776;2:4477" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I281:9776;2:4478" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I281:9776;2:4478;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I281:9776;2:4479" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I281:9776;2:4479;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I281:9776;2:4479;2:3571" data-name="Badge">
                <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I281:9776;2:4479;2:3571;2:3270" data-name="Div Red" />
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I281:9776;33:1604" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I281:9776;33:1605" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I281:9776;33:1605;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I281:9776;33:1605;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I281:9776;33:1606" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I281:9776;33:1607">
                  Adam Vasylenko
                </p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I281:9776;33:1608">
                  Member
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I281:9776;33:1609">
                <div className="bg-[#f9f4f2] content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I281:9776;33:1609;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[36px] items-start min-h-[842px] relative shrink-0 w-full" data-node-id="281:9807" data-name="Body">
          <div className="bg-white content-stretch flex flex-col gap-[20px] items-start p-[36px] relative rounded-[16px] shrink-0 w-[800px]" data-node-id="281:9834" data-name="Content">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="284:10153" data-name="Header">
              <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="284:10155" data-name="Info Category">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="284:10156">{`Health & Wellness`}</p>
              </div>
              <div className="relative shrink-0 size-[3px]" data-node-id="284:10157">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
              </div>
              <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="284:10158" data-name="Info Date">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="284:10159">
                  6 min read
                </p>
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[28px] w-full" data-node-id="281:9835">
              The Science Behind Hydration: Why Water is Essential for Health
            </p>
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="284:10162" data-name="Footer">
              <div className="content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="284:10163" data-name="Info Author">
                <div className="relative rounded-[32px] shrink-0 size-[20px]" data-node-id="284:10164" data-name="Avatar">
                  <div className="absolute bg-[#ffcb65] inset-[-5%] overflow-clip rounded-[20px]" data-node-id="I284:10164;2:3126" data-name="User Image/14" />
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="284:10165">
                  Dr. Amelia Johnson
                </p>
              </div>
              <div className="relative shrink-0 size-[3px]" data-node-id="284:10171">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="284:10172">
                Sept 15, 2028
              </p>
            </div>
            <div className="bg-[#eeeeef] h-[408px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="293:7843" data-name="Image" />
            <div className="border-[#e1e1e2] border-l-2 border-solid content-stretch flex flex-col items-start px-[24px] py-[16px] relative shrink-0 w-full" data-node-id="293:7846" data-name="Pharagraph">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] not-italic relative shrink-0 text-[#8a8c90] text-[14px] w-full" data-node-id="293:7848">
                This article dives into the importance of hydration for overall well-being, covering how water affects everything from brain function to physical performance. Learn how to keep your hydration levels optimal throughout the day.
              </p>
            </div>
            <div className="content-stretch flex flex-col items-start relative rounded-[28px] shrink-0 w-full" data-node-id="281:9862" data-name="Pharagraph">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] not-italic relative shrink-0 text-[#52545b] text-[14px] w-full" data-node-id="284:10174">
                Water is the essence of life. It plays a crucial role in every system of the body, from maintaining cellular functions to regulating temperature and keeping us energized. While it’s often easy to overlook, staying hydrated is one of the simplest and most effective ways to support your overall well-being.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="284:10176" data-name="Pharagraph">
              <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="284:10177" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="284:10178">
                  Why Hydration Matters
                </p>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="284:10179">
                Your body is composed of about 60% water. Every cell, tissue, and organ relies on water to function properly. Hydration impacts everything from digestion to muscle performance and brain function. Even mild dehydration can affect your mood, concentration, and physical energy.
              </p>
            </div>
            <div className="[word-break:break-word] bg-[#f9f4f2] border-[#ffa257] border-l-2 border-solid content-stretch flex flex-col gap-[8px] items-start leading-[1.4] not-italic px-[24px] py-[16px] relative rounded-br-[12px] rounded-tr-[12px] shrink-0 text-[14px] w-full" data-node-id="286:7116" data-name="Quotation">
              <p className="font-['Poppins:Regular'] relative shrink-0 text-[#52545b] w-full" data-node-id="286:7117">{`"Hydration isn't just about drinking enough water—it's about ensuring your body has what it needs to perform at its best."`}</p>
              <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] w-full" data-node-id="286:7118">
                - Dr. Amelia Johnson -
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="286:7164" data-name="Pharagraph">
              <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="286:7165" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="286:7166">
                  How Much Water Do You Really Need?
                </p>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="286:7167">{`The general guideline is to drink about 8 glasses of water a day, but your actual needs can vary depending on your activity level, environment, and health status. If you're exercising or in a hot climate, your water needs will increase. A good rule of thumb is to drink when you’re thirsty and aim for clear or light-colored urine, which indicates proper hydration.`}</p>
            </div>
            <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="286:7168" data-name="Pharagraph">
              <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="286:7169" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="286:7170">
                  Signs of Dehydration
                </p>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="286:7171">
                Dehydration occurs when you’re losing more water than you’re taking in. Some common signs include:
              </p>
              <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" text="Headaches" type="Bullet" />
              <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="2." text="Fatigue" type="Bullet" />
              <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="3." text="Dry Mouth" type="Bullet" />
              <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="4." text="Dark Yellow Urine" type="Bullet" />
              <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="4." text="Dizziness" type="Bullet" />
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="286:7192">
                Severe dehydration can lead to more serious health issues like kidney stones or heatstroke, so it’s important to monitor your hydration levels throughout the day.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="286:7225" data-name="Pharagraph">
              <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="286:7226" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="286:7227">
                  Tips for Staying Hydrated
                </p>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="286:7228">
                When you hydrate, water helps your body in the following ways:
              </p>
              <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" text="Carry a Water Bottle: Having water with you at all times makes it easier to stay hydrated." />
              <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="2." text="Set Hydration Goals: Track your water intake throughout the day using apps or reminders." />
              <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="3." text="Infuse Your Water: Add fruits or herbs like lemon, mint, or cucumber to make your water more enjoyable." />
              <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="4." text="Eat Hydrating Foods: Foods like watermelon, cucumber, and oranges have high water content and can contribute to your daily hydration needs." />
            </div>
            <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="286:7249" data-name="Pharagraph">
              <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="286:7250" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="286:7251">
                  Conclusion
                </p>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="286:7252">{`Hydration is an essential part of maintaining your overall health and well-being. By understanding how water impacts your body and taking simple steps to stay hydrated, you can improve your mood, energy, and cognitive function. So, make sure you’re sipping water throughout the day and paying attention to your body's hydration needs.`}</p>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-start min-w-px p-[36px] relative rounded-[16px]" data-node-id="281:9895" data-name="Right Side">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="286:7338" data-name="Section Tags">
              <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="286:7339" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I286:7339;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="I286:7339;2:4223">
                    Share
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] gap-[10px] h-[30px] items-center min-w-px relative" data-node-id="I286:7339;2:4225" data-name="Right Section" />
              </div>
              <div className="content-start flex flex-wrap gap-[8px] items-start relative shrink-0 w-full" data-node-id="286:7340" data-name="Categories">
                <div className="bg-[#f9f4f2] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="286:7341" data-name="Button Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I286:7341;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconLink} />
                  </div>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="286:7342" data-name="Button Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I286:7342;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFacebookLogo} />
                  </div>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="286:7343" data-name="Button Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I286:7343;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconInstagramLogo} />
                  </div>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="286:7344" data-name="Button Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I286:7344;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTwitterLogo} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="286:7253" data-name="Section Tags">
              <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="286:7254" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I286:7254;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="I286:7254;2:4223">
                    Tags
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] gap-[10px] h-[30px] items-center min-w-px relative" data-node-id="I286:7254;2:4225" data-name="Right Section" />
              </div>
              <div className="[word-break:break-word] content-start flex flex-wrap font-['Poppins:Regular'] gap-[8px] items-start not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="286:7302" data-name="Categories">
                <ChipsTag className="bg-[#f9f4f2] content-stretch flex gap-[4px] items-center justify-center pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] shrink-0" />
                <div className="bg-[#f9f4f2] content-stretch flex gap-[4px] items-center justify-center pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="286:7332" data-name="Chips Tag">
                  <p className="leading-[1.35] relative shrink-0 text-[#bebfc2] text-[10px]" data-node-id="I286:7332;286:7320">
                    #
                  </p>
                  <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I286:7332;286:7321">
                    Wellness
                  </p>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex gap-[4px] items-center justify-center pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="286:7326" data-name="Chips Tag">
                  <p className="leading-[1.35] relative shrink-0 text-[#bebfc2] text-[10px]" data-node-id="I286:7326;286:7320">
                    #
                  </p>
                  <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I286:7326;286:7321">
                    Health
                  </p>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex gap-[4px] items-center justify-center pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="286:7335" data-name="Chips Tag">
                  <p className="leading-[1.35] relative shrink-0 text-[#bebfc2] text-[10px]" data-node-id="I286:7335;286:7320">
                    #
                  </p>
                  <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I286:7335;286:7321">
                    Fitness
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="290:7777" data-name="Section Related Articles">
              <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="290:7778" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I290:7778;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="I290:7778;2:4223">
                    Related Articles
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] gap-[10px] h-[30px] items-center min-w-px relative" data-node-id="I290:7778;2:4225" data-name="Right Section" />
              </div>
              <div className="content-stretch flex flex-col gap-[24px] items-start justify-center relative shrink-0 w-full" data-node-id="290:7805" data-name="List Rcommendation">
                <div className="bg-white content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-node-id="293:7852" data-name="Card Related Article">
                  <div className="bg-[#eeeeef] h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I293:7852;290:7826" data-name="Image">
                    <div className="absolute flex inset-0 items-center justify-center" data-node-id="I293:7852;290:7827" style={{ containerType: "size" }}>
                      <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                        <div className="bg-[#eeeeef] relative size-full" data-name="Place Image Here" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start px-[4px] relative shrink-0 w-full" data-node-id="I293:7852;290:7828" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I293:7852;290:7831">
                      10 Hydration Myths Debunked
                    </p>
                    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I293:7852;290:7829" data-name="Info Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I293:7852;290:7830">
                        Health Tips
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-node-id="290:7835" data-name="Card Related Article">
                  <div className="bg-[#eeeeef] h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I290:7835;290:7826" data-name="Image">
                    <div className="absolute flex inset-0 items-center justify-center" data-node-id="I290:7835;290:7827" style={{ containerType: "size" }}>
                      <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                        <div className="bg-[#eeeeef] relative size-full" data-name="Place Image Here" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start px-[4px] relative shrink-0 w-full" data-node-id="I290:7835;290:7828" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I290:7835;290:7831">
                      The Role of Water in Post-Workout Recovery
                    </p>
                    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I290:7835;290:7829" data-name="Info Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I290:7835;290:7830">{`Nutrition & Wellness`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="293:7859" data-name="Section Related VIdeo">
              <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="293:7860" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I293:7860;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="I293:7860;2:4223">
                    Related Video
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] gap-[10px] h-[30px] items-center min-w-px relative" data-node-id="I293:7860;2:4225" data-name="Right Section" />
              </div>
              <div className="content-stretch flex flex-col gap-[24px] items-start justify-center relative shrink-0 w-full" data-node-id="293:7861" data-name="List Rcommendation">
                <div className="bg-white content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-node-id="293:7862" data-name="Card Related Article">
                  <div className="bg-[#eeeeef] h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I293:7862;290:7826" data-name="Image">
                    <div className="absolute flex inset-0 items-center justify-center" data-node-id="I293:7862;290:7827" style={{ containerType: "size" }}>
                      <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                        <div className="bg-[#eeeeef] relative size-full" data-name="Place Image Here" />
                      </div>
                    </div>
                    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[58px] top-1/2" data-node-id="I293:7862;293:7915" data-name="Play">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start px-[4px] relative shrink-0 w-full" data-node-id="I293:7862;290:7828" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I293:7862;290:7831">
                      How to Stay Hydrated During Workouts
                    </p>
                    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I293:7862;290:7829" data-name="Info Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I293:7862;290:7830">{`Fitness & Nutrition`}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-node-id="293:7863" data-name="Card Related Article">
                  <div className="bg-[#eeeeef] h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I293:7863;290:7826" data-name="Image">
                    <div className="absolute flex inset-0 items-center justify-center" data-node-id="I293:7863;290:7827" style={{ containerType: "size" }}>
                      <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                        <div className="bg-[#eeeeef] relative size-full" data-name="Place Image Here" />
                      </div>
                    </div>
                    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[58px] top-1/2" data-node-id="I293:7863;293:7915" data-name="Play">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start px-[4px] relative shrink-0 w-full" data-node-id="I293:7863;290:7828" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I293:7863;290:7831">
                      Hydration Hacks for Busy People
                    </p>
                    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I293:7863;290:7829" data-name="Info Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I293:7863;290:7830">{`Health & Wellness`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="279:9361" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="279:9362" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="279:9363">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="279:9364" data-name="Links">
              <p className="relative shrink-0" data-node-id="279:9365">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="279:9366">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="279:9367">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="279:9368" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9369" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9370" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9371" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9372" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9373" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
