import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaGroceryBody } from '../FigmaGroceryBody';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/GroceryList";
const imgStateDefaultSizeMedium = `${assetPathPrefix}/54a7a.svg`;
const imgStateCheckedSizeMedium = `${assetPathPrefix}/b9ba0.svg`;
const imgIconSort = `${assetPathPrefix}/5ef2f.svg`;
const imgVector31 = `${assetPathPrefix}/c4a11.svg`;
const imgRow = `${assetPathPrefix}/00da0.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/22b1d.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/c1872.svg`;
const imgIconCaretUp = `${assetPathPrefix}/49e1d.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/ac21f.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/b7ca2.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/2b979.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown = `${assetPathPrefix}/20d58.svg`;
const imgIconCurrencyCircleDollar = `${assetPathPrefix}/a720a.svg`;
const imgIconSpecialCube = `${assetPathPrefix}/5226e.svg`;
const imgIconSpecialFire = `${assetPathPrefix}/e811d.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/8e5ed.svg`;
const imgDonut1 = `${assetPathPrefix}/586e2.svg`;
const imgDonut2 = `${assetPathPrefix}/f5e29.svg`;
const imgDonut3 = `${assetPathPrefix}/02140.svg`;
const imgDonut4 = `${assetPathPrefix}/875c6.svg`;
const imgDonut5 = `${assetPathPrefix}/7afad.svg`;
const imgDonut6 = `${assetPathPrefix}/11d89.svg`;
const imgSeparator = `${assetPathPrefix}/b94c5.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgIconMagnifyingGlass1 = `${assetPathPrefix}/843cb.svg`;
const imgIconFunnel = `${assetPathPrefix}/e3085.svg`;
const imgIconPlus = `${assetPathPrefix}/6e435.svg`;
const imgIconMinus = `${assetPathPrefix}/17afd.svg`;
const imgIconPlus1 = `${assetPathPrefix}/bf79d.svg`;
const imgCheckbox = `${assetPathPrefix}/3c3a7.svg`;
const imgIconCaretLeft = `${assetPathPrefix}/40729.svg`;
const imgIconCaretRight = `${assetPathPrefix}/27dfe.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type CheckboxProps = {
  className?: string;
  size?: "Medium";
  state?: "Default" | "Checked";
};

function Checkbox({ className, size = "Medium", state = "Default" }: CheckboxProps) {
  const isCheckedAndMedium = state === "Checked" && size === "Medium";
  return (
    <div className={className || "relative size-[16px]"} id={isCheckedAndMedium ? "node-2_3993" : "node-2_3991"}>
      <div className="absolute inset-[-6.25%]">
        <img alt="" className="block max-w-none size-full" src={isCheckedAndMedium ? imgStateCheckedSizeMedium : imgStateDefaultSizeMedium} />
      </div>
    </div>
  );
}

type BadgeStatusGroceryListProps = {
  className?: string;
  status?: "Purchased";
};

function BadgeStatusGroceryList({ className, status = "Purchased" }: BadgeStatusGroceryListProps) {
  return (
    <div className={className || "bg-[#dff9a2] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px]"} data-node-id="129:4548">
      <Checkbox className="relative shrink-0 size-[16px]" state="Checked" />
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] w-[60px]" data-node-id="129:4549">
        Comprado
      </p>
    </div>
  );
}

type BadgeCategoryGroceryListProps = {
  className?: string;
  status?: "Veggies";
};

function BadgeCategoryGroceryList({ className, status = "Veggies" }: BadgeCategoryGroceryListProps) {
  return (
    <div className={className || "bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px]"} data-node-id="129:4533">
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="129:4534">
        Verduras
      </p>
    </div>
  );
}

type TableRowGroceryListProps = {
  className?: string;
  type?: "Head";
};

function TableRowGroceryList({ className, type = "Head" }: TableRowGroceryListProps) {
  return (
    <div className={className || "bg-white content-stretch flex items-center justify-between px-[8px] py-[16px] relative w-[1166px]"} data-node-id="129:4451">
      <div className="content-stretch flex items-start relative shrink-0 w-[138px]" data-node-id="129:4452" data-name="Cell-Item Name">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4453">
          Artículo
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4454" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="129:4455" data-name="Cell-Category">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4456">
          Categoría
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4457" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[152px]" data-node-id="129:4458" data-name="Cell-Qty">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4459">
          Cant.
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4460" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[62px]" data-node-id="129:4461" data-name="Cell-Calories">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4462">
          Calorías
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4463" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[42px]" data-node-id="129:4464" data-name="Cell-Cost">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4465">
          Costo
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4466" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[52px]" data-node-id="129:4525" data-name="Cell-Actual">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4526">
          Real
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4527" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="129:4470" data-name="Cell-Status">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4471">
          Estado
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4472" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
    </div>
  );
}

type ItemListExpenseBreakdownProps = {
  className?: string;
  align?: "Default";
  amount?: string;
  categories?: string;
  percentage?: string;
};

function ItemListExpenseBreakdown({ className, align = "Default", amount = "12 items", categories = "Veggies", percentage = "30%" }: ItemListExpenseBreakdownProps) {
  return (
    <div className={className || "content-stretch flex gap-[12px] items-center relative w-[186px]"} data-node-id="127:3583">
      <div className="bg-[#c2e66e] h-[10px] relative rounded-[3px] shrink-0 w-[20px]" data-node-id="127:3576" />
      <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-node-id="127:3577" data-name="Main Info">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[11px]" data-node-id="127:3578">
          {categories}
        </p>
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="127:3579" data-name="Info Numbers">
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="127:3580">
            {amount}
          </p>
          <div className="h-0 relative shrink-0 w-[5px]" data-node-id="127:3639">
            <div className="absolute inset-[-0.5px_-10%]">
              <img alt="" className="block max-w-none size-full" src={imgVector31} />
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="127:3582">
            {percentage}
          </p>
        </div>
      </div>
    </div>
  );
}

type ChartColumnProps = {
  className?: string;
  label?: string;
  type?: "Y-labels" | "Single";
};

function ChartColumn({ className, label = "Jan", type = "Y-labels" }: ChartColumnProps) {
  const isSingle = type === "Single";
  const isYLabels = type === "Y-labels";
  return (
    <div className={className || `content-stretch flex flex-col gap-[8px] h-[186px] pb-[4px] relative rounded-[6px] ${isSingle ? "items-center w-[45px]" : "items-start"}`} id={isSingle ? "node-2_4055" : "node-2_4010"}>
      <div className={`content-stretch flex flex-[1_0_0] flex-col justify-between min-h-px relative ${isSingle ? "items-center w-full" : "items-start"}`} id={isSingle ? "node-2_4056" : "node-2_4011"} data-name="Lines">
        <div className={`h-[13px] relative shrink-0 ${isSingle ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isSingle ? "node-2_4057" : "node-2_4012"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4013">
              8K
            </p>
          )}
          {isSingle && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isSingle ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isSingle ? "node-2_4059" : "node-2_4014"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4015">
              8K
            </p>
          )}
          {isSingle && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isSingle ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isSingle ? "node-2_4061" : "node-2_4016"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4017">
              8K
            </p>
          )}
          {isSingle && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isSingle ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isSingle ? "node-2_4063" : "node-2_4018"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4019">
              8K
            </p>
          )}
          {isSingle && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        <div className={`h-[13px] relative shrink-0 ${isSingle ? "w-full" : "content-stretch flex flex-col items-center justify-center pr-[8px]"}`} id={isSingle ? "node-2_4065" : "node-2_4020"} data-name="Row">
          {isYLabels && (
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="2:4021">
              8K
            </p>
          )}
          {isSingle && (
            <div className="absolute inset-[0_-1.11%]">
              <img alt="" className="block max-w-none size-full" src={imgRow} />
            </div>
          )}
        </div>
        {isSingle && (
          <div className="-translate-x-1/2 absolute bottom-[3.73%] content-stretch flex items-end justify-center left-1/2 pt-[25px] top-[3.73%] w-[31px]" data-node-id="2:4067" data-name="Div Bar">
            <div className="bg-[#ffcb65] flex-[1_0_0] h-full min-w-px relative rounded-tl-[8px] rounded-tr-[8px]" data-node-id="2:4068" data-name="Bar 1" />
          </div>
        )}
      </div>
      <div className={`content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 ${isSingle ? "w-full" : "pr-[8px] w-[19px]"}`} id={isSingle ? "node-2_4069" : "node-2_4022"} data-name="Row">
        {isSingle && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="2:4070">
            {label}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Component19GroceryListDesktop() {
  const patientName = useFigmaPatientName();
  return (
    <div className="bg-white content-stretch flex items-start relative size-full" data-node-id="105:2472" data-name="19. Grocery List (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="105:2473" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I105:2473;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I105:2473;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I105:2473;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4501;2:3296">
                Calendario
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4505;2:3296">
                Mensajes
              </p>
            </div>
            <FigmaPatientUnreadBadge variant="nav" className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" nodeId="I105:2473;2:4505;2:3297" />
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4502;2:3296">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[2px] items-start justify-center p-[2px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;2:4503" data-name="Button Nav">
            <div className="content-stretch flex gap-[12px] items-center pb-[10px] pl-[14px] pr-[8px] pt-[8px] relative shrink-0 w-full" data-node-id="I105:2473;2:4503;302:7572" data-name="Menu">
              <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;2:4503;302:7573" data-name="Icon/Nav/SquaresFour">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
              </div>
              <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;2:4503;302:7574" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4503;302:7575">
                  Plan de comidas
                </p>
              </div>
              <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I105:2473;2:4503;302:7576" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I105:2473;2:4503;302:7577" data-name="Icon/CaretUp">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretUp} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex items-center pl-[56px] pr-[8px] py-[13px] relative rounded-[12px] shrink-0 w-full" data-node-id="I105:2473;2:4503;302:7578" data-name="SubMenu">
              <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I105:2473;2:4503;302:7579" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#52545b] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4503;302:7580">
                  Plan de comidas
                </p>
              </div>
            </div>
            <div className="bg-[#c2e66e] content-stretch flex items-center pl-[56px] pr-[8px] py-[13px] relative rounded-[12px] shrink-0 w-full" data-node-id="I105:2473;2:4503;302:7581" data-name="SubMenu">
              <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I105:2473;2:4503;302:7582" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4503;302:7583">
                  Lista de compras
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4504;2:3296">
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4506;2:3296">
                Progreso
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4509;2:3296">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;12:1059;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;12:1059;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;12:1059;2:3296">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I105:2473;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I105:2473;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I105:2473;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I105:2473;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I105:2473;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I105:2473;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4518;2:3335">
                Enviar mensaje
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I105:2473;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I105:2473;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I105:2473;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I105:2473;2:4519;2:3296">
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="105:2474" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="105:2475" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I105:2475;2:4459" data-name="Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="I105:2475;2:4460">
              Lista de compras
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I105:2475;2:4462" data-name="Header Menu">
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I105:2475;2:4463" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I105:2475;2:4463;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I105:2475;2:4464" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I105:2475;2:4464;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I105:2475;2:4464;2:3571" />
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I105:2475;2:4465" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I105:2475;2:4466" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I105:2475;2:4466;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I105:2475;2:4466;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I105:2475;2:4467" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I105:2475;2:4468">{patientName}</p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I105:2475;2:4469">
                  Miembro
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I105:2475;2:4470">
                <div className="bg-white content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I105:2475;2:4470;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <FigmaGroceryBody variant="desktop" />
      
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="105:2477" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="105:2478" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="105:2479">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="105:2480" data-name="Links">
              <p className="relative shrink-0" data-node-id="105:2481">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="105:2482">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="105:2483">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="105:2484" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2485" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2486" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2487" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2488" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="105:2489" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
