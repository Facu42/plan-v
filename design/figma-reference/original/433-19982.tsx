const assetPathPrefix = "https://www.figma.com/api/mcp/asset/23109376-fb89-4d4a-83a6-62154e6bc8bb";
const imgIconGlobe = `${assetPathPrefix}/19e03.svg`;
const imgIconCopySimple = `${assetPathPrefix}/151c2.svg`;
const imgIconFilePdf = `${assetPathPrefix}/1a24d.svg`;
const imgChecks = `${assetPathPrefix}/2cef5.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/d5060.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconFadersHorizontal = `${assetPathPrefix}/96637.svg`;
const imgIconPlus = `${assetPathPrefix}/ce0a3.svg`;
const imgIconPhone = `${assetPathPrefix}/d99b5.svg`;
const imgIconVideoCamera = `${assetPathPrefix}/38345.svg`;
const imgIconSidebarSimple = `${assetPathPrefix}/0aba1.svg`;
const imgIconPaperPlaneRight = `${assetPathPrefix}/619e6.svg`;
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
  device?: "Mobile";
  message?: string;
  showChecks?: boolean;
  showImage?: boolean;
  time?: string;
  type?: "1" | "2";
};

function BubbleChat({ className, device = "Mobile", message = "Can I request a late check-out for Room 305?", showChecks = true, showImage = true, time = "9.46 PM", type = "1" }: BubbleChatProps) {
  const is1AndMobile = type === "1" && device === "Mobile";
  const is2AndMobile = type === "2" && device === "Mobile";
  return (
    <div className={className || `content-stretch flex py-[4px] relative w-[460px] ${is2AndMobile ? "items-start" : "items-end justify-end"}`} id={is2AndMobile ? "node-433_19878" : "node-433_19886"}>
      <div className={`content-stretch flex flex-[1_0_0] flex-col gap-[8px] justify-end min-w-px relative ${is2AndMobile ? "items-start" : "items-end"}`} id={is2AndMobile ? "node-433_19879" : "node-433_19887"} data-name="Main">
        {is1AndMobile && (
          <>
            <div className="bg-[#ffcb65] content-stretch flex items-center justify-center max-w-[320px] pb-[14px] pt-[13px] px-[16px] relative rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="433:19888" data-name="Bubble">
              <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="433:19889">
                {message}
              </p>
            </div>
            <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0" data-node-id="433:19890" data-name="Footer">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="433:19891">
                {time}
              </p>
              {showChecks && (
                <div className="relative shrink-0 size-[14px]" data-node-id="433:19892" data-name="Checks">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgChecks} />
                </div>
              )}
            </div>
          </>
        )}
        {is2AndMobile && showImage && (
          <div className="bg-[#fefcfb] content-stretch flex items-center justify-center max-w-[480px] p-[8px] relative rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="433:19880" data-name="Image">
            <div className="bg-[#eeeeef] overflow-clip relative rounded-bl-[6px] rounded-br-[6px] rounded-tr-[6px] shrink-0 size-[148px]" data-node-id="433:19881" data-name="Image/Car Type/Sedan" />
          </div>
        )}
        {is2AndMobile && (
          <>
            <div className="bg-[#fefcfb] content-stretch flex items-center justify-center max-w-[320px] pb-[14px] pt-[13px] px-[16px] relative rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="433:19883" data-name="Bubble">
              <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="433:19884">
                {message}
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="433:19885">
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
  size?: "Medium";
};

function InputSearch({ className, placeholder = "Search placeholder", size = "Medium" }: InputSearchProps) {
  return (
    <div className={className || "bg-[#f6f6f7] content-stretch flex gap-[6px] items-center px-[12px] py-[8px] relative rounded-[10px] w-[237px]"} data-node-id="2:3941">
      <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="2:3942" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="2:3943" data-name="Icon/MagnifyingGlass">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] items-center min-w-px px-[2px] relative" data-node-id="2:3944" data-name="Text">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="2:3945">
          {placeholder}
        </p>
      </div>
    </div>
  );
}

export default function Component09MessagesMobile() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="433:19982" data-name="09. Messages (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="433:19983" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I433:19983;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I433:19983;427:15210" data-name="Logo">
            <div className="absolute inset-[6.25%]" data-node-id="I433:19983;427:15210;408:17493" data-name="symbol">
              <div className="absolute bg-[#c2e66e] inset-[53.57%_7.14%_-3.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I433:19983;427:15210;408:17494" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] inset-[-3.57%_7.14%_53.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I433:19983;427:15210;408:17495" data-name="Bowl" />
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I433:19983;433:18077">
          Messages
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I433:19983;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I433:19983;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-node-id="433:19984" data-name="Content">
        <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[10px] items-start pb-[20px] px-[20px] relative shrink-0 w-full" data-node-id="433:20361" data-name="Header">
          <InputSearch className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px px-[12px] py-[8px] relative rounded-[10px]" placeholder="Search name, chat, etc" />
          <div className="bg-[#eeeeef] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="433:20363" data-name="Button Icon">
            <div className="relative shrink-0 size-[20px]" data-node-id="I433:20363;2:3558" data-name="Icon/ChatTeardropDots">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFadersHorizontal} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[10px] shrink-0" data-node-id="445:8570" data-name="Button Icon">
            <div className="relative shrink-0 size-[20px]" data-node-id="I445:8570;2:3564" data-name="Icon/ChatTeardropDots">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start overflow-clip pb-[16px] relative shrink-0 w-full" data-node-id="433:20364" data-name="List Messages">
          <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20365" data-name="Item List Message">
            <div className="bg-[#c2e66e] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20365;433:19719" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20365;433:19720" data-name="Avatar">
                <div className="absolute bg-[#c2e66e] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20365;433:19720;2:3102" data-name="User Image/08" />
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20365;433:19721" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20365;433:19722" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20365;433:19723" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20365;433:19724">
                    Mia Johnson
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20365;433:19725">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20365;433:19726">
                    Yoga Instructor
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I433:20365;433:19727">
                  11:40 AM
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I433:20365;433:19728" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20365;433:19729">
                  It was great to see you at the yoga session this morning! Let’s focus more on your balance next time.
                </p>
                <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I433:20365;433:19730" data-name="Badge">
                  <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I433:20365;433:19730;2:3262" data-name="Div Red">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I433:20365;433:19730;2:3263">
                      1
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20366" data-name="Item List Message">
            <div className="bg-[#ffcb65] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20366;433:19719" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20366;433:19720" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20366;433:19720;2:3102" data-name="User Image/18" />
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20366;433:19721" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20366;433:19722" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20366;433:19723" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20366;433:19724">
                    Dr. Emily Lawson
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20366;433:19725">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20366;433:19726">
                    Doctor
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I433:20366;433:19727">
                  11:15 AM
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I433:20366;433:19728" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20366;433:19729">{`Hi Ladya, your blood test results are back, and everything looks good. Let's review them during your next appointment.`}</p>
                <Badge className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" />
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20367" data-name="Item List Message">
            <div className="bg-[#ffa257] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20367;433:19699" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20367;433:19700" data-name="Avatar">
                <div className="absolute bg-[#ffa257] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20367;433:19700;2:3102" data-name="User Image/01" />
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20367;433:19701" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20367;433:19702" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20367;433:19703" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20367;433:19704">
                    Alex Foster
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20367;433:19705">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20367;433:19706">
                    Personal Trainer
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="I433:20367;433:19707">
                  10:30 AM
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I433:20367;433:19708" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#555] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20367;433:19709">
                  You’ve got this! See you at our next session. Let’s keep pushing forward!
                </p>
              </div>
            </div>
          </div>
          <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20368" data-name="Item List Message">
            <div className="bg-[#c2e66e] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20368;433:19719" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20368;433:19720" data-name="Avatar">
                <div className="absolute bg-[#c2e66e] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20368;433:19720;2:3102" data-name="User Image/03" />
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20368;433:19721" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20368;433:19722" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20368;433:19723" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20368;433:19724">
                    Sara Mitchell
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20368;433:19725">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20368;433:19726">
                    Nutritionist
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I433:20368;433:19727">
                  9:45 AM
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I433:20368;433:19728" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20368;433:19729">
                  I’ve updated your meal plan for the week. Let me know if you have any questions about the new recipes!
                </p>
                <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I433:20368;433:19730" data-name="Badge">
                  <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I433:20368;433:19730;2:3262" data-name="Div Red">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I433:20368;433:19730;2:3263">
                      2
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20369" data-name="Item List Message">
            <div className="bg-[#ffcb65] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20369;433:19719" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20369;433:19720" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20369;433:19720;2:3102" data-name="User Image/16" />
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20369;433:19721" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20369;433:19722" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20369;433:19723" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20369;433:19724">
                    Laura Davis
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20369;433:19725">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20369;433:19726">
                    Health Coach
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I433:20369;433:19727">
                  9:10 AM
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I433:20369;433:19728" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20369;433:19729">
                  Just checking in to see how you’re managing with your new meal plan. Need any adjustments?
                </p>
                <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I433:20369;433:19730" data-name="Badge">
                  <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I433:20369;433:19730;2:3262" data-name="Div Red">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I433:20369;433:19730;2:3263">
                      3
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20370" data-name="Item List Message">
            <div className="bg-[#ffa257] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20370;433:19719" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20370;433:19720" data-name="Avatar">
                <div className="absolute bg-[#ffa257] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20370;433:19720;2:3102" data-name="User Image/17" />
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20370;433:19721" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20370;433:19722" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20370;433:19723" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20370;433:19724">
                    Dr. Kevin Moore
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20370;433:19725">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20370;433:19726">
                    Physiotherapist
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I433:20370;433:19727">
                  8:25 AM
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I433:20370;433:19728" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20370;433:19729">
                  Remember to do the stretching exercises I recommended to help improve flexibility. How are they going so far?
                </p>
                <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I433:20370;433:19730" data-name="Badge">
                  <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I433:20370;433:19730;2:3262" data-name="Div Red">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I433:20370;433:19730;2:3263">
                      1
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20371" data-name="Item List Message">
            <div className="bg-[#c2e66e] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20371;433:19687" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20371;433:19688" data-name="Avatar">
                <div className="absolute bg-[#c2e66e] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20371;433:19688;2:3102" data-name="User Image/10" />
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20371;433:19689" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20371;433:19690" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20371;433:19691" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20371;433:19692">
                    Chris Novak
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20371;433:19693">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20371;433:19694">
                    Fitness Coach
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="I433:20371;433:19695">
                  7:30 AM
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I433:20371;433:19696" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20371;433:19697">
                  Hey Ladya, I’ve updated your cardio routine to help you hit your 10km goal. Keep up the hard work!
                </p>
              </div>
            </div>
          </div>
          <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20372" data-name="Item List Message">
            <div className="bg-[#ffcb65] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20372;433:19687" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20372;433:19688" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20372;433:19688;2:3102" data-name="User Image/06">
                  <div className="absolute inset-[0_0.28%_0_0]" data-node-id="I433:20372;433:19688;2:3102;2:3147" data-name="Place Image Here" />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20372;433:19689" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20372;433:19690" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20372;433:19691" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20372;433:19692">
                    Dr. Mehdi Petit
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20372;433:19693">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20372;433:19694">
                    Doctor
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="I433:20372;433:19695">
                  7:05 AM
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I433:20372;433:19696" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20372;433:19697">
                  Don’t forget your follow-up appointment next Wednesday at 3 PM. We’ll discuss your overall progress.
                </p>
              </div>
            </div>
          </div>
          <div className="border-[#e1e1e2] border-b border-solid content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20373" data-name="Item List Message">
            <div className="bg-[#ffa257] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20373;433:19719" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20373;433:19720" data-name="Avatar">
                <div className="absolute bg-[#ffa257] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20373;433:19720;2:3102" data-name="User Image/17" />
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20373;433:19721" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20373;433:19722" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20373;433:19723" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20373;433:19724">
                    Dr. Kevin Moore
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20373;433:19725">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20373;433:19726">
                    Physiotherapist
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#2a2b2a] text-[11px]" data-node-id="I433:20373;433:19727">
                  Yesterday
                </p>
              </div>
              <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-node-id="I433:20373;433:19728" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20373;433:19729">
                  Remember to do the stretching exercises I recommended to help improve flexibility. How are they going so far?
                </p>
                <div className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" data-node-id="I433:20373;433:19730" data-name="Badge">
                  <div className="bg-[#ffa257] content-stretch flex items-center justify-center min-w-[18px] p-[2px] relative rounded-[9px] shrink-0" data-node-id="I433:20373;433:19730;2:3262" data-name="Div Red">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.35] min-w-px not-italic relative text-[10px] text-center text-white" data-node-id="I433:20373;433:19730;2:3263">
                      1
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[16px] items-center px-[20px] py-[22px] relative shrink-0 w-full" data-node-id="433:20374" data-name="Item List Message">
            <div className="bg-[#c2e66e] overflow-clip relative rounded-[20px] shrink-0 size-[38px]" data-node-id="I433:20374;433:19687" data-name="User Image">
              <div className="absolute inset-[2.63%] rounded-[32px]" data-node-id="I433:20374;433:19688" data-name="Avatar">
                <div className="absolute bg-[#c2e66e] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I433:20374;433:19688;2:3102" data-name="User Image/10" />
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="I433:20374;433:19689" data-name="Main">
              <div className="[word-break:break-word] content-stretch flex gap-[8px] items-center not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="I433:20374;433:19690" data-name="Head">
                <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-baseline min-w-px relative" data-node-id="I433:20374;433:19691" data-name="User Info">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I433:20374;433:19692">
                    Chris Novak
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I433:20374;433:19693">
                    -
                  </p>
                  <p className="flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px overflow-hidden relative text-[#52545b] text-[11px] text-ellipsis" data-node-id="I433:20374;433:19694">
                    Fitness Coach
                  </p>
                </div>
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8c8d8c] text-[11px]" data-node-id="I433:20374;433:19695">
                  Yesterday
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I433:20374;433:19696" data-name="Body">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] h-[20px] leading-[1.6] min-w-px not-italic overflow-hidden relative text-[#8c8d8c] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I433:20374;433:19697">
                  Hey Ladya, I’ve updated your cardio routine to help you hit your 10km goal. Keep up the hard work!
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex flex-col h-[900px] items-start overflow-clip relative shrink-0 w-full" data-node-id="536:17998" data-name="Center Section">
          <div className="content-stretch flex items-center justify-center p-[16px] relative shrink-0 w-full" data-node-id="536:17999" data-name="Header">
            <div className="bg-white content-stretch flex flex-[1_0_0] items-center justify-between min-w-px p-[16px] relative rounded-[16px]" data-node-id="536:18000">
              <div className="content-stretch flex gap-[14px] items-center relative shrink-0" data-node-id="536:18001" data-name="User">
                <div className="relative rounded-[32px] shrink-0 size-[28px]" data-node-id="536:18002" data-name="Avatar">
                  <div className="absolute bg-[#ffcb65] inset-[-3.57%] overflow-clip rounded-[24px]" data-node-id="I536:18002;2:3120" data-name="User Image/01" />
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="536:18003" data-name="Main">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="536:18004">
                    Alex Foster
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="536:18005">
                    last seen recently
                  </p>
                </div>
              </div>
              <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-node-id="536:18006" data-name="Buttons">
                <div className="bg-[#f9f4f2] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="536:18007" data-name="Button Picker">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I536:18007;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPhone} />
                  </div>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="536:18008" data-name="Button Picker">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I536:18008;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconVideoCamera} />
                  </div>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="536:18009" data-name="Button Picker">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I536:18009;2:3586" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSidebarSimple} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px overflow-clip px-[20px] relative w-full" data-node-id="536:18010" data-name="Chat Area">
            <div className="content-stretch flex flex-col items-center py-[8px] relative shrink-0 w-full" data-node-id="536:18011" data-name="Section Badge">
              <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="536:18012" data-name="Badge Info">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="536:18013">
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
          <div className="content-stretch flex flex-col items-start p-[16px] relative shrink-0 w-full" data-node-id="536:18021" data-name="Footer">
            <div className="bg-white content-stretch flex items-center overflow-clip pl-[4px] pr-[9px] py-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="536:18022" data-name="Type Board">
              <div className="bg-white content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px px-[12px] py-[8px] relative rounded-[10px]" data-node-id="536:18023" data-name="Input-search">
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I536:18023;2:3942" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I536:18023;2:3943" data-name="Icon/MagnifyingGlass">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] items-center min-w-px px-[2px] relative" data-node-id="I536:18023;2:3944" data-name="Text">
                  <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#8a8c90] text-[12px]" data-node-id="I536:18023;2:3945">
                    Type a message..
                  </p>
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex gap-[4px] items-center justify-center pl-[14px] pr-[12px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="536:18024" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I536:18024;2:3337" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I536:18024;2:3338">
                    Send
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I536:18024;2:3339" data-name="Icon Right">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I536:18024;2:3340" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPaperPlaneRight} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[24px] items-start px-[16px] py-[24px] relative rounded-[12px] shrink-0 w-full" data-node-id="536:18171" data-name="Center Section">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="536:18172" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I536:18172;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I536:18172;2:4223">
                Profile
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I536:18172;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I536:18172;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[20px]" data-node-id="I536:18172;2:4233;2:3590" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNotePencil} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full" data-node-id="536:18173" data-name="Section Profile">
            <div className="relative rounded-[32px] shrink-0 size-[56px]" data-node-id="536:18174" data-name="Avatar">
              <div className="absolute bg-[#ffcb65] inset-[-2.5%] overflow-clip rounded-[28px]" data-node-id="I536:18174;2:3090" data-name="User Image/01" />
            </div>
            <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full" data-node-id="536:18175" data-name="Main Info">
              <div className="content-stretch flex items-end relative shrink-0" data-node-id="536:18176" data-name="Name">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="536:18177">
                  Alex Foster
                </p>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="536:18178" data-name="Badge Role">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="536:18179">
                  Personal Trainer
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="536:18180" data-name="Section Features">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-node-id="536:18181" data-name="Title">
              <div className="relative shrink-0 size-[14px]" data-node-id="536:18182" data-name="Icon/Info">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconInfo} />
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-[61px]" data-node-id="536:18183" data-name="Title">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="536:18184">
                  About
                </p>
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.5] not-italic relative shrink-0 text-[#52545b] text-[12px] w-full" data-node-id="536:18185">
              A certified personal trainer with 8 years of experience, specializing in strength training and personalized fitness plans for clients.
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="536:18186" data-name="Section Features">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-node-id="536:18187" data-name="Title">
              <div className="relative shrink-0 size-[14px]" data-node-id="536:18188" data-name="Icon/ImageSquare">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconImageSquare} />
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="536:18189" data-name="Title">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="536:18190">
                  Media (2)
                </p>
              </div>
              <div className="content-stretch flex items-center justify-center px-[2px] relative rounded-[12px] shrink-0" data-node-id="536:18191" data-name="Button">
                <div className="content-stretch flex items-center pb-[3px] pt-[2px] relative shrink-0" data-node-id="I536:18191;1:267" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[12px] text-center whitespace-nowrap" data-node-id="I536:18191;1:268">
                    Show All
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="536:18192" data-name="Gallery">
              <div className="content-stretch flex gap-[10px] items-start overflow-clip relative shrink-0 w-full" data-node-id="536:18193" data-name="Row">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[92px]" data-node-id="536:18194" data-name="Media 1">
                  <div className="absolute inset-[32.61%]" data-node-id="536:18196" data-name="Play">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay} />
                  </div>
                </div>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[92px]" data-node-id="536:18198" data-name="Media 3">
                  <div className="absolute bottom-0 left-0 top-0 w-[92px]" data-node-id="536:18199" data-name="Place Image Here" />
                </div>
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[92px]" data-node-id="536:18200" data-name="Media 4" />
                <div className="absolute bg-gradient-to-l from-[rgba(255,255,255,0.48)] h-[92px] right-0 to-[rgba(255,255,255,0)] top-0 w-[24px]" data-node-id="536:18202" />
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="536:18203" data-name="Section Features">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-node-id="536:18204" data-name="Title">
              <div className="relative shrink-0 size-[14px]" data-node-id="536:18205" data-name="Icon/FileText">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFileText} />
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="536:18206" data-name="Title">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="536:18207">
                  Documents (3)
                </p>
              </div>
              <div className="content-stretch flex items-center justify-center px-[2px] relative rounded-[12px] shrink-0" data-node-id="536:18208" data-name="Button">
                <div className="content-stretch flex items-center pb-[3px] pt-[2px] relative shrink-0" data-node-id="I536:18208;1:267" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[12px] text-center whitespace-nowrap" data-node-id="I536:18208;1:268">
                    Show All
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="536:18209" data-name="List Docs">
              <ItemListDocs className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center p-[12px] relative rounded-[16px] shrink-0 w-full" docs="Customized workout plan.pdf" size="2.5 mb" />
              <ItemListDocs className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center p-[12px] relative rounded-[16px] shrink-0 w-full" />
              <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center p-[12px] relative rounded-[16px] shrink-0 w-full" data-node-id="536:18212" data-name="Item List Docs">
                <div className="bg-[#c2e66e] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I536:18212;207:7121" data-name="Icon">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I536:18212;207:7122" data-name="Icon/FilePdf">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFileXls} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic relative whitespace-nowrap" data-node-id="I536:18212;207:7123" data-name="Main">
                  <p className="font-['Poppins:Medium'] leading-[1.3] min-w-full overflow-hidden relative shrink-0 text-[#52545b] text-[12px] text-ellipsis w-[min-content]" data-node-id="I536:18212;207:7124">
                    Weekly progress report.xls
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I536:18212;207:7125">
                    1.96 mb
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="536:18213" data-name="Section Features">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-node-id="536:18214" data-name="Title">
              <div className="relative shrink-0 size-[14px]" data-node-id="536:18215" data-name="Icon/Link">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconLink} />
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="536:18216" data-name="Title">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="536:18217">
                  Links
                </p>
              </div>
              <div className="content-stretch flex items-center justify-center px-[2px] relative rounded-[12px] shrink-0" data-node-id="536:18218" data-name="Button">
                <div className="content-stretch flex items-center pb-[3px] pt-[2px] relative shrink-0" data-node-id="I536:18218;1:267" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[12px] text-center whitespace-nowrap" data-node-id="I536:18218;1:268">
                    Show All
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="536:18219" data-name="List Docs">
              <ItemListLinks className="bg-[#f9f4f2] content-stretch flex items-center px-[2px] py-[4px] relative rounded-[8px] shrink-0 w-full" />
              <div className="bg-[#f9f4f2] content-stretch flex items-center px-[2px] py-[4px] relative rounded-[8px] shrink-0 w-full" data-node-id="536:18221" data-name="Item List Links">
                <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="I536:18221;210:5698" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I536:18221;210:5699" data-name="Icon/Globe">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconInstagramLogo} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="I536:18221;210:5700" data-name="Main">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I536:18221;210:5701">
                    @alex_fitnesspro
                  </p>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="I536:18221;210:6072" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I536:18221;210:6073" data-name="Icon/CopySimple">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCopySimple} />
                  </div>
                </div>
              </div>
              <div className="bg-[#f9f4f2] content-stretch flex items-center px-[2px] py-[4px] relative rounded-[8px] shrink-0 w-full" data-node-id="536:18222" data-name="Item List Links">
                <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="I536:18222;210:5698" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I536:18222;210:5699" data-name="Icon/Globe">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconYoutubeLogo} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-node-id="I536:18222;210:5700" data-name="Main">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I536:18222;210:5701">
                    Alex Foster Fitness Tips
                  </p>
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex items-center p-[6px] relative rounded-[6px] shrink-0" data-node-id="I536:18222;210:6072" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I536:18222;210:6073" data-name="Icon/CopySimple">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCopySimple} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center py-[24px] relative shrink-0 w-full" data-node-id="433:20107" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="433:20108" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="433:20109">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="433:20110" data-name="Links">
              <p className="relative shrink-0" data-node-id="433:20111">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="433:20112">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="433:20113">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="433:20114" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="433:20115" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:20116" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:20117" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:20118" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="433:20119" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
