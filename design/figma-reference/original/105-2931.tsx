const assetPathPrefix = "https://www.figma.com/api/mcp/asset/7bbbaad7-093f-4aff-b09c-eee56beb197e";
const imgIconSort = `${assetPathPrefix}/5ef2f.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/22b1d.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/ac3fd.svg`;
const imgIconCaretDown = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/e3c39.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconCaretDown2 = `${assetPathPrefix}/8e5ed.svg`;
const imgIconPlus = `${assetPathPrefix}/6e435.svg`;
const imgIconSpecialPersonSimpleSquat = `${assetPathPrefix}/a4ab3.svg`;
const imgIconSpecialPersonSimpleDeadlifts = `${assetPathPrefix}/7a56a.svg`;
const imgIconSpecialPersonSimpleBenchPress = `${assetPathPrefix}/a719f.svg`;
const imgIconSpecialPersonSimplePullUps = `${assetPathPrefix}/bfb23.svg`;
const imgIconSpecialPersonSimplePlank = `${assetPathPrefix}/b7687.svg`;
const imgIconNavPersonSimpleRun = `${assetPathPrefix}/deeef.svg`;
const imgIconSpecialPersonSimpleLunges = `${assetPathPrefix}/e4162.svg`;
const imgIconSpecialBarbell = `${assetPathPrefix}/3a24d.svg`;
const imgIconSpecialPersonSimpleBicepCurls = `${assetPathPrefix}/f832d.svg`;
const imgPersonSimpleBike = `${assetPathPrefix}/0626b.svg`;
const imgIconSpecialPersonSimpleMountClimbers = `${assetPathPrefix}/5cc72.svg`;
const imgIconSpecialPersonYoga = `${assetPathPrefix}/39546.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/40729.svg`;
const imgIconCaretRight = `${assetPathPrefix}/27dfe.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type BadgeStatusExercisesProps = {
  className?: string;
  status?: "Completed" | "Not Started";
};

function BadgeStatusExercises({ className, status = "Completed" }: BadgeStatusExercisesProps) {
  const isNotStarted = status === "Not Started";
  return (
    <div className={className || `content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] ${isNotStarted ? "bg-[#e1e1e2]" : "bg-[#c2e66e]"}`} id={isNotStarted ? "node-105_5057" : "node-105_5055"}>
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" id={isNotStarted ? "node-105_5058" : "node-105_5056"}>
        {isNotStarted ? "Not Started" : "Completed"}
      </p>
    </div>
  );
}

type TableRowExercisesProps = {
  className?: string;
  device?: "Desktop";
  type?: "Head";
};

function TableRowExercises({ className, device = "Desktop", type = "Head" }: TableRowExercisesProps) {
  return (
    <div className={className || "bg-white content-stretch flex items-center justify-between px-[8px] py-[16px] relative w-[1166px]"} data-node-id="105:4647">
      <div className="content-stretch flex items-start relative shrink-0 w-[162px]" data-node-id="105:4648" data-name="Cell-Name">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4649">
          Exercise Name
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4650" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="105:4651" data-name="Cell-Sets">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4652">
          Sets
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4653" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[88px]" data-node-id="105:4654" data-name="Cell-Reps">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4655">
          Reps
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4656" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[70px]" data-node-id="105:4657" data-name="Cell-Rest">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4658">
          Rest
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4659" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[90px]" data-node-id="105:4660" data-name="Cell-Weight">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4661">
          Weight
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4662" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[58px]" data-node-id="105:4663" data-name="Cell-Calories">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4664">
          Calories
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4665" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="105:4666" data-name="Cell-Status">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="105:4667">
          Status
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="105:4668" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
    </div>
  );
}

export default function Component28ExerciseDesktop() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative size-full" data-node-id="105:2931" data-name="28. Exercise (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="105:2932" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I105:2932;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I105:2932;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I105:2932;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I105:2932;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I105:2932;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I105:2932;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I105:2932;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4500;2:3296">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4505;2:3296">
                Messages
              </p>
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4505;2:3297" data-name="Badge">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I105:2932;2:4505;2:3297;2:3262" data-name="Div Red">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I105:2932;2:4505;2:3297;2:3263">
                  6
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4502;2:3296">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4503;2:3296">
                Meal Plan
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:2932;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I105:2932;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4504;2:3296">
                Food Diary
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4506;2:3296">
                Progress
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4509;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I105:2932;2:4509;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4509;2:3292">
                Exercises
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;12:1059;2:3296">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I105:2932;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I105:2932;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I105:2932;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I105:2932;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:2932;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:2932;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4518;2:3335">
                Claim Now!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2932;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I105:2932;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2932;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2932;2:4519;2:3296">
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="105:2933" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="105:2934" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I105:2934;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I105:2934;2:4460">
              Exercises
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I105:2934;2:4462" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I105:2934;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I105:2934;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I105:2934;2:4464;2:3571" data-name="Badge">
                <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I105:2934;2:4464;2:3571;2:3270" data-name="Div Red" />
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I105:2934;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I105:2934;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I105:2934;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I105:2934;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I105:2934;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I105:2934;2:4468">
                  Adam Vasylenko
                </p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I105:2934;2:4469">
                  Member
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I105:2934;2:4470">
                <div className="bg-white content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I105:2934;2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start min-h-[888px] relative rounded-[16px] shrink-0 w-full" data-node-id="105:4232" data-name="Body">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="105:4234" data-name="Header-Section">
            <div className="flex flex-row items-center self-stretch" data-node-id="I105:4234;2:4236">
              <div className="content-stretch flex gap-[10px] h-full items-center relative shrink-0" data-name="Left Section">
                <div className="bg-white content-stretch flex gap-[4px] items-center px-[8px] py-[6px] relative rounded-[8px] shrink-0 w-[224px]" data-node-id="I105:4234;2:4237" data-name="Input-search">
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:4234;2:4237;2:3947" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I105:4234;2:4237;2:3948" data-name="Icon/MagnifyingGlass">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I105:4234;2:4237;2:3949" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I105:4234;2:4237;2:3950">
                      Search for exercise
                    </p>
                  </div>
                </div>
                <div className="bg-white content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4234;2:4238" data-name="Button Picker">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I105:4234;2:4238;2:3476" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I105:4234;2:4238;2:3477">
                      Status
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:4234;2:4238;2:3478" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I105:4234;2:4238;2:3479" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown2} />
                    </div>
                  </div>
                </div>
                <div className="bg-white content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4234;2:4239" data-name="Button Picker">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I105:4234;2:4239;2:3476" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I105:4234;2:4239;2:3477">
                      This Week
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:4234;2:4239;2:3478" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I105:4234;2:4239;2:3479" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown2} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I105:4234;2:4240" data-name="Right Section">
              <div className="bg-white content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4234;2:4241" data-name="Button Picker">
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I105:4234;2:4241;2:3476" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I105:4234;2:4241;2:3477">
                    Popular
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:4234;2:4241;2:3478" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I105:4234;2:4241;2:3479" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown2} />
                  </div>
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex gap-[4px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4234;2:4247" data-name="Button CTA">
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:4234;2:4247;2:3314" data-name="Icon Left">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I105:4234;2:4247;2:3315" data-name="Icon/CalendarBlank">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                  </div>
                </div>
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I105:4234;2:4247;2:3316" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I105:4234;2:4247;2:3317">
                    Add Exercise
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col items-start overflow-clip px-[16px] py-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="105:4235" data-name="Table">
            <TableRowExercises className="bg-white content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" />
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4237" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4237;105:4670" data-name="Cell-Name">
                <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4237;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4237;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleSquat} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4237;105:4673">
                  Squats
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4237;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4237;105:4675">
                  4
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4237;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4237;105:4677">
                  12
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4237;105:4678">
                  repetitions
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4237;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4237;105:4680">
                  60
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4237;105:4681">
                  sec
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4237;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4237;105:4683">
                  45
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4237;105:4684">
                  kg
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4237;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4237;105:4686">
                  180
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4237;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4237;105:4688" data-name="Cell-Status">
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4237;105:4689" data-name="Badge Status - Exercises">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I105:4237;105:4689;105:5056">
                    Completed
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4238" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4238;105:4670" data-name="Cell-Name">
                <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4238;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4238;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleDeadlifts} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4238;105:4673">
                  Deadlifts
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4238;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4238;105:4675">
                  3
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4238;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4238;105:4677">
                  10
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4238;105:4678">
                  repetitions
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4238;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4238;105:4680">
                  90
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4238;105:4681">
                  sec
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4238;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4238;105:4683">
                  60
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4238;105:4684">
                  kg
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4238;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4238;105:4686">
                  220
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4238;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4238;105:4688" data-name="Cell-Status">
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4238;105:4689" data-name="Badge Status - Exercises">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I105:4238;105:4689;105:5056">
                    Completed
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4239" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4239;105:4670" data-name="Cell-Name">
                <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4239;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4239;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleBenchPress} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4239;105:4673">
                  Bench Press
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4239;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4239;105:4675">
                  3
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4239;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4239;105:4677">
                  8
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4239;105:4678">
                  repetitions
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4239;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4239;105:4680">
                  60
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4239;105:4681">
                  sec
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4239;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4239;105:4683">
                  40
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4239;105:4684">
                  kg
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4239;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4239;105:4686">
                  150
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4239;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4239;105:4688" data-name="Cell-Status">
                <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4239;105:4689" data-name="Badge Status - Exercises">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I105:4239;105:4689;105:5060">
                    In Progress
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4240" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4240;105:4670" data-name="Cell-Name">
                <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4240;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4240;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimplePullUps} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4240;105:4673">
                  Pull-Ups
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4240;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4240;105:4675">
                  4
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4240;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4240;105:4677">
                  8
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4240;105:4678">
                  repetitions
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4240;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4240;105:4680">
                  90
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4240;105:4681">
                  sec
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4240;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4240;105:4683">
                  Bodyweight
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4240;105:4684">
                  ​
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4240;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4240;105:4686">
                  120
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4240;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4240;105:4688" data-name="Cell-Status">
                <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4240;105:4689" data-name="Badge Status - Exercises">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I105:4240;105:4689;105:5062">
                    Skipped
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4241" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4241;105:4670" data-name="Cell-Name">
                <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4241;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4241;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimplePlank} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4241;105:4673">
                  Plank
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4241;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4241;105:4675">
                  3
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4241;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4241;105:4677">
                  60
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4241;105:4678">
                  repetitions
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4241;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4241;105:4680">
                  30
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4241;105:4681">
                  sec
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4241;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4241;105:4683">
                  -
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4241;105:4684">
                  ​
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4241;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4241;105:4686">
                  90
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4241;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4241;105:4688" data-name="Cell-Status">
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4241;105:4689" data-name="Badge Status - Exercises">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I105:4241;105:4689;105:5056">
                    Completed
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4242" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4242;105:4670" data-name="Cell-Name">
                <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4242;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4242;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleRun} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4242;105:4673">
                  Running
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4242;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4242;105:4675">
                  1
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4242;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4242;105:4677">
                  30
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4242;105:4678">
                  minutes
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4242;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4242;105:4680">
                  N/A
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4242;105:4681">
                  ​
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4242;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4242;105:4683">
                  -
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4242;105:4684">
                  ​
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4242;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4242;105:4686">
                  300
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4242;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4242;105:4688" data-name="Cell-Status">
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4242;105:4689" data-name="Badge Status - Exercises">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I105:4242;105:4689;105:5056">
                    Completed
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4243" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4243;105:4670" data-name="Cell-Name">
                <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4243;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4243;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleLunges} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4243;105:4673">
                  Lunges
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4243;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4243;105:4675">
                  3
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4243;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4243;105:4677">
                  15
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4243;105:4678">
                  repetitions
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4243;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4243;105:4680">
                  60
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4243;105:4681">
                  sec
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4243;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4243;105:4683">
                  20
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4243;105:4684">
                  kg
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4243;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4243;105:4686">
                  160
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4243;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4243;105:4688" data-name="Cell-Status">
                <BadgeStatusExercises className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" status="Not Started" />
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4244" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4244;105:4670" data-name="Cell-Name">
                <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4244;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4244;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBarbell} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4244;105:4673">
                  Shoulder Press
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4244;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4244;105:4675">
                  3
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4244;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4244;105:4677">
                  10
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4244;105:4678">
                  repetitions
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4244;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4244;105:4680">
                  60
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4244;105:4681">
                  sec
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4244;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4244;105:4683">
                  25
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4244;105:4684">
                  kg
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4244;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4244;105:4686">
                  140
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4244;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4244;105:4688" data-name="Cell-Status">
                <BadgeStatusExercises className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" status="Not Started" />
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4245" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4245;105:4670" data-name="Cell-Name">
                <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4245;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4245;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleBicepCurls} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4245;105:4673">
                  Bicep Curls
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4245;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4245;105:4675">
                  3
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4245;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4245;105:4677">
                  12
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4245;105:4678">
                  repetitions
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4245;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4245;105:4680">
                  45
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4245;105:4681">
                  sec
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4245;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4245;105:4683">
                  15
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4245;105:4684">
                  kg
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4245;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4245;105:4686">
                  110
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4245;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4245;105:4688" data-name="Cell-Status">
                <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4245;105:4689" data-name="Badge Status - Exercises">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I105:4245;105:4689;105:5062">
                    Skipped
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4246" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4246;105:4670" data-name="Cell-Name">
                <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4246;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4246;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPersonSimpleBike} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4246;105:4673">
                  Cycling
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4246;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4246;105:4675">
                  1
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4246;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4246;105:4677">
                  45
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4246;105:4678">
                  minutes
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4246;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4246;105:4680">
                  N/A
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4246;105:4681">
                  ​
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4246;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4246;105:4683">
                  -
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4246;105:4684">
                  ​
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4246;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4246;105:4686">
                  350
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4246;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4246;105:4688" data-name="Cell-Status">
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4246;105:4689" data-name="Badge Status - Exercises">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I105:4246;105:4689;105:5056">
                    Completed
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4247" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4247;105:4670" data-name="Cell-Name">
                <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4247;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4247;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleMountClimbers} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4247;105:4673">
                  Mountain Climbers
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4247;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4247;105:4675">
                  4
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4247;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4247;105:4677">
                  20
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4247;105:4678">
                  repetitions
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4247;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4247;105:4680">
                  30
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4247;105:4681">
                  sec
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4247;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4247;105:4683">
                  -
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4247;105:4684">
                  ​
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4247;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4247;105:4686">
                  200
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4247;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4247;105:4688" data-name="Cell-Status">
                <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4247;105:4689" data-name="Badge Status - Exercises">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I105:4247;105:4689;105:5060">
                    In Progress
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-full" data-node-id="105:4248" data-name="Table-Row-Exercises">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[162px]" data-node-id="I105:4248;105:4670" data-name="Cell-Name">
                <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:4248;105:4671" data-name="Icon">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I105:4248;105:4672" data-name="Icon/Special/Barbell">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonYoga} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4248;105:4673">
                  Yoga (Stretching)
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[38px]" data-node-id="I105:4248;105:4674" data-name="Cell-Sets">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I105:4248;105:4675">
                  1
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[88px] whitespace-nowrap" data-node-id="I105:4248;105:4676" data-name="Cell-Reps">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4248;105:4677">
                  60
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4248;105:4678">
                  minutes
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[70px] whitespace-nowrap" data-node-id="I105:4248;105:4679" data-name="Cell-Rest">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4248;105:4680">
                  N/A
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4248;105:4681">
                  ​
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[90px] whitespace-nowrap" data-node-id="I105:4248;105:4682" data-name="Cell-Weight">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4248;105:4683">
                  -
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4248;105:4684">
                  ​
                </p>
              </div>
              <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[58px] whitespace-nowrap" data-node-id="I105:4248;105:4685" data-name="Cell-Calories">
                <p className="relative shrink-0 text-[#272932]" data-node-id="I105:4248;105:4686">
                  150
                </p>
                <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I105:4248;105:4687">
                  cal
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I105:4248;105:4688" data-name="Cell-Status">
                <BadgeStatusExercises className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" status="Not Started" />
              </div>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="105:4249" data-name="Footer">
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="105:4250" data-name="Section Result">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#878a94] text-[11px] whitespace-nowrap" data-node-id="105:4251">
                Showing
              </p>
              <div className="bg-white content-stretch flex gap-[4px] items-center pl-[8px] pr-[6px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="105:4252" data-name="Button">
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I105:4252;2:3476" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I105:4252;2:3477">
                    12
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:4252;2:3478" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I105:4252;2:3479" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown2} />
                  </div>
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#878a94] text-[11px] whitespace-nowrap" data-node-id="105:4253">
                out of 28
              </p>
            </div>
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="105:4254" data-name="Pagination">
              <div className="bg-[#f6f6f7] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4254;2:4524" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I105:4254;2:4524;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I105:4254;2:4525" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:4254;2:4525;2:3331" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I105:4254;2:4525;2:3332">
                    1
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I105:4254;2:4526" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:4254;2:4526;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I105:4254;2:4526;2:3482">
                    2
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I105:4254;2:4527" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:4254;2:4527;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I105:4254;2:4527;2:3482">
                    3
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I105:4254;2:4530" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I105:4254;2:4530;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="105:2936" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="105:2937" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="105:2938">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="105:2939" data-name="Links">
              <p className="relative shrink-0" data-node-id="105:2940">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="105:2941">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="105:2942">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="105:2943" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2944" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2945" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2946" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2947" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2948" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
