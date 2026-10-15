// Código de estructura generado por Figma MCP para el nodo 72:1490.
const assetPathPrefix = "/figma/dashboard/72-1490";;
const imgIconDotsThree = `${assetPathPrefix}/74332.svg`;
const imgDonutBase = `${assetPathPrefix}/f641d.svg`;
const imgMaskGroup = `${assetPathPrefix}/35603.svg`;
const imgDonutProgress = `${assetPathPrefix}/16730.svg`;
const imgVector10 = `${assetPathPrefix}/28578.svg`;
const imgEllipseBase = `${assetPathPrefix}/596c8.svg`;
const imgDonutBase1 = `${assetPathPrefix}/57c0c.svg`;
const imgDonutProgress1 = `${assetPathPrefix}/1af77.svg`;
const imgIconSpecialLightning = `${assetPathPrefix}/ea252.svg`;
const imgIconSpecialForkKnife = `${assetPathPrefix}/63f81.svg`;
const imgIconSpecialFire = `${assetPathPrefix}/2b142.svg`;

type ItemListMacronutrientsProps = {
  className?: string;
  amount?: string;
  nutrients?: string;
  percentage?: string;
  unit?: string;
};

function ItemListMacronutrients({ className, amount = "120", nutrients = "Carbohidratos", percentage = "37%", unit = "/325gr" }: ItemListMacronutrientsProps) {
  return (
    <div className={className || "bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] w-[823px]"} data-node-id="67:706" data-name="Item List Macronutrients">
      <div className="[word-break:break-word] bg-[#eeeeef] content-stretch flex items-baseline justify-between not-italic px-[12px] py-[8px] relative rounded-[10px] shrink-0 w-[89px] whitespace-nowrap" data-node-id="67:675" data-name="Current Weight">
        <p className="font-['Poppins:Bold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="67:676">
          {amount}
        </p>
        <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="67:677">
          {unit}
        </p>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-node-id="67:683" data-name="Main Data">
        <div className="[word-break:break-word] content-stretch flex items-start justify-between leading-[1.24] not-italic relative shrink-0 text-[11px] w-full whitespace-nowrap" data-node-id="67:680" data-name="Header">
          <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="67:678">
            {nutrients}
          </p>
          <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="67:679">
            {percentage}
          </p>
        </div>
        <div className="bg-white content-stretch flex flex-col items-start pr-[114.03px] relative rounded-[6px] shrink-0 w-full" data-node-id="67:682" data-name="Chart">
          <div className="bg-[#c2e66e] h-[6px] relative rounded-[6px] shrink-0 w-full" data-node-id="67:681" data-name="Progress Bar" />
        </div>
      </div>
    </div>
  );
}

export default function SectionWeightNutrients() {
  return (
    <div className="content-stretch flex gap-[20px] items-center relative size-full" data-node-id="72:1490" data-name="Section Weight & Nutrients">
      <div className="bg-white content-stretch flex flex-col h-[306px] items-center relative rounded-[16px] shrink-0 w-[265px]" data-node-id="57:1509" data-name="Widget Weight Data">
        <div className="bg-white content-stretch flex flex-col gap-[16px] items-center pb-[24px] pt-[16px] px-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="62:1511" data-name="Main">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="56:1350" data-name="Header-Section">
            <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-840px] relative shrink-0" data-node-id="I56:1350;2:4222" data-name="Div Title">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I56:1350;2:4223">
                Datos de peso
              </p>
            </div>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I56:1350;2:4225" data-name="Right Section">
              <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I56:1350;2:4233" data-name="Button More">
                <div className="relative shrink-0 size-[24px]" data-node-id="I56:1350;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
                </div>
              </div>
            </div>
          </div>
          <div className="h-[127px] overflow-clip relative shrink-0 w-[204px]" data-node-id="56:1463" data-name="Chart">
            <div className="absolute inset-[0_0_-60.63%_0]" data-node-id="56:1464" data-name="Donut Base">
              <div className="absolute bottom-1/2 left-[47.16%] right-[0.17%] top-0">
                <img alt="" className="block max-w-none size-full" src={imgDonutBase} />
              </div>
            </div>
            <div className="absolute left-0 size-[204px] top-0" data-node-id="62:1553" data-name="Mask group">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMaskGroup} />
            </div>
            <div className="absolute inset-[0_0_-60.63%_0]" data-node-id="62:1512" data-name="Donut Progress">
              <div className="absolute bottom-1/2 left-[0.17%] right-[55.14%] top-[1.01%]">
                <img alt="" className="block max-w-none size-full" src={imgDonutProgress} />
              </div>
            </div>
            <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[8px] items-center left-[49px] not-italic top-[52px] w-[106px] whitespace-nowrap" data-node-id="57:1474" data-name="Info Current Weight">
              <div className="content-stretch flex gap-[3px] items-end leading-[1.08] relative shrink-0 text-[#272932]" data-node-id="57:1473" data-name="Current Weight">
                <p className="font-['Poppins:Bold'] relative shrink-0 text-[26px]" data-node-id="56:1466">
                  78
                </p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[24px]" data-node-id="57:1471">
                  kg
                </p>
              </div>
              <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="56:1470">
                Peso actual
              </p>
            </div>
            <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Poppins:Regular'] leading-[1.24] left-[102px] not-italic text-[#8a8c90] text-[11px] text-center top-[111px] whitespace-nowrap" data-node-id="62:1538">
              13 kg restantes
            </p>
            <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.25] left-[12px] not-italic text-[#8a8c90] text-[14px] text-center top-[109px] w-[24px]" data-node-id="56:1468">
              85
            </p>
            <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[1.25] not-italic right-[12px] text-[#8a8c90] text-[14px] text-center top-[109px] translate-x-1/2 w-[24px]" data-node-id="56:1469">
              65
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-between min-h-px pb-[16px] pt-[8px] px-[16px] relative rounded-[12px] w-full" data-node-id="57:1510" data-name="Motivational Note">
          <div className="h-0 relative shrink-0 w-full" data-node-id="68:1234">
            <div className="absolute inset-[-1px_-0.43%]">
              <img alt="" className="block max-w-none size-full" src={imgVector10} />
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#52545b] text-[11px] text-center w-full" data-node-id="57:1475">
            <span className="leading-[1.6]">{`Cada avance cuenta, a tu ritmo y con acompañamiento. `}</span>
            <span className="leading-[1.6]">🎉</span>
          </p>
        </div>
      </div>
      <div className="bg-white content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px p-[16px] relative rounded-[16px]" data-node-id="62:1513" data-name="Widget Calories Intake">
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="62:1514" data-name="Header-Section">
          <div className="content-stretch flex gap-[4px] h-[18px] items-baseline mr-[-6px] relative shrink-0" data-node-id="I62:1514;2:4222" data-name="Div Title">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.25] not-italic relative shrink-0 text-[#272932] text-[14px] whitespace-nowrap" data-node-id="I62:1514;2:4223">
              Calorías consumidas
            </p>
          </div>
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="I62:1514;2:4225" data-name="Right Section">
            <div className="content-stretch flex items-start p-[3px] relative rounded-[5px] shrink-0" data-node-id="I62:1514;2:4233" data-name="Button More">
              <div className="relative shrink-0 size-[24px]" data-node-id="I62:1514;2:4233;2:3576" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-node-id="62:1634" data-name="Body">
          <div className="relative shrink-0 size-[228px]" data-node-id="62:1515" data-name="Chart">
            <div className="absolute inset-[0_-0.25%_0_0.25%]" data-node-id="68:1233" data-name="Ellipse Base">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipseBase} />
            </div>
            <div className="absolute inset-[7.41%_6.94%_7.41%_7.87%]" data-node-id="62:1516" data-name="Donut Base">
              <div className="absolute inset-[-1.03%]">
                <img alt="" className="block max-w-none size-full" src={imgDonutBase1} />
              </div>
            </div>
            <div className="absolute inset-[4.63%_4.17%_4.63%_5.09%]" data-node-id="62:1517" data-name="Donut Progress">
              <div className="absolute bottom-[8.94%] left-1/2 right-0 top-0">
                <img alt="" className="block max-w-none size-full" src={imgDonutProgress1} />
              </div>
            </div>
            <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col gap-[8px] items-center left-[calc(50%-0.5px)] top-[calc(50%-8px)] w-[106px]" data-node-id="62:1518" data-name="Info Current Weight">
              <div className="relative shrink-0 size-[32px]" data-node-id="62:1624" data-name="Icon/Special/Lightning">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialLightning} />
              </div>
              <div className="[word-break:break-word] content-stretch flex gap-[3px] items-end leading-[1.08] not-italic relative shrink-0 text-[#272932] text-[22px] whitespace-nowrap" data-node-id="62:1519" data-name="Current Weight">
                <p className="font-['Poppins:SemiBold'] relative shrink-0" data-node-id="62:1520">
                  1240
                </p>
                <p className="font-['Poppins:Regular'] relative shrink-0" data-node-id="62:1521">
                  kcal
                </p>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="62:1522">
                Calorías restantes
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative" data-node-id="62:1643" data-name="Data">
            <div className="content-stretch flex items-center justify-between pr-[4px] relative shrink-0 w-full" data-node-id="67:728" data-name="Detail Calories">
              <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="62:1645" data-name="Detail Calories">
                <div className="content-stretch flex gap-[10px] items-center py-[4px] relative shrink-0" data-node-id="62:1627" data-name="Info Eaten Calories">
                  <div className="bg-[#dff9a2] content-stretch flex items-center px-[8px] py-[10px] relative rounded-[20px] shrink-0" data-node-id="67:765" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="62:1628" data-name="Icon/Special/ForkKnife">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialForkKnife} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="62:1664" data-name="Info">
                    <div className="content-stretch flex gap-[3px] items-baseline relative shrink-0 text-[#272932]" data-node-id="62:1629" data-name="Current Weight">
                      <p className="font-['Poppins:SemiBold'] leading-[1.2] relative shrink-0 text-[18px]" data-node-id="62:1630">
                        1750
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[16px]" data-node-id="62:1631">
                        kcal
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="62:1632">
                      Calorías ingeridas
                    </p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="62:1647" data-name="Detail Calories">
                <div className="content-stretch flex gap-[10px] items-center py-[4px] relative shrink-0" data-node-id="62:1656" data-name="Info Burned Calories">
                  <div className="bg-[#dff9a2] content-stretch flex items-center px-[8px] py-[10px] relative rounded-[20px] shrink-0" data-node-id="67:766" data-name="Icon">
                    <div className="relative shrink-0 size-[16px]" data-node-id="62:1657" data-name="Icon/Special/Fire">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialFire} />
                    </div>
                  </div>
                  <div className="[word-break:break-word] content-stretch flex flex-col items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="62:1665" data-name="Info">
                    <div className="content-stretch flex gap-[3px] items-baseline relative shrink-0 text-[#272932]" data-node-id="62:1658" data-name="Current Weight">
                      <p className="font-['Poppins:SemiBold'] leading-[1.2] relative shrink-0 text-[18px]" data-node-id="62:1659">
                        510
                      </p>
                      <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[16px]" data-node-id="62:1660">
                        kcal
                      </p>
                    </div>
                    <p className="font-['Poppins:Regular'] leading-[1.24] relative shrink-0 text-[#8a8c90] text-[11px] text-center" data-node-id="62:1661">
                      Calorías gastadas
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-node-id="67:727" data-name="List Macronutrients">
              <ItemListMacronutrients className="bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] shrink-0 w-full" />
              <div className="bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] shrink-0 w-full" data-node-id="67:707" data-name="Item List Macronutrients">
                <div className="[word-break:break-word] bg-[#eeeeef] content-stretch flex items-baseline justify-between not-italic px-[12px] py-[8px] relative rounded-[10px] shrink-0 w-[89px] whitespace-nowrap" data-node-id="I67:707;67:675" data-name="Current Weight">
                  <p className="font-['Poppins:Bold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="I67:707;67:676">
                    70
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I67:707;67:677">
                    /75gr
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-node-id="I67:707;67:683" data-name="Main Data">
                  <div className="[word-break:break-word] content-stretch flex items-start justify-between leading-[1.24] not-italic relative shrink-0 text-[11px] w-full whitespace-nowrap" data-node-id="I67:707;67:680" data-name="Header">
                    <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="I67:707;67:678">
                      Proteínas
                    </p>
                    <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="I67:707;67:679">
                      93%
                    </p>
                  </div>
                  <div className="bg-white content-stretch flex flex-col items-start pr-[11.34px] relative rounded-[6px] shrink-0 w-full" data-node-id="I67:707;67:682" data-name="Chart">
                    <div className="bg-[#c2e66e] h-[6px] relative rounded-[6px] shrink-0 w-full" data-node-id="I67:707;67:681" data-name="Progress Bar" />
                  </div>
                </div>
              </div>
              <div className="bg-[#f6f6f7] content-stretch flex gap-[16px] items-center pr-[16px] relative rounded-[12px] shrink-0 w-full" data-node-id="67:717" data-name="Item List Macronutrients">
                <div className="[word-break:break-word] bg-[#eeeeef] content-stretch flex items-baseline justify-between not-italic px-[12px] py-[8px] relative rounded-[10px] shrink-0 w-[89px] whitespace-nowrap" data-node-id="I67:717;67:675" data-name="Current Weight">
                  <p className="font-['Poppins:Bold'] leading-[1.2] relative shrink-0 text-[#272932] text-[18px]" data-node-id="I67:717;67:676">
                    20
                  </p>
                  <p className="font-['Poppins:Regular'] leading-[1.35] relative shrink-0 text-[#52545b] text-[9px]" data-node-id="I67:717;67:677">
                    /44gr
                  </p>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-node-id="I67:717;67:683" data-name="Main Data">
                  <div className="[word-break:break-word] content-stretch flex items-start justify-between leading-[1.24] not-italic relative shrink-0 text-[11px] w-full whitespace-nowrap" data-node-id="I67:717;67:680" data-name="Header">
                    <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90]" data-node-id="I67:717;67:678">
                      Grasas
                    </p>
                    <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932]" data-node-id="I67:717;67:679">
                      45%
                    </p>
                  </div>
                  <div className="bg-white content-stretch flex flex-col items-start pr-[89.1px] relative rounded-[6px] shrink-0 w-full" data-node-id="I67:717;67:682" data-name="Chart">
                    <div className="bg-[#c2e66e] h-[6px] relative rounded-[6px] shrink-0 w-full" data-node-id="I67:717;67:681" data-name="Progress Bar" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
