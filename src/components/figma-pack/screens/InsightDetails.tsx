import { FigmaPatientUnreadBadge } from '../FigmaPatientUnreadBadge';
import { FigmaInsightDetail } from '../FigmaInsights';
import { useFigmaPatientName } from '../FigmaPatientIdentity';
import planVLogo from '../../../assets/plan-v-logo-256.png';
const assetPathPrefix = "/figma/screens/InsightDetails";
const imgNumber = `${assetPathPrefix}/41ecb.svg`;
const imgIconNavSquaresFour = `${assetPathPrefix}/13d26.svg`;
const imgIconNavCalendarDots = `${assetPathPrefix}/5fb75.svg`;
const imgIconNavChatTeardropDots = `${assetPathPrefix}/9661f.svg`;
const imgIconNavForkKnife = `${assetPathPrefix}/22b1d.svg`;
const imgIconNavBowlFood = `${assetPathPrefix}/ac3fd.svg`;
const imgIconCaretDown = `${assetPathPrefix}/d9ad9.svg`;
const imgIconNavNotebook = `${assetPathPrefix}/764e2.svg`;
const imgIconNavChartLineUp = `${assetPathPrefix}/75bf3.svg`;
const imgIconNavPersonSimpleTaiChi = `${assetPathPrefix}/1e657.svg`;
const imgIconNavHeartbeat = `${assetPathPrefix}/33c19.svg`;
const imgIconNavSignOut = `${assetPathPrefix}/78605.svg`;
const imgIconArrowLeft = `${assetPathPrefix}/980a2.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/2b979.svg`;
const imgIconBell = `${assetPathPrefix}/1f153.svg`;
const imgIconCaretDown1 = `${assetPathPrefix}/20d58.svg`;
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

function ChipsTag({ className }: { className?: string }) {
  return (
    <div className={className || '[word-break:break-word] bg-[#f9f4f2] content-stretch flex font-["Poppins:Regular"] gap-[4px] items-center justify-center not-italic pl-[8px] pr-[10px] py-[7px] relative rounded-[8px] whitespace-nowrap'} data-node-id="286:7322" data-name="Chips Tag">
      <p className="leading-[1.35] relative shrink-0 text-[#bebfc2] text-[10px]" data-node-id="286:7320">
        #
      </p>
      <p className="leading-[1.24] relative shrink-0 text-[#272932] text-[11px]" data-node-id="286:7321">
        Hidratación
      </p>
    </div>
  );
}

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

export default function Component34InsightDetailsDesktop() {
  const patientName = useFigmaPatientName();
  return (
    <div className="bg-[#f9f4f2] content-stretch flex items-start relative size-full" data-node-id="279:9301" data-name="34. Insight Details (Desktop)">
      <div className="bg-white content-stretch flex flex-col gap-[28px] items-start px-[20px] py-[28px] relative self-stretch shrink-0 w-[223px]" data-node-id="279:9302" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start px-[8px] py-[9px] relative shrink-0 w-full" data-node-id="I279:9302;2:4497" data-name="Header">
          <div className="h-[32px] relative shrink-0 w-full" data-node-id="I279:9302;2:4498" data-name="Logo">
            <img src={planVLogo} alt="Plan V Nutrición" className="figma-planv-logo" />
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px relative w-full" data-node-id="I279:9302;2:4499" data-name="Menu Nav">
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4500" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4500;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSquaresFour} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4500;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4500;2:3296">
                Inicio
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4501" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4501;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavCalendarDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4501;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4501;2:3296">
                Calendario
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4505" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4505;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChatTeardropDots} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4505;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4505;2:3296">
                Mensajes
              </p>
            </div>
            <FigmaPatientUnreadBadge variant="nav" className="content-stretch flex flex-col items-center justify-center p-[4px] relative shrink-0 size-[20px]" nodeId="I279:9302;2:4505;2:3297" />
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4502" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4502;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavForkKnife} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4502;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4502;2:3296">
                Menú saludable
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4503" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4503;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavBowlFood} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4503;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4503;2:3296">
                Plan de comidas
              </p>
            </div>
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I279:9302;2:4503;2:3298" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I279:9302;2:4503;2:3299" data-name="Icon/CaretDown">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown} />
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4504" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4504;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavNotebook} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4504;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4504;2:3296">
                Diario de comidas
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4506" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4506;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavChartLineUp} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4506;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4506;2:3296">
                Progreso
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4509" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4509;2:3294" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleTaiChi} />
            </div>
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4509;2:3295" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4509;2:3296">
                Ejercicios
              </p>
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[12px] items-center pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;12:1059" data-name="Button Nav">
            <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;12:1059;2:3290" data-name="Icon/Nav/SquaresFour">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavHeartbeat} />
            </div>
            <div className="content-stretch flex items-center pr-[2px] relative shrink-0" data-node-id="I279:9302;12:1059;2:3291" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;12:1059;2:3292">
                Consejos de salud
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffcb65] content-stretch flex flex-col gap-[12px] items-start justify-end p-[16px] relative rounded-[16px] shrink-0 w-full" data-node-id="I279:9302;2:4510" data-name="Promotional Banner">
          <div className="h-[77px] relative shrink-0 w-full" data-node-id="I279:9302;2:4511" data-name="Image" />
          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-node-id="I279:9302;2:4515" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[0] not-italic relative shrink-0 text-[#272932] text-[0px] w-full" data-node-id="I279:9302;2:4517">
              <span className="leading-[1.5] text-[12px]">¿Necesitás ajustar tu plan?</span>
              <span className="font-['Poppins:Bold'] leading-[1.5] text-[12px]">{` Hablá con tu nutricionista`}</span>
              <span className="leading-[1.5] text-[12px]">{` desde Plan V.`}</span>
            </p>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[14px] py-[8px] relative rounded-[10px] shrink-0" data-node-id="I279:9302;2:4518" data-name="Button">
            <div className="content-stretch flex items-center py-[3px] relative shrink-0" data-node-id="I279:9302;2:4518;2:3334" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#272932] text-[12px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4518;2:3335">
                Enviar mensaje
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#f9f4f2] content-stretch flex gap-[12px] items-center overflow-clip pl-[16px] pr-[8px] py-[10px] relative rounded-[14px] shrink-0 w-full" data-node-id="I279:9302;2:4519" data-name="Button Nav">
          <div className="relative shrink-0 size-[20px]" data-node-id="I279:9302;2:4519;2:3294" data-name="Icon/Nav/SquaresFour">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavSignOut} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center min-w-px pr-[2px] relative" data-node-id="I279:9302;2:4519;2:3295" data-name="Text">
            <p className="[word-break:break-word] font-['Poppins:Medium'] leading-none not-italic relative shrink-0 text-[#8a8c90] text-[14px] text-center whitespace-nowrap" data-node-id="I279:9302;2:4519;2:3296">
              Cerrar sesión
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[28px] items-start min-w-px overflow-clip p-[28px] relative" data-node-id="279:9303" data-name="Content">
        <div className="content-stretch flex h-[50px] items-center justify-between pl-[4px] relative shrink-0 w-full" data-node-id="281:9776" data-name="Header">
          <div className="content-stretch flex flex-col gap-[6px] items-start py-[2px] relative shrink-0 w-[340px]" data-node-id="I281:9776;2:4472" data-name="Title">
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I281:9776;2:4473" data-name="Back Button">
              <div className="relative shrink-0 size-[16px]" data-node-id="I281:9776;2:4474" data-name="Icon/ArrowLeft">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.3] not-italic relative shrink-0 text-[#8a8c90] text-[12px] whitespace-nowrap" data-node-id="I281:9776;2:4475">
                Volver a consejos de salud
              </p>
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[1.08] min-w-full not-italic relative shrink-0 text-[#272932] text-[22px] w-[min-content]" data-node-id="I281:9776;2:4476">
              Detalle del consejo
            </p>
          </div>
          <div className="content-stretch flex gap-[12px] items-center relative rounded-[28px] shrink-0" data-node-id="I281:9776;2:4477" data-name="Header Menu">
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I281:9776;2:4478" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I281:9776;2:4478;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="bg-[#f9f4f2] content-stretch flex gap-[8px] items-start p-[9px] relative rounded-[12px] shrink-0" data-node-id="I281:9776;2:4479" data-name="Button Icon">
              <div className="relative shrink-0 size-[22px]" data-node-id="I281:9776;2:4479;2:3570" data-name="Icon/ChatTeardropDots">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
              </div>
              <FigmaPatientUnreadBadge variant="dot" className="absolute content-stretch flex flex-col items-center justify-center p-[4px] right-[4px] size-[20px] top-[4px]" nodeId="I281:9776;2:4479;2:3571" />
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="I281:9776;33:1604" data-name="User Profile">
              <div className="overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="I281:9776;33:1605" data-name="Avatar">
                <div className="absolute bg-[#ffcb65] inset-0" data-node-id="I281:9776;33:1605;2:3098" data-name="User Image/12">
                  <div className="absolute bg-[#ffcb65] inset-0 rounded-[12px]" data-node-id="I281:9776;33:1605;2:3098;2:3159" data-name="Place Image Here" />
                </div>
              </div>
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 whitespace-nowrap" data-node-id="I281:9776;33:1606" data-name="User Name">
                <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#272932] text-[16px]" data-node-id="I281:9776;33:1607">{patientName}</p>
                <p className="font-['Poppins:Regular'] relative shrink-0 text-[#8a8c90] text-[11px]" data-node-id="I281:9776;33:1608">
                  Miembro
                </p>
              </div>
              <div className="flex flex-row items-center self-stretch" data-node-id="I281:9776;33:1609">
                <div className="bg-[#f9f4f2] content-stretch flex h-full items-center justify-center p-[5px] relative rounded-[12px] shrink-0" data-name="Button Icon">
                  <div className="relative shrink-0 size-[16px]" data-node-id="I281:9776;33:1609;2:3582" data-name="Icon/ChatTeardropDots">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCaretDown1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[36px] items-start min-h-[842px] relative shrink-0 w-full" data-node-id="281:9807" data-name="Body"><FigmaInsightDetail variant="desktop" /></div>
        <div className="content-stretch flex gap-[12px] h-[20px] items-center relative shrink-0 w-full" data-node-id="279:9361" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] gap-[24px] items-start leading-[1.3] min-w-px not-italic relative text-[12px] whitespace-nowrap" data-node-id="279:9362" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="279:9363">
              © 2026 Plan V
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[16px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="279:9364" data-name="Links">
              <p className="relative shrink-0" data-node-id="279:9365">
                Política de privacidad
              </p>
              <p className="relative shrink-0" data-node-id="279:9366">
                Términos y condiciones
              </p>
              <p className="relative shrink-0" data-node-id="279:9367">
                Contacto
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="279:9368" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9369" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9370" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9371" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9372" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="279:9373" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
