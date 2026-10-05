const assetPathPrefix = "https://www.figma.com/api/mcp/asset/7ab69194-7ad7-49ff-a40d-c8c3f8f351bc";
const imgLine = `${assetPathPrefix}/9d354.svg`;
const imgIconSpecialFire = `${assetPathPrefix}/36850.svg`;
const imgIconArrowLeft = `${assetPathPrefix}/7ecad.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconClock = `${assetPathPrefix}/1f647.svg`;
const imgIconSpecialKnife = `${assetPathPrefix}/246bc.svg`;
const imgIconSpecialCookingPot = `${assetPathPrefix}/33cab.svg`;
const imgIconChartBar = `${assetPathPrefix}/a1d03.svg`;
const imgIconSpecialListNumbers = `${assetPathPrefix}/7a7e7.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/5a044.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/bb986.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/a4b28.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/871ca.svg`;
const imgIconMinus = `${assetPathPrefix}/4425e.svg`;
const imgIconPlus = `${assetPathPrefix}/2ac73.svg`;
const imgDivider = `${assetPathPrefix}/9ef3a.svg`;
const imgDot = `${assetPathPrefix}/f0f58.svg`;
const imgIconDotsThree = `${assetPathPrefix}/1fb9c.svg`;
const imgStar = `${assetPathPrefix}/c88d0.svg`;
const imgStar1 = `${assetPathPrefix}/71b23.svg`;
const imgStar2 = `${assetPathPrefix}/d98b5.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemListDirectionsProps = {
  className?: string;
  desc?: string;
  showLine?: boolean;
  step?: string;
  title?: string;
};

function ItemListDirections({ className, desc = "Crack the eggs into a mixing bowl, add a pinch of salt and pepper, and whisk until fully blended.", showLine = true, step = "1", title = "Prep the Ingredients" }: ItemListDirectionsProps) {
  return (
    <div className={className || "content-stretch flex gap-[12px] items-start relative w-[425px]"} data-node-id="256:7349" data-name="Item List Directions">
      <div className="content-stretch flex flex-col gap-[4px] items-center pb-[4px] relative self-stretch shrink-0" data-node-id="256:7342" data-name="Left Side">
        <div className="bg-[#ffcb65] content-stretch flex flex-col items-center justify-center p-[6px] relative rounded-[8px] shrink-0 w-[30px]" data-node-id="256:7343" data-name="Number">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#52545b] text-[14px] text-center w-full" data-node-id="256:7344">
            {step}
          </p>
        </div>
        {showLine && (
          <div className="flex-[1_0_0] min-h-px relative w-0" data-node-id="256:7345" data-name="Line">
            <div className="absolute inset-[0_-0.5px]">
              <img alt="" className="block max-w-none size-full" src={imgLine} />
            </div>
          </div>
        )}
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic pb-[14px] pt-[6px] relative" data-node-id="256:7346" data-name="Content">
        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px] w-full" data-node-id="256:7347">
          {title}
        </p>
        <p className="font-['Poppins:Regular'] leading-[1.5] relative shrink-0 text-[#8a8c90] text-[12px] w-full" data-node-id="256:7348">
          {desc}
        </p>
      </div>
    </div>
  );
}

type ItemListSimpleProps = {
  className?: string;
  item?: string;
  number?: string;
  type?: "Circle" | "Square";
};

function ItemListSimple({ className, item = "Saucepan for cooking brown rice", number = "1", type = "Circle" }: ItemListSimpleProps) {
  const isSquare = type === "Square";
  return (
    <div className={className || "content-stretch flex gap-[12px] items-center min-h-[32px] relative w-[206.5px]"} id={isSquare ? "node-370_9863" : "node-256_7875"}>
      <div className={`content-stretch flex flex-col items-center justify-center p-[6px] relative shrink-0 ${isSquare ? "border border-[#8a8c90] border-solid rounded-[7px]" : "bg-[#ffa257] rounded-[20px]"}`} id={isSquare ? "node-370_9867" : "node-256_7872"} data-name="Number">
        {type === "Circle" && (
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] text-center w-[16px]" data-node-id="256:7873">
            {number}
          </p>
        )}
        {isSquare && (
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] text-center w-[16px]" data-node-id="370:9868">
            {number}
          </p>
        )}
      </div>
      <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.3] min-w-px not-italic relative text-[#52545b] text-[12px]" data-node-id="256:7874">
        {item}
      </p>
    </div>
  );
}

function ItemDetailMealValueRecipeDetails({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#c2e66e] content-stretch flex flex-col gap-[16px] items-center p-[12px] relative rounded-[16px] w-[64.75px]"} data-node-id="251:6518" data-name="Item Detail Meal Value - Recipe Details">
      <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="251:6510" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="251:6511" data-name="Icon/Special/Fire">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
        </div>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="251:6512" data-name="Info">
        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="251:6513">
          Calories
        </p>
        <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="251:6514" data-name="Amount">
          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="251:6515">
            450
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[10px]" data-node-id="251:6516">
            kcal
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Component15RecipeDetailsMobile() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="457:13264" data-name="15. Recipe Details (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="457:13265" data-name="Navbar">
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I457:13265;463:14294" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I457:13265;463:14295" data-name="Icon/ArrowLeft">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I457:13265;463:14287">
          Recipe Details
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I457:13265;463:14288" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I457:13265;463:14289" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[32px] items-start overflow-clip pb-[24px] px-[16px] relative shrink-0 w-full" data-node-id="457:13266" data-name="Content">
        <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start justify-center overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="463:13917" data-name="Left Side">
          <div className="bg-[#eeeeef] h-[275px] overflow-clip relative shrink-0 w-full" data-node-id="463:13918" data-name="Image">
            <div className="absolute inset-[-0.36%_-0.36%_0_0]" data-node-id="463:13919" data-name="Place Image Here" />
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex gap-[48px] items-start p-[24px] relative rounded-[16px] shrink-0 w-full" data-node-id="545:18905" data-name="Section Info">
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px relative" data-node-id="545:18906" data-name="List Info - Column 1">
              <div className="content-stretch flex h-[24px] items-center relative rounded-[8px] shrink-0" data-node-id="545:18907" data-name="Item Detail Info">
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="545:18908" data-name="Label">
                  <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="545:18909" data-name="Icon">
                    <div className="relative shrink-0 size-[12px]" data-node-id="545:18910" data-name="Icon/Clock">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconClock} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center leading-[1.24] not-italic relative shrink-0 text-[11px] whitespace-nowrap" data-node-id="545:18911" data-name="Info">
                    <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="545:18912">
                      Eat Time
                    </p>
                    <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="545:18913">
                      12:30 PM
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex h-[24px] items-center relative rounded-[8px] shrink-0" data-node-id="545:18914" data-name="Item Detail Info">
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="545:18915" data-name="Label">
                  <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="545:18916" data-name="Icon">
                    <div className="relative shrink-0 size-[12px]" data-node-id="545:18917" data-name="Icon/Special/Knife">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialKnife} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center leading-[1.24] not-italic relative shrink-0 text-[11px] whitespace-nowrap" data-node-id="545:18918" data-name="Info">
                    <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="545:18919">
                      Prep Time
                    </p>
                    <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="545:18920">
                      10 minutes
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex h-[24px] items-center relative rounded-[8px] shrink-0" data-node-id="545:18921" data-name="Item Detail Info">
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="545:18922" data-name="Label">
                  <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="545:18923" data-name="Icon">
                    <div className="relative shrink-0 size-[12px]" data-node-id="545:18924" data-name="Icon/Special/CookingPot">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialCookingPot} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center leading-[1.24] not-italic relative shrink-0 text-[11px] whitespace-nowrap" data-node-id="545:18925">
                    <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="545:18926">
                      Cook Time
                    </p>
                    <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="545:18927">
                      15 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-start min-w-px relative" data-node-id="545:18928" data-name="List Info - Column 2">
              <div className="content-stretch flex h-[24px] items-center relative rounded-[8px] shrink-0" data-node-id="545:18929" data-name="Item Detail Info">
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="545:18930" data-name="Label">
                  <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="545:18931" data-name="Icon">
                    <div className="relative shrink-0 size-[12px]" data-node-id="545:18932" data-name="Icon/ChartBar">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center leading-[1.24] not-italic relative shrink-0 text-[11px] whitespace-nowrap" data-node-id="545:18933" data-name="Info">
                    <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="545:18934">
                      Difficulty
                    </p>
                    <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="545:18935">
                      Medium
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex h-[24px] items-center relative rounded-[8px] shrink-0" data-node-id="545:18936" data-name="Item Detail Info">
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="545:18937" data-name="Label">
                  <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="545:18938" data-name="Icon">
                    <div className="relative shrink-0 size-[12px]" data-node-id="545:18939" data-name="Icon/Special/ListNumbers">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialListNumbers} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center leading-[1.24] not-italic relative shrink-0 text-[11px] whitespace-nowrap" data-node-id="545:18940" data-name="Info">
                    <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="545:18941">
                      Total Steps
                    </p>
                    <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="545:18942">
                      5 steps
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex h-[24px] items-center relative rounded-[8px] shrink-0" data-node-id="545:18943" data-name="Item Detail Info">
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="545:18944" data-name="Label">
                  <div className="bg-[#c2e66e] content-stretch flex items-center p-[6px] relative rounded-[8px] shrink-0" data-node-id="545:18945" data-name="Icon">
                    <div className="relative shrink-0 size-[12px]" data-node-id="545:18946" data-name="Icon/Nav/Heartbeat">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center leading-[1.24] not-italic relative shrink-0 text-[11px] whitespace-nowrap" data-node-id="545:18947" data-name="Info">
                    <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="545:18948">
                      Health Score
                    </p>
                    <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="545:18949">
                      9/10
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col gap-[24px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="463:14016" data-name="Content">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="463:14017">
            Grilled Turkey Breast with Steamed Asparagus and Brown Rice
          </p>
          <div className="bg-[#f6f6f7] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="463:14018" data-name="Section About">
            <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="463:14019" data-name="Badge Meal Category">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#52545b] text-[14px] whitespace-nowrap" data-node-id="463:14020">
                Lunch
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.5] min-w-full not-italic relative shrink-0 text-[#52545b] text-[12px] w-[min-content]" data-node-id="463:14021">
              A lean and balanced meal that’s perfect for a post-workout lunch or a healthy midday option. This meal provides a great balance of protein, fiber, and healthy fats while being low in calories. The grilled turkey breast offers a rich source of lean protein, while the steamed asparagus and brown rice provide essential vitamins and minerals.
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] h-[118px] items-start px-[16px] relative shrink-0 w-full" data-node-id="536:20987" data-name="Details">
            <ItemDetailMealValueRecipeDetails className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px p-[12px] relative rounded-[16px]" />
            <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px p-[12px] relative rounded-[16px]" data-node-id="536:20989" data-name="Item Detail Meal Value - Recipe Details">
              <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I536:20989;251:6510" data-name="Icon">
                <div className="relative shrink-0 size-[16px]" data-node-id="I536:20989;251:6511" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I536:20989;251:6512" data-name="Info">
                <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I536:20989;251:6513">
                  Carbs
                </p>
                <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="I536:20989;251:6514" data-name="Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I536:20989;251:6515">
                    40
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[10px]" data-node-id="I536:20989;251:6516">
                    gr
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px p-[12px] relative rounded-[16px]" data-node-id="536:20990" data-name="Item Detail Meal Value - Recipe Details">
              <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I536:20990;251:6510" data-name="Icon">
                <div className="relative shrink-0 size-[16px]" data-node-id="I536:20990;251:6511" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I536:20990;251:6512" data-name="Info">
                <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I536:20990;251:6513">
                  Protein
                </p>
                <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="I536:20990;251:6514" data-name="Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I536:20990;251:6515">
                    35
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[10px]" data-node-id="I536:20990;251:6516">
                    gr
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#e1e1e2] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-w-px p-[12px] relative rounded-[16px]" data-node-id="536:20991" data-name="Item Detail Meal Value - Recipe Details">
              <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I536:20991;251:6510" data-name="Icon">
                <div className="relative shrink-0 size-[16px]" data-node-id="I536:20991;251:6511" data-name="Icon/Special/Fire">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I536:20991;251:6512" data-name="Info">
                <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I536:20991;251:6513">
                  Fats
                </p>
                <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="I536:20991;251:6514" data-name="Amount">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I536:20991;251:6515">
                    12
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[10px]" data-node-id="I536:20991;251:6516">
                    gr
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="536:20969" data-name="Block Total Servings">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="536:20970" data-name="Total Servings">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="536:20971">
                Total Servings
              </p>
              <div className="bg-[#fefcfb] content-stretch flex gap-[10px] items-center p-[4px] relative rounded-[9px] shrink-0" data-node-id="536:20972" data-name="Label">
                <div className="bg-[#c2e66e] content-stretch flex items-start p-[5px] relative rounded-[7px] shrink-0" data-node-id="536:20973" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I536:20973;2:3580" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMinus} />
                  </div>
                </div>
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#878a94] text-[12px] whitespace-nowrap" data-node-id="536:20974">
                  2
                </p>
                <div className="bg-[#c2e66e] content-stretch flex items-start p-[5px] relative rounded-[7px] shrink-0" data-node-id="536:20975" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I536:20975;2:3580" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-node-id="536:20976" data-name="Divider">
              <div className="absolute inset-[-0.5px_0]">
                <img alt="" className="block max-w-none size-full" src={imgDivider} />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="536:20977" data-name="Section Ingredients">
              <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="536:20978" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] w-[90px]" data-node-id="536:20979">
                  Ingredients
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="536:20980" data-name="List Nutrition Facts">
                <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="200 g turkey breast" type="Square" />
                <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="1 cup asparagus (steamed)" number="2" type="Square" />
                <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="1/2 cup cooked brown rice" number="3" type="Square" />
                <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="1 tbsp olive oil" number="4" type="Square" />
                <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Salt and pepper to taste" number="5" type="Square" />
                <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Lemon for garnish" number="6" type="Square" />
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[24px] items-start py-[16px] relative shrink-0 w-full" data-node-id="463:14022" data-name="Tools & Direction">
            <div className="content-stretch flex flex-col gap-[16px] items-start pb-[16px] relative rounded-[28px] shrink-0 w-full" data-node-id="463:14023" data-name="Section Tools">
              <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0 w-full" data-node-id="463:14024" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] w-full" data-node-id="463:14025">{`Tools & Equipment`}</p>
              </div>
              <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-node-id="463:14026" data-name="List Nutrition Facts">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="463:14027" data-name="Column 1">
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Grill pan or outdoor grill" />
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Medium pot for steaming" number="2" />
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" number="3" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="463:14031" data-name="Column 2">
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Tongs for turning turkey" number="4" />
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Cutting board" number="5" />
                  <ItemListSimple className="content-stretch flex gap-[12px] items-center min-h-[32px] relative shrink-0 w-full" item="Knife" number="6" />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="463:14035" data-name="Section Directions">
              <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="463:14036" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] w-[90px]" data-node-id="463:14037">
                  Directions
                </p>
              </div>
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="463:14038" data-name="List Nutrition Facts">
                <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="Season the turkey breast with olive oil, salt, and pepper. Set aside." title="Prepare the Turkey" />
                <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="In a saucepan, cook 1/2 cup of brown rice in 1 cup of water. Let it simmer for 15 minutes or until fully cooked." step="2" title="Cook the Brown Rice" />
                <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="Preheat the grill pan over medium heat. Grill the turkey breast for 6-7 minutes on each side until fully cooked (internal temp: 165°F)." step="3" title="Grill the Turkey" />
                <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="In a medium pot, steam the asparagus for 5 minutes or until tender." step="4" title="Steam the Asparagus" />
                <ItemListDirections className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" desc="Arrange the turkey breast, brown rice, and asparagus on a plate. Garnish with a lemon wedge." showLine={false} step="5" title="Serve and Garnish" />
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="463:14044" data-name="Section Notes">
              <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="463:14045" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] w-[90px]" data-node-id="463:14046">
                  Notes
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="463:14047" data-name="List Nutrition Facts">
                <div className="content-stretch flex gap-[16px] items-center min-h-[32px] relative shrink-0 w-full" data-node-id="463:14048" data-name="Item List Simple">
                  <div className="content-stretch flex flex-col items-center justify-center relative rounded-[20px] shrink-0" data-node-id="I463:14048;370:9871" data-name="Icon">
                    <div className="relative shrink-0 size-[28px]" data-node-id="I463:14048;370:9875" data-name="Dot">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgDot} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative" data-node-id="I463:14048;371:9890" data-name="Info Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#52545b] text-[12px]" data-node-id="I463:14048;370:9873">
                      For added flavor, marinate the turkey in lemon juice and garlic for 30 minutes before grilling.
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center min-h-[32px] relative shrink-0 w-full" data-node-id="463:14049" data-name="Item List Simple">
                  <div className="content-stretch flex flex-col items-center justify-center relative rounded-[20px] shrink-0" data-node-id="I463:14049;370:9871" data-name="Icon">
                    <div className="relative shrink-0 size-[28px]" data-node-id="I463:14049;370:9875" data-name="Dot">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgDot} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative" data-node-id="I463:14049;371:9890" data-name="Info Text">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-w-px not-italic relative text-[#52545b] text-[12px]" data-node-id="I463:14049;370:9873">
                      You can replace brown rice with quinoa or couscous for variety.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] h-[441px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="536:21047" data-name="Widget Nutrition Facts">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="536:21048" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-747px] relative shrink-0" data-node-id="I536:21048;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="I536:21048;2:4223">
                  Nutrition Facts
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I536:21048;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I536:21048;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I536:21048;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px relative w-full" data-node-id="536:21049" data-name="List Nutrition Facts">
              <div className="[word-break:break-word] content-stretch flex items-end justify-between mb-[-1.875px] not-italic pb-[14px] relative shrink-0 w-full whitespace-nowrap" data-node-id="536:21050" data-name="Info Cal">
                <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="536:21051">
                  Calories
                </p>
                <div className="content-stretch flex flex-col gap-[2px] items-end relative shrink-0" data-node-id="536:21052" data-name="Info">
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="536:21053">
                    Per Serving
                  </p>
                  <p className="font-['Poppins:SemiBold'] leading-[1.24] relative shrink-0 text-[#272932] text-[16px]" data-node-id="536:21054">
                    450 kcal
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="536:21055" data-name="Info Cal">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21056">
                  Carbohydrates
                </p>
                <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="536:21057" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21058">
                    40 gr
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="536:21059" data-name="Info Cal">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21060">
                  Protein
                </p>
                <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="536:21061" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21062">
                    35 gr
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="536:21063" data-name="Info Cal">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21064">
                  Total Fat
                </p>
                <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="536:21065" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21066">
                    12 gr
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="536:21067" data-name="Info Cal">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21068">
                  Fiber
                </p>
                <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="536:21069" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21070">
                    7 gr
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="536:21071" data-name="Info Cal">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21072">
                  Sodium
                </p>
                <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="536:21073" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21074">
                    420 mg
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="536:21075" data-name="Info Cal">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21076">
                  Cholesterol
                </p>
                <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="536:21077" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21078">
                    75 mg
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between mb-[-1.875px] pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="536:21079" data-name="Info Cal">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21080">
                  Sugars
                </p>
                <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="536:21081" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21082">
                    4 gr
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-solid border-t content-stretch flex items-end justify-between pb-[12px] pt-[13px] relative shrink-0 w-full" data-node-id="536:21083" data-name="Info Cal">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21084">
                  Vitamin C
                </p>
                <div className="content-stretch flex flex-col items-end relative shrink-0" data-node-id="536:21085" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] whitespace-nowrap" data-node-id="536:21086">
                    20% DV
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="536:21087" data-name="Section Reviews">
            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="536:21088" data-name="Total Servings">
              <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="536:21089" data-name="Title">
                <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="536:21090">
                  Reviews
                </p>
                <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="536:21091">
                  by 125 People
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="536:21092" data-name="Ratings">
                <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="536:21093" data-name="Stars">
                  <div className="relative shrink-0 size-[14px]" data-node-id="536:21094" data-name="Star">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                  </div>
                  <div className="relative shrink-0 size-[14px]" data-node-id="536:21096" data-name="Star">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                  </div>
                  <div className="relative shrink-0 size-[14px]" data-node-id="536:21098" data-name="Star">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                  </div>
                  <div className="relative shrink-0 size-[14px]" data-node-id="536:21100" data-name="Star">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                  </div>
                  <div className="relative shrink-0 size-[14px]" data-node-id="536:21102" data-name="Star">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar1} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="536:21107" data-name="Info Rating">
                  <p className="leading-[1.3] relative shrink-0 text-[#52545b] text-[12px]" data-node-id="536:21108">
                    4.8
                  </p>
                  <p className="leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="536:21109">
                    /5
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-node-id="536:21110" data-name="List Review">
              <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-[265px]" data-node-id="536:21111" data-name="Card Reviews - Receipt Details">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.6] not-italic relative shrink-0 text-[#8a8c90] text-[11px] w-full" data-node-id="I536:21111;256:7697">
                  Very easy to make, and the portion was just right. I added a little garlic to the rice for extra flavor. This will be a regular meal in my meal prep rotation.
                </p>
                <div className="content-stretch flex gap-[13px] items-end relative shrink-0 w-full" data-node-id="I536:21111;256:7687" data-name="Header">
                  <div className="bg-[#c2e66e] overflow-clip relative rounded-[24px] shrink-0 size-[36px]" data-node-id="I536:21111;256:7688" data-name="Image">
                    <div className="absolute inset-0 rounded-[32px]" data-node-id="I536:21111;256:7689" data-name="Avatar">
                      <div className="absolute bg-[#c2e66e] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I536:21111;256:7689;2:3102" data-name="User Image/16" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I536:21111;256:7690" data-name="Title Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] min-w-full not-italic relative shrink-0 text-[#52545b] text-[12px] w-[min-content]" data-node-id="I536:21111;256:7691">
                      Sarah Murad
                    </p>
                    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I536:21111;256:7692" data-name="Badge Meal Category">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I536:21111;256:7693" data-name="Star">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I536:21111;256:7695">
                        5/5
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] self-stretch shrink-0 w-[265px]" data-node-id="536:21112" data-name="Card Reviews - Receipt Details">
                <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.6] min-h-px not-italic relative text-[#8a8c90] text-[11px] w-full" data-node-id="I536:21112;256:7697">
                  This is my go-to lunch recipe now! Simple, nutritious, and delicious. I love how quickly it comes together on busy days.
                </p>
                <div className="content-stretch flex gap-[13px] items-end relative shrink-0 w-full" data-node-id="I536:21112;256:7687" data-name="Header">
                  <div className="bg-[#ffa257] overflow-clip relative rounded-[24px] shrink-0 size-[36px]" data-node-id="I536:21112;256:7688" data-name="Image">
                    <div className="absolute inset-0 rounded-[32px]" data-node-id="I536:21112;256:7689" data-name="Avatar">
                      <div className="absolute bg-[#ffa257] inset-[-2.78%] overflow-clip rounded-[40px]" data-node-id="I536:21112;256:7689;2:3102" data-name="User Image/08" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px relative" data-node-id="I536:21112;256:7690" data-name="Title Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] min-w-full not-italic relative shrink-0 text-[#52545b] text-[12px] w-[min-content]" data-node-id="I536:21112;256:7691">
                      Linda Rawls
                    </p>
                    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I536:21112;256:7692" data-name="Badge Meal Category">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I536:21112;256:7693" data-name="Star">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I536:21112;256:7695">
                        4.7/5
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="457:13349" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="457:13350" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="457:13351">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="457:13352" data-name="Links">
              <p className="relative shrink-0" data-node-id="457:13353">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="457:13354">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="457:13355">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="457:13356" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="457:13357" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="457:13358" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="457:13359" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="457:13360" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="457:13361" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
