const assetPathPrefix = "https://www.figma.com/api/mcp/asset/1e9011c6-e8bf-401c-8151-ae741ee27dfd";
const imgRow = `${assetPathPrefix}/00da0.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgPoint = `${assetPathPrefix}/845df.svg`;
const imgLine = `${assetPathPrefix}/3f805.svg`;
const imgPoint1 = `${assetPathPrefix}/8730a.svg`;
const imgPoint2 = `${assetPathPrefix}/e27f6.svg`;
const imgLine1 = `${assetPathPrefix}/272cd.svg`;
const imgLine2 = `${assetPathPrefix}/b3c5e.svg`;
const imgLine3 = `${assetPathPrefix}/b72a7.svg`;
const imgLine4 = `${assetPathPrefix}/96be4.svg`;
const imgIconCaretDown = `${assetPathPrefix}/16cfa.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgLineArea = `${assetPathPrefix}/ebe3d.svg`;
const imgLine5 = `${assetPathPrefix}/bcc5a.svg`;
const imgPoint3 = `${assetPathPrefix}/445ce.svg`;
const imgRow1 = `${assetPathPrefix}/9fe68.svg`;
const imgLeftSide = `${assetPathPrefix}/36709.svg`;
const imgLeftSide1 = `${assetPathPrefix}/595f3.svg`;
const imgChartArea = `${assetPathPrefix}/81e20.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ChartColumnProps = {
  className?: string;
  label?: string;
  type?: "Default" | "Y-labels";
};

function ChartColumn({ className, label = "Jan", type = "Y-labels" }: ChartColumnProps) {
  const isDefault = type === "Default";
  const isYLabels = type === "Y-labels";
  return (
    <div className={className || `content-stretch flex flex-col gap-[8px] h-[186px] pb-[4px] relative rounded-[6px] ${isDefault ? "items-center w-[45px]" : "items-start"}`} id={isDefault ? "node-2_4024" : "node-2_4010"}>
      <div className={`content-stretch flex flex-[1_0_0] flex-col justify-between min-h-px relative ${isDefault ? "items-center w-full" : "items-start"}`} id={isDefault ? "node-2_4025" : "node-2_4011"} data-name="Lines">
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4026" : "node-2_4012"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4013">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4028" : "node-2_4014"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4015">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4030" : "node-2_4016"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4017">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4032" : "node-2_4018"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4019">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isDefault ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isDefault ? "node-2_4034" : "node-2_4020"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4021">
              8K
            </p>
          )}
          {isDefault && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
      </div>
      <div className={`content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 ${isDefault ? "w-full" : "pr-[8px] w-[19px]"}`} id={isDefault ? "node-2_4036" : "node-2_4022"} data-name="Row">
        {isDefault && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="2:4037">
            {label}
          </p>
        )}
      </div>
    </div>
  );
}

function ItemListPhotoCarousel({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[16px] w-[156px]"} data-node-id="161:6738" data-name="Item List Photo Carousel">
      <div className="[word-break:break-word] content-stretch flex items-baseline justify-between not-italic p-[12px] relative rounded-[12px] shrink-0 w-full whitespace-nowrap" data-node-id="161:6507" data-name="Info Progress">
        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="161:6508">
          July 2028
        </p>
        <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="161:6509" data-name="Current Weight">
          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="161:6510">
            82
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="161:6511">
            Kg
          </p>
        </div>
      </div>
      <div className="bg-[#eeeeef] h-[156px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="161:6737" data-name="Image">
        <div className="absolute bg-[#eeeeef] inset-0" data-node-id="191:5430" data-name="Place Image Here" />
      </div>
    </div>
  );
}

export default function Component27ProgressMobile() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="498:18237" data-name="27. Progress (Mobile)">
      <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="498:18238" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I498:18238;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I498:18238;427:15210" data-name="Logo">
            <div className="absolute inset-[6.25%]" data-node-id="I498:18238;427:15210;408:17493" data-name="symbol">
              <div className="absolute bg-[#c2e66e] inset-[53.57%_7.14%_-3.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I498:18238;427:15210;408:17494" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] inset-[-3.57%_7.14%_53.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I498:18238;427:15210;408:17495" data-name="Bowl" />
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I498:18238;433:18077">
          Progress
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I498:18238;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I498:18238;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="bg-white content-stretch flex flex-col gap-[32px] items-start overflow-clip py-[24px] relative shrink-0 w-full" data-node-id="498:18239" data-name="Content">
        <div className="content-stretch flex flex-col items-start px-[16px] relative shrink-0 w-full" data-node-id="498:18240" data-name="Section Data Chart">
          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-node-id="498:18848" data-name="Main Info">
            <div className="h-[556px] overflow-clip relative shrink-0 w-full" data-node-id="498:18849" data-name="Image Area">
              <div className="absolute contents left-[-51.48px] top-0" data-node-id="498:18916">
                <div className="absolute bg-[#eeeeef] h-[563px] left-[179.43px] top-0 w-[230.904px]" data-node-id="498:18917" data-name="freepik-export-20240925003141nI3f 1" />
                <div className="absolute flex h-[563px] items-center justify-center left-[-51.48px] top-0 w-[230.904px]" data-node-id="498:18918">
                  <div className="-scale-y-100 flex-none rotate-180">
                    <div className="bg-[#eeeeef] h-[563px] relative w-[230.904px]" data-name="freepik-export-20240925003141nI3f 2" />
                  </div>
                </div>
              </div>
              <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] h-[33px] items-start left-[292px] not-italic px-[8px] rounded-[12px] top-[65px] w-[58px] whitespace-nowrap" data-node-id="498:18919" data-name="Info Progress">
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="498:18920">
                  Chest
                </p>
                <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:18921" data-name="Current Weight">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="498:18922">
                    93.0
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="498:18923">
                    cm
                  </p>
                </div>
              </div>
              <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] h-[33px] items-start left-[293px] not-italic px-[8px] rounded-[12px] top-[157px] w-[57px] whitespace-nowrap" data-node-id="498:18924" data-name="Info Progress">
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="498:18925">
                  Waist
                </p>
                <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:18926" data-name="Current Weight">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="498:18927">
                    77.5
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="498:18928">
                    cm
                  </p>
                </div>
              </div>
              <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] h-[34px] items-start left-[13px] not-italic px-[8px] rounded-[12px] top-[294px] w-[59px] whitespace-nowrap" data-node-id="498:18929" data-name="Info Progress">
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="498:18930">
                  Hips
                </p>
                <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:18931" data-name="Current Weight">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="498:18932">
                    98.0
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="498:18933">
                    cm
                  </p>
                </div>
              </div>
              <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] h-[34px] items-start left-[13px] not-italic px-[8px] rounded-[12px] top-[121px] w-[58px] whitespace-nowrap" data-node-id="498:18934" data-name="Info Progress">
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="498:18935">
                  Arm
                </p>
                <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:18936" data-name="Current Weight">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="498:18937">
                    28.5
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="498:18938">
                    cm
                  </p>
                </div>
              </div>
              <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] h-[33px] items-start left-[292px] not-italic px-[8px] rounded-[12px] top-[369px] w-[59px] whitespace-nowrap" data-node-id="498:18939" data-name="Info Progress">
                <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="498:18940">
                  Thigh
                </p>
                <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:18941" data-name="Current Weight">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="498:18942">
                    58.5
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="498:18943">
                    cm
                  </p>
                </div>
              </div>
              <div className="absolute h-[11px] left-[113px] top-[163px] w-[10px]" data-node-id="498:18944" data-name="Point">
                <div className="absolute inset-[-18.18%_-20%]">
                  <img alt="" className="block max-w-none size-full" src={imgPoint} />
                </div>
              </div>
              <div className="absolute h-[32px] left-[13px] top-[137px] w-[105px]" data-node-id="498:18945" data-name="Line">
                <div className="absolute inset-[-1.56%_-0.32%_-1.15%_0]">
                  <img alt="" className="block max-w-none size-full" src={imgLine} />
                </div>
              </div>
              <div className="absolute h-[9px] left-[174px] top-[134px] w-[11px]" data-node-id="498:18946" data-name="Point">
                <div className="absolute inset-[-22.22%_-18.18%]">
                  <img alt="" className="block max-w-none size-full" src={imgPoint1} />
                </div>
              </div>
              <div className="absolute h-[10px] left-[174px] top-[195px] w-[11px]" data-node-id="498:18947" data-name="Point">
                <div className="absolute inset-[-20%_-18.18%]">
                  <img alt="" className="block max-w-none size-full" src={imgPoint2} />
                </div>
              </div>
              <div className="absolute h-[10px] left-[199px] top-[331px] w-[11px]" data-node-id="498:18948" data-name="Point">
                <div className="absolute inset-[-20%_-18.18%]">
                  <img alt="" className="block max-w-none size-full" src={imgPoint2} />
                </div>
              </div>
              <div className="absolute h-[10px] left-[174px] top-[253px] w-[11px]" data-node-id="498:18949" data-name="Point">
                <div className="absolute inset-[-20%_-18.18%]">
                  <img alt="" className="block max-w-none size-full" src={imgPoint2} />
                </div>
              </div>
              <div className="absolute h-[59px] left-[179px] top-[80px] w-[172px]" data-node-id="498:18950" data-name="Line">
                <div className="absolute inset-[-0.85%_0_-0.71%_-0.16%]">
                  <img alt="" className="block max-w-none size-full" src={imgLine1} />
                </div>
              </div>
              <div className="absolute h-[48px] left-[205px] top-[336px] w-[146px]" data-node-id="498:18951" data-name="Line">
                <div className="absolute inset-[-0.85%_0_-1.04%_-0.2%]">
                  <img alt="" className="block max-w-none size-full" src={imgLine2} />
                </div>
              </div>
              <div className="absolute h-[27px] left-[179px] top-[172px] w-[173px]" data-node-id="498:18952" data-name="Line">
                <div className="absolute inset-[-1.85%_0_-1.78%_0]">
                  <img alt="" className="block max-w-none size-full" src={imgLine3} />
                </div>
              </div>
              <div className="absolute h-[52px] left-[13px] top-[258px] w-[166px]" data-node-id="498:18953" data-name="Line">
                <div className="absolute inset-[-0.8%_-0.17%_-0.96%_0]">
                  <img alt="" className="block max-w-none size-full" src={imgLine4} />
                </div>
              </div>
              <div className="absolute bg-[#c2e66e] content-stretch flex gap-[2px] items-center left-0 pl-[10px] pr-[8px] py-[6px] rounded-[8px] top-0" data-node-id="498:18954" data-name="Button Picker">
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I498:18954;2:3326" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I498:18954;2:3327">
                    Today
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I498:18954;2:3328" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I498:18954;2:3329" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:18956" data-name="Widget Weight Tracking">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="498:18957" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I498:18957;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I498:18957;2:4223">
                    Weight Tracking
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I498:18957;2:4225" data-name="Right Section">
                  <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I498:18957;2:4233" data-name="Button More">
                    <div className="relative shrink-0 size-[24px]" data-node-id="I498:18957;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="498:18958" data-name="Body">
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start justify-center not-italic relative self-stretch shrink-0 whitespace-nowrap" data-node-id="498:18959" data-name="Info Weights">
                  <div className="content-stretch flex flex-col gap-[4px] items-start relative rounded-[12px] shrink-0 w-full" data-node-id="498:18960" data-name="Item Info Weight">
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="498:18961">
                      Start Weight
                    </p>
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:18962" data-name="Current Weight">
                      <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="498:18963">
                        85
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="498:18964">
                        Kg
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[4px] items-start relative rounded-[12px] shrink-0 w-full" data-node-id="498:18965" data-name="Item Info Weight">
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="498:18966">
                      Current Weight
                    </p>
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:18967" data-name="Current Weight">
                      <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="498:18968">
                        78
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="498:18969">
                        Kg
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[4px] items-start relative rounded-[12px] shrink-0 w-full" data-node-id="498:18970" data-name="Item Info Weight">
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="498:18971">
                      Weight Goal
                    </p>
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:18972" data-name="Current Weight">
                      <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="498:18973">
                        65
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="498:18974">
                        Kg
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] h-[181px] items-start min-w-px relative" data-node-id="498:18975" data-name="Chart">
                  <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Apr" type="Default" />
                  <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="May" type="Default" />
                  <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Jun" type="Default" />
                  <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Jul" type="Default" />
                  <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Aug" type="Default" />
                  <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Sep" type="Default" />
                  <div className="absolute inset-[13.26%_0.42%_17.13%_0.21%]" data-node-id="498:18983" data-name="Line Area">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLineArea} />
                  </div>
                  <div className="absolute inset-[13.26%_0.42%_47.21%_0.21%]" data-node-id="498:18984" data-name="Line">
                    <div className="absolute inset-[-1.4%_-0.45%]">
                      <img alt="" className="block max-w-none size-full" src={imgLine5} />
                    </div>
                  </div>
                  <div className="absolute content-stretch flex inset-0 items-center" data-node-id="498:18985" data-name="Columns">
                    <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[164px] relative" data-node-id="498:18986" data-name="Column">
                      <div className="relative shrink-0 size-[10px]" data-node-id="498:18987" data-name="Tooltip">
                        <div className="absolute left-px size-[8px] top-px" data-node-id="498:18988" data-name="Point">
                          <div className="absolute inset-[-25%]">
                            <img alt="" className="block max-w-none size-full" src={imgPoint3} />
                          </div>
                        </div>
                        <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-1/2 not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="498:18989">
                          85 kg
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[146px] relative" data-node-id="498:18990" data-name="Column">
                      <div className="relative shrink-0 size-[10px]" data-node-id="498:18991" data-name="Tooltip">
                        <div className="absolute left-px size-[8px] top-px" data-node-id="498:18992" data-name="Point">
                          <div className="absolute inset-[-25%]">
                            <img alt="" className="block max-w-none size-full" src={imgPoint3} />
                          </div>
                        </div>
                        <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-[calc(50%+0.5px)] not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="498:18993">
                          83 kg
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[129px] relative" data-node-id="498:18994" data-name="Column">
                      <div className="relative shrink-0 size-[10px]" data-node-id="498:18995" data-name="Tooltip">
                        <div className="absolute left-px size-[8px] top-px" data-node-id="498:18996" data-name="Point">
                          <div className="absolute inset-[-25%]">
                            <img alt="" className="block max-w-none size-full" src={imgPoint3} />
                          </div>
                        </div>
                        <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-1/2 not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="498:18997">
                          80 kg
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[93px] relative" data-node-id="498:18998" data-name="Column">
                      <div className="relative shrink-0 size-[10px]" data-node-id="498:18999" data-name="Tooltip">
                        <div className="absolute left-px size-[8px] top-px" data-node-id="498:19000" data-name="Point">
                          <div className="absolute inset-[-25%]">
                            <img alt="" className="block max-w-none size-full" src={imgPoint3} />
                          </div>
                        </div>
                        <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-1/2 not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="498:19001">
                          73 kg
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[129px] relative" data-node-id="498:19002" data-name="Column">
                      <div className="relative shrink-0 size-[10px]" data-node-id="498:19003" data-name="Tooltip">
                        <div className="absolute left-px size-[8px] top-px" data-node-id="498:19004" data-name="Point">
                          <div className="absolute inset-[-25%]">
                            <img alt="" className="block max-w-none size-full" src={imgPoint3} />
                          </div>
                        </div>
                        <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-1/2 not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="498:19005">
                          80 kg
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] h-[205px] items-end justify-center min-w-px pb-[115px] relative" data-node-id="498:19006" data-name="Column">
                      <div className="relative shrink-0 size-[10px]" data-node-id="498:19007" data-name="Tooltip">
                        <div className="absolute left-px size-[8px] top-px" data-node-id="498:19008" data-name="Point">
                          <div className="absolute inset-[-25%]">
                            <img alt="" className="block max-w-none size-full" src={imgPoint3} />
                          </div>
                        </div>
                        <p className="-translate-x-1/2 [word-break:break-word] absolute bottom-[26px] font-['Poppins:Regular'] leading-[1.35] left-[calc(50%+0.5px)] not-italic text-[#52545b] text-[10px] text-center translate-y-full whitespace-nowrap" dir="auto" data-node-id="498:19009">
                          78 kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[20px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="498:19010" data-name="Widget Progress Photos">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="498:19011" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I498:19011;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I498:19011;2:4223">
                    Progress Photos
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I498:19011;2:4225" data-name="Right Section">
                  <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I498:19011;2:4228" data-name="Button Picker">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I498:19011;2:4228;2:3331" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I498:19011;2:4228;2:3332">{`View All `}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full" data-node-id="498:19012" data-name="Body">
                <div className="content-stretch flex gap-[16px] items-start overflow-clip relative shrink-0 w-full" data-node-id="498:19013" data-name="Carousel">
                  <ItemListPhotoCarousel className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[156px]" />
                  <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[156px]" data-node-id="498:19015" data-name="Item List Photo Carousel">
                    <div className="[word-break:break-word] content-stretch flex items-baseline justify-between not-italic p-[12px] relative rounded-[12px] shrink-0 w-full whitespace-nowrap" data-node-id="I498:19015;161:6507" data-name="Info Progress">
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="I498:19015;161:6508">
                        Sept 2028
                      </p>
                      <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="I498:19015;161:6509" data-name="Current Weight">
                        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I498:19015;161:6510">
                          82
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I498:19015;161:6511">
                          Kg
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#eeeeef] h-[156px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I498:19015;161:6737" data-name="Image">
                      <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I498:19015;191:5430" data-name="Place Image Here" />
                    </div>
                  </div>
                  <ItemListPhotoCarousel className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-[156px]" />
                  <div className="absolute bg-gradient-to-l bottom-0 from-[rgba(39,41,50,0.06)] right-0 to-[rgba(39,41,50,0)] top-0 w-[24px]" data-node-id="498:19017" />
                </div>
                <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative rounded-[6px] shrink-0 w-full" data-node-id="498:19018" data-name="Slider">
                  <div className="bg-[#e1e1e2] h-[8px] relative rounded-[6px] shrink-0 w-[80px]" data-node-id="498:19019" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[32px] items-start px-[16px] relative shrink-0 w-full" data-node-id="498:20327" data-name="Section Charts">
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:19888" data-name="Widget Calories Activities">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="498:19889" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I498:19889;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I498:19889;2:4223">
                  Calories Activities
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I498:19889;2:4225" data-name="Right Section">
                <div className="bg-[#c2e66e] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I498:19889;2:4228" data-name="Button Picker">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I498:19889;2:4228;2:3326" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I498:19889;2:4228;2:3327">
                      Last 4 Days
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I498:19889;2:4228;2:3328" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I498:19889;2:4228;2:3329" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-h-px relative rounded-[16px] w-full" data-node-id="498:19890" data-name="Body">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="498:19891" data-name="Top Row">
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start not-italic relative rounded-[12px] shrink-0 whitespace-nowrap" data-node-id="498:19892" data-name="Info Total Item">
                  <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:19893" data-name="Current Weight">
                    <p className="font-['Poppins:SemiBold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="498:19894">
                      450
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="498:19895">
                      kcal left
                    </p>
                  </div>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="498:19896">
                    Calorie Goal: 2,000 kcal
                  </p>
                </div>
                <div className="flex flex-row items-center self-stretch" data-node-id="498:19897">
                  <div className="content-stretch flex flex-col gap-[6px] h-full items-start pr-[8px] relative shrink-0" data-name="Legends">
                    <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="498:19898" data-name="Item Category">
                      <div className="bg-[#ffcb65] relative rounded-[2px] shrink-0 size-[6px]" data-node-id="498:19899" data-name="Color Category" />
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="498:19900">
                        Consumed
                      </p>
                    </div>
                    <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="498:19901" data-name="Item Category">
                      <div className="bg-[#ffa257] relative rounded-[2px] shrink-0 size-[6px]" data-node-id="498:19902" data-name="Color Category" />
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="498:19903">
                        Burned
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] items-center min-h-px relative w-full" data-node-id="498:19904" data-name="Body">
                <div className="content-stretch flex flex-col gap-[8px] h-full items-start pb-[4px] relative rounded-[6px] shrink-0" data-node-id="498:19905" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px relative" data-node-id="I498:19905;2:4011" data-name="Lines">
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I498:19905;2:4012" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I498:19905;2:4013">
                        2000
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I498:19905;2:4014" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I498:19905;2:4015">
                        1500
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I498:19905;2:4016" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I498:19905;2:4017">
                        1000
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I498:19905;2:4018" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I498:19905;2:4019">
                        500
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I498:19905;2:4020" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I498:19905;2:4021">
                        0
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0 w-[19px]" data-node-id="I498:19905;2:4022" data-name="Row" />
                </div>
                <ChartColumn className="content-stretch flex flex-col gap-[8px] h-full items-center pb-[4px] relative rounded-[6px] shrink-0 w-[8px]" label="" type="Default" />
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:19907" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I498:19907;2:4098" data-name="Lines">
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19907;2:4099" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19907;2:4101" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19907;2:4103" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19907;2:4105" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19907;2:4107" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="absolute content-stretch flex inset-[3.73%_15.56%] items-end justify-center" data-node-id="I498:19907;2:4109" data-name="Div Bar">
                      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[25px] relative" data-node-id="I498:19907;2:4110" data-name="Bar 1">
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I498:19907;2:4111" data-name="Bar 1" />
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[32px] relative" data-node-id="I498:19907;2:4112" data-name="Bar 2">
                        <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I498:19907;2:4113" data-name="Bar 1" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I498:19907;2:4114" data-name="Row">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I498:19907;2:4115">
                      Mon
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:19908" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I498:19908;2:4098" data-name="Lines">
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19908;2:4099" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19908;2:4101" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19908;2:4103" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19908;2:4105" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19908;2:4107" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="absolute content-stretch flex inset-[3.73%_15.56%] isolate items-end justify-center" data-node-id="I498:19908;2:4109" data-name="Div Bar">
                      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px pt-[13px] relative z-[2]" data-node-id="I498:19908;2:4110" data-name="Bar 1">
                        <div className="bg-[#ffcb65] border-[#ffefd0] border-l-6 border-r-6 border-solid border-t-6 flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I498:19908;2:4111" data-name="Bar 1" />
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[21px] relative z-[1]" data-node-id="I498:19908;2:4112" data-name="Bar 2">
                        <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I498:19908;2:4113" data-name="Bar 1" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I498:19908;2:4114" data-name="Row">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I498:19908;2:4115">
                      Tue
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:19909" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I498:19909;2:4098" data-name="Lines">
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19909;2:4099" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19909;2:4101" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19909;2:4103" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19909;2:4105" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19909;2:4107" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="absolute content-stretch flex inset-[3.73%_15.56%] items-end justify-center" data-node-id="I498:19909;2:4109" data-name="Div Bar">
                      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[13px] relative" data-node-id="I498:19909;2:4110" data-name="Bar 1">
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I498:19909;2:4111" data-name="Bar 1" />
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[24px] relative" data-node-id="I498:19909;2:4112" data-name="Bar 2">
                        <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I498:19909;2:4113" data-name="Bar 1" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I498:19909;2:4114" data-name="Row">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I498:19909;2:4115">
                      Wed
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:19910" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I498:19910;2:4098" data-name="Lines">
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19910;2:4099" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19910;2:4101" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19910;2:4103" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19910;2:4105" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="I498:19910;2:4107" data-name="Row">
                      <div className="absolute inset-[0_-1.11%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow} />
                      </div>
                    </div>
                    <div className="absolute content-stretch flex inset-[3.73%_15.56%] items-end justify-center" data-node-id="I498:19910;2:4109" data-name="Div Bar">
                      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[26px] relative" data-node-id="I498:19910;2:4110" data-name="Bar 1">
                        <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I498:19910;2:4111" data-name="Bar 1" />
                      </div>
                      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-w-px overflow-clip pt-[64px] relative" data-node-id="I498:19910;2:4112" data-name="Bar 2">
                        <div className="bg-[#ffa257] flex-[1_0_0] min-h-px relative rounded-tl-[5px] rounded-tr-[5px] w-full" data-node-id="I498:19910;2:4113" data-name="Bar 1" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I498:19910;2:4114" data-name="Row">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I498:19910;2:4115">
                      Thu
                    </p>
                  </div>
                </div>
                <ChartColumn className="content-stretch flex flex-col gap-[8px] h-full items-center pb-[4px] relative rounded-[6px] shrink-0 w-[8px]" label="" type="Default" />
                <div className="[word-break:break-word] absolute bg-[#f6f6f7] content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex flex-col gap-[4px] items-start left-[146px] not-italic px-[10px] py-[8px] rounded-br-[10px] rounded-tl-[10px] rounded-tr-[10px] top-[-4px] whitespace-nowrap" data-node-id="498:19912" data-name="Tooltip">
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" dir="auto" data-node-id="498:19913">
                    Consumed
                  </p>
                  <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:19914" data-name="Info Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#52545b] text-[12px]" dir="auto" data-node-id="498:19915">
                      1,755
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" dir="auto" data-node-id="498:19916">
                      kcal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:19917" data-name="Widget Sleep Statistics">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="498:19918" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I498:19918;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I498:19918;2:4223">
                  Sleep Statistics
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I498:19918;2:4225" data-name="Right Section">
                <div className="bg-[#c2e66e] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I498:19918;2:4228" data-name="Button Picker">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I498:19918;2:4228;2:3326" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I498:19918;2:4228;2:3327">
                      Last 5 Days
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I498:19918;2:4228;2:3328" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I498:19918;2:4228;2:3329" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[20px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="498:19919" data-name="Body">
              <div className="content-stretch flex items-start justify-between pr-[8px] relative shrink-0 w-full" data-node-id="498:19920" data-name="Info Weights">
                <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="498:19921" data-name="Info Total Item">
                  <div className="bg-[#ffa257] h-[4px] relative rounded-[2px] shrink-0 w-[10px]" data-node-id="498:19922" />
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="498:19923">
                    Deep Sleep
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="498:19924" data-name="Info Total Item">
                  <div className="bg-[#ffcb65] h-[4px] relative rounded-[2px] shrink-0 w-[10px]" data-node-id="498:19925" />
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="498:19926">
                    Light Sleep
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="498:19927" data-name="Info Total Item">
                  <div className="bg-[#c2e66e] h-[4px] relative rounded-[2px] shrink-0 w-[10px]" data-node-id="498:19928" />
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="498:19929">
                    REM Phase
                  </p>
                </div>
                <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0" data-node-id="498:19930" data-name="Info Total Item">
                  <div className="bg-[#e1e1e2] h-[4px] relative rounded-[2px] shrink-0 w-[10px]" data-node-id="498:19931" />
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="498:19932">
                    Awake
                  </p>
                </div>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="498:19933" data-name="Chart">
                <div className="content-stretch flex flex-col gap-[8px] items-start pb-[4px] relative rounded-[6px] shrink-0" data-node-id="498:19934" data-name="Chart Column">
                  <div className="content-stretch flex flex-col h-[177px] items-start justify-between relative shrink-0" data-node-id="498:19935" data-name="Lines">
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="498:19936" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="498:19937">
                        9:00 PM
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="498:19938" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="498:19939">
                        11:00 PM
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="498:19940" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="498:19941">
                        1:00 AM
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="498:19942" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="498:19943">
                        3:00 AM
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="498:19944" data-name="Row">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="498:19945">
                        5:00 AM
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col h-[26px] items-center justify-center pr-[8px] relative shrink-0 w-[19px]" data-node-id="498:19946" data-name="Row" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:19948" data-name="Chart Column">
                  <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="498:19949" data-name="Lines">
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19950" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19952" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19954" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19956" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19958" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%+0.5px)] overflow-clip py-[6px] top-0" data-node-id="498:19960" data-name="Bars Stage">
                      <div className="bg-[#ffcb65] h-[20px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19961" data-name="Light" />
                      <div className="bg-[#ffa257] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19962" data-name="Deep" />
                      <div className="bg-[#c2e66e] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19963" data-name="REM" />
                      <div className="bg-[#ffa257] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19964" data-name="Deep" />
                      <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19965" data-name="Light" />
                      <div className="bg-[#c2e66e] h-[8px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19966" data-name="REM" />
                      <div className="bg-[#ffa257] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19967" data-name="Deep" />
                      <div className="bg-[#ffcb65] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19968" data-name="Light" />
                      <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="498:19969" data-name="Awake" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="498:19970" data-name="Row">
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="498:19971">
                      6h 45m
                    </p>
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="498:19972">
                      Sun
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:19973" data-name="Chart Column">
                  <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="498:19974" data-name="Lines">
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19975" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19977" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19979" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19981" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:19983" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%+0.5px)] overflow-clip py-[6px] top-0" data-node-id="498:19985" data-name="Bars Stage">
                      <div className="bg-[#e1e1e2] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19986" data-name="Awake" />
                      <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19987" data-name="Light" />
                      <div className="bg-[#c2e66e] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19988" data-name="REM" />
                      <div className="bg-[#ffa257] h-[13px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19989" data-name="Deep" />
                      <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19990" data-name="Light" />
                      <div className="bg-[#e1e1e2] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19991" data-name="Awake" />
                      <div className="bg-[#ffcb65] h-[17px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19992" data-name="Light" />
                      <div className="bg-[#ffa257] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19993" data-name="Deep" />
                      <div className="bg-[#c2e66e] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19994" data-name="REM" />
                      <div className="bg-[#ffcb65] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:19995" data-name="Light" />
                      <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="498:19996" data-name="Awake" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="498:19997" data-name="Row">
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="498:19998">
                      7h 25m
                    </p>
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="498:19999">
                      Mon
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20000" data-name="Chart Column">
                  <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="498:20001" data-name="Lines">
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20002" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20004" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20006" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20008" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20010" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%+0.5px)] overflow-clip py-[6px] top-0" data-node-id="498:20012" data-name="Bars Stage">
                      <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20013" data-name="Light" />
                      <div className="bg-[#ffa257] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20014" data-name="Deep" />
                      <div className="bg-[#c2e66e] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20015" data-name="REM" />
                      <div className="bg-[#ffcb65] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20016" data-name="Light" />
                      <div className="bg-[#e1e1e2] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20017" data-name="Awake" />
                      <div className="bg-[#ffcb65] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20018" data-name="Light" />
                      <div className="bg-[#ffa257] h-[24px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20019" data-name="Deep" />
                      <div className="bg-[#c2e66e] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20020" data-name="REM" />
                      <div className="bg-[#ffcb65] h-[20px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20021" data-name="Light" />
                      <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="498:20022" data-name="Awake" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="498:20023" data-name="Row">
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="498:20024">
                      7h 55m
                    </p>
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="498:20025">
                      Tue
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20026" data-name="Chart Column">
                  <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="498:20027" data-name="Lines">
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20028" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20030" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20032" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20034" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20036" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%+0.5px)] overflow-clip py-[6px] top-0" data-node-id="498:20038" data-name="Bars Stage">
                      <div className="bg-[#e1e1e2] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20039" data-name="Awake" />
                      <div className="bg-[#ffcb65] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20040" data-name="Light" />
                      <div className="bg-[#c2e66e] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20041" data-name="REM" />
                      <div className="bg-[#ffcb65] h-[22px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20042" data-name="Light" />
                      <div className="bg-[#ffa257] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20043" data-name="Deep" />
                      <div className="bg-[#c2e66e] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20044" data-name="REM" />
                      <div className="bg-[#ffa257] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20045" data-name="Deep" />
                      <div className="bg-[#ffcb65] h-[20px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20046" data-name="Light" />
                      <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="498:20047" data-name="Awake" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="498:20048" data-name="Row">
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="498:20049">
                      6h 0m
                    </p>
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="498:20050">
                      Wed
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20051" data-name="Chart Column">
                  <div className="content-stretch flex flex-col h-[177px] items-center justify-between relative shrink-0 w-full" data-node-id="498:20052" data-name="Lines">
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20053" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20055" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20057" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20059" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="h-[13px] relative shrink-0 w-full" data-node-id="498:20061" data-name="Row">
                      <div className="absolute inset-[0_-0.91%]">
                        <img alt="" className="block max-w-none size-full" src={imgRow1} />
                      </div>
                    </div>
                    <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col gap-[4px] items-center left-[calc(50%+0.5px)] overflow-clip py-[6px] top-0" data-node-id="498:20063" data-name="Bars Stage">
                      <div className="bg-[#ffcb65] h-[24px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20064" data-name="Light" />
                      <div className="bg-[#ffa257] h-[10px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20065" data-name="Deep" />
                      <div className="bg-[#e1e1e2] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20066" data-name="Awake" />
                      <div className="bg-[#c2e66e] h-[4px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20067" data-name="REM" />
                      <div className="bg-[#ffcb65] h-[18px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20068" data-name="Light" />
                      <div className="bg-[#c2e66e] h-[14px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20069" data-name="REM" />
                      <div className="bg-[#ffcb65] h-[6px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20070" data-name="Light" />
                      <div className="bg-[#ffa257] h-[22px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20071" data-name="Deep" />
                      <div className="bg-[#ffcb65] h-[12px] relative rounded-[4px] shrink-0 w-[40px]" data-node-id="498:20072" data-name="Light" />
                      <div className="bg-[#e1e1e2] flex-[1_0_0] min-h-px relative rounded-[4px] w-[40px]" data-node-id="498:20073" data-name="Awake" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[26px] items-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="498:20074" data-name="Row">
                    <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[9px] w-full" dir="auto" data-node-id="498:20075">
                      6h 50m
                    </p>
                    <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="498:20076">
                      Thu
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:20077" data-name="Widget Hydration">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="498:20078" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I498:20078;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I498:20078;2:4223">
                  Hydration
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I498:20078;2:4225" data-name="Right Section">
                <div className="bg-[#c2e66e] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I498:20078;2:4228" data-name="Button Picker">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I498:20078;2:4228;2:3326" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I498:20078;2:4228;2:3327">
                      This Week
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I498:20078;2:4228;2:3328" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I498:20078;2:4228;2:3329" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-h-px relative rounded-[16px] w-full" data-node-id="498:20079" data-name="Body">
              <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-node-id="498:20080" data-name="Top Row">
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[12px] shrink-0" data-node-id="498:20081" data-name="Info Detail">
                  <div className="h-[38px] relative shrink-0 w-[34px]" data-node-id="498:20082" data-name="Left Side">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLeftSide} />
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="498:20085" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center whitespace-nowrap" data-node-id="498:20086">
                      Hydration Level
                    </p>
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:20087" data-name="Value">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="498:20088">
                        Normal
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[12px] shrink-0" data-node-id="498:20090" data-name="Info Detail">
                  <div className="h-[38px] relative shrink-0 w-[34px]" data-node-id="498:20091" data-name="Left Side">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLeftSide1} />
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="498:20094" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] text-center whitespace-nowrap" data-node-id="498:20095">
                      Intake
                    </p>
                    <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="498:20096" data-name="Value">
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="498:20097">
                        2.0 L
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] items-center min-h-px relative w-full" data-node-id="498:20099" data-name="Body">
                <div className="absolute inset-[0_0_18.82%_0]" data-node-id="498:20100" data-name="Chart Area">
                  <div className="absolute inset-[0_-2.57%]">
                    <img alt="" className="block max-w-none size-full" src={imgChartArea} />
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20102" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I498:20102;2:4072" data-name="Lines">
                    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I498:20102;2:4073" data-name="Div Bar">
                      <div className="content-stretch flex flex-col items-center justify-end pt-[20px] relative shrink-0 w-full" data-node-id="I498:20102;2:4074" data-name="Amount">
                        <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I498:20102;2:4075">
                          <p className="leading-[1.35]" dir="auto">
                            100%
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I498:20102;2:4076" data-name="Bar 1" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I498:20102;2:4077" data-name="Row">
                    <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I498:20102;182:8758">
                      <p className="leading-[1.35]" dir="auto">
                        2.0 L
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I498:20102;2:4078">
                      Mon
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20103" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I498:20103;2:4072" data-name="Lines">
                    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[4px] isolate items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I498:20103;2:4073" data-name="Div Bar">
                      <div className="content-stretch flex flex-col items-center justify-end pt-[30px] relative shrink-0 w-full z-[2]" data-node-id="I498:20103;2:4074" data-name="Amount">
                        <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I498:20103;2:4075">
                          <p className="leading-[1.35]" dir="auto">
                            90%
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full z-[1]" data-node-id="I498:20103;2:4076" data-name="Bar 1" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I498:20103;2:4077" data-name="Row">
                    <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I498:20103;182:8758">
                      <p className="leading-[1.35]" dir="auto">
                        1.8 L
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I498:20103;2:4078">
                      Tue
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20104" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I498:20104;2:4072" data-name="Lines">
                    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I498:20104;2:4073" data-name="Div Bar">
                      <div className="content-stretch flex flex-col items-center justify-end pt-[10px] relative shrink-0 w-full" data-node-id="I498:20104;2:4074" data-name="Amount">
                        <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I498:20104;2:4075">
                          <p className="leading-[1.35]" dir="auto">
                            110%
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I498:20104;2:4076" data-name="Bar 1" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I498:20104;2:4077" data-name="Row">
                    <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I498:20104;182:8758">
                      <p className="leading-[1.35]" dir="auto">
                        2.2 L
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I498:20104;2:4078">
                      Wed
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20105" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I498:20105;2:4072" data-name="Lines">
                    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I498:20105;2:4073" data-name="Div Bar">
                      <div className="content-stretch flex flex-col items-center justify-end pt-[40px] relative shrink-0 w-full" data-node-id="I498:20105;2:4074" data-name="Amount">
                        <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I498:20105;2:4075">
                          <p className="leading-[1.35]" dir="auto">
                            80%
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I498:20105;2:4076" data-name="Bar 1" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I498:20105;2:4077" data-name="Row">
                    <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I498:20105;182:8758">
                      <p className="leading-[1.35]" dir="auto">
                        1.6 L
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I498:20105;2:4078">
                      Thu
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20106" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I498:20106;2:4072" data-name="Lines">
                    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I498:20106;2:4073" data-name="Div Bar">
                      <div className="content-stretch flex flex-col items-center justify-end pt-[20px] relative shrink-0 w-full" data-node-id="I498:20106;2:4074" data-name="Amount">
                        <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I498:20106;2:4075">
                          <p className="leading-[1.35]" dir="auto">
                            100%
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I498:20106;2:4076" data-name="Bar 1" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I498:20106;2:4077" data-name="Row">
                    <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I498:20106;182:8758">
                      <p className="leading-[1.35]" dir="auto">
                        2.0 L
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I498:20106;2:4078">
                      Fri
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20107" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I498:20107;2:4072" data-name="Lines">
                    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I498:20107;2:4073" data-name="Div Bar">
                      <div className="content-stretch flex flex-col items-center justify-end pt-[25px] relative shrink-0 w-full" data-node-id="I498:20107;2:4074" data-name="Amount">
                        <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I498:20107;2:4075">
                          <p className="leading-[1.35]" dir="auto">
                            95%
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I498:20107;2:4076" data-name="Bar 1" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I498:20107;2:4077" data-name="Row">
                    <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I498:20107;182:8758">
                      <p className="leading-[1.35]" dir="auto">
                        1.9 L
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I498:20107;2:4078">
                      Sat
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="498:20108" data-name="Chart Column">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px px-[6px] py-[4px] relative w-full" data-node-id="I498:20108;2:4072" data-name="Lines">
                    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-end min-h-px overflow-clip p-[6px] relative rounded-[12px] w-full" data-node-id="I498:20108;2:4073" data-name="Div Bar">
                      <div className="content-stretch flex flex-col items-center justify-end pt-[15px] relative shrink-0 w-full" data-node-id="I498:20108;2:4074" data-name="Amount">
                        <div className="[word-break:break-word] flex flex-col font-['Poppins:Regular'] justify-end leading-[0] not-italic relative shrink-0 text-[#8a8c90] text-[9px] text-center w-full" data-node-id="I498:20108;2:4075">
                          <p className="leading-[1.35]" dir="auto">
                            105%
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#ffcb65] flex-[1_0_0] min-h-px relative rounded-[8px] w-full" data-node-id="I498:20108;2:4076" data-name="Bar 1" />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col h-[22px] items-center justify-center not-italic relative shrink-0 text-[#8a8c90] text-center w-full" data-node-id="I498:20108;2:4077" data-name="Row">
                    <div className="flex flex-col font-['Poppins:SemiBold'] justify-end leading-[0] relative shrink-0 text-[10px] w-full" data-node-id="I498:20108;182:8758">
                      <p className="leading-[1.35]" dir="auto">
                        2.1 L
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[11px] w-full" dir="auto" data-node-id="I498:20108;2:4078">
                      Sun
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="498:18273" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="498:18274" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="498:18275">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="498:18276" data-name="Links">
              <p className="relative shrink-0" data-node-id="498:18277">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="498:18278">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="498:18279">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="498:18280" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="498:18281" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:18282" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:18283" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:18284" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="498:18285" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
