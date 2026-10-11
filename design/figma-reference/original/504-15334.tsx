const assetPathPrefix = "https://www.figma.com/api/mcp/asset/d0c2cf8e-0207-4610-8b1f-817ecae9ba8d";
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/44561.svg`;
const imgEllipse4 = `${assetPathPrefix}/b94c5.svg`;
const imgPlay = `${assetPathPrefix}/2a6ab.svg`;
const imgPlay1 = `${assetPathPrefix}/3eeb9.svg`;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemListTrendingTagsProps = {
  className?: string;
  align?: "Horizontal";
  amount?: string;
  category?: string;
  tags?: string;
};

function ItemListTrendingTags({ className, align = "Horizontal", amount = "15 posts", category = "Mental Health & Wellness", tags = "#PostWorkoutNutrition" }: ItemListTrendingTagsProps) {
  return (
    <div className={className || "border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between py-[8px] relative w-[408px]"} data-node-id="507:16554">
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="507:16555">
        {tags}
      </p>
      <div className="content-stretch flex flex-col gap-[2px] items-end relative shrink-0" data-node-id="507:16556" data-name="Header">
        <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="507:16557" data-name="Info Category">
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#73a107] text-[11px] whitespace-nowrap" data-node-id="507:16558">
            {category}
          </p>
        </div>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic overflow-hidden relative shrink-0 text-[#8a8c90] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="507:16560">
          {amount}
        </p>
      </div>
    </div>
  );
}

function ChipsCategory({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px]"} data-node-id="264:8052" data-name="Chips Category">
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="264:8051">
        Trending
      </p>
    </div>
  );
}

export default function Component33InsightsMobile() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="504:15334" data-name="33. Insights (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="504:15335" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I504:15335;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I504:15335;427:15210" data-name="Logo">
            <div className="absolute inset-[6.25%]" data-node-id="I504:15335;427:15210;408:17493" data-name="symbol">
              <div className="absolute bg-[#c2e66e] inset-[53.57%_7.14%_-3.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I504:15335;427:15210;408:17494" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] inset-[-3.57%_7.14%_53.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I504:15335;427:15210;408:17495" data-name="Bowl" />
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I504:15335;433:18077">
          Healthy Insights
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I504:15335;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I504:15335;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="bg-white content-stretch flex flex-col gap-[24px] items-start overflow-clip pb-[24px] relative shrink-0 w-full" data-node-id="504:15336" data-name="Content">
        <div className="bg-[#eeeeef] content-stretch flex flex-col gap-[24px] items-center px-[16px] py-[32px] relative shrink-0 w-full" data-node-id="504:15702" data-name="Header">
          <div className="bg-white content-stretch flex gap-[8px] items-center p-[8px] relative rounded-[14px] shrink-0 w-full" data-node-id="504:15705" data-name="Header Menu">
            <div className="bg-white content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px px-[8px] py-[6px] relative rounded-[8px]" data-node-id="504:15706" data-name="Input-search">
              <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I504:15706;2:3949" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I504:15706;2:3950">
                  Search articles
                </p>
              </div>
            </div>
            <div className="bg-[#c2e66e] content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="504:15707" data-name="Button More">
              <div className="relative shrink-0 size-[18px]" data-node-id="I504:15707;2:3578" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
          </div>
          <div className="content-start flex flex-wrap gap-[8px] items-start justify-center relative shrink-0 w-full" data-node-id="504:15708" data-name="Categories">
            <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="504:15709" data-name="Chips Category">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I504:15709;264:8051">
                Recent
              </p>
            </div>
            <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="504:15710" data-name="Chips Category">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I504:15710;264:8051">
                Featured
              </p>
            </div>
            <ChipsCategory className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" />
            <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="504:15712" data-name="Chips Category">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I504:15712;264:8051">
                Popular
              </p>
            </div>
            <div className="bg-[#fefcfb] content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="504:15713" data-name="Chips Category">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I504:15713;264:8051">
                Recommended
              </p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[8px] items-start px-[16px] relative shrink-0 w-[856px]" data-node-id="507:15755" data-name="Tab">
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[12px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="507:15756" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I507:15756;2:3331" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I507:15756;2:3332">
                All
              </p>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="507:15757" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I507:15757;2:3481" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:15757;2:3482">{`Nutrition & Wellness`}</p>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="507:15758" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I507:15758;2:3481" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:15758;2:3482">{`Health & Lifestyle`}</p>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="507:15759" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I507:15759;2:3481" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:15759;2:3482">{`Fitness & Nutrition`}</p>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="507:15760" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I507:15760;2:3481" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:15760;2:3482">{`Health & Wellness`}</p>
            </div>
          </div>
          <div className="bg-[#f9f4f2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="507:15761" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I507:15761;2:3481" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:15761;2:3482">{`Mental Health & Wellness`}</p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-start justify-center overflow-clip relative shrink-0 w-full" data-node-id="507:15787" data-name="Featured Articles">
          <div className="content-stretch flex items-center justify-between px-[16px] relative shrink-0 w-full" data-node-id="507:15788" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I507:15788;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I507:15788;2:4223">
                Featured Article
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] h-[30px] items-center relative shrink-0 w-[987px]" data-node-id="I507:15788;2:4225" data-name="Right Section" />
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="507:15789" data-name="Body">
            <div className="bg-[#eeeeef] h-[196px] overflow-clip relative shrink-0 w-full" data-node-id="507:15790" data-name="Image">
              <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[208px] left-[calc(50%-0.5px)] top-1/2 w-[391px]" data-node-id="507:15791" data-name="Place Image Here" />
            </div>
            <div className="content-stretch flex flex-col gap-[12px] h-[196px] items-start px-[16px] relative shrink-0 w-full" data-node-id="507:15792" data-name="Content">
              <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="507:15793" data-name="Header">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="507:15794" data-name="Left Info">
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="507:15795" data-name="Info Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="507:15796">{`Health & Wellness`}</p>
                  </div>
                  <div className="relative shrink-0 size-[3px]" data-node-id="507:15797">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
                  </div>
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="507:15798" data-name="Info Date">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="507:15799">
                      Sept 15, 2028
                    </p>
                  </div>
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[20px] w-full" data-node-id="507:15800">
                The Importance of Hydration for Optimal Health
              </p>
              <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.5] min-h-px not-italic overflow-hidden relative text-[#8a8c90] text-[12px] text-ellipsis w-full" data-node-id="507:15801">
                Learn how proper hydration impacts your overall health, energy levels, and mental clarity, and get tips on how to stay hydrated throughout the day. Discover the signs of dehydration and how to prevent it with simple daily habits.
              </p>
              <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="507:15802" data-name="Footer">
                <div className="content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="507:15803" data-name="Info Author">
                  <div className="relative rounded-[32px] shrink-0 size-[20px]" data-node-id="507:15804" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-[-5%] overflow-clip rounded-[20px]" data-node-id="I507:15804;2:3126" data-name="User Image/14" />
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="507:15805">
                    Dr. Amelia Johnson
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-center px-[16px] relative shrink-0 w-full" data-node-id="507:15852" data-name="Widget Popular Menu">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="507:15853" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I507:15853;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I507:15853;2:4223">
                Popular Insights
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I507:15853;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="I507:15853;2:4234" data-name="Button CTA">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I507:15853;2:4234;2:3551" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:15853;2:4234;2:3552">
                    See All
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[28px] items-start justify-center relative shrink-0 w-full" data-node-id="507:15854" data-name="List Menu">
            <div className="bg-white content-stretch flex gap-[16px] items-center relative rounded-[16px] shrink-0 w-full" data-node-id="507:15855" data-name="Card Popular Insights">
              <div className="flex flex-row items-center self-stretch" data-node-id="I507:15855;507:16179">
                <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[16px] shrink-0 w-[165px]" data-name="Image">
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#eeeeef] h-[205.045px] left-[calc(50%+0.5px)] top-[calc(50%-0.48px)] w-[202px]" data-node-id="I507:15855;507:16180" data-name="Place Image Here" />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px py-[4px] relative" data-node-id="I507:15855;507:16183" data-name="Info">
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I507:15855;507:16184" data-name="Header">
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:15855;507:16186" data-name="Info Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#73a107] text-[11px] whitespace-nowrap" data-node-id="I507:15855;507:16187">{`Fitness & Nutrition`}</p>
                  </div>
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:15855;507:16189" data-name="Info Date">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I507:15855;507:16190">
                      Sept 20, 2028
                    </p>
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full" data-node-id="I507:15855;507:16191" data-name="Body">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I507:15855;507:16192">
                    How Nutrient Timing Affects Your Workout Performance
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.5] overflow-hidden relative shrink-0 text-[#8a8c90] text-[12px] text-ellipsis w-full" data-node-id="I507:15855;507:16193">
                    Discover the science behind nutrient timing and how it can improve your workout results. Learn the best times to eat for energy, recovery, and muscle growth.
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I507:15855;507:16194" data-name="Footer">
                  <div className="content-stretch flex items-center relative shrink-0" data-node-id="I507:15855;507:16195" data-name="Left Info">
                    <div className="content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:15855;507:16196" data-name="Info Date">
                      <div className="relative rounded-[32px] shrink-0 size-[20px]" data-node-id="I507:15855;507:16197" data-name="Avatar">
                        <div className="absolute bg-[#ffcb65] inset-[-5%] overflow-clip rounded-[20px]" data-node-id="I507:15855;507:16197;2:3126" data-name="User Image/19" />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="I507:15855;507:16198">
                        Coach Daniel Green
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[16px] h-[202px] items-center relative rounded-[16px] shrink-0 w-[356px]" data-node-id="507:15856" data-name="Card Popular Insights">
              <div className="bg-[#eeeeef] h-full overflow-clip relative rounded-[16px] shrink-0 w-[165px]" data-node-id="I507:15856;507:16179" data-name="Image">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#eeeeef] h-[205.045px] left-[calc(50%+0.5px)] top-[calc(50%-0.48px)] w-[202px]" data-node-id="I507:15856;507:16180" data-name="Place Image Here" />
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.5px)] size-[52px] top-1/2" data-node-id="I507:15856;507:16181" data-name="Play">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay} />
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px py-[4px] relative" data-node-id="I507:15856;507:16183" data-name="Info">
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I507:15856;507:16184" data-name="Header">
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:15856;507:16186" data-name="Info Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#73a107] text-[11px] whitespace-nowrap" data-node-id="I507:15856;507:16187">
                      Health Tips
                    </p>
                  </div>
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:15856;507:16189" data-name="Info Date">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] whitespace-nowrap" data-node-id="I507:15856;507:16190">
                      Sept 18, 2028
                    </p>
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-h-px not-italic relative w-full" data-node-id="I507:15856;507:16191" data-name="Body">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px] w-full" data-node-id="I507:15856;507:16192">
                    Hydration Hacks for a Busy Lifestyle
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.5] overflow-hidden relative shrink-0 text-[#8a8c90] text-[12px] text-ellipsis w-full" data-node-id="I507:15856;507:16193">
                    This video shares quick and practical hydration tips to help you stay hydrated even with a hectic schedule. Perfect for on-the-go individuals!
                  </p>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-full" data-node-id="I507:15856;507:16194" data-name="Footer">
                  <div className="content-stretch flex items-center relative shrink-0" data-node-id="I507:15856;507:16195" data-name="Left Info">
                    <div className="content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:15856;507:16196" data-name="Info Date">
                      <div className="relative rounded-[32px] shrink-0 size-[20px]" data-node-id="I507:15856;507:16197" data-name="Avatar">
                        <div className="absolute bg-[#ffa257] inset-[-5%] overflow-clip rounded-[20px]" data-node-id="I507:15856;507:16197;2:3126" data-name="User Image/09" />
                      </div>
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="I507:15856;507:16198">
                        Dr. Emily Stevens
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-center px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="507:16304" data-name="Widget Recommnded Article">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="507:16305" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I507:16305;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I507:16305;2:4223">
                Recommended Article
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I507:16305;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="I507:16305;2:4234" data-name="Button CTA">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I507:16305;2:4234;2:3551" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:16305;2:4234;2:3552">
                    See All
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0 w-full" data-node-id="507:16306" data-name="List Rcommendation">
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="507:16307">
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px relative" data-name="Card Recommended Insights">
                <div className="bg-[#eeeeef] h-[124px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I507:16307;276:9109" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I507:16307;276:9110" data-name="Place Image Here" />
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I507:16307;276:9111" data-name="Info">
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:16307;276:9114" data-name="Info Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I507:16307;276:9115">{`Nutrition & Wellness`}</p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I507:16307;276:9120">
                    Superfoods for Better Brain Function
                  </p>
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:16307;276:9117" data-name="Info Date">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I507:16307;276:9118">
                      Sept 5, 2028
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="507:16308" data-name="Card Recommended Insights">
              <div className="bg-[#eeeeef] h-[124px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I507:16308;276:9109" data-name="Image">
                <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I507:16308;276:9110" data-name="Place Image Here" />
              </div>
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I507:16308;276:9111" data-name="Info">
                <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:16308;276:9114" data-name="Info Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I507:16308;276:9115">{`Health & Lifestyle`}</p>
                </div>
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I507:16308;276:9120">
                  The Benefits of Intermittent Fasting for Longevity
                </p>
                <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:16308;276:9117" data-name="Info Date">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I507:16308;276:9118">
                    Aug 30, 2028
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[16px] items-center px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="507:16309" data-name="Widget Recommnded Article">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="507:16310" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-715px] relative shrink-0" data-node-id="I507:16310;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I507:16310;2:4223">
                Recommended Video
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I507:16310;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-center justify-center px-[2px] py-[6px] relative shrink-0" data-node-id="I507:16310;2:4234" data-name="Button CTA">
                <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I507:16310;2:4234;2:3551" data-name="Text">
                  <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:16310;2:4234;2:3552">
                    See All
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0 w-full" data-node-id="507:16311" data-name="List Rcommendation">
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="507:16312">
              <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px relative" data-name="Card Recommended Insights">
                <div className="bg-[#eeeeef] h-[124px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I507:16312;276:9109" data-name="Image">
                  <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I507:16312;276:9110" data-name="Place Image Here" />
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.5px)] size-[48px] top-1/2" data-node-id="I507:16312;297:7931" data-name="Play">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay1} />
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I507:16312;276:9111" data-name="Info">
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:16312;276:9114" data-name="Info Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I507:16312;276:9115">
                      Fitness Tips
                    </p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I507:16312;276:9120">
                    Stretching Routines to Boost Flexibility
                  </p>
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:16312;276:9117" data-name="Info Date">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I507:16312;276:9118">
                      Sept 3, 2028
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="507:16313" data-name="Card Recommended Insights">
              <div className="bg-[#eeeeef] h-[124px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I507:16313;276:9109" data-name="Image">
                <div className="absolute bg-[#eeeeef] inset-0" data-node-id="I507:16313;276:9110" data-name="Place Image Here" />
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.5px)] size-[48px] top-1/2" data-node-id="I507:16313;297:7931" data-name="Play">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay1} />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I507:16313;276:9111" data-name="Info">
                <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:16313;276:9114" data-name="Info Category">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I507:16313;276:9115">
                    Nutrition Hacks
                  </p>
                </div>
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I507:16313;276:9120">{`Quick & Healthy Breakfast Ideas for Busy Mornings`}</p>
                <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:16313;276:9117" data-name="Info Date">
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I507:16313;276:9118">
                    Aug 25, 2028
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[32px] items-start p-[28px] relative shrink-0 w-full" data-node-id="507:16417" data-name="Right Side">
          <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="507:16418" data-name="Widget Trending Tags">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="507:16419" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-739px] relative shrink-0" data-node-id="I507:16419;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I507:16419;2:4223">
                  Trending Tags
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I507:16419;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I507:16419;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I507:16419;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-node-id="507:16420" data-name="List Menu">
              <ItemListTrendingTags amount="8 posts" category="Health & Wellness" className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between py-[8px] relative shrink-0 w-full" tags="#Hydration" />
              <ItemListTrendingTags amount="12 posts" category="Health & Lifestyle" className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between py-[8px] relative shrink-0 w-full" tags="#IntermittentFasting" />
              <ItemListTrendingTags category="Nutrition & Wellness" className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between py-[8px] relative shrink-0 w-full" tags="#Superfoods" />
              <ItemListTrendingTags amount="6 posts" className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between py-[8px] relative shrink-0 w-full" tags="#MindfulEating" />
              <ItemListTrendingTags amount="5 posts" className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between py-[8px] relative shrink-0 w-full" tags="#BalancedBites" />
              <div className="content-stretch flex items-center justify-between pt-[8px] relative shrink-0 w-full" data-node-id="507:16426" data-name="Item List Trending Tags">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I507:16426;507:16555">
                  #PostWorkoutNutrition
                </p>
                <div className="content-stretch flex flex-col gap-[2px] items-end relative shrink-0" data-node-id="I507:16426;507:16556" data-name="Header">
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:16426;507:16557" data-name="Info Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#73a107] text-[11px] whitespace-nowrap" data-node-id="I507:16426;507:16558">{`Fitness & Nutrition`}</p>
                  </div>
                  <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic overflow-hidden relative shrink-0 text-[#8a8c90] text-[11px] text-ellipsis whitespace-nowrap" data-node-id="I507:16426;507:16560">
                    10 posts
                  </p>
                </div>
              </div>
            </div>
            <div className="border border-[#e1e1e2] border-solid content-stretch flex items-center justify-center px-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="507:16427" data-name="Button">
              <div className="content-stretch flex items-center px-[2px] py-[3px] relative shrink-0" data-node-id="I507:16427;2:3519" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:16427;2:3520">
                  Show More
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="507:16428" data-name="Widget Top Author">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="507:16429" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-739px] relative shrink-0" data-node-id="I507:16429;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I507:16429;2:4223">
                  Top Author
                </p>
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I507:16429;2:4225" data-name="Right Section">
                <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I507:16429;2:4233" data-name="Button More">
                  <div className="relative shrink-0 size-[24px]" data-node-id="I507:16429;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="507:16430" data-name="List Menu">
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-full" data-node-id="507:16431" data-name="User Profile">
                <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I507:16431;276:8854" data-name="Image">
                  <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I507:16431;276:8705" data-name="Avatar">
                    <div className="absolute bg-[#c2e66e] inset-0" data-node-id="I507:16431;276:8705;2:3114" data-name="User Image/05" />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I507:16431;276:8706" data-name="User Name">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I507:16431;276:8707">
                    Chef Michael Harris
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I507:16431;276:8708">
                    90K Followers
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-full" data-node-id="507:16432" data-name="User Profile">
                <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I507:16432;276:8854" data-name="Image">
                  <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I507:16432;276:8705" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I507:16432;276:8705;2:3114" data-name="User Image/18" />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I507:16432;276:8706" data-name="User Name">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I507:16432;276:8707">
                    Dr. Sarah Collins
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I507:16432;276:8708">
                    85K Followers
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-full" data-node-id="507:16433" data-name="User Profile">
                <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I507:16433;276:8854" data-name="Image">
                  <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I507:16433;276:8705" data-name="Avatar">
                    <div className="absolute bg-[#ffa257] inset-0" data-node-id="I507:16433;276:8705;2:3114" data-name="User Image/19" />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I507:16433;276:8706" data-name="User Name">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I507:16433;276:8707">
                    Coach Daniel Green
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I507:16433;276:8708">
                    72K Followers
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-full" data-node-id="507:16434" data-name="User Profile">
                <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I507:16434;276:8854" data-name="Image">
                  <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I507:16434;276:8705" data-name="Avatar">
                    <div className="absolute bg-[#c2e66e] inset-0" data-node-id="I507:16434;276:8705;2:3114" data-name="User Image/08" />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I507:16434;276:8706" data-name="User Name">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I507:16434;276:8707">
                    Jane Murray
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I507:16434;276:8708">
                    65K Followers
                  </p>
                </div>
              </div>
              <div className="border-[#e1e1e2] border-b border-solid content-stretch flex items-center pb-[16px] relative shrink-0 w-full" data-node-id="507:16435" data-name="User Profile">
                <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I507:16435;276:8854" data-name="Image">
                  <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I507:16435;276:8705" data-name="Avatar">
                    <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I507:16435;276:8705;2:3114" data-name="User Image/07" />
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I507:16435;276:8706" data-name="User Name">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I507:16435;276:8707">
                    Dr. Emily Thompson
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I507:16435;276:8708">
                    58K Followers
                  </p>
                </div>
              </div>
              <div className="content-stretch flex items-center pb-[16px] relative shrink-0 w-full" data-node-id="507:16436" data-name="User Profile">
                <div className="bg-[#ffe6b5] content-stretch flex items-center relative rounded-[10px] shrink-0" data-node-id="I507:16436;276:8854" data-name="Image">
                  <div className="overflow-clip relative rounded-[10px] shrink-0 size-[36px]" data-node-id="I507:16436;276:8705" data-name="Avatar">
                    <div className="absolute bg-[#ffa257] inset-0" data-node-id="I507:16436;276:8705;2:3114" data-name="User Image/06">
                      <div className="absolute inset-[0_0.28%_0_0]" data-node-id="I507:16436;276:8705;2:3114;2:3147" data-name="Place Image Here" />
                    </div>
                  </div>
                </div>
                <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px not-italic pl-[12px] pr-[8px] relative whitespace-nowrap" data-node-id="I507:16436;276:8706" data-name="User Name">
                  <p className="font-['Poppins:SemiBold'] leading-[1.25] relative shrink-0 text-[#272932] text-[14px]" data-node-id="I507:16436;276:8707">
                    Coach Adam Maes
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I507:16436;276:8708">
                    46K Followers
                  </p>
                </div>
              </div>
            </div>
            <div className="border border-[#e1e1e2] border-solid content-stretch flex items-center justify-center px-[8px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="507:16437" data-name="Button">
              <div className="content-stretch flex items-center px-[2px] py-[3px] relative shrink-0" data-node-id="I507:16437;2:3519" data-name="Text">
                <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center whitespace-nowrap" data-node-id="I507:16437;2:3520">
                  Show More
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="504:15358" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="504:15359" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="504:15360">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="504:15361" data-name="Links">
              <p className="relative shrink-0" data-node-id="504:15362">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="504:15363">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="504:15364">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="504:15365" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15366" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15367" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15368" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15369" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="504:15370" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
