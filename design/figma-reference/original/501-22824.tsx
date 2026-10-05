const assetPathPrefix = "https://www.figma.com/api/mcp/asset/37779fa0-7500-420e-b90c-0f3416172f78";
const imgIconList = `${assetPathPrefix}/91e78.svg`;
const imgIconMagnifyingGlass = `${assetPathPrefix}/843cb.svg`;
const imgIconDotsThree = `${assetPathPrefix}/b443c.svg`;
const imgIconPlus = `${assetPathPrefix}/6e435.svg`;
const imgIconSort = `${assetPathPrefix}/5ef2f.svg`;
const imgIconSpecialPersonSimpleSquat = `${assetPathPrefix}/28a78.svg`;
const imgIconSpecialPersonSimpleDeadlifts = `${assetPathPrefix}/c4ef9.svg`;
const imgIconSpecialPersonSimpleBenchPress = `${assetPathPrefix}/af529.svg`;
const imgIconSpecialPersonSimplePullUps = `${assetPathPrefix}/21cfd.svg`;
const imgIconSpecialPersonSimplePlank = `${assetPathPrefix}/c909d.svg`;
const imgIconNavPersonSimpleRun = `${assetPathPrefix}/d724b.svg`;
const imgIconSpecialPersonSimpleLunges = `${assetPathPrefix}/92c0e.svg`;
const imgIconSpecialBarbell = `${assetPathPrefix}/5b565.svg`;
const imgIconSpecialPersonSimpleBicepCurls = `${assetPathPrefix}/7f465.svg`;
const imgPersonSimpleBike = `${assetPathPrefix}/e22bc.svg`;
const imgIconSpecialPersonSimpleMountClimbers = `${assetPathPrefix}/916ca.svg`;
const imgIconSpecialPersonYoga = `${assetPathPrefix}/61936.svg`;
const imgFacebookLogo = `${assetPathPrefix}/55106.svg`;
const imgTwitterLogo = `${assetPathPrefix}/2e99e.svg`;
const imgInstagramLogo = `${assetPathPrefix}/3de81.svg`;
const imgYoutubeLogo = `${assetPathPrefix}/1c262.svg`;
const imgLinkedinLogo = `${assetPathPrefix}/228c2.svg`;

type BadgeStatusExercisesProps = {
  className?: string;
  status?: "Completed" | "Not Started";
};

function BadgeStatusExercises({ className, status = "Completed" }: BadgeStatusExercisesProps) {
  const isNotStarted = status === "Not Started";
  return (
    <div className={className || `content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] ${isNotStarted ? "bg-[#e1e1e2]" : "bg-[#c2e66e]"}`} id={isNotStarted ? "node-105_5057" : "node-105_5055"}>
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" id={isNotStarted ? "node-105_5058" : "node-105_5056"}>
        {isNotStarted ? "Not Started" : "Completed"}
      </p>
    </div>
  );
}

export default function Component30ExerciseMobile() {
  return (
    <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start relative shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="501:22824" data-name="30. Exercise (Mobile)">
      <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[390px]" data-node-id="501:22825" data-name="Navbar">
        <div className="content-stretch flex flex-col items-start p-[4px] relative shrink-0" data-node-id="I501:22825;427:15209" data-name="Header">
          <div className="relative shrink-0 size-[24px]" data-node-id="I501:22825;427:15210" data-name="Logo">
            <div className="absolute inset-[6.25%]" data-node-id="I501:22825;427:15210;408:17493" data-name="symbol">
              <div className="absolute bg-[#c2e66e] inset-[53.57%_7.14%_-3.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I501:22825;427:15210;408:17494" data-name="Bowl" />
              <div className="absolute bg-[#ffcb65] inset-[-3.57%_7.14%_53.57%_7.14%] rounded-bl-[12px] rounded-br-[12px]" data-node-id="I501:22825;427:15210;408:17495" data-name="Bowl" />
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[1.24] min-w-px not-italic relative text-[#272932] text-[16px] text-center" data-node-id="I501:22825;433:18077">
          Exercise
        </p>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[12px] shrink-0" data-node-id="I501:22825;445:8578" data-name="Button Nav">
          <div className="relative shrink-0 size-[24px]" data-node-id="I501:22825;445:8579" data-name="Icon/List">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconList} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[24px] items-start overflow-clip px-[16px] py-[24px] relative shrink-0 w-full" data-node-id="501:22826" data-name="Content">
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-node-id="501:23671" data-name="Header-Section">
          <div className="bg-white content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px px-[8px] py-[6px] relative rounded-[8px]" data-node-id="501:23673" data-name="Input-search">
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I501:23673;2:3947" data-name="Icon">
              <div className="relative shrink-0 size-[14px]" data-node-id="I501:23673;2:3948" data-name="Icon/MagnifyingGlass">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMagnifyingGlass} />
              </div>
            </div>
            <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I501:23673;2:3949" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#8a8c90] text-[11px] text-center whitespace-nowrap" data-node-id="I501:23673;2:3950">
                Search for exercise
              </p>
            </div>
          </div>
          <div className="bg-white content-stretch flex items-start p-[6px] relative rounded-[8px] shrink-0" data-node-id="501:23682" data-name="Button More">
            <div className="relative shrink-0 size-[18px]" data-node-id="I501:23682;2:3586" data-name="Icon/ChatTeardropDots">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDotsThree} />
            </div>
          </div>
          <div className="bg-[#c2e66e] content-stretch flex gap-[4px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="501:23683" data-name="Button CTA">
            <div className="content-stretch flex items-center py-[2px] relative shrink-0" data-node-id="I501:23683;2:3314" data-name="Icon Left">
              <div className="relative shrink-0 size-[14px]" data-node-id="I501:23683;2:3315" data-name="Icon/CalendarBlank">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
              </div>
            </div>
            <div className="content-stretch flex items-center px-[2px] relative shrink-0" data-node-id="I501:23683;2:3316" data-name="Text">
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[1.05] not-italic relative shrink-0 text-[#272932] text-[11px] text-center whitespace-nowrap" data-node-id="I501:23683;2:3317">
                Add Exercise
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col items-start overflow-x-auto overflow-y-clip py-[8px] relative rounded-[16px] shrink-0 w-full" data-node-id="501:23703" data-name="Table">
          <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23704" data-name="Table-Row-Exercises">
            <div className="content-stretch flex items-start relative shrink-0 w-[144px]" data-node-id="I501:23704;501:21656" data-name="Cell-Name">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="I501:23704;501:21657">
                Exercise Name
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I501:23704;501:21658" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23704;501:21659" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="I501:23704;501:21660">
                Sets
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I501:23704;501:21661" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[50px]" data-node-id="I501:23704;501:21662" data-name="Cell-Reps">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="I501:23704;501:21663">
                Reps
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I501:23704;501:21664" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[42px]" data-node-id="I501:23704;501:21665" data-name="Cell-Rest">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="I501:23704;501:21666">
                Rest
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I501:23704;501:21667" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[72px]" data-node-id="I501:23704;501:21668" data-name="Cell-Weight">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="I501:23704;501:21669">
                Weight
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I501:23704;501:21670" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[58px]" data-node-id="I501:23704;501:21671" data-name="Cell-Calories">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="I501:23704;501:21672">
                Calories
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I501:23704;501:21673" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23704;501:21674" data-name="Cell-Status">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] not-italic relative shrink-0 text-[#8a8c90] text-[10px] whitespace-nowrap" data-node-id="I501:23704;501:21675">
                Status
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I501:23704;501:21676" data-name="Icon/Sort">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSort} />
              </div>
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23705" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23705;501:21678" data-name="Cell-Name">
              <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23705;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23705;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleSquat} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23705;501:21681">
                Squats
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23705;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23705;501:21683">
                4
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23705;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23705;501:21685">
                12
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23705;501:21686">
                reps
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23705;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23705;501:21688">
                60
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23705;501:21689">
                sec
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23705;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23705;501:21691">
                45
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23705;501:21692">
                kg
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23705;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23705;501:21694">
                180
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23705;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23705;501:21696" data-name="Cell-Status">
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I501:23705;501:21697" data-name="Badge Status - Exercises">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23705;501:21697;105:5056">
                  Completed
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23706" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23706;501:21678" data-name="Cell-Name">
              <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23706;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23706;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleDeadlifts} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23706;501:21681">
                Deadlifts
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23706;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23706;501:21683">
                3
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23706;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23706;501:21685">
                10
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23706;501:21686">
                reps
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23706;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23706;501:21688">
                90
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23706;501:21689">
                sec
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23706;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23706;501:21691">
                60
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23706;501:21692">
                kg
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23706;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23706;501:21694">
                220
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23706;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23706;501:21696" data-name="Cell-Status">
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I501:23706;501:21697" data-name="Badge Status - Exercises">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23706;501:21697;105:5056">
                  Completed
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23707" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23707;501:21678" data-name="Cell-Name">
              <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23707;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23707;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleBenchPress} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23707;501:21681">
                Bench Press
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23707;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23707;501:21683">
                3
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23707;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23707;501:21685">
                8
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23707;501:21686">
                reps
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23707;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23707;501:21688">
                60
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23707;501:21689">
                sec
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23707;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23707;501:21691">
                40
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23707;501:21692">
                kg
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23707;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23707;501:21694">
                150
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23707;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23707;501:21696" data-name="Cell-Status">
              <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I501:23707;501:21697" data-name="Badge Status - Exercises">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23707;501:21697;105:5060">
                  In Progress
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23708" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23708;501:21678" data-name="Cell-Name">
              <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23708;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23708;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimplePullUps} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23708;501:21681">
                Pull-Ups
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23708;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23708;501:21683">
                4
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23708;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23708;501:21685">
                8
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23708;501:21686">
                reps
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23708;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23708;501:21688">
                90
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23708;501:21689">
                sec
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23708;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23708;501:21691">
                Bodyweight
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23708;501:21692">
                ​
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23708;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23708;501:21694">
                120
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23708;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23708;501:21696" data-name="Cell-Status">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I501:23708;501:21697" data-name="Badge Status - Exercises">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23708;501:21697;105:5062">
                  Skipped
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23709" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23709;501:21678" data-name="Cell-Name">
              <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23709;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23709;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimplePlank} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23709;501:21681">
                Plank
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23709;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23709;501:21683">
                3
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23709;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23709;501:21685">
                60
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23709;501:21686">
                reps
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23709;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23709;501:21688">
                30
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23709;501:21689">
                sec
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23709;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23709;501:21691">
                -
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23709;501:21692">
                ​
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23709;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23709;501:21694">
                90
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23709;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23709;501:21696" data-name="Cell-Status">
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I501:23709;501:21697" data-name="Badge Status - Exercises">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23709;501:21697;105:5056">
                  Completed
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23710" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23710;501:21678" data-name="Cell-Name">
              <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23710;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23710;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconNavPersonSimpleRun} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23710;501:21681">
                Running
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23710;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23710;501:21683">
                1
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23710;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23710;501:21685">
                30
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23710;501:21686">
                min
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23710;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23710;501:21688">
                N/A
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23710;501:21689">
                ​
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23710;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23710;501:21691">
                -
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23710;501:21692">
                ​
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23710;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23710;501:21694">
                300
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23710;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23710;501:21696" data-name="Cell-Status">
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I501:23710;501:21697" data-name="Badge Status - Exercises">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23710;501:21697;105:5056">
                  Completed
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23711" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23711;501:21678" data-name="Cell-Name">
              <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23711;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23711;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleLunges} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23711;501:21681">
                Lunges
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23711;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23711;501:21683">
                3
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23711;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23711;501:21685">
                15
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23711;501:21686">
                reps
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23711;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23711;501:21688">
                60
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23711;501:21689">
                sec
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23711;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23711;501:21691">
                20
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23711;501:21692">
                kg
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23711;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23711;501:21694">
                160
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23711;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23711;501:21696" data-name="Cell-Status">
              <BadgeStatusExercises className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" status="Not Started" />
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23712" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23712;501:21678" data-name="Cell-Name">
              <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23712;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23712;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialBarbell} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23712;501:21681">
                Shoulder Press
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23712;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23712;501:21683">
                3
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23712;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23712;501:21685">
                10
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23712;501:21686">
                reps
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23712;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23712;501:21688">
                60
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23712;501:21689">
                sec
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23712;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23712;501:21691">
                25
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23712;501:21692">
                kg
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23712;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23712;501:21694">
                140
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23712;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23712;501:21696" data-name="Cell-Status">
              <BadgeStatusExercises className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" status="Not Started" />
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23713" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23713;501:21678" data-name="Cell-Name">
              <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23713;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23713;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleBicepCurls} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23713;501:21681">
                Bicep Curls
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23713;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23713;501:21683">
                3
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23713;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23713;501:21685">
                12
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23713;501:21686">
                reps
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23713;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23713;501:21688">
                45
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23713;501:21689">
                sec
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23713;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23713;501:21691">
                15
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23713;501:21692">
                kg
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23713;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23713;501:21694">
                110
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23713;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23713;501:21696" data-name="Cell-Status">
              <div className="bg-[#ffa257] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I501:23713;501:21697" data-name="Badge Status - Exercises">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23713;501:21697;105:5062">
                  Skipped
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23714" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23714;501:21678" data-name="Cell-Name">
              <div className="bg-[#c2e66e] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23714;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23714;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPersonSimpleBike} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23714;501:21681">
                Cycling
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23714;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23714;501:21683">
                1
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23714;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23714;501:21685">
                45
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23714;501:21686">
                min
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23714;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23714;501:21688">
                N/A
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23714;501:21689">
                ​
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23714;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23714;501:21691">
                -
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23714;501:21692">
                ​
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23714;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23714;501:21694">
                350
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23714;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23714;501:21696" data-name="Cell-Status">
              <div className="bg-[#c2e66e] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I501:23714;501:21697" data-name="Badge Status - Exercises">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23714;501:21697;105:5056">
                  Completed
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#e1e1e2] border-b border-solid content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23715" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23715;501:21678" data-name="Cell-Name">
              <div className="bg-[#ffcb65] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23715;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23715;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonSimpleMountClimbers} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23715;501:21681">
                Mountain Climbers
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23715;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23715;501:21683">
                4
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23715;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23715;501:21685">
                20
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23715;501:21686">
                reps
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23715;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23715;501:21688">
                30
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23715;501:21689">
                sec
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23715;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23715;501:21691">
                -
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23715;501:21692">
                ​
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23715;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23715;501:21694">
                200
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23715;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23715;501:21696" data-name="Cell-Status">
              <div className="bg-[#ffcb65] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" data-node-id="I501:23715;501:21697" data-name="Badge Status - Exercises">
                <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23715;501:21697;105:5060">
                  In Progress
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white content-stretch flex items-center justify-between p-[16px] relative shrink-0 w-[652px]" data-node-id="501:23716" data-name="Table-Row-Exercises">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[144px]" data-node-id="I501:23716;501:21678" data-name="Cell-Name">
              <div className="bg-[#ffa257] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[10px] shrink-0" data-node-id="I501:23716;501:21679" data-name="Icon">
                <div className="relative shrink-0 size-[14px]" data-node-id="I501:23716;501:21680" data-name="Icon/Special/Barbell">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSpecialPersonYoga} />
                </div>
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23716;501:21681">
                Yoga (Stretching)
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[36px]" data-node-id="I501:23716;501:21682" data-name="Cell-Sets">
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[1.24] not-italic relative shrink-0 text-[#272932] text-[11px] whitespace-nowrap" data-node-id="I501:23716;501:21683">
                1
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[50px] whitespace-nowrap" data-node-id="I501:23716;501:21684" data-name="Cell-Reps">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23716;501:21685">
                60
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23716;501:21686">
                min
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[42px] whitespace-nowrap" data-node-id="I501:23716;501:21687" data-name="Cell-Rest">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23716;501:21688">
                N/A
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23716;501:21689">
                ​
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-center leading-[1.24] not-italic relative shrink-0 text-[11px] w-[72px] whitespace-nowrap" data-node-id="I501:23716;501:21690" data-name="Cell-Weight">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23716;501:21691">
                -
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23716;501:21692">
                ​
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex font-['Poppins:Regular'] gap-[4px] items-start leading-[1.24] not-italic relative shrink-0 text-[11px] w-[58px] whitespace-nowrap" data-node-id="I501:23716;501:21693" data-name="Cell-Calories">
              <p className="relative shrink-0 text-[#272932]" data-node-id="I501:23716;501:21694">
                150
              </p>
              <p className="relative shrink-0 text-[#8a8c90]" data-node-id="I501:23716;501:21695">
                cal
              </p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-[84px]" data-node-id="I501:23716;501:21696" data-name="Cell-Status">
              <BadgeStatusExercises className="bg-[#e1e1e2] content-stretch flex items-center justify-center px-[10px] py-[6px] relative rounded-[8px] shrink-0" status="Not Started" />
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start justify-center pb-[4px] px-[16px] relative shrink-0 w-[358px]" data-node-id="501:24017" data-name="Section Slider">
            <div className="bg-[#f9f4f2] content-stretch flex flex-col items-start pr-[96px] relative rounded-[8px] shrink-0 w-full" data-node-id="501:24018" data-name="Slider">
              <div className="bg-[#e1e1e2] h-[6px] relative rounded-[8px] shrink-0 w-full" data-node-id="501:24019" data-name="Bar" />
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-center relative shrink-0 w-full" data-node-id="501:23221" data-name="Section Footer">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[1.3] not-italic relative shrink-0 text-[12px] w-full whitespace-nowrap" data-node-id="501:23222" data-name="Legal Information">
            <p className="font-['Poppins:SemiBold'] relative shrink-0 text-[#52545b]" data-node-id="501:23223">
              Copyright © 2024 Peterdraw
            </p>
            <div className="content-stretch flex font-['Poppins:Regular'] gap-[20px] items-start relative shrink-0 text-[#8a8c90]" data-node-id="501:23224" data-name="Links">
              <p className="relative shrink-0" data-node-id="501:23225">
                Privacy Policy
              </p>
              <p className="relative shrink-0" data-node-id="501:23226">
                Term and conditions
              </p>
              <p className="relative shrink-0" data-node-id="501:23227">
                Contact
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="501:23228" data-name="Social Media">
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23229" data-name="FacebookLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFacebookLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23230" data-name="TwitterLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTwitterLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23231" data-name="InstagramLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgInstagramLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23232" data-name="YoutubeLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgYoutubeLogo} />
            </div>
            <div className="relative shrink-0 size-[20px]" data-node-id="501:23233" data-name="LinkedinLogo">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLinkedinLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
