import { FigmaRecipeDetail } from '../FigmaHealthyMenu';
const assetPathPrefix = "/figma/screens/RecipeDetailsMobile";
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
          Calorías
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
          Detalle de receta
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I457:13265;463:14288" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I457:13265;463:14289" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[32px] items-start overflow-clip pb-[24px] px-[16px] relative shrink-0 w-full" data-node-id="457:13266" data-name="Content"><FigmaRecipeDetail variant="mobile" /><footer className="nv-recipe-mobile-footer" data-node-id="457:13349" data-name="Section Footer"><div data-node-id="457:13350" data-name="Legal Information"><strong>© 2026 Plan V</strong><span>Política de privacidad</span><span>Términos y condiciones</span><span>Contacto</span></div><div data-node-id="457:13356" data-name="Social Media"><img src={imgFacebookLogo} alt="" /><img src={imgTwitterLogo} alt="" /><img src={imgInstagramLogo} alt="" /><img src={imgYoutubeLogo} alt="" /><img src={imgLinkedinLogo} alt="" /></div></footer></div>
    </div>
  );
}
