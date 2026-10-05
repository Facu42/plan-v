const assetPathPrefix = "https://www.figma.com/api/mcp/asset/906414d7-f12a-4992-ae83-b8f64a56cafa";
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
        Purchased
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
        Veggies
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
          Item Name
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4454" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="129:4455" data-name="Cell-Category">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4456">
          Category
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4457" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[152px]" data-node-id="129:4458" data-name="Cell-Qty">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4459">
          Qty
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4460" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[62px]" data-node-id="129:4461" data-name="Cell-Calories">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4462">
          Calories
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4463" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[42px]" data-node-id="129:4464" data-name="Cell-Cost">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4465">
          Cost
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4466" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[52px]" data-node-id="129:4525" data-name="Cell-Actual">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4526">
          Actual
        </p>
        <div className="relative shrink-0 size-[14px]" data-node-id="129:4527" data-name="Icon/Sort">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="129:4470" data-name="Cell-Status">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="129:4471">
          Status
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
            <div className="absolute inset-[6.25%]" data-node-id="I492:11325;427:15210;408:17493" data-name="symbol">
              <div className="absolute bg-[#c2e66e] inset-[53.57%_7.14%_-3.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I492:11325;427:15210;408:17494" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] inset-[-3.57%_7.14%_53.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I492:11325;427:15210;408:17495" data-name="Bowl" />
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I492:11325;433:18077">
          Grocery List
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I492:11325;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I492:11325;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[32px] items-start overflow-clip py-[24px] relative shrink-0 w-full" data-node-id="492:11326" data-name="Content">
        <div className="content-stretch flex flex-col gap-[20px] items-start px-[16px] relative shrink-0 w-full" data-node-id="492:11931" data-name="Section Data Chart">
          <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="492:11637" data-name="Section Statistics">
            <div className="bg-white content-stretch flex gap-[16px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:11638" data-name="Card Statistic - Grocery List">
              <div className="bg-[#c2e66e] content-stretch flex items-center p-[16px] relative rounded-[12px] shrink-0" data-node-id="I492:11638;116:2986" data-name="Icon">
                <div className="relative shrink-0 size-[20px]" data-node-id="I492:11638;116:2987" data-name="Icon/Special/ForkKnife">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCurrencyCircleDollar} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic relative" data-node-id="I492:11638;116:2992" data-name="Main Info">
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I492:11638;116:2600">
                  Estimated Cost
                </p>
                <div className="content-stretch flex gap-[4px] items-end relative shrink-0 w-full whitespace-nowrap" data-node-id="I492:11638;116:2603" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I492:11638;116:2601">
                    $157
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="I492:11638;116:2602">
                    ​
                  </p>
                </div>
              </div>
              <div className="bg-[#eeeeef] content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I492:11638;116:2991" data-name="Info Percentage">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I492:11638;116:2990">
                  +2.08%
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[16px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:11639" data-name="Card Statistic - Grocery List">
              <div className="bg-[#ffcb65] content-stretch flex items-center p-[16px] relative rounded-[12px] shrink-0" data-node-id="I492:11639;116:2986" data-name="Icon">
                <div className="relative shrink-0 size-[20px]" data-node-id="I492:11639;116:2987" data-name="Icon/Special/ForkKnife">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialCube} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic relative" data-node-id="I492:11639;116:2992" data-name="Main Info">
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I492:11639;116:2600">
                  Total Items
                </p>
                <div className="content-stretch flex gap-[4px] items-end relative shrink-0 w-full whitespace-nowrap" data-node-id="I492:11639;116:2603" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I492:11639;116:2601">
                    40
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="I492:11639;116:2602">
                    ​
                  </p>
                </div>
              </div>
              <div className="bg-[#eeeeef] content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I492:11639;116:2991" data-name="Info Percentage">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I492:11639;116:2990">
                  +10.2%
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[16px] items-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:11640" data-name="Card Statistic - Grocery List">
              <div className="bg-[#ffa257] content-stretch flex items-center p-[16px] relative rounded-[12px] shrink-0" data-node-id="I492:11640;116:2986" data-name="Icon">
                <div className="relative shrink-0 size-[20px]" data-node-id="I492:11640;116:2987" data-name="Icon/Special/ForkKnife">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic relative" data-node-id="I492:11640;116:2992" data-name="Main Info">
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="I492:11640;116:2600">
                  Total Calories
                </p>
                <div className="content-stretch flex gap-[4px] items-end relative shrink-0 w-full whitespace-nowrap" data-node-id="I492:11640;116:2603" data-name="Info Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="I492:11640;116:2601">
                    21,615
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="I492:11640;116:2602">
                    kcal
                  </p>
                </div>
              </div>
              <div className="bg-[#ffe1c9] content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I492:11640;116:2991" data-name="Info Percentage">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#52545b] text-[11px] whitespace-nowrap" data-node-id="I492:11640;116:2990">
                  -3.56%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col gap-[16px] h-[244px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:11672" data-name="Widget Expense Overview">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="492:11673" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I492:11673;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I492:11673;2:4223">
                  Expense Overview
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I492:11673;2:4225" data-name="Right Section">
                <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:11673;2:4228" data-name="Button Picker">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I492:11673;2:4228;2:3476" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:11673;2:4228;2:3477">
                      Last 7 Months
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I492:11673;2:4228;2:3478" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:11673;2:4228;2:3479" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-h-px relative w-full" data-node-id="492:11674" data-name="Body">
              <div className="content-stretch flex flex-col gap-[8px] h-full items-start pb-[4px] relative rounded-[6px] shrink-0" data-node-id="492:11675" data-name="Chart Column">
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px relative" data-node-id="I492:11675;2:4011" data-name="Lines">
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I492:11675;2:4012" data-name="Row">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I492:11675;2:4013">
                      $600
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I492:11675;2:4014" data-name="Row">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I492:11675;2:4015">
                      $450
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I492:11675;2:4016" data-name="Row">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I492:11675;2:4017">
                      $300
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I492:11675;2:4018" data-name="Row">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I492:11675;2:4019">
                      $150
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0" data-node-id="I492:11675;2:4020" data-name="Row">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" dir="auto" data-node-id="I492:11675;2:4021">
                      $0
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col h-[13px] items-center justify-center pr-[8px] relative shrink-0 w-[19px]" data-node-id="I492:11675;2:4022" data-name="Row" />
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="492:11677" data-name="Chart Column">
                <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I492:11677;2:4056" data-name="Lines">
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11677;2:4057" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11677;2:4059" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11677;2:4061" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11677;2:4063" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11677;2:4065" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="-translate-x-1/2 absolute bottom-[3.73%] content-stretch flex items-end justify-center left-1/2 pt-[34px] top-[3.73%] w-[31px]" data-node-id="I492:11677;2:4067" data-name="Div Bar">
                    <div className="bg-[#ffcb65] flex-[1_0_0] h-full min-w-px relative rounded-tl-[8px] rounded-tr-[8px]" data-node-id="I492:11677;2:4068" data-name="Bar 1" />
                  </div>
                </div>
                <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I492:11677;2:4069" data-name="Row">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I492:11677;2:4070">
                    Feb
                  </p>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="492:11678" data-name="Chart Column">
                <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I492:11678;2:4056" data-name="Lines">
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11678;2:4057" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11678;2:4059" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11678;2:4061" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11678;2:4063" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11678;2:4065" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="-translate-x-1/2 absolute bottom-[3.73%] content-stretch flex items-end justify-center left-1/2 pt-[46px] top-[3.73%] w-[31px]" data-node-id="I492:11678;2:4067" data-name="Div Bar">
                    <div className="bg-[#ffcb65] flex-[1_0_0] h-full min-w-px relative rounded-tl-[8px] rounded-tr-[8px]" data-node-id="I492:11678;2:4068" data-name="Bar 1" />
                  </div>
                </div>
                <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I492:11678;2:4069" data-name="Row">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I492:11678;2:4070">
                    Mar
                  </p>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="492:11679" data-name="Chart Column">
                <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I492:11679;2:4056" data-name="Lines">
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11679;2:4057" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11679;2:4059" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11679;2:4061" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11679;2:4063" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11679;2:4065" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="-translate-x-1/2 absolute bottom-[3.73%] content-stretch flex items-end justify-center left-1/2 pt-[28px] top-[3.73%] w-[31px]" data-node-id="I492:11679;2:4067" data-name="Div Bar">
                    <div className="bg-[#ffcb65] flex-[1_0_0] h-full min-w-px relative rounded-tl-[8px] rounded-tr-[8px]" data-node-id="I492:11679;2:4068" data-name="Bar 1" />
                  </div>
                </div>
                <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I492:11679;2:4069" data-name="Row">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I492:11679;2:4070">
                    Apr
                  </p>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="492:11680" data-name="Chart Column">
                <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I492:11680;2:4056" data-name="Lines">
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11680;2:4057" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11680;2:4059" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11680;2:4061" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11680;2:4063" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11680;2:4065" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="-translate-x-1/2 absolute bottom-[3.73%] content-stretch flex items-end justify-center left-1/2 pt-[14px] top-[3.73%] w-[31px]" data-node-id="I492:11680;2:4067" data-name="Div Bar">
                    <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-tl-[8px] rounded-tr-[8px]" data-node-id="I492:11680;2:4068" data-name="Bar 1" />
                  </div>
                </div>
                <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I492:11680;2:4069" data-name="Row">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I492:11680;2:4070">
                    May
                  </p>
                </div>
              </div>
              <ChartColumn className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" label="Jun" type="Single" />
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="492:11682" data-name="Chart Column">
                <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I492:11682;2:4056" data-name="Lines">
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11682;2:4057" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11682;2:4059" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11682;2:4061" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11682;2:4063" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11682;2:4065" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="-translate-x-1/2 absolute bottom-[3.73%] content-stretch flex items-end justify-center left-1/2 pt-[45px] top-[3.73%] w-[31px]" data-node-id="I492:11682;2:4067" data-name="Div Bar">
                    <div className="bg-[#ffcb65] flex-[1_0_0] h-full min-w-px relative rounded-tl-[8px] rounded-tr-[8px]" data-node-id="I492:11682;2:4068" data-name="Bar 1" />
                  </div>
                </div>
                <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I492:11682;2:4069" data-name="Row">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I492:11682;2:4070">
                    Jul
                  </p>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] h-full items-center min-w-px pb-[4px] relative rounded-[6px]" data-node-id="492:11683" data-name="Chart Column">
                <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px relative w-full" data-node-id="I492:11683;2:4056" data-name="Lines">
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11683;2:4057" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11683;2:4059" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11683;2:4061" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11683;2:4063" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="h-[13px] relative shrink-0 w-full" data-node-id="I492:11683;2:4065" data-name="Row">
                    <div className="absolute inset-[0_-1.11%]">
                      <img alt="" className="block max-w-none size-full" src={imgRow} />
                    </div>
                  </div>
                  <div className="-translate-x-1/2 absolute bottom-[3.73%] content-stretch flex items-end justify-center left-1/2 pt-[31px] top-[3.73%] w-[31px]" data-node-id="I492:11683;2:4067" data-name="Div Bar">
                    <div className="bg-[#ffcb65] flex-[1_0_0] h-full min-w-px relative rounded-tl-[8px] rounded-tr-[8px]" data-node-id="I492:11683;2:4068" data-name="Bar 1" />
                  </div>
                </div>
                <div className="content-stretch flex flex-col h-[13px] items-center justify-center relative shrink-0 w-full" data-node-id="I492:11683;2:4069" data-name="Row">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center w-full" dir="auto" data-node-id="I492:11683;2:4070">
                    Aug
                  </p>
                </div>
              </div>
              <div className="[word-break:break-word] absolute bg-[#f6f6f7] content-stretch drop-shadow-[0px_4px_6px_rgba(176,176,176,0.14)] flex flex-col gap-[4px] items-center left-[147px] not-italic px-[10px] py-[8px] rounded-[10px] top-[-20px] whitespace-nowrap" data-node-id="492:11688" data-name="Tooltip">
                <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" dir="auto" data-node-id="492:11689">
                  May 2028
                </p>
                <p className="font-['Poppins:SemiBold'] leading-[1.3] relative shrink-0 text-[#52545b] text-[12px]" dir="auto" data-node-id="492:11690">
                  $530
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col gap-[16px] h-[342px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:12080" data-name="Widget Expense Breakdown">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="492:12081" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I492:12081;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I492:12081;2:4223">
                  Expense Breakdown
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I492:12081;2:4225" data-name="Right Section">
                <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12081;2:4228" data-name="Button Picker">
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I492:12081;2:4228;2:3476" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12081;2:4228;2:3477">
                      This Week
                    </p>
                  </div>
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I492:12081;2:4228;2:3478" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:12081;2:4228;2:3479" data-name="Icon/CaretDown">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] gap-[24px] items-center min-h-px pl-[4px] relative w-full" data-node-id="492:12082" data-name="Body">
              <div className="relative shrink-0 size-[182px]" data-node-id="492:12083" data-name="Chart">
                <div className="absolute inset-[0_-0.66%_0_0.66%]" data-node-id="492:12084" data-name="Donut 1">
                  <div className="absolute bottom-[38.36%] left-1/2 right-0 top-[0.13%]">
                    <img alt="" className="block max-w-none size-full" src={imgDonut1} />
                  </div>
                </div>
                <div className="absolute inset-[0_-0.66%_0_0.66%]" data-node-id="492:12085" data-name="Donut 2">
                  <div className="absolute inset-[62.03%_3.39%_0_38.34%]">
                    <img alt="" className="block max-w-none size-full" src={imgDonut2} />
                  </div>
                </div>
                <div className="absolute inset-[0_-0.66%_0_0.66%]" data-node-id="492:12086" data-name="Donut 3">
                  <div className="absolute inset-[57.35%_62.02%_3.39%_1.54%]">
                    <img alt="" className="block max-w-none size-full" src={imgDonut3} />
                  </div>
                </div>
                <div className="absolute inset-[0_-0.66%_0_0.66%]" data-node-id="492:12087" data-name="Donut 4">
                  <div className="absolute inset-[17.03%_77.5%_44.39%_0]">
                    <img alt="" className="block max-w-none size-full" src={imgDonut4} />
                  </div>
                </div>
                <div className="absolute inset-[0_-0.66%_0_0.66%]" data-node-id="492:12088" data-name="Donut 5">
                  <div className="absolute inset-[4.47%_64.1%_77.7%_17.34%]">
                    <img alt="" className="block max-w-none size-full" src={imgDonut5} />
                  </div>
                </div>
                <div className="absolute inset-[0_-0.66%_0_0.66%]" data-node-id="492:12089" data-name="Donut 6">
                  <div className="absolute inset-[0.42%_52.46%_85%_35.49%]">
                    <img alt="" className="block max-w-none size-full" src={imgDonut6} />
                  </div>
                </div>
                <div className="-translate-y-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[4px] items-center left-[13.29%] not-italic right-[12.59%] top-[calc(50%+0.24px)] whitespace-nowrap" data-node-id="492:12090" data-name="Info Current Weight">
                  <div className="content-stretch flex gap-[2px] items-baseline leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="492:12091" data-name="Current Weight">
                    <p className="font-['Poppins:Regular'] relative shrink-0" data-node-id="492:12092">
                      $
                    </p>
                    <p className="font-['Poppins:SemiBold'] relative shrink-0" data-node-id="492:12093">
                      157
                    </p>
                  </div>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="492:12094">
                    Total Expense
                  </p>
                </div>
              </div>
              <div className="content-stretch flex flex-col h-full items-start justify-between py-[4px] relative shrink-0" data-node-id="492:12095" data-name="List Expense Breakdown">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="492:12096" data-name="Item List Expense Breakdown">
                  <div className="flex flex-row items-center self-stretch" data-node-id="I492:12096;489:11765">
                    <div className="content-stretch flex h-full items-start py-[2px] relative shrink-0 w-[10px]" data-name="Left">
                      <div className="bg-[#c2e66e] flex-[1_0_0] h-[10px] min-w-px relative rounded-[4px]" data-node-id="I492:12096;489:11758" data-name="Color Categories" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0" data-node-id="I492:12096;489:11759" data-name="Main Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12096;489:11760">
                      Protein
                    </p>
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12096;489:11761" data-name="Info Numbers">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12096;489:11762">
                        $47.10
                      </p>
                      <div className="relative shrink-0 size-[3px]" data-node-id="I492:12096;489:11763" data-name="Separator">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSeparator} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12096;489:11764">
                        30%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="492:12097" data-name="Item List Expense Breakdown">
                  <div className="flex flex-row items-center self-stretch" data-node-id="I492:12097;489:11765">
                    <div className="content-stretch flex h-full items-start py-[2px] relative shrink-0 w-[10px]" data-name="Left">
                      <div className="bg-[#ffcb65] flex-[1_0_0] h-[10px] min-w-px relative rounded-[4px]" data-node-id="I492:12097;489:11758" data-name="Color Categories" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0" data-node-id="I492:12097;489:11759" data-name="Main Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12097;489:11760">
                      Grains
                    </p>
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12097;489:11761" data-name="Info Numbers">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12097;489:11762">
                        $39.25
                      </p>
                      <div className="relative shrink-0 size-[3px]" data-node-id="I492:12097;489:11763" data-name="Separator">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSeparator} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12097;489:11764">
                        25%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="492:12098" data-name="Item List Expense Breakdown">
                  <div className="flex flex-row items-center self-stretch" data-node-id="I492:12098;489:11765">
                    <div className="content-stretch flex h-full items-start py-[2px] relative shrink-0 w-[10px]" data-name="Left">
                      <div className="bg-[#ffa257] flex-[1_0_0] h-[10px] min-w-px relative rounded-[4px]" data-node-id="I492:12098;489:11758" data-name="Color Categories" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0" data-node-id="I492:12098;489:11759" data-name="Main Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12098;489:11760">
                      Fruits
                    </p>
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12098;489:11761" data-name="Info Numbers">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12098;489:11762">
                        $28.26
                      </p>
                      <div className="relative shrink-0 size-[3px]" data-node-id="I492:12098;489:11763" data-name="Separator">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSeparator} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12098;489:11764">
                        18%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="492:12099" data-name="Item List Expense Breakdown">
                  <div className="flex flex-row items-center self-stretch" data-node-id="I492:12099;489:11765">
                    <div className="content-stretch flex h-full items-start py-[2px] relative shrink-0 w-[10px]" data-name="Left">
                      <div className="bg-[#ffbe8a] flex-[1_0_0] h-[10px] min-w-px relative rounded-[4px]" data-node-id="I492:12099;489:11758" data-name="Color Categories" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0" data-node-id="I492:12099;489:11759" data-name="Main Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12099;489:11760">
                      Veggies
                    </p>
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12099;489:11761" data-name="Info Numbers">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12099;489:11762">
                        $23.55
                      </p>
                      <div className="relative shrink-0 size-[3px]" data-node-id="I492:12099;489:11763" data-name="Separator">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSeparator} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12099;489:11764">
                        15%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="492:12100" data-name="Item List Expense Breakdown">
                  <div className="flex flex-row items-center self-stretch" data-node-id="I492:12100;489:11765">
                    <div className="content-stretch flex h-full items-start py-[2px] relative shrink-0 w-[10px]" data-name="Left">
                      <div className="bg-[#ffe1c9] flex-[1_0_0] h-[10px] min-w-px relative rounded-[4px]" data-node-id="I492:12100;489:11758" data-name="Color Categories" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0" data-node-id="I492:12100;489:11759" data-name="Main Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12100;489:11760">
                      Dairy
                    </p>
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12100;489:11761" data-name="Info Numbers">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12100;489:11762">
                        $10.99
                      </p>
                      <div className="relative shrink-0 size-[3px]" data-node-id="I492:12100;489:11763" data-name="Separator">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSeparator} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12100;489:11764">
                        7%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="492:12101" data-name="Item List Expense Breakdown">
                  <div className="flex flex-row items-center self-stretch" data-node-id="I492:12101;489:11765">
                    <div className="content-stretch flex h-full items-start py-[2px] relative shrink-0 w-[10px]" data-name="Left">
                      <div className="bg-[#e1e1e2] flex-[1_0_0] h-[10px] min-w-px relative rounded-[4px]" data-node-id="I492:12101;489:11758" data-name="Color Categories" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0" data-node-id="I492:12101;489:11759" data-name="Main Info">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12101;489:11760">
                      Others
                    </p>
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12101;489:11761" data-name="Info Numbers">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12101;489:11762">
                        $7.85
                      </p>
                      <div className="relative shrink-0 size-[3px]" data-node-id="I492:12101;489:11763" data-name="Separator">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSeparator} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12101;489:11764">
                        5%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex flex-col gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:12253" data-name="Widget Grocery Category">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="492:12254" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I492:12254;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I492:12254;2:4223">
                  Grocery Category
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I492:12254;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I492:12254;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I492:12254;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[20px] items-start pb-[8px] relative shrink-0 w-full" data-node-id="492:12255" data-name="Body">
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="492:12256" data-name="Head Info">
                <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="492:12257" data-name="Info Total Item">
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="492:12258">
                    Total
                  </p>
                  <div className="content-stretch flex gap-[4px] items-baseline relative shrink-0" data-node-id="492:12259" data-name="Current Weight">
                    <p className="font-['Poppins:SemiBold'] leading-[1.08] relative shrink-0 text-[#272932] text-[22px]" data-node-id="492:12260">
                      40
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.25] relative shrink-0 text-[#8a8c90] text-[14px]" data-node-id="492:12261">
                      Items
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-node-id="492:12262" data-name="Chart Bar">
                  <div className="bg-[#c2e66e] h-[10px] relative rounded-[4px] shrink-0 w-[93px]" data-node-id="492:12263" data-name="Bar 1" />
                  <div className="bg-[#ffcb65] h-[10px] relative rounded-[4px] shrink-0 w-[77.5px]" data-node-id="492:12264" data-name="Bar 2" />
                  <div className="bg-[#ffa257] h-[10px] relative rounded-[4px] shrink-0 w-[62px]" data-node-id="492:12265" data-name="Bar 3" />
                  <div className="bg-[#ffbe8a] h-[10px] relative rounded-[4px] shrink-0 w-[46.5px]" data-node-id="492:12266" data-name="Bar 4" />
                  <div className="bg-[#ffe1c9] h-[10px] relative rounded-[4px] shrink-0 w-[15.5px]" data-node-id="492:12267" data-name="Bar 5" />
                  <div className="bg-[#eeeeef] h-[10px] relative rounded-[4px] shrink-0 w-[15.5px]" data-node-id="492:12268" data-name="Bar 6" />
                </div>
              </div>
              <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="492:12269" data-name="List Expense Breakdown">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="492:12643" data-name="Column Left">
                  <ItemListExpenseBreakdown categories="Grains" className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" />
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="492:12271" data-name="Item List Expense Breakdown">
                    <div className="flex flex-row items-center self-stretch" data-node-id="I492:12271;492:12594">
                      <div className="content-stretch flex flex-col h-full items-start py-[2px] relative shrink-0 w-[20px]" data-name="Left">
                        <div className="bg-[#ffcb65] h-[10px] relative rounded-[3px] shrink-0 w-full" data-node-id="I492:12271;492:12587" />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative" data-node-id="I492:12271;492:12588" data-name="Main Info">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12271;492:12589">
                        Veggies
                      </p>
                      <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12271;492:12590" data-name="Info Numbers">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12271;492:12591">
                          10 items
                        </p>
                        <div className="h-0 relative shrink-0 w-[5px]" data-node-id="I492:12271;492:12592">
                          <div className="absolute inset-[-0.5px_-10%]">
                            <img alt="" className="block max-w-none size-full" src={imgVector31} />
                          </div>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12271;492:12593">
                          25%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="492:12272" data-name="Item List Expense Breakdown">
                    <div className="flex flex-row items-center self-stretch" data-node-id="I492:12272;492:12594">
                      <div className="content-stretch flex flex-col h-full items-start py-[2px] relative shrink-0 w-[20px]" data-name="Left">
                        <div className="bg-[#ffa257] h-[10px] relative rounded-[3px] shrink-0 w-full" data-node-id="I492:12272;492:12587" />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative" data-node-id="I492:12272;492:12588" data-name="Main Info">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12272;492:12589">
                        Protein
                      </p>
                      <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12272;492:12590" data-name="Info Numbers">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12272;492:12591">
                          8 items
                        </p>
                        <div className="h-0 relative shrink-0 w-[5px]" data-node-id="I492:12272;492:12592">
                          <div className="absolute inset-[-0.5px_-10%]">
                            <img alt="" className="block max-w-none size-full" src={imgVector31} />
                          </div>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12272;492:12593">
                          20%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="492:12669" data-name="Column Right">
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="492:12273" data-name="Item List Expense Breakdown">
                    <div className="flex flex-row items-center self-stretch" data-node-id="I492:12273;492:12594">
                      <div className="content-stretch flex flex-col h-full items-start py-[2px] relative shrink-0 w-[20px]" data-name="Left">
                        <div className="bg-[#ffbe8a] h-[10px] relative rounded-[3px] shrink-0 w-full" data-node-id="I492:12273;492:12587" />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative" data-node-id="I492:12273;492:12588" data-name="Main Info">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12273;492:12589">
                        Fruits
                      </p>
                      <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12273;492:12590" data-name="Info Numbers">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12273;492:12591">
                          6 items
                        </p>
                        <div className="h-0 relative shrink-0 w-[5px]" data-node-id="I492:12273;492:12592">
                          <div className="absolute inset-[-0.5px_-10%]">
                            <img alt="" className="block max-w-none size-full" src={imgVector31} />
                          </div>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12273;492:12593">
                          15%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="492:12274" data-name="Item List Expense Breakdown">
                    <div className="flex flex-row items-center self-stretch" data-node-id="I492:12274;492:12594">
                      <div className="content-stretch flex flex-col h-full items-start py-[2px] relative shrink-0 w-[20px]" data-name="Left">
                        <div className="bg-[#ffe1c9] h-[10px] relative rounded-[3px] shrink-0 w-full" data-node-id="I492:12274;492:12587" />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative" data-node-id="I492:12274;492:12588" data-name="Main Info">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12274;492:12589">
                        Dairy
                      </p>
                      <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12274;492:12590" data-name="Info Numbers">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12274;492:12591">
                          2 items
                        </p>
                        <div className="h-0 relative shrink-0 w-[5px]" data-node-id="I492:12274;492:12592">
                          <div className="absolute inset-[-0.5px_-10%]">
                            <img alt="" className="block max-w-none size-full" src={imgVector31} />
                          </div>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12274;492:12593">
                          5%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-node-id="492:12275" data-name="Item List Expense Breakdown">
                    <div className="flex flex-row items-center self-stretch" data-node-id="I492:12275;492:12594">
                      <div className="content-stretch flex flex-col h-full items-start py-[2px] relative shrink-0 w-[20px]" data-name="Left">
                        <div className="bg-[#e1e1e2] h-[10px] relative rounded-[3px] shrink-0 w-full" data-node-id="I492:12275;492:12587" />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px relative" data-node-id="I492:12275;492:12588" data-name="Main Info">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] min-w-full not-italic relative shrink-0 text-[#272932] text-[11px] w-[min-content]" data-node-id="I492:12275;492:12589">
                        Others
                      </p>
                      <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I492:12275;492:12590" data-name="Info Numbers">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I492:12275;492:12591">
                          2 items
                        </p>
                        <div className="h-0 relative shrink-0 w-[5px]" data-node-id="I492:12275;492:12592">
                          <div className="absolute inset-[-0.5px_-10%]">
                            <img alt="" className="block max-w-none size-full" src={imgVector31} />
                          </div>
                        </div>
                        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12275;492:12593">
                          5%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-start px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="492:12688" data-name="Widget Grocery list">
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="492:12689" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="492:12690" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="492:12691">
                Grocery List
              </p>
            </div>
            <div className="content-stretch flex flex-col items-end relative shrink-0 w-full" data-node-id="492:12693" data-name="Right Section">
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-node-id="492:12694" data-name="Left">
                <div className="bg-white content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px px-[8px] py-[6px] relative rounded-[8px]" data-node-id="492:12695" data-name="Input-search">
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I492:12695;2:3947" data-name="Icon">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:12695;2:3948" data-name="Icon/MagnifyingGlass">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I492:12695;2:3949" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12695;2:3950">
                      Search item
                    </p>
                  </div>
                </div>
                <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="492:12696" data-name="Button Picker">
                  <div className="relative shrink-0 size-[18px]" data-node-id="I492:12696;2:3578" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFadersHorizontal} />
                  </div>
                </div>
                <div className="bg-[#c2e66e] content-stretch flex gap-[4px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="492:13170" data-name="Button CTA">
                  <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I492:13170;2:3314" data-name="Icon Left">
                    <div className="relative shrink-0 size-[14px]" data-node-id="I492:13170;2:3315" data-name="Icon/CalendarBlank">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                    </div>
                  </div>
                  <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I492:13170;2:3316" data-name="Text">
                    <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:13170;2:3317">
                      Add Item
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="492:12702" data-name="Section Table">
            <div className="content-stretch flex items-center pr-[4px] relative shrink-0 w-full" data-node-id="492:12703" data-name="Top Section">
              <div className="content-stretch flex items-start relative shrink-0" data-node-id="492:12704" data-name="Tab">
                <div className="bg-white content-stretch flex flex-col items-start px-[8px] py-[6px] relative rounded-tl-[12px] rounded-tr-[12px] shrink-0" data-node-id="492:12705" data-name="Item Tab">
                  <div className="content-stretch flex items-center justify-center px-[16px] py-[6px] relative shrink-0" data-node-id="492:12706" data-name="Button">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12706;2:3551" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12706;2:3552">
                        All Categories
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start pl-[32px] pr-[40px] py-[6px] relative shrink-0" data-node-id="492:12707" data-name="Item Tab">
                  <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="492:12708" data-name="Button">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12708;2:3551" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12708;2:3552">
                        Grains
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start pr-[40px] py-[6px] relative shrink-0" data-node-id="492:12709" data-name="Item Tab">
                  <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="492:12710" data-name="Button">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12710;2:3551" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12710;2:3552">
                        Fruits
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start pr-[40px] py-[6px] relative shrink-0" data-node-id="492:12711" data-name="Item Tab">
                  <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="492:12712" data-name="Button">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12712;2:3551" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12712;2:3552">
                        Veggies
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start pr-[40px] py-[6px] relative shrink-0" data-node-id="492:12713" data-name="Item Tab">
                  <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="492:12714" data-name="Button">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12714;2:3551" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12714;2:3552">
                        Protein
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start pr-[40px] py-[6px] relative shrink-0" data-node-id="492:12715" data-name="Item Tab">
                  <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="492:12716" data-name="Button">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12716;2:3551" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12716;2:3552">
                        Dairy
                      </p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start pr-[40px] py-[6px] relative shrink-0" data-node-id="492:12717" data-name="Item Tab">
                  <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="492:12718" data-name="Button">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12718;2:3551" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12718;2:3552">
                        Others
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col items-start overflow-clip pl-[16px] py-[8px] relative shrink-0 w-full" data-node-id="492:12719" data-name="Table">
              <TableRowGroceryList className="bg-white content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" />
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12721" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12721;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12721;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12721;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12721;129:4477">
                    Oats
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12721;129:4478" data-name="Cell-Category">
                  <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12721;129:4544" data-name="Badge Category - Grocery List">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:12721;129:4544;129:4532">
                      Grains
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12721;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12721;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12721;129:4481">
                      500
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12721;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12721;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12721;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12721;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12721;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12721;129:4482">
                    gr
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12721;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12721;129:4484">
                    1900
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12721;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12721;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12721;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12721;129:4487">
                    0.60
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[52px] whitespace-nowrap" data-node-id="I492:12721;129:4522" data-name="Cell-Actual">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12721;129:4523">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12721;129:4524">
                    3
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12721;129:4492" data-name="Cell-Status">
                  <BadgeStatusGroceryList className="bg-[#dff9a2] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" />
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12722" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12722;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12722;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12722;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12722;129:4477">
                    Almond Butter
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12722;129:4478" data-name="Cell-Category">
                  <div className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12722;129:4544" data-name="Badge Category - Grocery List">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:12722;129:4544;129:4543">
                      Others
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12722;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12722;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12722;129:4481">
                      1
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12722;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12722;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12722;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12722;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12722;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12722;129:4482">
                    Jar
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12722;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12722;129:4484">
                    1600
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12722;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12722;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12722;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12722;129:4487">
                    5
                  </p>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-[52px]" data-node-id="I492:12722;129:4522" data-name="Cell-Actual">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12722;129:4524">
                    -
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12722;129:4492" data-name="Cell-Status">
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12722;129:4563" data-name="Badge Status - Grocery List">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I492:12722;129:4563;133:6604" data-name="Checkbox">
                      <div className="absolute inset-[-6.25%]">
                        <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] w-[60px]" data-node-id="I492:12722;129:4563;129:4553">
                      Pending
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12723" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12723;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12723;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12723;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12723;129:4477">
                    Berries
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12723;129:4478" data-name="Cell-Category">
                  <div className="bg-[#ffbe8a] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12723;129:4544" data-name="Badge Category - Grocery List">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:12723;129:4544;129:4538">
                      Fruits
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12723;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12723;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12723;129:4481">
                      200
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12723;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12723;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12723;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12723;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12723;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12723;129:4482">
                    gr
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12723;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12723;129:4484">
                    120
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12723;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12723;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12723;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12723;129:4487">
                    2
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[52px] whitespace-nowrap" data-node-id="I492:12723;129:4522" data-name="Cell-Actual">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12723;129:4523">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12723;129:4524">
                    4
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12723;129:4492" data-name="Cell-Status">
                  <BadgeStatusGroceryList className="bg-[#dff9a2] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" />
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12724" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12724;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12724;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12724;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12724;129:4477">
                    Chicken Breast
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12724;129:4478" data-name="Cell-Category">
                  <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12724;129:4544" data-name="Badge Category - Grocery List">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:12724;129:4544;129:4536">
                      Protein
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12724;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12724;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12724;129:4481">
                      1
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12724;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12724;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12724;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12724;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12724;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12724;129:4482">
                    kg
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12724;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12724;129:4484">
                    1650
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12724;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12724;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12724;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12724;129:4487">
                    8
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[52px] whitespace-nowrap" data-node-id="I492:12724;129:4522" data-name="Cell-Actual">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12724;129:4523">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12724;129:4524">
                    8
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12724;129:4492" data-name="Cell-Status">
                  <BadgeStatusGroceryList className="bg-[#dff9a2] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" />
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12725" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12725;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12725;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12725;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12725;129:4477">
                    Avocado
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12725;129:4478" data-name="Cell-Category">
                  <div className="bg-[#ffbe8a] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12725;129:4544" data-name="Badge Category - Grocery List">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:12725;129:4544;129:4538">
                      Fruits
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12725;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12725;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12725;129:4481">
                      3
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12725;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12725;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12725;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12725;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12725;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12725;129:4482">
                    units
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12725;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12725;129:4484">
                    720
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12725;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12725;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12725;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12725;129:4487">
                    2
                  </p>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-[52px]" data-node-id="I492:12725;129:4522" data-name="Cell-Actual">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12725;129:4524">
                    -
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12725;129:4492" data-name="Cell-Status">
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12725;129:4563" data-name="Badge Status - Grocery List">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I492:12725;129:4563;133:6604" data-name="Checkbox">
                      <div className="absolute inset-[-6.25%]">
                        <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] w-[60px]" data-node-id="I492:12725;129:4563;129:4553">
                      Pending
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12726" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12726;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12726;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12726;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12726;129:4477">
                    Spinach
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12726;129:4478" data-name="Cell-Category">
                  <BadgeCategoryGroceryList className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" />
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12726;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12726;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12726;129:4481">
                      300
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12726;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12726;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12726;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12726;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12726;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12726;129:4482">
                    gr
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12726;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12726;129:4484">
                    65
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12726;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12726;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12726;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12726;129:4487">
                    1
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[52px] whitespace-nowrap" data-node-id="I492:12726;129:4522" data-name="Cell-Actual">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12726;129:4523">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12726;129:4524">
                    3
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12726;129:4492" data-name="Cell-Status">
                  <BadgeStatusGroceryList className="bg-[#dff9a2] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" />
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12727" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12727;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12727;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12727;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12727;129:4477">
                    Sweet Potatoes
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12727;129:4478" data-name="Cell-Category">
                  <BadgeCategoryGroceryList className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" />
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12727;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12727;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12727;129:4481">
                      3
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12727;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12727;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12727;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12727;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12727;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12727;129:4482">
                    units
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12727;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12727;129:4484">
                    360
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12727;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12727;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12727;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12727;129:4487">
                    1
                  </p>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-[52px]" data-node-id="I492:12727;129:4522" data-name="Cell-Actual">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12727;129:4524">
                    -
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12727;129:4492" data-name="Cell-Status">
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12727;129:4563" data-name="Badge Status - Grocery List">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I492:12727;129:4563;133:6604" data-name="Checkbox">
                      <div className="absolute inset-[-6.25%]">
                        <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] w-[60px]" data-node-id="I492:12727;129:4563;129:4553">
                      Pending
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12728" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12728;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12728;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12728;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12728;129:4477">
                    Greek Yogurt
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12728;129:4478" data-name="Cell-Category">
                  <div className="bg-[#ffe1c9] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12728;129:4544" data-name="Badge Category - Grocery List">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:12728;129:4544;129:4541">
                      Dairy
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12728;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12728;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12728;129:4481">
                      1
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12728;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12728;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12728;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12728;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12728;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12728;129:4482">
                    tub
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12728;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12728;129:4484">
                    600
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12728;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12728;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12728;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12728;129:4487">
                    4
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[52px] whitespace-nowrap" data-node-id="I492:12728;129:4522" data-name="Cell-Actual">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12728;129:4523">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12728;129:4524">
                    4
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12728;129:4492" data-name="Cell-Status">
                  <BadgeStatusGroceryList className="bg-[#dff9a2] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" />
                </div>
              </div>
              <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12729" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12729;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12729;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12729;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12729;129:4477">
                    Quinoa
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12729;129:4478" data-name="Cell-Category">
                  <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12729;129:4544" data-name="Badge Category - Grocery List">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:12729;129:4544;129:4532">
                      Grains
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12729;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12729;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12729;129:4481">
                      500
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12729;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12729;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12729;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12729;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12729;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12729;129:4482">
                    gr
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12729;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12729;129:4484">
                    1800
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12729;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12729;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12729;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12729;129:4487">
                    1
                  </p>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-[52px]" data-node-id="I492:12729;129:4522" data-name="Cell-Actual">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12729;129:4524">
                    -
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12729;129:4492" data-name="Cell-Status">
                  <div className="bg-[#fff2e8] content-stretch flex gap-[6px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12729;129:4563" data-name="Badge Status - Grocery List">
                    <div className="relative shrink-0 size-[16px]" data-node-id="I492:12729;129:4563;133:6604" data-name="Checkbox">
                      <div className="absolute inset-[-6.25%]">
                        <img alt="" className="block max-w-none size-full" src={imgCheckbox} />
                      </div>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] w-[60px]" data-node-id="I492:12729;129:4563;129:4553">
                      Pending
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex items-center justify-between px-[8px] py-[16px] relative shrink-0 w-[840px]" data-node-id="492:12730" data-name="Table-Row-Grocery List">
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[138px]" data-node-id="I492:12730;129:4474" data-name="Cell-Item Name">
                  <div className="bg-[#f9f4f2] overflow-clip relative rounded-[10px] shrink-0 size-[34px]" data-node-id="I492:12730;129:4475" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I492:12730;376:9686" data-name="Place Image Here" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="I492:12730;129:4477">
                    Brown Rice
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[66px]" data-node-id="I492:12730;129:4478" data-name="Cell-Category">
                  <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12730;129:4544" data-name="Badge Category - Grocery List">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I492:12730;129:4544;129:4532">
                      Grains
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-[152px]" data-node-id="I492:12730;129:4480" data-name="Cell-Qty">
                  <div className="bg-[#eeeeef] content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px pl-[12px] pr-[4px] py-[4px] relative rounded-[8px]" data-node-id="I492:12730;129:6417">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I492:12730;129:4481">
                      500
                    </p>
                    <div className="content-stretch flex gap-[2px] items-center relative rounded-[4px] shrink-0" data-node-id="I492:12730;129:6001" data-name="Button Group">
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-bl-[7px] rounded-tl-[7px] shrink-0" data-node-id="I492:12730;129:6012" data-name="Button-left">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12730;129:6013" data-name="Icon/Minus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                        </div>
                      </div>
                      <div className="bg-white content-stretch flex items-start p-[5px] relative rounded-br-[7px] rounded-tr-[7px] shrink-0" data-node-id="I492:12730;129:6009" data-name="Button-right">
                        <div className="relative shrink-0 size-[14px]" data-node-id="I492:12730;129:6010" data-name="Icon/Plus">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] w-[39px]" data-node-id="I492:12730;129:4482">
                    g
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.3] not-italic relative shrink-0 text-[12px] w-[62px] whitespace-nowrap" data-node-id="I492:12730;129:4483" data-name="Cell-Calories">
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12730;129:4484">
                    1800
                  </p>
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12730;129:4485">
                    kcal
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[42px] whitespace-nowrap" data-node-id="I492:12730;129:4486" data-name="Cell-Cost">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12730;129:4488">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12730;129:4487">
                    0.80
                  </p>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-[52px] whitespace-nowrap" data-node-id="I492:12730;129:4522" data-name="Cell-Actual">
                  <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I492:12730;129:4523">
                    $
                  </p>
                  <p className="relative shrink-0 text-[#272932]" data-node-id="I492:12730;129:4524">
                    4
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-[108px]" data-node-id="I492:12730;129:4492" data-name="Cell-Status">
                  <BadgeStatusGroceryList className="bg-[#dff9a2] content-stretch flex gap-[8px] items-center justify-center pl-[6px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" />
                </div>
              </div>
              <div className="content-stretch flex flex-col items-start pb-[8px] pr-[16px] relative shrink-0 w-full" data-node-id="492:12731" data-name="Section Slider">
                <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start pr-[110px] relative rounded-[8px] shrink-0 w-full" data-node-id="492:12732" data-name="Slider">
                  <div className="bg-[#e1e1e2] h-[6px] relative rounded-[8px] shrink-0 w-full" data-node-id="492:12733" data-name="Bar" />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-node-id="492:12734" data-name="Footer">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="492:12739" data-name="Pagination">
              <div className="bg-[#f6f6f7] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12739;2:4524" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I492:12739;2:4524;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretLeft} />
                </div>
              </div>
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I492:12739;2:4525" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12739;2:4525;2:3331" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12739;2:4525;2:3332">
                    1
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I492:12739;2:4526" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12739;2:4526;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12739;2:4526;2:3482">
                    2
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I492:12739;2:4527" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12739;2:4527;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12739;2:4527;2:3482">
                    3
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="I492:12739;2:4529" data-name="Button">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I492:12739;2:4529;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I492:12739;2:4529;2:3482">
                    4
                  </p>
                </div>
              </div>
              <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="I492:12739;2:4530" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I492:12739;2:4530;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretRight} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="492:11353" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="492:11354" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="492:11355">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="492:11356" data-name="Links">
              <p className="relative shrink-0" data-node-id="492:11357">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="492:11358">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="492:11359">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="492:11360" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="492:11361" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="492:11362" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="492:11363" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="492:11364" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="492:11365" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
