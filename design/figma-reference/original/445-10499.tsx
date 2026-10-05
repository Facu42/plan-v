const assetPathPrefix = "https://www.figma.com/api/mcp/asset/84b57fb1-c235-4559-9e6d-4f1be31acd0a";
const imgIconSpecialFire = `${assetPathPrefix}/36850.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgStar = `${assetPathPrefix}/c88d0.svg`;
const imgIconNavChartBar = `${assetPathPrefix}/de48f.svg`;
const imgIconSpecialHeartbeat = `${assetPathPrefix}/a0ae2.svg`;
const imgIconSpecialCookingPot = `${assetPathPrefix}/b3caf.svg`;
const imgIconSpecialListNumbers = `${assetPathPrefix}/b5ce2.svg`;
const imgIconSpecialBread = `${assetPathPrefix}/bb986.svg`;
const imgIconSpecialFish = `${assetPathPrefix}/a4b28.svg`;
const imgIconSpecialDrop = `${assetPathPrefix}/871ca.svg`;
const imgIconFunnel = `${assetPathPrefix}/e3085.svg`;
const imgIconCaretDown = `${assetPathPrefix}/8e5ed.svg`;
const imgIconChartBar = `${assetPathPrefix}/f55c9.svg`;
const imgIconSpecialFire1 = `${assetPathPrefix}/26c9b.svg`;
const imgSeparator = `${assetPathPrefix}/3dda7.svg`;
const imgIconSpecialBread1 = `${assetPathPrefix}/bcc73.svg`;
const imgIconSpecialFish1 = `${assetPathPrefix}/f2e93.svg`;
const imgIconSpecialDrop1 = `${assetPathPrefix}/b6c86.svg`;
const imgIconPlus = `${assetPathPrefix}/84d5e.svg`;
const imgIconPlus1 = `${assetPathPrefix}/2ac73.svg`;
const imgDivider = `${assetPathPrefix}/31a56.svg`;
const imgIconSpecialFire2 = `${assetPathPrefix}/36936.svg`;
const imgIconSpecialBread2 = `${assetPathPrefix}/0c987.svg`;
const imgIconSpecialFish2 = `${assetPathPrefix}/d6aa7.svg`;
const imgIconSpecialDrop2 = `${assetPathPrefix}/188dc.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemDetailMealValueProps = {
  className?: string;
  amount?: string;
  title?: string;
  unit?: string;
};

function ItemDetailMealValue({ className, amount = "450", title = "Calories", unit = "kcal" }: ItemDetailMealValueProps) {
  return (
    <div className={className || "bg-[#c2e66e] content-stretch flex gap-[8px] h-[314px] items-center p-[12px] relative rounded-[8px] w-[1384px]"} data-node-id="233:8189" data-name="Item Detail Meal Value">
      <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="233:8180" data-name="Icon">
        <div className="relative shrink-0 size-[16px]" data-node-id="233:8181" data-name="Icon/Special/Fire">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
        </div>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="233:8182" data-name="Info">
        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="233:8183">
          {title}
        </p>
        <div className="content-stretch flex gap-[2px] items-baseline relative shrink-0 text-[#272932]" data-node-id="233:8187" data-name="Amount">
          <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[14px]" data-node-id="233:8184">
            {amount}
          </p>
          <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="233:8186">
            {unit}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Component12HealthyMenuMobile() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="445:10499" data-name="12. Healthy Menu (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="445:10500" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I445:10500;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I445:10500;427:15210" data-name="Logo">
            <div className="absolute inset-[6.25%]" data-node-id="I445:10500;427:15210;408:17493" data-name="symbol">
              <div className="absolute bg-[#c2e66e] inset-[53.57%_7.14%_-3.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I445:10500;427:15210;408:17494" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] inset-[-3.57%_7.14%_53.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I445:10500;427:15210;408:17495" data-name="Bowl" />
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I445:10500;433:18077">
          Healthy Menu
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I445:10500;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I445:10500;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[32px] items-start overflow-clip pb-[24px] relative shrink-0 w-full" data-node-id="445:10501" data-name="Content">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="445:10878" data-name="Widget Featured Menu">
          <div className="bg-white content-stretch flex flex-col gap-[12px] items-start overflow-clip relative shrink-0 w-full" data-node-id="445:10880" data-name="Body">
            <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start justify-center px-[16px] py-[20px] relative shrink-0 w-full" data-node-id="445:10881" data-name="Main">
              <div className="content-stretch flex h-[30px] items-center justify-between relative shrink-0 w-full" data-node-id="445:10879" data-name="Header-Section">
                <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I445:10879;2:4222" data-name="Div Title">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I445:10879;2:4223">
                    Featured Menu
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I445:10879;2:4225" data-name="Right Section">
                  <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I445:10879;2:4233" data-name="Button More">
                    <div className="relative shrink-0 size-[24px]" data-node-id="I445:10879;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#eeeeef] h-[298px] overflow-clip relative rounded-[14px] shrink-0 w-full" data-node-id="445:10882" data-name="Image" />
              <div className="content-stretch flex flex-col gap-[24px] items-start pt-[4px] relative shrink-0 w-full" data-node-id="445:10884" data-name="Content">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] w-full" data-node-id="445:10885">
                  Grilled Turkey Breast with Steamed Asparagus and Brown Rice
                </p>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="445:10886" data-name="Row 2">
                  <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="445:10887" data-name="Badge Meal Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="445:10888">
                      Lunch
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="445:10889" data-name="Badge Meal Category">
                    <div className="relative shrink-0 size-[14px]" data-node-id="445:10890" data-name="Star">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="445:10892">
                      4.8/5 (125 reviews)
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[16px] items-start pr-[16px] relative shrink-0 w-full" data-node-id="445:10893" data-name="Details">
                  <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-node-id="445:10894" data-name="Row 1">
                    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center min-w-px relative rounded-[8px]" data-node-id="445:10895" data-name="Item Detail Info">
                      <div className="bg-white content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I445:10895;2:4445" data-name="Icon">
                        <div className="relative shrink-0 size-[16px]" data-node-id="I445:10895;2:4446" data-name="Icon/Nav/ChartBar">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartBar} />
                        </div>
                      </div>
                      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:10895;2:4447" data-name="Info">
                        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I445:10895;2:4448">
                          Difficulty
                        </p>
                        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I445:10895;2:4449">
                          Medium
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center min-w-px relative rounded-[8px]" data-node-id="445:10896" data-name="Item Detail Info">
                      <div className="bg-white content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I445:10896;2:4445" data-name="Icon">
                        <div className="relative shrink-0 size-[16px]" data-node-id="I445:10896;2:4446" data-name="Icon/Nav/ChartBar">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialHeartbeat} />
                        </div>
                      </div>
                      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:10896;2:4447" data-name="Info">
                        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I445:10896;2:4448">
                          Health Score
                        </p>
                        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I445:10896;2:4449">
                          85/100
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="445:10897" data-name="Row 2">
                    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center min-w-px relative rounded-[8px]" data-node-id="445:10898" data-name="Item Detail Info">
                      <div className="bg-white content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I445:10898;2:4445" data-name="Icon">
                        <div className="relative shrink-0 size-[16px]" data-node-id="I445:10898;2:4446" data-name="Icon/Nav/ChartBar">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialCookingPot} />
                        </div>
                      </div>
                      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:10898;2:4447" data-name="Info">
                        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I445:10898;2:4448">
                          Cook Duration
                        </p>
                        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I445:10898;2:4449">
                          10 minutes
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[10px] items-center min-w-px relative rounded-[8px]" data-node-id="445:10899" data-name="Item Detail Info">
                      <div className="bg-white content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I445:10899;2:4445" data-name="Icon">
                        <div className="relative shrink-0 size-[16px]" data-node-id="I445:10899;2:4446" data-name="Icon/Nav/ChartBar">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialListNumbers} />
                        </div>
                      </div>
                      <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:10899;2:4447" data-name="Info">
                        <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I445:10899;2:4448">
                          Total Steps
                        </p>
                        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I445:10899;2:4449">
                          4 steps
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-node-id="445:10900" data-name="Footer">
                  <div className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[16px] py-[10px] relative rounded-[12px]" data-node-id="445:10901" data-name="Button CTA">
                    <div className="content-stretch flex h-[20px] items-center py-[2px] relative shrink-0" data-node-id="I445:10901;2:3405" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I445:10901;2:3406">
                        Add to Meal Plan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-start px-[16px] relative shrink-0 w-full" data-node-id="445:10902" data-name="Details">
              <ItemDetailMealValue className="bg-[#c2e66e] content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px p-[12px] relative rounded-[8px] self-stretch" />
              <div className="bg-[#ffcb65] content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px p-[12px] relative rounded-[8px] self-stretch" data-node-id="445:10904" data-name="Item Detail Meal Value">
                <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I445:10904;233:8180" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I445:10904;233:8181" data-name="Icon/Special/Fire">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:10904;233:8182" data-name="Info">
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I445:10904;233:8183">
                    Carbs
                  </p>
                  <div className="content-stretch flex gap-[2px] items-baseline relative shrink-0 text-[#272932]" data-node-id="I445:10904;233:8187" data-name="Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[14px]" data-node-id="I445:10904;233:8184">
                      40
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I445:10904;233:8186">
                      gr
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[12px] items-start px-[16px] relative shrink-0 w-full" data-node-id="445:10979" data-name="Details">
              <div className="bg-[#ffa257] content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px p-[12px] relative rounded-[8px] self-stretch" data-node-id="445:10982" data-name="Item Detail Meal Value">
                <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I445:10982;233:8180" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I445:10982;233:8181" data-name="Icon/Special/Fire">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:10982;233:8182" data-name="Info">
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I445:10982;233:8183">
                    Proteins
                  </p>
                  <div className="content-stretch flex gap-[2px] items-baseline relative shrink-0 text-[#272932]" data-node-id="I445:10982;233:8187" data-name="Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[14px]" data-node-id="I445:10982;233:8184">
                      35
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I445:10982;233:8186">
                      gr
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#e1e1e2] content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px p-[12px] relative rounded-[8px] self-stretch" data-node-id="445:10983" data-name="Item Detail Meal Value">
                <div className="bg-[#fefcfb] content-stretch flex items-center p-[8px] relative rounded-[8px] shrink-0" data-node-id="I445:10983;233:8180" data-name="Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I445:10983;233:8181" data-name="Icon/Special/Fire">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop} />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start justify-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:10983;233:8182" data-name="Info">
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#52545b] text-[11px]" data-node-id="I445:10983;233:8183">
                    Fats
                  </p>
                  <div className="content-stretch flex gap-[2px] items-baseline relative shrink-0 text-[#272932]" data-node-id="I445:10983;233:8187" data-name="Amount">
                    <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[14px]" data-node-id="I445:10983;233:8184">
                      12
                    </p>
                    <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[12px]" data-node-id="I445:10983;233:8186">
                      gr
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-start px-[16px] relative shrink-0 w-full" data-node-id="445:11016" data-name="Widget All Menu">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:11017" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="445:11018" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="445:11019">
                All Menu
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="445:11021" data-name="Right Section">
              <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="445:11023" data-name="Button Picker">
                <div className="content-stretch flex items-center pr-[2px] py-[2px] relative shrink-0" data-node-id="I445:11023;2:3507" data-name="Icon Left">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I445:11023;2:3508" data-name="Icon/CalendarBlank">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFunnel} />
                  </div>
                </div>
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I445:11023;2:3509" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11023;2:3510">
                    Filter
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I445:11023;2:3511" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I445:11023;2:3512" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex h-[30px] items-start relative shrink-0 w-full" data-node-id="445:11032" data-name="Left Section">
            <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] gap-[2px] items-start min-w-px relative rounded-[10px]" data-node-id="445:11033" data-name="Segmented Button">
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[16px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="445:11034" data-name="Button Picker">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I445:11034;2:3331" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11034;2:3332">
                    All
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex items-center justify-center pl-[20px] pr-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="445:11035" data-name="Button Picker">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I445:11035;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11035;2:3482">
                    Breakfast
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[8px] py-[6px] relative rounded-[8px]" data-node-id="445:11036" data-name="Button Picker">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I445:11036;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11036;2:3482">
                    Lunch
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px px-[8px] py-[6px] relative rounded-[8px]" data-node-id="445:11037" data-name="Button Picker">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I445:11037;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11037;2:3482">
                    Snack
                  </p>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px pl-[12px] pr-[20px] py-[6px] relative rounded-[8px]" data-node-id="445:11038" data-name="Button Picker">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I445:11038;2:3481" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11038;2:3482">
                    Dinner
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="445:11039" data-name="Right Section">
            <div className="content-stretch flex gap-[10px] items-baseline relative shrink-0" data-node-id="445:11045" data-name="Sort by">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="445:11046">
                Sort by:
              </p>
              <div className="bg-[#f6f6f7] content-stretch flex gap-[2px] items-center pl-[10px] pr-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="445:11047" data-name="Button Picker">
                <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I445:11047;2:3476" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11047;2:3477">
                    Calories
                  </p>
                </div>
                <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I445:11047;2:3478" data-name="Icon">
                  <div className="relative shrink-0 size-[14px]" data-node-id="I445:11047;2:3479" data-name="Icon/CaretDown">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="445:11050" data-name="List Menu">
            <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start justify-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11051" data-name="Card List All Menu">
              <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="I445:11051;536:20502" data-name="Top">
                <div className="bg-[#eeeeef] h-[104px] overflow-clip relative rounded-[16px] shrink-0 w-[152px]" data-node-id="I445:11051;453:11787" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11051;453:11788" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-w-px relative self-stretch" data-node-id="I445:11051;536:20181" data-name="Main Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] w-full" data-node-id="I445:11051;453:11817">
                    Avocado Toast with Poached Egg
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0 w-full" data-node-id="I445:11051;453:11844" data-name="Button Picker">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I445:11051;453:11844;2:3331" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11051;453:11844;2:3332">
                        Add to Meal Plan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="I445:11051;453:11789" data-name="Main Content">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11051;453:11790" data-name="Head Info">
                  <div className="content-stretch flex gap-[11px] items-center relative shrink-0" data-node-id="I445:11051;453:11791" data-name="Badges Info">
                    <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11051;453:11792" data-name="Badge Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I445:11051;453:11793">
                        Breakfast
                      </p>
                    </div>
                    <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[6px] pr-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11051;453:11794" data-name="Info Level">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11051;453:11795" data-name="Icon/ChartBar">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11051;453:11796">
                        Easy
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[2px] items-start justify-center pb-[6px] relative shrink-0" data-node-id="I445:11051;453:11800" data-name="Chart Health Score">
                    <div className="[word-break:break-word] content-stretch flex gap-[60px] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:11051;453:11801" data-name="Head">
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I445:11051;453:11802">
                        Health Score:
                      </p>
                      <div className="content-stretch flex items-end relative shrink-0" data-node-id="I445:11051;453:11803" data-name="Amount Score">
                        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I445:11051;453:11804">
                          9
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I445:11051;453:11805">
                          /10
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[4px] h-[5px] items-center relative shrink-0 w-[109.5px]" data-node-id="I445:11051;453:11806" data-name="Chart Bar">
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11807" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11808" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11809" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11810" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11811" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11812" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11813" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11814" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11815" data-name="Bar" />
                      <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11051;453:11816" data-name="Bar" />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I445:11051;453:11818" data-name="Footer">
                  <div className="bg-white content-stretch flex gap-[8px] items-start pl-[10px] pr-[14px] py-[8px] relative rounded-[6px] shrink-0 w-full" data-node-id="I445:11051;453:11819" data-name="Nutrition Info">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11051;453:11820" data-name="Info Cal">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11051;453:11821" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                      </div>
                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-[46px]" data-node-id="I445:11051;453:11822" data-name="Value">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11051;453:11823">
                          320 kcal
                        </p>
                      </div>
                    </div>
                    <div className="relative self-stretch shrink-0 w-0" data-node-id="I445:11051;453:11825" data-name="Separator">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11051;453:11826" data-name="Info Carbs">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11051;453:11827" data-name="Icon/Special/Bread">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11051;453:11828" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11051;453:11829">
                          30g
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11051;453:11830">
                          C
                        </p>
                      </div>
                    </div>
                    <div className="relative self-stretch shrink-0 w-0" data-node-id="I445:11051;453:11831" data-name="Separator">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11051;453:11832" data-name="Info Protein">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11051;453:11833" data-name="Icon/Special/Fish">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11051;453:11834" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11051;453:11835">
                          14g
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11051;453:11836">
                          P
                        </p>
                      </div>
                    </div>
                    <div className="relative self-stretch shrink-0 w-0" data-node-id="I445:11051;453:11837" data-name="Separator">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11051;453:11838" data-name="Info Fats">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11051;453:11839" data-name="Icon/Special/Drop">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11051;453:11840" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11051;453:11841">
                          18g
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11051;453:11842">
                          F
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start justify-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11052" data-name="Card List All Menu">
              <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="I445:11052;536:20502" data-name="Top">
                <div className="bg-[#eeeeef] h-[104px] overflow-clip relative rounded-[16px] shrink-0 w-[152px]" data-node-id="I445:11052;453:11787" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11052;453:11788" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-w-px relative self-stretch" data-node-id="I445:11052;536:20181" data-name="Main Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] w-full" data-node-id="I445:11052;453:11817">
                    Grilled Shrimp Tacos with Mango Salsa
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0 w-full" data-node-id="I445:11052;453:11844" data-name="Button Picker">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I445:11052;453:11844;2:3331" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11052;453:11844;2:3332">
                        Add to Meal Plan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="I445:11052;453:11789" data-name="Main Content">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11052;453:11790" data-name="Head Info">
                  <div className="content-stretch flex gap-[11px] items-center relative shrink-0" data-node-id="I445:11052;453:11791" data-name="Badges Info">
                    <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11052;453:11792" data-name="Badge Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I445:11052;453:11793">
                        Lunch
                      </p>
                    </div>
                    <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[6px] pr-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11052;453:11794" data-name="Info Level">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11052;453:11795" data-name="Icon/ChartBar">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11052;453:11796">
                        Medium
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[2px] items-start justify-center overflow-clip pb-[6px] relative shrink-0" data-node-id="I445:11052;453:11800" data-name="Chart Health Score">
                    <div className="[word-break:break-word] content-stretch flex gap-[60px] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:11052;453:11801" data-name="Head">
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I445:11052;453:11802">
                        Health Score:
                      </p>
                      <div className="content-stretch flex items-end relative shrink-0" data-node-id="I445:11052;453:11803" data-name="Amount Score">
                        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I445:11052;453:11804">
                          8
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I445:11052;453:11805">
                          /10
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[4px] h-[5px] items-center relative shrink-0 w-[109.5px]" data-node-id="I445:11052;453:11806" data-name="Chart Bar">
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11807" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11808" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11809" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11810" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11811" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11812" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11813" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11814" data-name="Bar" />
                      <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11815" data-name="Bar" />
                      <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11052;453:11816" data-name="Bar" />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I445:11052;453:11818" data-name="Footer">
                  <div className="bg-white content-stretch flex gap-[8px] items-start pl-[10px] pr-[14px] py-[8px] relative rounded-[6px] shrink-0 w-full" data-node-id="I445:11052;453:11819" data-name="Nutrition Info">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11052;453:11820" data-name="Info Cal">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11052;453:11821" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] w-[46px] whitespace-nowrap" data-node-id="I445:11052;453:11822" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11052;453:11823">
                          400
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11052;453:11824">
                          kcal
                        </p>
                      </div>
                    </div>
                    <div className="relative self-stretch shrink-0 w-0" data-node-id="I445:11052;453:11825" data-name="Separator">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11052;453:11826" data-name="Info Carbs">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11052;453:11827" data-name="Icon/Special/Bread">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11052;453:11828" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11052;453:11829">
                          45g
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11052;453:11830">
                          C
                        </p>
                      </div>
                    </div>
                    <div className="relative self-stretch shrink-0 w-0" data-node-id="I445:11052;453:11831" data-name="Separator">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11052;453:11832" data-name="Info Protein">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11052;453:11833" data-name="Icon/Special/Fish">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11052;453:11834" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11052;453:11835">
                          28g
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11052;453:11836">
                          P
                        </p>
                      </div>
                    </div>
                    <div className="relative self-stretch shrink-0 w-0" data-node-id="I445:11052;453:11837" data-name="Separator">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11052;453:11838" data-name="Info Fats">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11052;453:11839" data-name="Icon/Special/Drop">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11052;453:11840" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11052;453:11841">
                          12g
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11052;453:11842">
                          F
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[20px] items-start justify-center p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11053" data-name="Card List All Menu">
              <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="I445:11053;536:20502" data-name="Top">
                <div className="bg-[#eeeeef] h-[104px] overflow-clip relative rounded-[16px] shrink-0 w-[152px]" data-node-id="I445:11053;453:11787" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11053;453:11788" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-w-px relative self-stretch" data-node-id="I445:11053;536:20181" data-name="Main Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] w-full" data-node-id="I445:11053;453:11817">
                    Baked Chicken Breast with Quinoa and Kale
                  </p>
                  <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0 w-full" data-node-id="I445:11053;453:11844" data-name="Button Picker">
                    <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I445:11053;453:11844;2:3331" data-name="Text">
                      <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I445:11053;453:11844;2:3332">
                        Add to Meal Plan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="I445:11053;453:11789" data-name="Main Content">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11053;453:11790" data-name="Head Info">
                  <div className="content-stretch flex gap-[11px] items-center relative shrink-0" data-node-id="I445:11053;453:11791" data-name="Badges Info">
                    <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[10px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11053;453:11792" data-name="Badge Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#272932] text-[10px] whitespace-nowrap" data-node-id="I445:11053;453:11793">
                        Dinner
                      </p>
                    </div>
                    <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[6px] pr-[8px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11053;453:11794" data-name="Info Level">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11053;453:11795" data-name="Icon/ChartBar">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChartBar} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11053;453:11796">
                        Medium
                      </p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[2px] items-start justify-center pb-[6px] relative shrink-0" data-node-id="I445:11053;453:11800" data-name="Chart Health Score">
                    <div className="[word-break:break-word] content-stretch flex gap-[60px] items-baseline not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:11053;453:11801" data-name="Head">
                      <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I445:11053;453:11802">
                        Health Score:
                      </p>
                      <div className="content-stretch flex items-end relative shrink-0" data-node-id="I445:11053;453:11803" data-name="Amount Score">
                        <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#52545b] text-[14px]" data-node-id="I445:11053;453:11804">
                          9
                        </p>
                        <p className="font-['Poppins:Regular'] leading-[1.3] relative shrink-0 text-[#8a8c90] text-[12px]" data-node-id="I445:11053;453:11805">
                          /10
                        </p>
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[4px] h-[5px] items-center relative shrink-0 w-[109.5px]" data-node-id="I445:11053;453:11806" data-name="Chart Bar">
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11807" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11808" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11809" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11810" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11811" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11812" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11813" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11814" data-name="Bar" />
                      <div className="bg-[#ffa257] flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11815" data-name="Bar" />
                      <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[4px]" data-node-id="I445:11053;453:11816" data-name="Bar" />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="I445:11053;453:11818" data-name="Footer">
                  <div className="bg-white content-stretch flex gap-[8px] items-start pl-[10px] pr-[14px] py-[8px] relative rounded-[6px] shrink-0 w-full" data-node-id="I445:11053;453:11819" data-name="Nutrition Info">
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11053;453:11820" data-name="Info Cal">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11053;453:11821" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] w-[46px] whitespace-nowrap" data-node-id="I445:11053;453:11822" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11053;453:11823">
                          480
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11053;453:11824">
                          kcal
                        </p>
                      </div>
                    </div>
                    <div className="relative self-stretch shrink-0 w-0" data-node-id="I445:11053;453:11825" data-name="Separator">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11053;453:11826" data-name="Info Carbs">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11053;453:11827" data-name="Icon/Special/Bread">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11053;453:11828" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11053;453:11829">
                          50g
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11053;453:11830">
                          C
                        </p>
                      </div>
                    </div>
                    <div className="relative self-stretch shrink-0 w-0" data-node-id="I445:11053;453:11831" data-name="Separator">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11053;453:11832" data-name="Info Protein">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11053;453:11833" data-name="Icon/Special/Fish">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11053;453:11834" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11053;453:11835">
                          40g
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11053;453:11836">
                          P
                        </p>
                      </div>
                    </div>
                    <div className="relative self-stretch shrink-0 w-0" data-node-id="I445:11053;453:11837" data-name="Separator">
                      <div className="absolute inset-[0_-0.5px]">
                        <img alt="" className="block max-w-none size-full" src={imgSeparator} />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center justify-center min-w-px relative" data-node-id="I445:11053;453:11838" data-name="Info Fats">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11053;453:11839" data-name="Icon/Special/Drop">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop1} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.35] not-italic relative shrink-0 text-[#52545b] text-[10px] whitespace-nowrap" data-node-id="I445:11053;453:11840" data-name="Value">
                        <p className="relative shrink-0" data-node-id="I445:11053;453:11841">
                          15g
                        </p>
                        <p className="relative shrink-0" data-node-id="I445:11053;453:11842">
                          F
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="445:11785" data-name="Menus">
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-center p-[16px] relative shrink-0 w-full" data-node-id="445:11520" data-name="Widget Popular Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:11521" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I445:11521;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I445:11521;2:4223">
                  Popular Menu
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I445:11521;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I445:11521;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I445:11521;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="445:11522" data-name="List Menu">
              <div className="bg-white content-stretch flex gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11524" data-name="Card Popular Menu">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[68px]" data-node-id="I445:11524;228:6619" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11524;228:6620" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-w-px relative self-stretch" data-node-id="I445:11524;228:6621" data-name="Info">
                  <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="I445:11524;228:7783" data-name="Top">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I445:11524;228:6622">
                      Greek Salad with Feta and Olives
                    </p>
                    <div className="bg-[#c2e66e] content-stretch flex items-start p-[4px] relative rounded-[8px] shrink-0" data-node-id="I445:11524;228:7740" data-name="Button More">
                      <div className="relative shrink-0 size-[18px]" data-node-id="I445:11524;228:7740;2:3578" data-name="Icon/ChatTeardropDots">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11524;228:6647" data-name="Details Info">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11524;228:6650" data-name="Info Rating">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I445:11524;228:6951" data-name="Star">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:11524;228:6954" data-name="Rate">
                        <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I445:11524;228:6652">
                          4.9
                        </p>
                        <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I445:11524;228:6953">
                          /5
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#ffe6b5] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11524;228:6648" data-name="Info Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11524;228:6649">
                        Lunch
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11525" data-name="Card Popular Menu">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[68px]" data-node-id="I445:11525;228:6619" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11525;228:6620" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-w-px relative self-stretch" data-node-id="I445:11525;228:6621" data-name="Info">
                  <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="I445:11525;228:7783" data-name="Top">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I445:11525;228:6622">
                      Blueberry Protein Smoothie
                    </p>
                    <div className="bg-[#c2e66e] content-stretch flex items-start p-[4px] relative rounded-[8px] shrink-0" data-node-id="I445:11525;228:7740" data-name="Button More">
                      <div className="relative shrink-0 size-[18px]" data-node-id="I445:11525;228:7740;2:3578" data-name="Icon/ChatTeardropDots">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11525;228:6647" data-name="Details Info">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11525;228:6650" data-name="Info Rating">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I445:11525;228:6951" data-name="Star">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:11525;228:6954" data-name="Rate">
                        <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I445:11525;228:6652">
                          4.8
                        </p>
                        <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I445:11525;228:6953">
                          /5
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#dff9a2] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11525;228:6648" data-name="Info Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11525;228:6649">
                        Breakfast
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex gap-[12px] h-[100px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11528" data-name="Card Popular Menu">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[68px]" data-node-id="I445:11528;228:6619" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11528;228:6620" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-node-id="I445:11528;228:6621" data-name="Info">
                  <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="I445:11528;228:7783" data-name="Top">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I445:11528;228:6622">
                      Grilled Salmon with Lemon and Asparagus
                    </p>
                    <div className="bg-[#c2e66e] content-stretch flex items-start p-[4px] relative rounded-[8px] shrink-0" data-node-id="I445:11528;228:7740" data-name="Button More">
                      <div className="relative shrink-0 size-[18px]" data-node-id="I445:11528;228:7740;2:3578" data-name="Icon/ChatTeardropDots">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11528;228:6647" data-name="Details Info">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11528;228:6650" data-name="Info Rating">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I445:11528;228:6951" data-name="Star">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:11528;228:6954" data-name="Rate">
                        <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I445:11528;228:6652">
                          4.9
                        </p>
                        <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I445:11528;228:6953">
                          /5
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#ffbe8a] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11528;228:6648" data-name="Info Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11528;228:6649">
                        Dinner
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex gap-[12px] h-[100px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11527" data-name="Card Popular Menu">
                <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[68px]" data-node-id="I445:11527;228:6619" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11527;228:6620" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-node-id="I445:11527;228:6621" data-name="Info">
                  <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="I445:11527;228:7783" data-name="Top">
                    <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.3] min-w-px not-italic relative text-[#272932] text-[12px]" data-node-id="I445:11527;228:6622">
                      Greek Yogurt with Granola and Honey
                    </p>
                    <div className="bg-[#c2e66e] content-stretch flex items-start p-[4px] relative rounded-[8px] shrink-0" data-node-id="I445:11527;228:7740" data-name="Button More">
                      <div className="relative shrink-0 size-[18px]" data-node-id="I445:11527;228:7740;2:3578" data-name="Icon/ChatTeardropDots">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11527;228:6647" data-name="Details Info">
                    <div className="bg-[#f6f6f7] content-stretch flex gap-[4px] items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11527;228:6650" data-name="Info Rating">
                      <div className="relative shrink-0 size-[14px]" data-node-id="I445:11527;228:6951" data-name="Star">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgStar} />
                      </div>
                      <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] items-center not-italic relative shrink-0 whitespace-nowrap" data-node-id="I445:11527;228:6954" data-name="Rate">
                        <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I445:11527;228:6652">
                          4.8
                        </p>
                        <p className="leading-[1.35] relative shrink-0 text-[#8a8c90] text-[10px]" data-node-id="I445:11527;228:6953">
                          /5
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#dff9a2] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11527;228:6648" data-name="Info Meal Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11527;228:6649">
                        Breakfast
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[16px] items-center p-[16px] relative shrink-0 w-full" data-node-id="445:11529" data-name="Widget Recommended Menu">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="445:11530" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I445:11530;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I445:11530;2:4223">
                  Recommended Menu
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I445:11530;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I445:11530;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I445:11530;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full" data-node-id="445:11531" data-name="List Menu">
              <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11533" data-name="Card Recommended Menu">
                <div className="content-stretch flex gap-[16px] h-[64px] items-start relative shrink-0 w-full" data-node-id="I445:11533;228:7536" data-name="Main">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I445:11533;228:7497" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11533;228:7498" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-node-id="I445:11533;228:7499" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I445:11533;228:7500">
                      Oatmeal with Almond Butter and Berries
                    </p>
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I445:11533;228:7548" data-name="Bottom">
                      <div className="bg-[#dff9a2] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11533;228:7502" data-name="Info Meal Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11533;228:7503">
                          Breakfast
                        </p>
                      </div>
                      <div className="bg-[#c2e66e] content-stretch flex items-start p-[3px] relative rounded-[7px] shrink-0" data-node-id="I445:11533;228:7549" data-name="Button Picker">
                        <div className="relative shrink-0 size-[16px]" data-node-id="I445:11533;228:7549;2:3580" data-name="Icon/ChatTeardropDots">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-0 relative shrink-0 w-full" data-node-id="I445:11533;228:7513" data-name="Divider">
                  <div className="absolute inset-[-0.5px_0]">
                    <img alt="" className="block max-w-none size-full" src={imgDivider} />
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11533;228:7514" data-name="Detail Nutrients">
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11533;228:7537" data-name="Info Calories">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11533;228:7538" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11533;228:7539" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11533;228:7540">
                        C
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11533;228:7541">
                      350 kcal
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11533;228:7515" data-name="Info Carbs">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11533;228:7516" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11533;228:7517" data-name="Icon/Special/Bread">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11533;228:7518">
                        C
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11533;228:7519">
                      45g
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11533;228:7520" data-name="Info Protein">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11533;228:7521" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11533;228:7522" data-name="Icon/Special/Fish">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11533;228:7523">
                        P
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11533;228:7524">
                      12g
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11533;228:7525" data-name="Info Fats">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11533;228:7526" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11533;228:7527" data-name="Icon/Special/Drop">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11533;228:7528">
                        F
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11533;228:7529">
                      14g
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11534" data-name="Card Recommended Menu">
                <div className="content-stretch flex gap-[16px] h-[64px] items-start relative shrink-0 w-full" data-node-id="I445:11534;228:7536" data-name="Main">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I445:11534;228:7497" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11534;228:7498" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-node-id="I445:11534;228:7499" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I445:11534;228:7500">
                      Grilled Chicken Wrap with Avocado and Spinach
                    </p>
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I445:11534;228:7548" data-name="Bottom">
                      <div className="bg-[#ffe6b5] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11534;228:7502" data-name="Info Meal Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11534;228:7503">
                          Lunch
                        </p>
                      </div>
                      <div className="bg-[#c2e66e] content-stretch flex items-start p-[3px] relative rounded-[7px] shrink-0" data-node-id="I445:11534;228:7549" data-name="Button Picker">
                        <div className="relative shrink-0 size-[16px]" data-node-id="I445:11534;228:7549;2:3580" data-name="Icon/ChatTeardropDots">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-0 relative shrink-0 w-full" data-node-id="I445:11534;228:7513" data-name="Divider">
                  <div className="absolute inset-[-0.5px_0]">
                    <img alt="" className="block max-w-none size-full" src={imgDivider} />
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11534;228:7514" data-name="Detail Nutrients">
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11534;228:7537" data-name="Info Calories">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11534;228:7538" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11534;228:7539" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11534;228:7540">
                        C
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11534;228:7541">
                      450 kcal
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11534;228:7515" data-name="Info Carbs">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11534;228:7516" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11534;228:7517" data-name="Icon/Special/Bread">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11534;228:7518">
                        C
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11534;228:7519">
                      40g
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11534;228:7520" data-name="Info Protein">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11534;228:7521" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11534;228:7522" data-name="Icon/Special/Fish">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11534;228:7523">
                        P
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11534;228:7524">
                      30g
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11534;228:7525" data-name="Info Fats">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11534;228:7526" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11534;228:7527" data-name="Icon/Special/Drop">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11534;228:7528">
                        F
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11534;228:7529">
                      18g
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11536" data-name="Card Recommended Menu">
                <div className="content-stretch flex gap-[16px] h-[64px] items-start relative shrink-0 w-full" data-node-id="I445:11536;228:7536" data-name="Main">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I445:11536;228:7497" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11536;228:7498" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-node-id="I445:11536;228:7499" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I445:11536;228:7500">
                      Quinoa Salad with Roasted Vegetables and Feta
                    </p>
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I445:11536;228:7548" data-name="Bottom">
                      <div className="bg-[#ffbe8a] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11536;228:7502" data-name="Info Meal Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11536;228:7503">
                          Dinner
                        </p>
                      </div>
                      <div className="bg-[#c2e66e] content-stretch flex items-start p-[3px] relative rounded-[7px] shrink-0" data-node-id="I445:11536;228:7549" data-name="Button Picker">
                        <div className="relative shrink-0 size-[16px]" data-node-id="I445:11536;228:7549;2:3580" data-name="Icon/ChatTeardropDots">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-0 relative shrink-0 w-full" data-node-id="I445:11536;228:7513" data-name="Divider">
                  <div className="absolute inset-[-0.5px_0]">
                    <img alt="" className="block max-w-none size-full" src={imgDivider} />
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11536;228:7514" data-name="Detail Nutrients">
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11536;228:7537" data-name="Info Calories">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11536;228:7538" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11536;228:7539" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11536;228:7540">
                        C
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11536;228:7541">
                      400 kcal
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11536;228:7515" data-name="Info Carbs">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11536;228:7516" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11536;228:7517" data-name="Icon/Special/Bread">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11536;228:7518">
                        C
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11536;228:7519">
                      50g
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11536;228:7520" data-name="Info Protein">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11536;228:7521" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11536;228:7522" data-name="Icon/Special/Fish">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11536;228:7523">
                        P
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11536;228:7524">
                      15g
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11536;228:7525" data-name="Info Fats">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11536;228:7526" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11536;228:7527" data-name="Icon/Special/Drop">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11536;228:7528">
                        F
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11536;228:7529">
                      12g
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white content-stretch flex flex-col gap-[16px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="445:11537" data-name="Card Recommended Menu">
                <div className="content-stretch flex gap-[16px] h-[64px] items-start relative shrink-0 w-full" data-node-id="I445:11537;228:7536" data-name="Main">
                  <div className="bg-[#eeeeef] overflow-clip relative rounded-[12px] shrink-0 size-[64px]" data-node-id="I445:11537;228:7497" data-name="Image">
                    <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I445:11537;228:7498" data-name="Place Image Here" />
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start justify-between min-w-px relative" data-node-id="I445:11537;228:7499" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.3] not-italic relative shrink-0 text-[#272932] text-[12px] w-full" data-node-id="I445:11537;228:7500">{`Scrambled Eggs with Spinach & Whole Grain Toast`}</p>
                    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-node-id="I445:11537;228:7548" data-name="Bottom">
                      <div className="bg-[#dff9a2] content-stretch flex items-center justify-center px-[6px] py-[4px] relative rounded-[6px] shrink-0" data-node-id="I445:11537;228:7502" data-name="Info Meal Category">
                        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11537;228:7503">
                          Breakfast
                        </p>
                      </div>
                      <div className="bg-[#c2e66e] content-stretch flex items-start p-[3px] relative rounded-[7px] shrink-0" data-node-id="I445:11537;228:7549" data-name="Button Picker">
                        <div className="relative shrink-0 size-[16px]" data-node-id="I445:11537;228:7549;2:3580" data-name="Icon/ChatTeardropDots">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-0 relative shrink-0 w-full" data-node-id="I445:11537;228:7513" data-name="Divider">
                  <div className="absolute inset-[-0.5px_0]">
                    <img alt="" className="block max-w-none size-full" src={imgDivider} />
                  </div>
                </div>
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="I445:11537;228:7514" data-name="Detail Nutrients">
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11537;228:7537" data-name="Info Calories">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11537;228:7538" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11537;228:7539" data-name="Icon/Special/Fire">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11537;228:7540">
                        C
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11537;228:7541">
                      380 kcal
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11537;228:7515" data-name="Info Carbs">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11537;228:7516" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11537;228:7517" data-name="Icon/Special/Bread">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBread2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11537;228:7518">
                        C
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11537;228:7519">
                      35g
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11537;228:7520" data-name="Info Protein">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11537;228:7521" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11537;228:7522" data-name="Icon/Special/Fish">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFish2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11537;228:7523">
                        P
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11537;228:7524">
                      25g
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[6px] items-center justify-center relative shrink-0" data-node-id="I445:11537;228:7525" data-name="Info Fats">
                    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" data-node-id="I445:11537;228:7526" data-name="Label">
                      <div className="relative shrink-0 size-[12px]" data-node-id="I445:11537;228:7527" data-name="Icon/Special/Drop">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialDrop2} />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I445:11537;228:7528">
                        F
                      </p>
                    </div>
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I445:11537;228:7529">
                      18g
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="445:10624" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="445:10625" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="445:10626">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="445:10627" data-name="Links">
              <p className="relative shrink-0" data-node-id="445:10628">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="445:10629">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="445:10630">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="445:10631" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10632" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10633" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10634" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10635" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="445:10636" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
