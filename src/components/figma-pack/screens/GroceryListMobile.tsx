import { FigmaGroceryBody } from '../FigmaGroceryBody';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/GroceryListMobile";
const imgStateDefaultSizeMedium = `${assetPathPrefix}/54a7a.svg`;
const imgStateCheckedSizeMedium = `${assetPathPrefix}/b9ba0.svg`;
const imgIconSort = `${assetPathPrefix}/5ef2f.svg`;
const imgVector31 = `${assetPathPrefix}/c4a11.svg`;
const imgRow = `${assetPathPrefix}/00da0.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconCurrencyCircleDollar = `${assetPathPrefix}/a720a.svg`;
const imgIconSpecialCube = `${assetPathPrefix}/5226e.svg`;
const imgIconSpecialFire = `${assetPathPrefix}/e811d.svg`;
const imgIconCaretDown = `${assetPathPrefix}/8e5ed.svg`;
const imgDonut1 = `${assetPathPrefix}/30d48.svg`;
const imgDonut2 = `${assetPathPrefix}/d0890.svg`;
const imgDonut3 = `${assetPathPrefix}/1f176.svg`;
const imgDonut4 = `${assetPathPrefix}/d7bba.svg`;
const imgDonut5 = `${assetPathPrefix}/08002.svg`;
const imgDonut6 = `${assetPathPrefix}/215b3.svg`;
const imgSeparator = `${assetPathPrefix}/b94c5.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconFadersHorizontal = `${assetPathPrefix}/b56ef.svg`;
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
  align?: "Vertical";
  amount?: string;
  categories?: string;
  percentage?: string;
};

function ItemListExpenseBreakdown({ className, align = "Vertical", amount = "12 items", categories = "Veggies", percentage = "30%" }: ItemListExpenseBreakdownProps) {
  return (
    <div className={className || "content-stretch flex gap-[12px] items-center relative w-[186px]"} data-node-id="492:12586">
      <div className="flex flex-row items-center self-stretch" data-node-id="492:12594">
        <div className="content-stretch flex flex-col h-full items-start py-[2px] relative shrink-0 w-[20px]" data-name="Left">
          <div className="bg-[#c2e66e] h-[10px] relative rounded-[3px] shrink-0 w-full" data-node-id="492:12587" />
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative" data-node-id="492:12588" data-name="Main Info">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="492:12589">
          {categories}
        </p>
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="492:12590" data-name="Info Numbers">
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="492:12591">
            {amount}
          </p>
          <div className="h-0 relative shrink-0 w-[5px]" data-node-id="492:12592">
            <div className="absolute inset-[-0.5px_-10%]">
              <img alt="" className="block max-w-none size-full" src={imgVector31} />
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="492:12593">
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

export default function Component21GroceryListMobile() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="492:11324" data-name="21. Grocery List (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="492:11325" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I492:11325;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I492:11325;427:15210" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I492:11325;433:18077">
          Lista de compras
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I492:11325;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I492:11325;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[32px] items-start overflow-clip py-[24px] relative shrink-0 w-full" data-node-id="492:11326" data-name="Content">
        <FigmaGroceryBody variant="mobile" />
      </div>
    </div>
  );
}
