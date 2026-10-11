const assetPathPrefix = "https://www.figma.com/api/mcp/asset/d8bd5696-dfd4-4907-b968-03c7aea62c12";
const imgNumber = `${assetPathPrefix}/41ecb.svg`;
const imgIconArrowLeft = `${assetPathPrefix}/7ecad.svg`;
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgEllipse4 = `${assetPathPrefix}/b94c5.svg`;
const imgIconLink = `${assetPathPrefix}/e1e1f.svg`;
const imgIconFacebookLogo = `${assetPathPrefix}/74650.svg`;
const imgIconInstagramLogo = `${assetPathPrefix}/b8fc5.svg`;
const imgIconTwitterLogo = `${assetPathPrefix}/51979.svg`;
const imgPlay = `${assetPathPrefix}/e6a2a.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type ItemListTextParagraphProps = {
  className?: string;
  number?: string;
  text?: string;
  type?: "Number" | "Bullet";
};

function ItemListTextParagraph({ className, number = "1.", text = "Regulates Body Temperature: Water is crucial for maintaining body temperature, especially during exercise or in hot environments.", type = "Number" }: ItemListTextParagraphProps) {
  const isBullet = type === "Bullet";
  return (
    <div className={className || "content-stretch flex gap-[4px] items-start px-[8px] relative w-[698px]"} id={isBullet ? "node-286_7198" : "node-286_7138"}>
      <div className={`relative shrink-0 ${isBullet ? "size-[20px]" : "content-stretch flex flex-col items-center justify-center px-[6px] py-px rounded-[20px] w-[20px]"}`} id={isBullet ? "node-286_7199" : "node-286_7134"} data-name="Number">
        {type === "Number" && (
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#52545b] text-[14px] text-center w-[16px]" data-node-id="286:7135">
            {number}
          </p>
        )}
        {isBullet && <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgNumber} />}
      </div>
      <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative" id={isBullet ? "node-286_7201" : "node-286_7137"} data-name="Text">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[1.4] min-w-px not-italic relative text-[#52545b] text-[14px]" data-node-id="286:7136">
          {text}
        </p>
      </div>
    </div>
  );
}

export default function Component36InsightDetailsMobile() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="507:17412" data-name="36. Insight Details (Mobile)">
      <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="507:17413" data-name="Navbar">
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I507:17413;463:14294" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I507:17413;463:14295" data-name="Icon/ArrowLeft">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I507:17413;463:14287">
          Insights Details
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I507:17413;463:14288" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I507:17413;463:14289" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[24px] items-start overflow-clip pb-[24px] relative shrink-0 w-full" data-node-id="507:17414" data-name="Content">
        <div className="bg-white content-stretch flex flex-col gap-[20px] items-start px-[16px] py-[24px] relative shrink-0 w-full" data-node-id="507:17793" data-name="Content">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="507:17794" data-name="Header">
            <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="507:17795" data-name="Info Category">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="507:17796">{`Health & Wellness`}</p>
            </div>
            <div className="relative shrink-0 size-[3px]" data-node-id="507:17797">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
            </div>
            <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="507:17798" data-name="Info Date">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="507:17799">
                6 min read
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[28px] w-full" data-node-id="507:17800">
            The Science Behind Hydration: Why Water is Essential for Health
          </p>
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-node-id="507:17801" data-name="Footer">
            <div className="content-stretch flex gap-[6px] items-center justify-center relative rounded-[8px] shrink-0" data-node-id="507:17802" data-name="Info Author">
              <div className="relative rounded-[32px] shrink-0 size-[20px]" data-node-id="507:17803" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-[-5%] overflow-clip rounded-[20px]" data-node-id="I507:17803;2:3126" data-name="User Image/14" />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#52545b] text-[12px] whitespace-nowrap" data-node-id="507:17804">
                Dr. Amelia Johnson
              </p>
            </div>
            <div className="relative shrink-0 size-[3px]" data-node-id="507:17805">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse4} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="507:17806">
              Sept 15, 2028
            </p>
          </div>
          <div className="bg-[#eeeeef] h-[358px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="507:17807" data-name="Image">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[408px] left-1/2 top-1/2 w-[728px]" data-node-id="507:17809" data-name="Place Image Here" />
          </div>
          <div className="border-[#e1e1e2] border-l-2 border-solid content-stretch flex flex-col items-start px-[24px] py-[16px] relative shrink-0 w-full" data-node-id="507:17810" data-name="Pharagraph">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] not-italic relative shrink-0 text-[#8a8c90] text-[14px] w-full" data-node-id="507:17811">
              This article dives into the importance of hydration for overall well-being, covering how water affects everything from brain function to physical performance. Learn how to keep your hydration levels optimal throughout the day.
            </p>
          </div>
          <div className="content-stretch flex flex-col items-start relative rounded-[28px] shrink-0 w-full" data-node-id="507:17812" data-name="Pharagraph">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] not-italic relative shrink-0 text-[#52545b] text-[14px] w-full" data-node-id="507:17813">
              Water is the essence of life. It plays a crucial role in every system of the body, from maintaining cellular functions to regulating temperature and keeping us energized. While it’s often easy to overlook, staying hydrated is one of the simplest and most effective ways to support your overall well-being.
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="507:17814" data-name="Pharagraph">
            <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="507:17815" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="507:17816">
                Why Hydration Matters
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="507:17817">
              Your body is composed of about 60% water. Every cell, tissue, and organ relies on water to function properly. Hydration impacts everything from digestion to muscle performance and brain function. Even mild dehydration can affect your mood, concentration, and physical energy.
            </p>
          </div>
          <div className="[word-break:break-word] bg-[#f9f4f2] border-[#ffa257] border-l-2 border-solid content-stretch flex flex-col gap-[8px] items-start leading-[1.4] not-italic px-[24px] py-[16px] relative rounded-br-[12px] rounded-tr-[12px] shrink-0 text-[14px] w-full" data-node-id="507:17818" data-name="Quotation">
            <p className="font-['Poppins:Regular'] relative shrink-0 text-[#52545b] w-full" data-node-id="507:17819">{`"Hydration isn't just about drinking enough water—it's about ensuring your body has what it needs to perform at its best."`}</p>
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] w-full" data-node-id="507:17820">
              - Dr. Amelia Johnson -
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="507:17821" data-name="Pharagraph">
            <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="507:17822" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="507:17823">
                How Much Water Do You Really Need?
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="507:17824">{`The general guideline is to drink about 8 glasses of water a day, but your actual needs can vary depending on your activity level, environment, and health status. If you're exercising or in a hot climate, your water needs will increase. A good rule of thumb is to drink when you’re thirsty and aim for clear or light-colored urine, which indicates proper hydration.`}</p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="507:17825" data-name="Pharagraph">
            <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="507:17826" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="507:17827">
                Signs of Dehydration
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="507:17828">
              Dehydration occurs when you’re losing more water than you’re taking in. Some common signs include:
            </p>
            <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" text="Headaches" type="Bullet" />
            <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="2." text="Fatigue" type="Bullet" />
            <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="3." text="Dry Mouth" type="Bullet" />
            <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="4." text="Dark Yellow Urine" type="Bullet" />
            <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="4." text="Dizziness" type="Bullet" />
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="507:17834">
              Severe dehydration can lead to more serious health issues like kidney stones or heatstroke, so it’s important to monitor your hydration levels throughout the day.
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="507:17835" data-name="Pharagraph">
            <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="507:17836" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="507:17837">
                Tips for Staying Hydrated
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="507:17838">
              When you hydrate, water helps your body in the following ways:
            </p>
            <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" text="Carry a Water Bottle: Having water with you at all times makes it easier to stay hydrated." />
            <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="2." text="Set Hydration Goals: Track your water intake throughout the day using apps or reminders." />
            <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="3." text="Infuse Your Water: Add fruits or herbs like lemon, mint, or cucumber to make your water more enjoyable." />
            <ItemListTextParagraph className="content-stretch flex gap-[4px] items-start px-[8px] relative shrink-0 w-full" number="4." text="Eat Hydrating Foods: Foods like watermelon, cucumber, and oranges have high water content and can contribute to your daily hydration needs." />
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[28px] shrink-0 w-full" data-node-id="507:17843" data-name="Pharagraph">
            <div className="content-stretch flex flex-col h-[30px] items-start justify-center relative shrink-0" data-node-id="507:17844" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#212738] text-[14px] whitespace-nowrap" data-node-id="507:17845">
                Conclusion
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.4] min-w-full not-italic relative shrink-0 text-[#52545b] text-[14px] w-[min-content]" data-node-id="507:17846">{`Hydration is an essential part of maintaining your overall health and well-being. By understanding how water impacts your body and taking simple steps to stay hydrated, you can improve your mood, energy, and cognitive function. So, make sure you’re sipping water throughout the day and paying attention to your body's hydration needs.`}</p>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="507:18004" data-name="Right Side">
          <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="507:18005" data-name="Section Tags">
            <div className="content-stretch flex h-[30px] items-center relative shrink-0 w-[56px]" data-node-id="507:18006" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="507:18007" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="507:18008">
                  Share
                </p>
              </div>
            </div>
            <div className="content-start flex flex-wrap gap-[8px] items-start relative shrink-0 w-full" data-node-id="507:18010" data-name="Categories">
              <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="507:18011" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I507:18011;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconLink} />
                </div>
              </div>
              <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="507:18012" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I507:18012;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFacebookLogo} />
                </div>
              </div>
              <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="507:18013" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I507:18013;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconInstagramLogo} />
                </div>
              </div>
              <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="507:18014" data-name="Button Icon">
                <div className="relative shrink-0 size-[18px]" data-node-id="I507:18014;2:3586" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTwitterLogo} />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="507:18015" data-name="Section Tags">
            <div className="content-stretch flex h-[30px] items-center relative shrink-0 w-[56px]" data-node-id="507:18016" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="507:18017" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="507:18018">
                  Tags
                </p>
              </div>
            </div>
            <div className="[word-break:break-word] content-start flex flex-wrap font-['Poppins:Regular'] gap-[8px] items-start not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="507:18020" data-name="Categories">
              <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="507:18021" data-name="Chips Tag">
                <p className="leading-[1.35] relative shrink-0 text-[#bebfc2] text-[10px]" data-node-id="I507:18021;286:7320">
                  #
                </p>
                <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I507:18021;286:7321">
                  Hydration
                </p>
              </div>
              <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="507:18022" data-name="Chips Tag">
                <p className="leading-[1.35] relative shrink-0 text-[#bebfc2] text-[10px]" data-node-id="I507:18022;286:7320">
                  #
                </p>
                <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I507:18022;286:7321">
                  Wellness
                </p>
              </div>
              <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="507:18023" data-name="Chips Tag">
                <p className="leading-[1.35] relative shrink-0 text-[#bebfc2] text-[10px]" data-node-id="I507:18023;286:7320">
                  #
                </p>
                <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I507:18023;286:7321">
                  Health
                </p>
              </div>
              <div className="bg-white content-stretch flex gap-[4px] items-center justify-center pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] shrink-0" data-node-id="507:18024" data-name="Chips Tag">
                <p className="leading-[1.35] relative shrink-0 text-[#bebfc2] text-[10px]" data-node-id="I507:18024;286:7320">
                  #
                </p>
                <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="I507:18024;286:7321">
                  Fitness
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="507:18025" data-name="Section Related Articles">
            <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="507:18026" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I507:18026;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="I507:18026;2:4223">
                  Related Articles
                </p>
              </div>
              <div className="content-stretch flex flex-[1_0_0] gap-[10px] h-[30px] items-center min-w-px relative" data-node-id="I507:18026;2:4225" data-name="Right Section" />
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="507:18027" data-name="List Rcommendation">
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="507:18028">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px relative" data-name="Card Related Article">
                  <div className="bg-[#eeeeef] h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I507:18028;290:7826" data-name="Image">
                    <div className="absolute flex inset-0 items-center justify-center" data-node-id="I507:18028;290:7827" style={{ containerType: "size" }}>
                      <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                        <div className="bg-[#eeeeef] relative size-full" data-name="Place Image Here" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start px-[4px] relative shrink-0 w-full" data-node-id="I507:18028;290:7828" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I507:18028;290:7831">
                      10 Hydration Myths Debunked
                    </p>
                    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:18028;290:7829" data-name="Info Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I507:18028;290:7830">
                        Health Tips
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="507:18029" data-name="Card Related Article">
                <div className="bg-[#eeeeef] h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I507:18029;290:7826" data-name="Image">
                  <div className="absolute flex inset-0 items-center justify-center" data-node-id="I507:18029;290:7827" style={{ containerType: "size" }}>
                    <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                      <div className="bg-[#eeeeef] relative size-full" data-name="Place Image Here" />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start px-[4px] relative shrink-0 w-full" data-node-id="I507:18029;290:7828" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I507:18029;290:7831">
                    The Role of Water in Post-Workout Recovery
                  </p>
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:18029;290:7829" data-name="Info Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I507:18029;290:7830">{`Nutrition & Wellness`}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[16px] shrink-0 w-full" data-node-id="507:18030" data-name="Section Related VIdeo">
            <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="507:18031" data-name="Header-Section">
              <div className="content-stretch flex gap-[4px] h-[18px] items-baseline relative shrink-0" data-node-id="I507:18031;2:4222" data-name="Div Title">
                <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[16px] whitespace-nowrap" data-node-id="I507:18031;2:4223">
                  Related Video
                </p>
              </div>
              <div className="content-stretch flex flex-[1_0_0] gap-[10px] h-[30px] items-center min-w-px relative" data-node-id="I507:18031;2:4225" data-name="Right Section" />
            </div>
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-node-id="507:18032" data-name="List Rcommendation">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-start min-w-px relative" data-node-id="507:18033" data-name="Card Related Article">
                <div className="bg-[#eeeeef] h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I507:18033;290:7826" data-name="Image">
                  <div className="absolute flex inset-0 items-center justify-center" data-node-id="I507:18033;290:7827" style={{ containerType: "size" }}>
                    <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                      <div className="bg-[#eeeeef] relative size-full" data-name="Place Image Here" />
                    </div>
                  </div>
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[58px] top-1/2" data-node-id="I507:18033;293:7915" data-name="Play">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay} />
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start px-[4px] relative shrink-0 w-full" data-node-id="I507:18033;290:7828" data-name="Info">
                  <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I507:18033;290:7831">
                    How to Stay Hydrated During Workouts
                  </p>
                  <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:18033;290:7829" data-name="Info Category">
                    <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I507:18033;290:7830">{`Fitness & Nutrition`}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_0_0] flex-row items-center self-stretch" data-node-id="507:18034">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] h-full items-start min-w-px relative" data-name="Card Related Article">
                  <div className="bg-[#eeeeef] h-[160px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-node-id="I507:18034;290:7826" data-name="Image">
                    <div className="absolute flex inset-0 items-center justify-center" data-node-id="I507:18034;290:7827" style={{ containerType: "size" }}>
                      <div className="-scale-x-100 flex-none h-[100cqh] w-[100cqw]">
                        <div className="bg-[#eeeeef] relative size-full" data-name="Place Image Here" />
                      </div>
                    </div>
                    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[58px] top-1/2" data-node-id="I507:18034;293:7915" data-name="Play">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPlay} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[8px] items-start px-[4px] relative shrink-0 w-full" data-node-id="I507:18034;290:7828" data-name="Info">
                    <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] min-w-full not-italic relative shrink-0 text-[#272932] text-[14px] w-[min-content]" data-node-id="I507:18034;290:7831">
                      Hydration Hacks for Busy People
                    </p>
                    <div className="content-stretch flex items-center justify-center relative rounded-[8px] shrink-0" data-node-id="I507:18034;290:7829" data-name="Info Category">
                      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#73a107] text-[12px] whitespace-nowrap" data-node-id="I507:18034;290:7830">{`Health & Wellness`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center pt-[16px] relative shrink-0 w-full" data-node-id="507:17487" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="507:17488" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="507:17489">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="507:17490" data-name="Links">
              <p className="relative shrink-0" data-node-id="507:17491">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="507:17492">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="507:17493">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="507:17494" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="507:17495" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="507:17496" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="507:17497" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="507:17498" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="507:17499" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
