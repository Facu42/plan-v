import { FigmaProgressBodyMap, FigmaProgressWeight, FigmaProgressPhotos, FigmaProgressMeasurements, FigmaProgressCalories, FigmaProgressSleep, FigmaProgressHydration } from '../FigmaProgress';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/ProgressMobile";
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
          Julio de 2028
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
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I498:18238;433:18077">
          Progreso
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
            <div className="h-[556px] overflow-clip relative shrink-0 w-full" data-node-id="498:18849" data-name="Image Area"><FigmaProgressBodyMap variant="mobile" /></div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:18956" data-name="Widget Weight Tracking"><FigmaProgressWeight /></div>
            <div className="content-stretch flex flex-col gap-[20px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="498:19010" data-name="Widget Progress Photos"><FigmaProgressPhotos /></div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[32px] items-start px-[16px] relative shrink-0 w-full" data-node-id="498:20327" data-name="Section Charts">
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:19888" data-name="Widget Calories Activities"><FigmaProgressCalories /></div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:19917" data-name="Widget Sleep Statistics"><FigmaProgressSleep /></div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] h-[304px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="498:20077" data-name="Widget Hydration"><FigmaProgressHydration /></div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="498:18273" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="498:18274" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="498:18275">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="498:18276" data-name="Links">
              <p className="relative shrink-0" data-node-id="498:18277">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="498:18278">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="498:18279">
                Contacto
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
