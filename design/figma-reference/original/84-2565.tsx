const assetPathPrefix = "https://www.figma.com/api/mcp/asset/3a39ac1c-2842-4444-a4fd-546ba8ef1a24";
const imgIconGlobe = `${assetPathPrefix}/19e03.svg`;
const imgIconCopySimple = `${assetPathPrefix}/151c2.svg`;
const imgIconFilePdf = `${assetPathPrefix}/1a24d.svg`;
const imgChecks = `${assetPathPrefix}/5a341.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/f08ac.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/103fd.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/2be86.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/bf5d8.svg`;
const imgIconCaretDown = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconMagnifyingGlass1 = `${assetPathPrefix}/2b979.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
const imgIconFadersHorizontal = `${assetPathPrefix}/5c06e.svg`;
const imgIconPhone = `${assetPathPrefix}/87f30.svg`;
const imgIconVideoCamera = `${assetPathPrefix}/2e9a9.svg`;
const imgIconSidebarSimple = `${assetPathPrefix}/9f190.svg`;
const imgIconPaperPlaneRight = `${assetPathPrefix}/a79eb.svg`;
const imgIconNotePencil = `${assetPathPrefix}/66831.svg`;
const imgIconInfo = `${assetPathPrefix}/5e8cc.svg`;
const imgIconImageSquare = `${assetPathPrefix}/e2ca4.svg`;
const imgPlay = `${assetPathPrefix}/c1f26.svg`;
const imgIconFileText = `${assetPathPrefix}/ca195.svg`;
const imgIconFileXls = `${assetPathPrefix}/754d7.svg`;
const imgIconLink = `${assetPathPrefix}/d2da4.svg`;
const imgIconInstagramLogo = `${assetPathPrefix}/17de0.svg`;
const imgIconYoutubeLogo = `${assetPathPrefix}/f3528.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemListLinksProps = {
  className?: string;
  link?: string;
};

function ItemListLinks({ className, link = "http://www.alexfosterfitness.com/" }: ItemListLinksProps) {
  return (
    <div className={className || "bg-[#f9f4f2] content-stretch flex items-center px-[2px] py-[4px] relative rounded-[8px] w-[275px]"} data-node-id="210:5737" data-name="Item List Links">
      <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="210:5698" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="210:5699" data-name="Icon/Globe">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconGlobe} />
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="210:5700" data-name="Main">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="210:5701">
          {link}
        </p>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="210:6072" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="210:6073" data-name="Icon/CopySimple">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCopySimple} />
        </div>
      </div>
    </div>
  );
}

type ItemListDocsProps = {
  className?: string;
  docs?: string;
  size?: string;
};

function ItemListDocs({ className, docs = "Nutritional guide for muscle recovery.pdf", size = "1.45 mb" }: ItemListDocsProps) {
  return (
    <div className={className || "bg-[#f9f4f2] content-stretch flex gap-[12px] items-center p-[12px] relative rounded-[16px] w-[264px]"} data-node-id="209:5633" data-name="Item List Docs">
      <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="207:7121" data-name="Icon">
        <div className="relative shrink-0 size-[24px]" data-node-id="207:7122" data-name="Icon/FilePdf">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFilePdf} />
        </div>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic relative whitespace-nowrap" data-node-id="207:7123" data-name="Main">
        <p className="font-['Poppins:Medium'] leading-[1.3] min-w-full overflow-hidden relative shrink-0 text-[#52545b] text-[12px] text-ellipsis w-[min-content]" data-node-id="207:7124">
          {docs}
        </p>
        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="207:7125">
          {size}
        </p>
      </div>
    </div>
  );
}

type BubbleChatProps = {
  className?: string;
  device?: "Desktop";
  message?: string;
  showChecks?: boolean;
  showImage?: boolean;
  time?: string;
  type?: "1" | "2";
};

function BubbleChat({ className, device = "Desktop", message = "Can I request a late check-out for Room 305?", showChecks = true, showImage = true, time = "9.46 PM", type = "1" }: BubbleChatProps) {
  const is1AndDesktop = type === "1" && device === "Desktop";
  const is2AndDesktop = type === "2" && device === "Desktop";
  return (
    <div className={className || `content-stretch flex py-[4px] relative w-[460px] ${is2AndDesktop ? "items-start" : "items-end justify-end"}`} id={is2AndDesktop ? "node-2_4288" : "node-2_4280"}>
      <div className={`content-stretch flex flex-[1_0_0] flex-col gap-[8px] justify-end min-w-px relative ${is2AndDesktop ? "items-start" : "items-end"}`} id={is2AndDesktop ? "node-2_4291" : "node-2_4281"} data-name="Main">
        {is1AndDesktop && (
          <>
            <div className="bg-[#ffcb65] content-stretch flex items-center justify-center max-w-[408px] pb-[14px] pt-[13px] px-[16px] relative rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="2:4286" data-name="Bubble">
              <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="2:4287">
                {message}
              </p>
            </div>
            <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0" data-node-id="2:4282" data-name="Footer">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="2:4283">
                {time}
              </p>
              {showChecks && (
                <div className="relative shrink-0 size-[16px]" data-node-id="2:4284" data-name="Checks">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChecks} />
                </div>
              )}
            </div>
          </>
        )}
        {is2AndDesktop && showImage && (
          <div className="bg-[#fefcfb] content-stretch flex items-center justify-center max-w-[480px] p-[8px] relative rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="2:4293" data-name="Image">
            <div className="bg-[#eeeeef] overflow-clip relative rounded-bl-[6px] rounded-br-[6px] rounded-tr-[6px] shrink-0 size-[148px]" data-node-id="2:4294" data-name="Image/Car Type/Sedan" />
          </div>
        )}
        {is2AndDesktop && (
          <>
            <div className="bg-[#fefcfb] content-stretch flex items-center justify-center max-w-[408px] pb-[14px] pt-[13px] px-[16px] relative rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="2:4296" data-name="Bubble">
              <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="2:4297">
                {message}
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="2:4292">
              {time}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

type BadgeProps = {
  className?: string;
  number?: string;
  size?: "Medium";
  withNumber?: boolean;
};

function Badge({ className, number = "5", size = "Medium", withNumber = true }: BadgeProps) {
  return (
    <div className={className || "content-stretch flex flex-col items-center justify-center p-[4px] relative size-[20px]"} data-node-id="2:3261">
      <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="2:3262" data-name="Div Red">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="2:3263">
          {number}
        </p>
      </div>
    </div>
  );
}

type InputSearchProps = {
  className?: string;
  placeholder?: string;
  size?: "Large";
};

function InputSearch({ className, placeholder = "Search placeholder", size = "Large" }: InputSearchProps) {
  return (
    <div className={className || "bg-[#f6f6f7] content-stretch flex gap-[6px] items-center px-[13px] py-[9px] relative rounded-[12px] w-[237px]"} data-node-id="2:3936">
      <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="2:3937" data-name="Icon">
        <div className="relative shrink-0 size-[18px]" data-node-id="2:3938" data-name="Icon/MagnifyingGlass">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] items-center min-w-px px-[2px] relative" data-node-id="2:3939" data-name="Text">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.25] min-w-px not-italic relative text-[#8a8c90] text-[14px]" data-node-id="2:3940">
          {placeholder}
        </p>
      </div>
    </div>
  );
}

export default function Component07MessagesDesktop() {
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="84:2565" data-name="07. Messages (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="84:2566" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I84:2566;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I84:2566;2:4498" data-name="Logo">
            <div className="-translate-y-1/2 absolute left-[3px] size-[28px] top-1/2" data-node-id="I84:2566;2:4498;2:2812" data-name="symbol">
              <div className="absolute bg-[#c2e66e] bottom-[-1px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I84:2566;2:4498;12:755" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] bottom-[15px] h-[14px] left-[7.14%] right-[7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I84:2566;2:4498;12:766" data-name="Bowl" />
            </div>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.1] left-[38px] not-italic text-[#2a2b2a] text-[20px] top-[calc(50%-11px)] whitespace-nowrap" data-node-id="I84:2566;2:4498;2:2816">
              Nutrigo
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I84:2566;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4500;2:3296">
                Dashboard
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4501;2:3296">
                Calendar
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4505;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I84:2566;2:4505;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4505;2:3292">
                Messages
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4502;2:3296">
                Healthy Menu
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4503;2:3296">
                Meal Plan
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I84:2566;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I84:2566;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4504;2:3296">
                Food Diary
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4506;2:3296">
                Progress
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4509;2:3296">
                Exercises
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;12:1059;2:3296">
                Health Insights
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I84:2566;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I84:2566;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I84:2566;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I84:2566;2:4517">
              <span className="leading-[1.5] text-[12px]">Start your health journey with a</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` FREE 1-month`}</span>
              <span className="leading-[1.5] text-[12px]">{` access to Nutrigo!`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I84:2566;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I84:2566;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4518;2:3335">
                Claim Now!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I84:2566;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I84:2566;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I84:2566;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I84:2566;2:4519;2:3296">
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white border-[#e1e1e2] border-l border-solid content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="84:2567" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="84:2568" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I84:2568;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I84:2568;2:4460">
              Messages
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I84:2568;2:4462" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:2568;2:4463" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:2568;2:4463;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass1} />
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I84:2568;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I84:2568;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <div className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" data-node-id="I84:2568;2:4464;2:3571" data-name="Badge">
                <div className="bg-[#ffa257] relative rounded-[14px] shrink-0 size-[8px]" data-node-id="I84:2568;2:4464;2:3571;2:3270" data-name="Div Red" />
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I84:2568;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I84:2568;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I84:2568;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I84:2568;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I84:2568;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I84:2568;2:4468">
                  Adam Vasylenko
                </p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I84:2568;2:4469">
                  Member
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I84:2568;2:4470">
                <div className="bg-[#f9f4f2] content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I84:2568;2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[20px] items-start min-h-[842px] relative rounded-[28px] shrink-0 w-full" data-node-id="198:5968" data-name="Body">
          <div className="content-stretch flex flex-col gap-[8px] items-start overflow-clip relative shrink-0 w-[299px]" data-node-id="198:5969" data-name="Section Messages">
            <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-node-id="198:5970" data-name="Header">
              <InputSearch className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px px-[13px] py-[9px] relative rounded-[12px]" placeholder="Search name, chat, etc" />
              <div className="bg-[#eeeeef] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="198:5973" data-name="Button Icon">
                <div className="relative shrink-0 size-[22px]" data-node-id="I198:5973;2:3570" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFadersHorizontal} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-node-id="198:5978" data-name="List Messages">
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[8px] py-[24px] relative shrink-0 w-full" data-node-id="198:5979" data-name="Item List Message">
                <div className="bg-[#c2e66e] overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="I198:5979;2:4300" data-name="User Image">
                  <div className="absolute inset-0 rounded-[32px]" data-node-id="I198:5979;2:4301" data-name="Avatar">
                    <div className="absolute bg-[#c2e66e] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I198:5979;2:4301;2:3102" data-name="User Image/08" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="I198:5979;2:4302" data-name="Main">
                  <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I198:5979;2:4303" data-name="Head">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I198:5979;210:6309" data-name="User Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I198:5979;210:6310">
                        Mia Johnson
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I198:5979;210:6311">
                        -
                      </p>
                      <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px overflow-hidden relative text-[#52545b] text-[12px] text-ellipsis" data-node-id="I198:5979;210:6312">
                        Yoga Instructor
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I198:5979;2:4308">
                      11:40 AM
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I198:5979;2:4309" data-name="Body">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="I198:5979;2:4310">
                      It was great to see you at the yoga session this morning! Let’s focus more on your balance next time.
                    </p>
                    <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I198:5979;2:4311" data-name="Badge">
                      <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I198:5979;2:4311;2:3262" data-name="Div Red">
                        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I198:5979;2:4311;2:3263">
                          1
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[8px] py-[24px] relative shrink-0 w-full" data-node-id="198:5980" data-name="Item List Message">
                <div className="bg-[#ffcb65] overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="I198:5980;2:4300" data-name="User Image">
                  <div className="absolute inset-0 rounded-[32px]" data-node-id="I198:5980;2:4301" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I198:5980;2:4301;2:3102" data-name="User Image/18" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="I198:5980;2:4302" data-name="Main">
                  <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I198:5980;2:4303" data-name="Head">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I198:5980;210:6309" data-name="User Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I198:5980;210:6310">
                        Dr. Emily Lawson
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I198:5980;210:6311">
                        -
                      </p>
                      <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px overflow-hidden relative text-[#52545b] text-[12px] text-ellipsis" data-node-id="I198:5980;210:6312">
                        Doctor
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I198:5980;2:4308">
                      11:15 AM
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I198:5980;2:4309" data-name="Body">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="I198:5980;2:4310">{`Hi Ladya, your blood test results are back, and everything looks good. Let's review them during your next appointment.`}</p>
                    <Badge className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" />
                  </div>
                </div>
              </div>
              <div className="bg-[#f9f4f2] border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[8px] py-[24px] relative shrink-0 w-full" data-node-id="198:5981" data-name="Item List Message">
                <div className="bg-[#ffa257] overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="I198:5981;2:4325" data-name="User Image">
                  <div className="absolute inset-0 rounded-[32px]" data-node-id="I198:5981;2:4326" data-name="Avatar">
                    <div className="absolute bg-[#ffa257] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I198:5981;2:4326;2:3102" data-name="User Image/01" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="I198:5981;2:4327" data-name="Main">
                  <div className="[word-break:break-word] content-stretch flex gap-[8px] items-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I198:5981;2:4328" data-name="Head">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I198:5981;210:6319" data-name="User Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I198:5981;210:6320">
                        Alex Foster
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I198:5981;210:6321">
                        -
                      </p>
                      <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px overflow-hidden relative text-[#52545b] text-[12px] text-ellipsis" data-node-id="I198:5981;210:6322">
                        Personal Trainer
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="I198:5981;2:4333">
                      10:30 AM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I198:5981;2:4334" data-name="Body">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#555] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="I198:5981;2:4335">
                      You’ve got this! See you at our next session. Let’s keep pushing forward!
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[8px] py-[24px] relative shrink-0 w-full" data-node-id="204:6049" data-name="Item List Message">
                <div className="bg-[#c2e66e] overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="I204:6049;2:4300" data-name="User Image">
                  <div className="absolute inset-0 rounded-[32px]" data-node-id="I204:6049;2:4301" data-name="Avatar">
                    <div className="absolute bg-[#c2e66e] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I204:6049;2:4301;2:3102" data-name="User Image/03" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="I204:6049;2:4302" data-name="Main">
                  <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I204:6049;2:4303" data-name="Head">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I204:6049;210:6309" data-name="User Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I204:6049;210:6310">
                        Sara Mitchell
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I204:6049;210:6311">
                        -
                      </p>
                      <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px overflow-hidden relative text-[#52545b] text-[12px] text-ellipsis" data-node-id="I204:6049;210:6312">
                        Nutritionist
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I204:6049;2:4308">
                      9:45 AM
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I204:6049;2:4309" data-name="Body">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="I204:6049;2:4310">
                      I’ve updated your meal plan for the week. Let me know if you have any questions about the new recipes!
                    </p>
                    <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I204:6049;2:4311" data-name="Badge">
                      <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I204:6049;2:4311;2:3262" data-name="Div Red">
                        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I204:6049;2:4311;2:3263">
                          2
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[8px] py-[24px] relative shrink-0 w-full" data-node-id="204:6066" data-name="Item List Message">
                <div className="bg-[#ffcb65] overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="I204:6066;2:4300" data-name="User Image">
                  <div className="absolute inset-0 rounded-[32px]" data-node-id="I204:6066;2:4301" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I204:6066;2:4301;2:3102" data-name="User Image/16" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="I204:6066;2:4302" data-name="Main">
                  <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I204:6066;2:4303" data-name="Head">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I204:6066;210:6309" data-name="User Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I204:6066;210:6310">
                        Laura Davis
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I204:6066;210:6311">
                        -
                      </p>
                      <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px overflow-hidden relative text-[#52545b] text-[12px] text-ellipsis" data-node-id="I204:6066;210:6312">
                        Health Coach
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I204:6066;2:4308">
                      9:10 AM
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I204:6066;2:4309" data-name="Body">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="I204:6066;2:4310">
                      Just checking in to see how you’re managing with your new meal plan. Need any adjustments?
                    </p>
                    <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I204:6066;2:4311" data-name="Badge">
                      <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I204:6066;2:4311;2:3262" data-name="Div Red">
                        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I204:6066;2:4311;2:3263">
                          3
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[8px] py-[24px] relative shrink-0 w-full" data-node-id="204:6083" data-name="Item List Message">
                <div className="bg-[#ffa257] overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="I204:6083;2:4300" data-name="User Image">
                  <div className="absolute inset-0 rounded-[32px]" data-node-id="I204:6083;2:4301" data-name="Avatar">
                    <div className="absolute bg-[#ffa257] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I204:6083;2:4301;2:3102" data-name="User Image/17" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="I204:6083;2:4302" data-name="Main">
                  <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I204:6083;2:4303" data-name="Head">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I204:6083;210:6309" data-name="User Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I204:6083;210:6310">
                        Dr. Kevin Moore
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I204:6083;210:6311">
                        -
                      </p>
                      <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px overflow-hidden relative text-[#52545b] text-[12px] text-ellipsis" data-node-id="I204:6083;210:6312">
                        Physiotherapist
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I204:6083;2:4308">
                      8:25 AM
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I204:6083;2:4309" data-name="Body">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="I204:6083;2:4310">
                      Remember to do the stretching exercises I recommended to help improve flexibility. How are they going so far?
                    </p>
                    <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I204:6083;2:4311" data-name="Badge">
                      <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I204:6083;2:4311;2:3262" data-name="Div Red">
                        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I204:6083;2:4311;2:3263">
                          1
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[8px] py-[24px] relative shrink-0 w-full" data-node-id="204:6100" data-name="Item List Message">
                <div className="bg-[#c2e66e] overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="I204:6100;2:4313" data-name="User Image">
                  <div className="absolute inset-0 rounded-[32px]" data-node-id="I204:6100;2:4314" data-name="Avatar">
                    <div className="absolute bg-[#c2e66e] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I204:6100;2:4314;2:3102" data-name="User Image/10" />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="I204:6100;2:4315" data-name="Main">
                  <div className="[word-break:break-word] content-stretch flex gap-[8px] items-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I204:6100;2:4316" data-name="Head">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I204:6100;210:6314" data-name="User Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I204:6100;210:6315">
                        Chris Novak
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I204:6100;210:6316">
                        -
                      </p>
                      <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px overflow-hidden relative text-[#52545b] text-[12px] text-ellipsis" data-node-id="I204:6100;210:6317">
                        Fitness Coach
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="I204:6100;2:4321">
                      7:30 AM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I204:6100;2:4322" data-name="Body">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="I204:6100;2:4323">
                      Hey Ladya, I’ve updated your cardio routine to help you hit your 10km goal. Keep up the hard work!
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[16px] items-center px-[8px] py-[24px] relative shrink-0 w-full" data-node-id="198:5982" data-name="Item List Message">
                <div className="bg-[#ffcb65] overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="I198:5982;2:4313" data-name="User Image">
                  <div className="absolute inset-0 rounded-[32px]" data-node-id="I198:5982;2:4314" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I198:5982;2:4314;2:3102" data-name="User Image/06">
                      <div className="absolute inset-[0_0.28%_0_0]" data-node-id="I198:5982;2:4314;2:3102;2:3147" data-name="Place Image Here" />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="I198:5982;2:4315" data-name="Main">
                  <div className="[word-break:break-word] content-stretch flex gap-[8px] items-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I198:5982;2:4316" data-name="Head">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I198:5982;210:6314" data-name="User Info">
                      <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I198:5982;210:6315">
                        Dr. Mehdi Petit
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I198:5982;210:6316">
                        -
                      </p>
                      <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px overflow-hidden relative text-[#52545b] text-[12px] text-ellipsis" data-node-id="I198:5982;210:6317">
                        Doctor
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="I198:5982;2:4321">
                      7:05 AM
                    </p>
                  </div>
                  <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I198:5982;2:4322" data-name="Body">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.5] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[12px] text-ellipsis whitespace-nowrap" data-node-id="I198:5982;2:4323">
                      Don’t forget your follow-up appointment next Wednesday at 3 PM. We’ll discuss your overall progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="207:7097" data-name="Footer">
              <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[16px] py-[10px] relative rounded-[12px]" data-node-id="207:7100" data-name="Button">
                <div className="content-stretch flex h-[20px] items-center py-[2px] relative shrink-0" data-node-id="I207:7100;2:3405" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I207:7100;2:3406">
                    New Message
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col items-start min-w-px overflow-clip relative rounded-[16px] self-stretch" data-node-id="198:5995" data-name="Center Section">
            <div className="content-stretch flex items-center justify-center p-[16px] relative shrink-0 w-full" data-node-id="198:5996" data-name="Header">
              <div className="bg-white content-stretch flex flex-[1_0_0] items-center justify-between min-w-px p-[16px] relative rounded-[16px]" data-node-id="207:6390">
                <div className="content-stretch flex gap-[14px] items-center relative shrink-0" data-node-id="198:5997" data-name="User">
                  <div className="relative rounded-[32px] shrink-0 size-[36px]" data-node-id="198:5998" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I198:5998;2:3102" data-name="User Image/01" />
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="198:5999" data-name="Main">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#212738] text-[14px]" data-node-id="198:6000">
                      Alex Foster
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#878a94] text-[12px]" data-node-id="198:6001">
                      last seen recently
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-node-id="198:6002" data-name="Buttons">
                  <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0 w-[36px]" data-node-id="198:6003" data-name="Button Picker">
                    <div className="relative shrink-0 size-[20px]" data-node-id="I198:6003;2:3558" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPhone} />
                    </div>
                  </div>
                  <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0 w-[36px]" data-node-id="198:6004" data-name="Button Picker">
                    <div className="relative shrink-0 size-[20px]" data-node-id="I198:6004;2:3558" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconVideoCamera} />
                    </div>
                  </div>
                  <div className="bg-[#c2e66e] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0 w-[36px]" data-node-id="198:6005" data-name="Button Picker">
                    <div className="relative shrink-0 size-[20px]" data-node-id="I198:6005;2:3564" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSidebarSimple} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-end min-h-px overflow-clip px-[20px] relative w-full" data-node-id="198:6007" data-name="Chat Area">
              <div className="content-stretch flex flex-col items-center py-[8px] relative shrink-0 w-full" data-node-id="198:6008" data-name="Section Badge">
                <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="198:6009" data-name="Badge Info">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="198:6010">
                    Today, Sept 8
                  </p>
                </div>
              </div>
              <BubbleChat className="content-stretch flex items-start py-[4px] relative shrink-0 w-full" message="Hey Adam, great job on completing your 5th strength training session today! You're making awesome progress with the 50kg squats. 💪" showImage={false} time="9:40 AM" type="2" />
              <BubbleChat className="content-stretch flex items-end justify-end py-[4px] relative shrink-0 w-full" message="Thanks, Alex! It’s definitely challenging, but I’m feeling stronger each time." showImage={false} time="9:47 AM" />
              <BubbleChat className="content-stretch flex items-start py-[4px] relative shrink-0 w-full" message="That’s the spirit! Let’s aim for more reps in our next session—think you can handle 3 more per set?" showImage={false} time="9:50 AM" type="2" />
              <BubbleChat className="content-stretch flex items-end justify-end py-[4px] relative shrink-0 w-full" message="That sounds tough, but I’ll give it my best shot!" showImage={false} time="10:05 AM" />
              <BubbleChat className="content-stretch flex items-start py-[4px] relative shrink-0 w-full" message="I have no doubt you'll crush it! Also, remember to focus on your form to avoid injury. I’ll be there to guide you through it." showImage={false} time="10:10 AM" type="2" />
              <BubbleChat className="content-stretch flex items-end justify-end py-[4px] relative shrink-0 w-full" message="Will do! Thanks for the encouragement!" showImage={false} time="10:25 AM" />
              <BubbleChat className="content-stretch flex items-start py-[4px] relative shrink-0 w-full" message="You’ve got this! See you at our next session. Let’s keep pushing forward!" showImage={false} time="10:30 AM" type="2" />
            </div>
            <div className="content-stretch flex flex-col items-start p-[16px] relative shrink-0 w-full" data-node-id="198:6020" data-name="Footer">
              <div className="bg-white content-stretch flex items-center overflow-clip pl-[4px] pr-[9px] py-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="198:6021" data-name="Type Board">
                <div className="bg-white content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px px-[13px] py-[9px] relative rounded-[12px]" data-node-id="198:6022" data-name="Input-search">
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I198:6022;2:3937" data-name="Icon">
                    <div className="relative shrink-0 size-[18px]" data-node-id="I198:6022;2:3938" data-name="Icon/MagnifyingGlass">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] items-center min-w-px px-[2px] relative" data-node-id="I198:6022;2:3939" data-name="Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.25] min-w-px not-italic relative text-[#8a8c90] text-[14px]" data-node-id="I198:6022;2:3940">
                      Type a message..
                    </p>
                  </div>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex gap-[4px] items-center justify-center pl-[16px] pr-[14px] py-[9px] relative rounded-[12px] shrink-0" data-node-id="198:6023" data-name="Button">
                  <div className="content-stretch flex items-center p-[2px] relative shrink-0" data-node-id="I198:6023;2:3428" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I198:6023;2:3429">
                      Send
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I198:6023;2:3430" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I198:6023;2:3431" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPaperPlaneRight} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col items-start justify-between relative rounded-[12px] self-stretch shrink-0 w-[275px]" data-node-id="207:6722" data-name="Center Section">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="207:6723" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-798px] relative shrink-0" data-node-id="I207:6723;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I207:6723;2:4223">
                  Profile
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I207:6723;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I207:6723;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[20px]" data-node-id="I207:6723;2:4233;2:3590" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNotePencil} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full" data-node-id="207:6724" data-name="Section Profile">
              <div className="relative rounded-[32px] shrink-0 size-[56px]" data-node-id="207:6725" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-[-2.5%] overflow-clip rounded-[28px]" data-node-id="I207:6725;2:3090" data-name="User Image/01" />
              </div>
              <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full" data-node-id="207:6726" data-name="Main Info">
                <div className="content-stretch flex items-end relative shrink-0" data-node-id="207:6727" data-name="Name">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="207:6728">
                    Alex Foster
                  </p>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="210:6216" data-name="Badge Role">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="207:6730">
                    Personal Trainer
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="207:6731" data-name="Section Features">
              <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-node-id="207:6732" data-name="Title">
                <div className="relative shrink-0 size-[14px]" data-node-id="207:6733" data-name="Icon/Info">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconInfo} />
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-[61px]" data-node-id="207:6734" data-name="Title">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="207:6735">
                    About
                  </p>
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.5] not-italic relative shrink-0 text-[#52545b] text-[12px] w-full" data-node-id="207:6736">
                A certified personal trainer with 8 years of experience, specializing in strength training and personalized fitness plans for clients.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="207:6737" data-name="Section Features">
              <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-node-id="207:6738" data-name="Title">
                <div className="relative shrink-0 size-[14px]" data-node-id="207:6739" data-name="Icon/ImageSquare">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconImageSquare} />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="207:6740" data-name="Title">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="207:6741">
                    Media (2)
                  </p>
                </div>
                <div className="content-stretch flex items-center justify-center px-[2px] relative rounded-[12px] shrink-0" data-node-id="207:6742" data-name="Button">
                  <div className="content-stretch flex items-center pb-[3px] pt-[2px] relative shrink-0" data-node-id="I207:6742;1:267" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[12px] text-center whitespace-nowrap" data-node-id="I207:6742;1:268">
                      Show All
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="207:6743" data-name="Gallery">
                <div className="content-stretch flex gap-[10px] items-start overflow-clip relative shrink-0 w-full" data-node-id="207:6744" data-name="Row">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[92px]" data-node-id="207:6745" data-name="Media 1">
                    <div className="absolute inset-[32.61%]" data-node-id="210:6203" data-name="Play">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay} />
                    </div>
                  </div>
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[92px]" data-node-id="210:6186" data-name="Media 3">
                    <div className="absolute bottom-0 left-0 top-0 w-[92px]" data-node-id="210:6188" data-name="Place Image Here" />
                  </div>
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[92px]" data-node-id="210:6190" data-name="Media 4" />
                  <div className="absolute bg-gradient-to-l from-[rgba(255,255,255,0.48)] h-[92px] right-0 to-[rgba(255,255,255,0)] top-0 w-[24px]" data-node-id="210:6193" />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="207:6758" data-name="Section Features">
              <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-node-id="207:6759" data-name="Title">
                <div className="relative shrink-0 size-[14px]" data-node-id="207:6760" data-name="Icon/FileText">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFileText} />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="207:6761" data-name="Title">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="207:6762">
                    Documents (3)
                  </p>
                </div>
                <div className="content-stretch flex items-center justify-center px-[2px] relative rounded-[12px] shrink-0" data-node-id="207:6763" data-name="Button">
                  <div className="content-stretch flex items-center pb-[3px] pt-[2px] relative shrink-0" data-node-id="I207:6763;1:267" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[12px] text-center whitespace-nowrap" data-node-id="I207:6763;1:268">
                      Show All
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="207:6764" data-name="List Docs">
                <ItemListDocs className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center p-[12px] relative rounded-[16px] shrink-0 w-full" docs="Customized workout plan.pdf" size="2.5 mb" />
                <ItemListDocs className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center p-[12px] relative rounded-[16px] shrink-0 w-full" />
                <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center p-[12px] relative rounded-[16px] shrink-0 w-full" data-node-id="209:5642" data-name="Item List Docs">
                  <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I209:5642;207:7121" data-name="Icon">
                    <div className="relative shrink-0 size-[24px]" data-node-id="I209:5642;207:7122" data-name="Icon/FilePdf">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFileXls} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic relative whitespace-nowrap" data-node-id="I209:5642;207:7123" data-name="Main">
                    <p className="font-['Poppins:Medium'] leading-[1.3] min-w-full overflow-hidden relative shrink-0 text-[#52545b] text-[12px] text-ellipsis w-[min-content]" data-node-id="I209:5642;207:7124">
                      Weekly progress report.xls
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I209:5642;207:7125">
                      1.96 mb
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="207:6768" data-name="Section Features">
              <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-node-id="207:6769" data-name="Title">
                <div className="relative shrink-0 size-[14px]" data-node-id="207:6770" data-name="Icon/Link">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconLink} />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="207:6771" data-name="Title">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="207:6772">
                    Links
                  </p>
                </div>
                <div className="content-stretch flex items-center justify-center px-[2px] relative rounded-[12px] shrink-0" data-node-id="207:6773" data-name="Button">
                  <div className="content-stretch flex items-center pb-[3px] pt-[2px] relative shrink-0" data-node-id="I207:6773;1:267" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[12px] text-center whitespace-nowrap" data-node-id="I207:6773;1:268">
                      Show All
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="207:6774" data-name="List Docs">
                <ItemListLinks className="bg-[#f9f4f2] content-stretch flex items-center px-[2px] py-[4px] relative rounded-[8px] shrink-0 w-full" />
                <div className="bg-[#f9f4f2] content-stretch flex items-center px-[2px] py-[4px] relative rounded-[8px] shrink-0 w-full" data-node-id="210:5748" data-name="Item List Links">
                  <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="I210:5748;210:5698" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I210:5748;210:5699" data-name="Icon/Globe">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconInstagramLogo} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="I210:5748;210:5700" data-name="Main">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I210:5748;210:5701">
                      @alex_fitnesspro
                    </p>
                  </div>
                  <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="I210:5748;210:6072" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I210:5748;210:6073" data-name="Icon/CopySimple">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCopySimple} />
                    </div>
                  </div>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex items-center px-[2px] py-[4px] relative rounded-[8px] shrink-0 w-full" data-node-id="210:5758" data-name="Item List Links">
                  <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="I210:5758;210:5698" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I210:5758;210:5699" data-name="Icon/Globe">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconYoutubeLogo} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="I210:5758;210:5700" data-name="Main">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I210:5758;210:5701">
                      Alex Foster Fitness Tips
                    </p>
                  </div>
                  <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="I210:5758;210:6072" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I210:5758;210:6073" data-name="Icon/CopySimple">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCopySimple} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="84:2570" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="84:2571" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="84:2572">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="84:2573" data-name="Links">
              <p className="relative shrink-0" data-node-id="84:2574">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="84:2575">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="84:2576">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="84:2577" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2578" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2579" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2580" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2581" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="84:2582" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
