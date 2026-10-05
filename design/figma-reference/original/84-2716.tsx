const assetPathPrefix = "https://www.figma.com/api/mcp/asset/27d4176b-e9b0-4764-ac46-5b55b5568662";
const imgIconSpecialFire = `${assetPathPrefix}/36850.svg`;
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
const imgIconMagnifyingGlass = `${assetPathPrefix}/f08ac.svg`;
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
const imgIconCaretDown1 = `${assetPathPrefix}/8e5ed.svg`;
const imgIconGridFour = `${assetPathPrefix}/2a9e0.svg`;
const imgIconList = `${assetPathPrefix}/07fed.svg`;
const imgIconChartBar = `${assetPathPrefix}/f55c9.svg`;
const imgIconSpecialFire1 = `${assetPathPrefix}/26c9b.svg`;
const imgSeparator = `${assetPathPrefix}/3dda7.svg`;
const imgIconSpecialBread1 = `${assetPathPrefix}/bcc73.svg`;
const imgIconSpecialFish1 = `${assetPathPrefix}/f2e93.svg`;
const imgIconSpecialDrop1 = `${assetPathPrefix}/b6c86.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;
const imgIconBell = `${assetPathPrefix}/dfce3.svg`;
const imgIconPlus = `${assetPathPrefix}/84d5e.svg`;
const imgIconPlus1 = `${assetPathPrefix}/2ac73.svg`;
const imgDivider = `${assetPathPrefix}/31a56.svg`;
const imgIconSpecialFire2 = `${assetPathPrefix}/36936.svg`;
const imgIconSpecialBread2 = `${assetPathPrefix}/0c987.svg`;
const imgIconSpecialFish2 = `${assetPathPrefix}/d6aa7.svg`;
const imgIconSpecialDrop2 = `${assetPathPrefix}/188dc.svg`;

type ItemDetailMealValueProps = {
  className?: string;
  amount?: string;
  title?: string;
  unit?: string;
};

function ItemDetailMealValue({ className, amount = "450", title = "Calories", unit = "kcal" }: ItemDetailMealValueProps) {
  return (
    <div className={className || "bg-[#c2e66e] content-stretch flex gap-[8px] h-[69.5px] items-center p-[12px] relative rounded-[8px] w-[134px]"} data-node-id="233:8189" data-name="Item Detail Meal Value">
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

export default function Component10HealthyMenuDesktop() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative size-full" data-node-id="84:2716" data-name="10. Healthy Menu (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="84:2717" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I84:2717;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I84:2717;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I84:2717;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I84:2717;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I84:2717;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I84:2717;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I84:2717;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4500;2:3296">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4505;2:3296">
                Messages
              </p>
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4505;2:3297" data-name="Badge">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I84:2717;2:4505;2:3297;2:3262" data-name="Div Red">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I84:2717;2:4505;2:3297;2:3263">
                  6
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4502;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:2717;2:4502;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4502;2:3292">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4503;2:3296">
                Meal Plan
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I84:2717;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I84:2717;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4504;2:3296">
                Food Diary
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4506;2:3296">
                Progress
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4509;2:3296">
                Exercises
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;12:1059;2:3296">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I84:2717;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I84:2717;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I84:2717;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I84:2717;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I84:2717;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I84:2717;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4518;2:3335">
                Claim Now!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2717;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I84:2717;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2717;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2717;2:4519;2:3296">
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="226:5860" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="226:6301" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[200px]" data-node-id="226:6302" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="226:6303">
              Healthy Menu
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0 w-[380px]" data-node-id="226:6305" data-name="Header Menu">
            <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px px-[13px] py-[9px] relative rounded-[12px]" data-node-id="226:6306" data-name="Input-search">
              <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I226:6306;2:3937" data-name="Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I226:6306;2:3938" data-name="Icon/MagnifyingGlass">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] items-center min-w-px px-[2px] relative" data-node-id="I226:6306;2:3939" data-name="Text">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.25] min-w-px not-italic relative text-[#8a8c90] text-[14px]" data-node-id="I226:6306;2:3940">
                  Search menu
                </p>
              </div>
            </div>
            <div className="bg-[#eeeeef] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="226:6312" data-name="Button More">
              <div className="relative shrink-0 size-[22px]" data-node-id="I226:6312;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFadersHorizontal} />
              </div>
            </div>
            <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[16px] py-[10px] relative rounded-[12px] shrink-0" data-node-id="226:6347" data-name="Button More">
              <div className="content-stretch flex h-[20px] items-center py-[2px] relative shrink-0" data-node-id="I226:6347;2:3405" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I226:6347;2:3406">
                  Add Menu
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start min-h-[842px] relative shrink-0 w-full" data-node-id="226:5862" data-name="Body">
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="232:8108" data-name="Widget Featured Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="232:7994" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-257px] relative shrink-0" data-node-id="I232:7994;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I232:7994;2:4223">
                  Featured Menu
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I232:7994;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I232:7994;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I232:7994;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="232:7934" data-name="Body">
              <div className="bg-[#f9f4f2] content-stretch flex gap-[20px] items-center p-[20px] relative rounded-[16px] self-stretch shrink-0 w-[670px]" data-node-id="233:8148" data-name="Main">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[14px] shrink-0 size-[298px]" data-node-id="232:7935" data-name="Image">
                  <div className="absolute left-0 size-[298px] top-0" data-node-id="371:10267" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px pt-[4px] relative" data-node-id="232:7937" data-name="Content">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="232:7945">
                    Grilled Turkey Breast with Steamed Asparagus and Brown Rice
                  </p>
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="233:8474" data-name="Row 2">
                    <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="232:7939" data-name="Badge Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#52545b] text-[14px] whitespace-nowrap" data-node-id="232:7940">
                        Lunch
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="232:7941" data-name="Badge Meal Category">
                      <div className="relative shrink-0 size-[14px]" data-node-id="232:7942" data-name="Star">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="232:7944">
                        4.8/5 (125 reviews)
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[16px] items-start pr-[16px] relative shrink-0 w-full" data-node-id="232:7947" data-name="Details">
                    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-node-id="243:9068" data-name="Row 1">
                      <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center min-w-px relative rounded-[8px]" data-node-id="232:7953" data-name="Item Detail Info">
                        <div className="bg-white content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I232:7953;2:4445" data-name="Icon">
                          <div className="relative shrink-0 size-[16px]" data-node-id="I232:7953;2:4446" data-name="Icon/Nav/ChartBar">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartBar} />
                          </div>
                        </div>
                        <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I232:7953;2:4447" data-name="Info">
                          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I232:7953;2:4448">
                            Difficulty
                          </p>
                          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I232:7953;2:4449">
                            Medium
                          </p>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center min-w-px relative rounded-[8px]" data-node-id="232:7955" data-name="Item Detail Info">
                        <div className="bg-white content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I232:7955;2:4445" data-name="Icon">
                          <div className="relative shrink-0 size-[16px]" data-node-id="I232:7955;2:4446" data-name="Icon/Nav/ChartBar">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialHeartbeat} />
                          </div>
                        </div>
                        <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I232:7955;2:4447" data-name="Info">
                          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I232:7955;2:4448">
                            Health Score
                          </p>
                          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I232:7955;2:4449">
                            85/100
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="243:9069" data-name="Row 2">
                      <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center min-w-px relative rounded-[8px]" data-node-id="233:8109" data-name="Item Detail Info">
                        <div className="bg-white content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I233:8109;2:4445" data-name="Icon">
                          <div className="relative shrink-0 size-[16px]" data-node-id="I233:8109;2:4446" data-name="Icon/Nav/ChartBar">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialCookingPot} />
                          </div>
                        </div>
                        <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I233:8109;2:4447" data-name="Info">
                          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I233:8109;2:4448">
                            Cook Duration
                          </p>
                          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I233:8109;2:4449">
                            10 minutes
                          </p>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center min-w-px relative rounded-[8px]" data-node-id="232:7954" data-name="Item Detail Info">
                        <div className="bg-white content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I232:7954;2:4445" data-name="Icon">
                          <div className="relative shrink-0 size-[16px]" data-node-id="I232:7954;2:4446" data-name="Icon/Nav/ChartBar">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialListNumbers} />
                          </div>
                        </div>
                        <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I232:7954;2:4447" data-name="Info">
                          <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I232:7954;2:4448">
                            Total Steps
                          </p>
                          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I232:7954;2:4449">
                            4 steps
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-node-id="233:8147" data-name="Footer">
                    <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[16px] py-[10px] relative rounded-[12px]" data-node-id="233:8141" data-name="Button CTA">
                      <div className="content-stretch flex h-[20px] items-center py-[2px] relative shrink-0" data-node-id="I233:8141;2:3405" data-name="Text">
                        <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I233:8141;2:3406">
                          Add to Meal Plan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px py-[12px] relative self-stretch" data-node-id="233:8149" data-name="Details">
                <ItemDetailMealValue className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px p-[12px] relative rounded-[8px] w-full" />
                <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px p-[12px] relative rounded-[8px] w-full" data-node-id="233:8200" data-name="Item Detail Meal Value">
                  <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I233:8200;233:8180" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I233:8200;233:8181" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I233:8200;233:8182" data-name="Info">
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I233:8200;233:8183">
                      Carbs
                    </p>
                    <div className="content-stretch flex gap-[2px] items-baseline relative shrink-0 text-[#272932]" data-node-id="I233:8200;233:8187" data-name="Amount">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[14px]" data-node-id="I233:8200;233:8184">
                        40
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I233:8200;233:8186">
                        gr
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px p-[12px] relative rounded-[8px] w-full" data-node-id="233:8190" data-name="Item Detail Meal Value">
                  <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I233:8190;233:8180" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I233:8190;233:8181" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I233:8190;233:8182" data-name="Info">
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I233:8190;233:8183">
                      Proteins
                    </p>
                    <div className="content-stretch flex gap-[2px] items-baseline relative shrink-0 text-[#272932]" data-node-id="I233:8190;233:8187" data-name="Amount">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[14px]" data-node-id="I233:8190;233:8184">
                        35
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I233:8190;233:8186">
                        gr
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#e1e1e2] content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px p-[12px] relative rounded-[8px] w-full" data-node-id="233:8210" data-name="Item Detail Meal Value">
                  <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I233:8210;233:8180" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I233:8210;233:8181" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I233:8210;233:8182" data-name="Info">
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I233:8210;233:8183">
                      Fats
                    </p>
                    <div className="content-stretch flex gap-[2px] items-baseline relative shrink-0 text-[#272932]" data-node-id="I233:8210;233:8187" data-name="Amount">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[14px]" data-node-id="I233:8210;233:8184">
                        12
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I233:8210;233:8186">
                        gr
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="233:8220" data-name="Widget All Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="243:9399" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="243:9400" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="243:9401">
                  All Menu
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="243:9403" data-name="Right Section">
                <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="243:9406" data-name="Button Picker">
                  <div className="content-stretch flex items-center pr-[2px] py-[2px] relative shrink-0" data-node-id="I243:9406;2:3507" data-name="Icon Left">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I243:9406;2:3508" data-name="Icon/CalendarBlank">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFunnel} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I243:9406;2:3509" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I243:9406;2:3510">
                      Filter
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I243:9406;2:3511" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I243:9406;2:3512" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                    </div>
                  </div>
                </div>
                <div className="bg-[#f6f6f7] content-stretch flex items-start relative rounded-[10px] shrink-0" data-node-id="243:9405" data-name="Segmented Button">
                  <div className="bg-[#f6f6f7] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I243:9405;2:3604" data-name="Button Picker">
                    <div className="relative shrink-0 size-[18px]" data-node-id="I243:9405;2:3604;2:3586" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconGridFour} />
                    </div>
                  </div>
                  <div className="bg-[#c2e66e] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I243:9405;2:3605" data-name="Button Picker">
                    <div className="relative shrink-0 size-[18px]" data-node-id="I243:9405;2:3605;2:3578" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="236:8627" data-name="Header-Section">
              <div className="content-stretch flex h-[30px] items-start relative shrink-0" data-node-id="236:8628" data-name="Left Section">
                <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-start relative rounded-[10px] shrink-0" data-node-id="236:8684" data-name="Segmented Button">
                  <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[16px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="236:8685" data-name="Button Picker">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I236:8685;2:3331" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I236:8685;2:3332">
                        All
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#f6f6f7] content-stretch flex items-center justify-center px-[32px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="236:8686" data-name="Button Picker">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I236:8686;2:3481" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I236:8686;2:3482">
                        Breakfast
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#f6f6f7] content-stretch flex items-center justify-center pr-[32px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="236:8687" data-name="Button Picker">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I236:8687;2:3481" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I236:8687;2:3482">
                        Lunch
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#f6f6f7] content-stretch flex items-center justify-center pr-[32px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="236:8697" data-name="Button Picker">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I236:8697;2:3481" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I236:8697;2:3482">
                        Snack
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#f6f6f7] content-stretch flex items-center justify-center pr-[32px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="236:8688" data-name="Button Picker">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I236:8688;2:3481" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I236:8688;2:3482">
                        Dinner
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="236:8630" data-name="Right Section">
                <div className="content-stretch flex gap-[10px] items-baseline relative shrink-0" data-node-id="236:8636" data-name="Sort by">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="236:8637">
                    Sort by:
                  </p>
                  <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="236:8638" data-name="Button Picker">
                    <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I236:8638;2:3476" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I236:8638;2:3477">
                        Calories
                      </p>
                    </div>
                    <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I236:8638;2:3478" data-name="Icon">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I236:8638;2:3479" data-name="Icon/CaretDown">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="373:10388" data-name="List Menu">
              <div className="bg-[#f9f4f2] content-stretch flex gap-[20px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="373:10389" data-name="Card List All Menu">
                <div className="bg-[#eeeeef] h-[104px] overflow-clip relative rounded-[16px] shrink-0 w-[152px]" data-node-id="I373:10389;236:9373" data-name="Image">
                  <div className="absolute bg-[#eeeeef] h-[104px] left-0 top-0 w-[152px]" data-node-id="I373:10389;236:9374" data-name="Place Image Here" />
                </div>
                <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I373:10389;236:9375">
                  <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-name="Main Content">
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I373:10389;236:9376" data-name="Head Info">
                      <div className="content-stretch flex gap-[11px] items-center relative shrink-0" data-node-id="I373:10389;236:9378" data-name="Badges Info">
                        <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10389;236:9443" data-name="Badge Meal Category">
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I373:10389;236:9444">
                            Breakfast
                          </p>
                        </div>
                        <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[6px] pr-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10389;236:9379" data-name="Info Level">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10389;236:9380" data-name="Icon/ChartBar">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10389;236:9381">
                            Easy
                          </p>
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I373:10389;236:9389" data-name="Chart Health Score">
                        <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="I373:10389;236:9390" data-name="Head">
                          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I373:10389;236:9391">
                            Health Score:
                          </p>
                          <div className="content-stretch flex items-end relative shrink-0" data-node-id="I373:10389;236:9392" data-name="Amount Score">
                            <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I373:10389;236:9393">
                              9
                            </p>
                            <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I373:10389;236:9394">
                              /10
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row items-center self-stretch" data-node-id="I373:10389;236:9395">
                          <div className="content-stretch flex gap-[4px] h-full items-center relative shrink-0 w-[109.5px]" data-name="Chart Bar">
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9396" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9397" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9398" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9399" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9400" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9401" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9402" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9403" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9404" data-name="Bar" />
                            <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10389;236:9405" data-name="Bar" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] w-full" data-node-id="I373:10389;236:9386">
                      Avocado Toast with Poached Egg
                    </p>
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I373:10389;236:9388" data-name="Footer">
                      <div className="bg-white content-stretch flex gap-[16px] items-start pl-[12px] pr-[16px] py-[8px] relative rounded-[6px] shrink-0" data-node-id="I373:10389;236:9418" data-name="Nutrition Info">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10389;236:9419" data-name="Info Cal">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10389;236:9420" data-name="Icon/Special/Fire">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                          </div>
                          <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-[46px]" data-node-id="I373:10389;243:6413" data-name="Value">
                            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10389;236:9421">
                              320 kcal
                            </p>
                          </div>
                        </div>
                        <div className="relative self-stretch shrink-0 w-0" data-node-id="I373:10389;243:7197" data-name="Separator">
                          <div className="absolute inset-[0_-0.5px]">
                            <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                          </div>
                        </div>
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10389;236:9422" data-name="Info Carbs">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10389;236:9423" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10389;243:6429" data-name="Value">
                            <p className="relative shrink-0" data-node-id="I373:10389;243:6430">
                              30g
                            </p>
                            <p className="relative shrink-0" data-node-id="I373:10389;243:6431">
                              carbs
                            </p>
                          </div>
                        </div>
                        <div className="relative self-stretch shrink-0 w-0" data-node-id="I373:10389;243:7424" data-name="Separator">
                          <div className="absolute inset-[0_-0.5px]">
                            <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                          </div>
                        </div>
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10389;236:9425" data-name="Info Protein">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10389;236:9426" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] w-[62px] whitespace-nowrap" data-node-id="I373:10389;243:6448" data-name="Value">
                            <p className="relative shrink-0" data-node-id="I373:10389;243:6449">
                              14g
                            </p>
                            <p className="relative shrink-0" data-node-id="I373:10389;243:6450">
                              protein
                            </p>
                          </div>
                        </div>
                        <div className="relative self-stretch shrink-0 w-0" data-node-id="I373:10389;243:7581" data-name="Separator">
                          <div className="absolute inset-[0_-0.5px]">
                            <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                          </div>
                        </div>
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10389;236:9428" data-name="Info Fats">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10389;236:9429" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10389;243:6452" data-name="Value">
                            <p className="relative shrink-0" data-node-id="I373:10389;243:6453">
                              18g
                            </p>
                            <p className="relative shrink-0" data-node-id="I373:10389;243:6454">
                              fats
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex items-center relative shrink-0" data-node-id="I373:10389;236:9416" data-name="Action">
                        <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I373:10389;236:9417" data-name="Button Picker">
                          <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I373:10389;236:9417;2:3331" data-name="Text">
                            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I373:10389;236:9417;2:3332">
                              Add to Meal Plan
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#f9f4f2] content-stretch flex gap-[20px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="373:10390" data-name="Card List All Menu">
                <div className="bg-[#eeeeef] h-[104px] overflow-clip relative rounded-[16px] shrink-0 w-[152px]" data-node-id="I373:10390;236:9373" data-name="Image">
                  <div className="absolute bg-[#eeeeef] h-[104px] left-0 top-0 w-[152px]" data-node-id="I373:10390;236:9374" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="I373:10390;236:9375" data-name="Main Content">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I373:10390;236:9376" data-name="Head Info">
                    <div className="content-stretch flex gap-[11px] items-center relative shrink-0" data-node-id="I373:10390;236:9378" data-name="Badges Info">
                      <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10390;236:9443" data-name="Badge Meal Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I373:10390;236:9444">
                          Lunch
                        </p>
                      </div>
                      <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[6px] pr-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10390;236:9379" data-name="Info Level">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I373:10390;236:9380" data-name="Icon/ChartBar">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10390;236:9381">
                          Medium
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I373:10390;236:9389" data-name="Chart Health Score">
                      <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="I373:10390;236:9390" data-name="Head">
                        <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I373:10390;236:9391">
                          Health Score:
                        </p>
                        <div className="content-stretch flex items-end relative shrink-0" data-node-id="I373:10390;236:9392" data-name="Amount Score">
                          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I373:10390;236:9393">
                            8
                          </p>
                          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I373:10390;236:9394">
                            /10
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row items-center self-stretch" data-node-id="I373:10390;236:9395">
                        <div className="content-stretch flex gap-[4px] h-full items-center relative shrink-0 w-[109.5px]" data-name="Chart Bar">
                          <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9396" data-name="Bar" />
                          <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9397" data-name="Bar" />
                          <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9398" data-name="Bar" />
                          <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9399" data-name="Bar" />
                          <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9400" data-name="Bar" />
                          <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9401" data-name="Bar" />
                          <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9402" data-name="Bar" />
                          <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9403" data-name="Bar" />
                          <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9404" data-name="Bar" />
                          <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10390;236:9405" data-name="Bar" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] w-full" data-node-id="I373:10390;236:9386">
                    Grilled Shrimp Tacos with Mango Salsa
                  </p>
                  <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I373:10390;236:9388" data-name="Footer">
                    <div className="bg-white content-stretch flex gap-[16px] items-start pl-[12px] pr-[16px] py-[8px] relative rounded-[6px] shrink-0" data-node-id="I373:10390;236:9418" data-name="Nutrition Info">
                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10390;236:9419" data-name="Info Cal">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I373:10390;236:9420" data-name="Icon/Special/Fire">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                        </div>
                        <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] w-[46px] whitespace-nowrap" data-node-id="I373:10390;243:6413" data-name="Value">
                          <p className="relative shrink-0" data-node-id="I373:10390;236:9421">
                            400
                          </p>
                          <p className="relative shrink-0" data-node-id="I373:10390;243:6400">
                            kcal
                          </p>
                        </div>
                      </div>
                      <div className="relative self-stretch shrink-0 w-0" data-node-id="I373:10390;243:7197" data-name="Separator">
                        <div className="absolute inset-[0_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10390;236:9422" data-name="Info Carbs">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I373:10390;236:9423" data-name="Icon/Special/Bread">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                        </div>
                        <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10390;243:6429" data-name="Value">
                          <p className="relative shrink-0" data-node-id="I373:10390;243:6430">
                            45g
                          </p>
                          <p className="relative shrink-0" data-node-id="I373:10390;243:6431">
                            carbs
                          </p>
                        </div>
                      </div>
                      <div className="relative self-stretch shrink-0 w-0" data-node-id="I373:10390;243:7424" data-name="Separator">
                        <div className="absolute inset-[0_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10390;236:9425" data-name="Info Protein">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I373:10390;236:9426" data-name="Icon/Special/Fish">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                        </div>
                        <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] w-[62px] whitespace-nowrap" data-node-id="I373:10390;243:6448" data-name="Value">
                          <p className="relative shrink-0" data-node-id="I373:10390;243:6449">
                            28g
                          </p>
                          <p className="relative shrink-0" data-node-id="I373:10390;243:6450">
                            protein
                          </p>
                        </div>
                      </div>
                      <div className="relative self-stretch shrink-0 w-0" data-node-id="I373:10390;243:7581" data-name="Separator">
                        <div className="absolute inset-[0_-0.5px]">
                          <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10390;236:9428" data-name="Info Fats">
                        <div className="relative shrink-0 size-[12px]" data-node-id="I373:10390;236:9429" data-name="Icon/Special/Drop">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                        </div>
                        <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10390;243:6452" data-name="Value">
                          <p className="relative shrink-0" data-node-id="I373:10390;243:6453">
                            12g
                          </p>
                          <p className="relative shrink-0" data-node-id="I373:10390;243:6454">
                            fats
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0" data-node-id="I373:10390;236:9416" data-name="Action">
                      <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I373:10390;236:9417" data-name="Button Picker">
                        <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I373:10390;236:9417;2:3331" data-name="Text">
                          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I373:10390;236:9417;2:3332">
                            Add to Meal Plan
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#f9f4f2] content-stretch flex gap-[20px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="373:10391" data-name="Card List All Menu">
                <div className="bg-[#eeeeef] h-[104px] overflow-clip relative rounded-[16px] shrink-0 w-[152px]" data-node-id="I373:10391;236:9373" data-name="Image">
                  <div className="absolute bg-[#eeeeef] h-[104px] left-0 top-0 w-[152px]" data-node-id="I373:10391;236:9374" data-name="Place Image Here" />
                </div>
                <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="I373:10391;236:9375">
                  <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-name="Main Content">
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I373:10391;236:9376" data-name="Head Info">
                      <div className="content-stretch flex gap-[11px] items-center relative shrink-0" data-node-id="I373:10391;236:9378" data-name="Badges Info">
                        <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10391;236:9443" data-name="Badge Meal Category">
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I373:10391;236:9444">
                            Dinner
                          </p>
                        </div>
                        <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[6px] pr-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10391;236:9379" data-name="Info Level">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10391;236:9380" data-name="Icon/ChartBar">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                          </div>
                          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10391;236:9381">
                            Medium
                          </p>
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I373:10391;236:9389" data-name="Chart Health Score">
                        <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="I373:10391;236:9390" data-name="Head">
                          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I373:10391;236:9391">
                            Health Score:
                          </p>
                          <div className="content-stretch flex items-end relative shrink-0" data-node-id="I373:10391;236:9392" data-name="Amount Score">
                            <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I373:10391;236:9393">
                              9
                            </p>
                            <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I373:10391;236:9394">
                              /10
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row items-center self-stretch" data-node-id="I373:10391;236:9395">
                          <div className="content-stretch flex gap-[4px] h-full items-center relative shrink-0 w-[109.5px]" data-name="Chart Bar">
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9396" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9397" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9398" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9399" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9400" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9401" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9402" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9403" data-name="Bar" />
                            <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9404" data-name="Bar" />
                            <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I373:10391;236:9405" data-name="Bar" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] w-full" data-node-id="I373:10391;236:9386">
                      Baked Chicken Breast with Quinoa and Kale
                    </p>
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I373:10391;236:9388" data-name="Footer">
                      <div className="bg-white content-stretch flex gap-[16px] items-start pl-[12px] pr-[16px] py-[8px] relative rounded-[6px] shrink-0" data-node-id="I373:10391;236:9418" data-name="Nutrition Info">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10391;236:9419" data-name="Info Cal">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10391;236:9420" data-name="Icon/Special/Fire">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                          </div>
                          <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] w-[46px] whitespace-nowrap" data-node-id="I373:10391;243:6413" data-name="Value">
                            <p className="relative shrink-0" data-node-id="I373:10391;236:9421">
                              480
                            </p>
                            <p className="relative shrink-0" data-node-id="I373:10391;243:6400">
                              kcal
                            </p>
                          </div>
                        </div>
                        <div className="relative self-stretch shrink-0 w-0" data-node-id="I373:10391;243:7197" data-name="Separator">
                          <div className="absolute inset-[0_-0.5px]">
                            <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                          </div>
                        </div>
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10391;236:9422" data-name="Info Carbs">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10391;236:9423" data-name="Icon/Special/Bread">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                          </div>
                          <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10391;243:6429" data-name="Value">
                            <p className="relative shrink-0" data-node-id="I373:10391;243:6430">
                              50g
                            </p>
                            <p className="relative shrink-0" data-node-id="I373:10391;243:6431">
                              carbs
                            </p>
                          </div>
                        </div>
                        <div className="relative self-stretch shrink-0 w-0" data-node-id="I373:10391;243:7424" data-name="Separator">
                          <div className="absolute inset-[0_-0.5px]">
                            <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                          </div>
                        </div>
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10391;236:9425" data-name="Info Protein">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10391;236:9426" data-name="Icon/Special/Fish">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                          </div>
                          <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] w-[62px] whitespace-nowrap" data-node-id="I373:10391;243:6448" data-name="Value">
                            <p className="relative shrink-0" data-node-id="I373:10391;243:6449">
                              40g
                            </p>
                            <p className="relative shrink-0" data-node-id="I373:10391;243:6450">
                              protein
                            </p>
                          </div>
                        </div>
                        <div className="relative self-stretch shrink-0 w-0" data-node-id="I373:10391;243:7581" data-name="Separator">
                          <div className="absolute inset-[0_-0.5px]">
                            <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                          </div>
                        </div>
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="I373:10391;236:9428" data-name="Info Fats">
                          <div className="relative shrink-0 size-[12px]" data-node-id="I373:10391;236:9429" data-name="Icon/Special/Drop">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                          </div>
                          <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I373:10391;243:6452" data-name="Value">
                            <p className="relative shrink-0" data-node-id="I373:10391;243:6453">
                              15g
                            </p>
                            <p className="relative shrink-0" data-node-id="I373:10391;243:6454">
                              fats
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex items-center relative shrink-0" data-node-id="I373:10391;236:9416" data-name="Action">
                        <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I373:10391;236:9417" data-name="Button Picker">
                          <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I373:10391;236:9417;2:3331" data-name="Text">
                            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I373:10391;236:9417;2:3332">
                              Add to Meal Plan
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
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="226:5949" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="226:5950" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="226:5951">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="226:5952" data-name="Links">
              <p className="relative shrink-0" data-node-id="226:5953">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="226:5954">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="226:5955">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="226:5956" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5957" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5958" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5959" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5960" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="226:5961" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[28px] items-start p-[28px] relative self-stretch shrink-0 w-[345px]" data-node-id="226:5962" data-name="Right Side">
        <div className="content-stretch flex items-center justify-between py-[5px] relative rounded-[28px] shrink-0 w-full" data-node-id="226:6332" data-name="Header Menu">
          <div className="content-stretch flex items-center relative shrink-0" data-node-id="226:6333" data-name="User Profile">
            <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="226:6334" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I226:6334;2:3098" data-name="User Image/12">
                <div className="absolute inset-0 rounded-[12px]" data-node-id="I226:6334;2:3098;2:3159" data-name="Place Image Here" />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic pl-[12px] pr-[8px] relative shrink-0 whitespace-nowrap" data-node-id="226:6335" data-name="User Name">
              <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#2a2b2a] text-[16px]" data-node-id="226:6336">
                Adam Vasylenko
              </p>
              <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="226:6337">
                Member
              </p>
            </div>
          </div>
          <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="226:6339" data-name="Button Icon">
            <div className="relative shrink-0 size-[22px]" data-node-id="I226:6339;2:3570" data-name="Icon/ChatTeardropDots">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
            </div>
            <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I226:6339;2:3571" data-name="Badge">
              <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I226:6339;2:3571;2:3270" data-name="Div Red" />
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-center relative rounded-[16px] shrink-0 w-full" data-node-id="228:6432" data-name="Widget Popular Menu">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="228:6433" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-784px] relative shrink-0" data-node-id="I228:6433;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I228:6433;2:4223">
                Popular Menu
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I228:6433;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I228:6433;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I228:6433;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="373:10583" data-name="List Menu">
            <div className="bg-white content-stretch flex gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="373:10584" data-name="Card Popular Menu">
              <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[68px]" data-node-id="I373:10584;228:6619" data-name="Image">
                <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10584;228:6620" data-name="Place Image Here" />
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-w-px relative self-stretch" data-node-id="I373:10584;228:6621" data-name="Info">
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="I373:10584;228:7783" data-name="Top">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I373:10584;228:6622">
                    Greek Salad with Feta and Olives
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-start p-[4px] relative rounded-[8px] shrink-0" data-node-id="I373:10584;228:7740" data-name="Button More">
                    <div className="relative shrink-0 size-[18px]" data-node-id="I373:10584;228:7740;2:3578" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I373:10584;228:6647" data-name="Details Info">
                  <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10584;228:6650" data-name="Info Rating">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I373:10584;228:6951" data-name="Star">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I373:10584;228:6954" data-name="Rate">
                      <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I373:10584;228:6652">
                        4.9
                      </p>
                      <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I373:10584;228:6953">
                        /5
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#ffe6b5] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10584;228:6648" data-name="Info Meal Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I373:10584;228:6649">
                      Lunch
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="373:10585" data-name="Card Popular Menu">
              <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[68px]" data-node-id="I373:10585;228:6619" data-name="Image">
                <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10585;228:6620" data-name="Place Image Here" />
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-w-px relative self-stretch" data-node-id="I373:10585;228:6621" data-name="Info">
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="I373:10585;228:7783" data-name="Top">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I373:10585;228:6622">
                    Blueberry Protein Smoothie
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-start p-[4px] relative rounded-[8px] shrink-0" data-node-id="I373:10585;228:7740" data-name="Button More">
                    <div className="relative shrink-0 size-[18px]" data-node-id="I373:10585;228:7740;2:3578" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I373:10585;228:6647" data-name="Details Info">
                  <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10585;228:6650" data-name="Info Rating">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I373:10585;228:6951" data-name="Star">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I373:10585;228:6954" data-name="Rate">
                      <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I373:10585;228:6652">
                        4.8
                      </p>
                      <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I373:10585;228:6953">
                        /5
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#dff9a2] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10585;228:6648" data-name="Info Meal Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I373:10585;228:6649">
                      Breakfast
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="373:10586" data-name="Card Popular Menu">
              <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[68px]" data-node-id="I373:10586;228:6619" data-name="Image">
                <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I373:10586;228:6620" data-name="Place Image Here" />
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-w-px relative self-stretch" data-node-id="I373:10586;228:6621" data-name="Info">
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="I373:10586;228:7783" data-name="Top">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I373:10586;228:6622">
                    Grilled Salmon with Lemon and Asparagus
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-start p-[4px] relative rounded-[8px] shrink-0" data-node-id="I373:10586;228:7740" data-name="Button More">
                    <div className="relative shrink-0 size-[18px]" data-node-id="I373:10586;228:7740;2:3578" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I373:10586;228:6647" data-name="Details Info">
                  <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10586;228:6650" data-name="Info Rating">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I373:10586;228:6951" data-name="Star">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                    </div>
                    <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I373:10586;228:6954" data-name="Rate">
                      <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I373:10586;228:6652">
                        4.9
                      </p>
                      <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I373:10586;228:6953">
                        /5
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#ffbe8a] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I373:10586;228:6648" data-name="Info Meal Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I373:10586;228:6649">
                      Dinner
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-center relative rounded-[16px] shrink-0 w-full" data-node-id="228:7363" data-name="Widget Popular Menu">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="228:7364" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-784px] relative shrink-0" data-node-id="I228:7364;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I228:7364;2:4223">
                Recommended Menu
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I228:7364;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I228:7364;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I228:7364;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="371:10271" data-name="List Menu">
            <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="371:10272" data-name="Card Recommended Menu">
              <div className="content-stretch flex gap-[16px] h-[64px] items-start relative shrink-0 w-full" data-node-id="I371:10272;228:7536" data-name="Main">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I371:10272;228:7497" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I371:10272;228:7498" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-node-id="I371:10272;228:7499" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I371:10272;228:7500">
                    Oatmeal with Almond Butter and Berries
                  </p>
                  <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I371:10272;228:7548" data-name="Bottom">
                    <div className="bg-[#dff9a2] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I371:10272;228:7502" data-name="Info Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10272;228:7503">
                        Breakfast
                      </p>
                    </div>
                    <div className="bg-[#c2e66e] content-stretch flex items-start p-[3px] relative rounded-[7px] shrink-0" data-node-id="I371:10272;228:7549" data-name="Button Picker">
                      <div className="relative shrink-0 size-[16px]" data-node-id="I371:10272;228:7549;2:3580" data-name="Icon/ChatTeardropDots">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-0 relative shrink-0 w-full" data-node-id="I371:10272;228:7513" data-name="Divider">
                <div className="absolute inset-[-0.5px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgDivider} />
                </div>
              </div>
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10272;228:7514" data-name="Detail Nutrients">
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10272;228:7537" data-name="Info Calories">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10272;228:7538" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10272;228:7539" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10272;228:7540">
                      C
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10272;228:7541">
                    350 kcal
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10272;228:7515" data-name="Info Carbs">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10272;228:7516" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10272;228:7517" data-name="Icon/Special/Bread">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10272;228:7518">
                      C
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10272;228:7519">
                    45g
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10272;228:7520" data-name="Info Protein">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10272;228:7521" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10272;228:7522" data-name="Icon/Special/Fish">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10272;228:7523">
                      P
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10272;228:7524">
                    12g
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10272;228:7525" data-name="Info Fats">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10272;228:7526" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10272;228:7527" data-name="Icon/Special/Drop">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10272;228:7528">
                      F
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10272;228:7529">
                    14g
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="371:10273" data-name="Card Recommended Menu">
              <div className="content-stretch flex gap-[16px] h-[64px] items-start relative shrink-0 w-full" data-node-id="I371:10273;228:7536" data-name="Main">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I371:10273;228:7497" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I371:10273;228:7498" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-node-id="I371:10273;228:7499" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I371:10273;228:7500">
                    Grilled Chicken Wrap with Avocado and Spinach
                  </p>
                  <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I371:10273;228:7548" data-name="Bottom">
                    <div className="bg-[#ffe6b5] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I371:10273;228:7502" data-name="Info Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10273;228:7503">
                        Lunch
                      </p>
                    </div>
                    <div className="bg-[#c2e66e] content-stretch flex items-start p-[3px] relative rounded-[7px] shrink-0" data-node-id="I371:10273;228:7549" data-name="Button Picker">
                      <div className="relative shrink-0 size-[16px]" data-node-id="I371:10273;228:7549;2:3580" data-name="Icon/ChatTeardropDots">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-0 relative shrink-0 w-full" data-node-id="I371:10273;228:7513" data-name="Divider">
                <div className="absolute inset-[-0.5px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgDivider} />
                </div>
              </div>
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10273;228:7514" data-name="Detail Nutrients">
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10273;228:7537" data-name="Info Calories">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10273;228:7538" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10273;228:7539" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10273;228:7540">
                      C
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10273;228:7541">
                    450 kcal
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10273;228:7515" data-name="Info Carbs">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10273;228:7516" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10273;228:7517" data-name="Icon/Special/Bread">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10273;228:7518">
                      C
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10273;228:7519">
                    40g
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10273;228:7520" data-name="Info Protein">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10273;228:7521" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10273;228:7522" data-name="Icon/Special/Fish">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10273;228:7523">
                      P
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10273;228:7524">
                    30g
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10273;228:7525" data-name="Info Fats">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10273;228:7526" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10273;228:7527" data-name="Icon/Special/Drop">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10273;228:7528">
                      F
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10273;228:7529">
                    18g
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="371:10274" data-name="Card Recommended Menu">
              <div className="content-stretch flex gap-[16px] h-[64px] items-start relative shrink-0 w-full" data-node-id="I371:10274;228:7536" data-name="Main">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I371:10274;228:7497" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I371:10274;228:7498" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-node-id="I371:10274;228:7499" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I371:10274;228:7500">
                    Quinoa Salad with Roasted Vegetables and Feta
                  </p>
                  <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I371:10274;228:7548" data-name="Bottom">
                    <div className="bg-[#ffbe8a] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I371:10274;228:7502" data-name="Info Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10274;228:7503">
                        Dinner
                      </p>
                    </div>
                    <div className="bg-[#c2e66e] content-stretch flex items-start p-[3px] relative rounded-[7px] shrink-0" data-node-id="I371:10274;228:7549" data-name="Button Picker">
                      <div className="relative shrink-0 size-[16px]" data-node-id="I371:10274;228:7549;2:3580" data-name="Icon/ChatTeardropDots">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-0 relative shrink-0 w-full" data-node-id="I371:10274;228:7513" data-name="Divider">
                <div className="absolute inset-[-0.5px_0]">
                  <img alt="" className="block max-w-none size-full" src={imgDivider} />
                </div>
              </div>
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I371:10274;228:7514" data-name="Detail Nutrients">
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10274;228:7537" data-name="Info Calories">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10274;228:7538" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10274;228:7539" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10274;228:7540">
                      C
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10274;228:7541">
                    400 kcal
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10274;228:7515" data-name="Info Carbs">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10274;228:7516" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10274;228:7517" data-name="Icon/Special/Bread">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10274;228:7518">
                      C
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10274;228:7519">
                    50g
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10274;228:7520" data-name="Info Protein">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10274;228:7521" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10274;228:7522" data-name="Icon/Special/Fish">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10274;228:7523">
                      P
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10274;228:7524">
                    15g
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I371:10274;228:7525" data-name="Info Fats">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I371:10274;228:7526" data-name="Label">
                    <div className="relative shrink-0 size-[12px]" data-node-id="I371:10274;228:7527" data-name="Icon/Special/Drop">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop2} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I371:10274;228:7528">
                      F
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I371:10274;228:7529">
                    12g
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
