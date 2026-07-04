import svgPaths from "./svg-o59yf1wryq";
type LogoProps = {
  className?: string;
  property1?: "full" | "small";
  property2?: "coloured" | "mono" | "mono-blue";
};

export default function Logo({ className, property1 = "full", property2 = "coloured" }: LogoProps) {
  const isFullAndColoured = property1 === "full" && property2 === "coloured";
  const isFullAndIsColouredOrMono = property1 === "full" && ["coloured", "mono"].includes(property2);
  const isFullAndMono = property1 === "full" && property2 === "mono";
  const isSmallAndIsMonoOrMonoBlue = property1 === "small" && ["mono", "mono-blue"].includes(property2);
  const isSmallAndMono = property1 === "small" && property2 === "mono";
  const isSmallAndMonoBlue = property1 === "small" && property2 === "mono-blue";
  return (
    <div className={className || `relative ${isSmallAndIsMonoOrMonoBlue ? "h-[51.149px] w-[77.85px]" : "h-[58.313px] w-[380.302px]"}`}>
      <div className={`absolute ${isSmallAndIsMonoOrMonoBlue ? "inset-[0.5%_0_0_50.95%]" : "inset-[41.6%_0_0_57.91%]"}`} data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox={isSmallAndIsMonoOrMonoBlue ? "0 0 38.1893 50.8937" : "0 0 160.078 34.0573"}>
          <path d={isSmallAndIsMonoOrMonoBlue ? svgPaths.p39ae5100 : svgPaths.p2cd86b00} fill={isSmallAndMono ? "var(--fill-0, #F0FFFF)" : isFullAndMono ? "var(--fill-0, white)" : "var(--fill-0, #203A85)"} id="Vector" />
        </svg>
      </div>
      <div className={`absolute ${isSmallAndIsMonoOrMonoBlue ? "inset-[29.71%_57.54%_54.16%_0]" : "inset-[42.09%_44.03%_12.95%_21.23%]"}`} data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox={isSmallAndIsMonoOrMonoBlue ? "0 0 33.0529 8.25274" : "0 0 132.134 26.2187"}>
          <path d={isSmallAndIsMonoOrMonoBlue ? svgPaths.p124f4040 : svgPaths.p4e29e00} fill={isSmallAndMono ? "var(--fill-0, #F0FFFF)" : isFullAndMono ? "var(--fill-0, white)" : "var(--fill-0, #203A85)"} id="Vector" />
        </svg>
      </div>
      <div className={`absolute ${isSmallAndIsMonoOrMonoBlue ? "inset-[59.17%_57.55%_0.44%_15.98%]" : "inset-[0.44%_79.53%_12.29%_10.43%]"}`} data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox={isSmallAndIsMonoOrMonoBlue ? "0 0 20.6109 20.6573" : "0 0 38.1893 50.8937"}>
          <path d={isSmallAndIsMonoOrMonoBlue ? svgPaths.pd494600 : svgPaths.p39ae5100} fill={isSmallAndMono ? "var(--fill-0, #F0FFFF)" : isFullAndMono ? "var(--fill-0, white)" : "var(--fill-0, #203A85)"} id="Vector" />
        </svg>
      </div>
      <div className={`absolute ${isSmallAndIsMonoOrMonoBlue ? "inset-[0_57.57%_83.85%_15.97%]" : "inset-[26.06%_91.31%_59.79%_0]"}`} data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox={isSmallAndIsMonoOrMonoBlue ? "0 0 20.5987 8.26188" : "0 0 33.0529 8.25274"}>
          <path d={isSmallAndIsMonoOrMonoBlue ? svgPaths.p36a7e700 : svgPaths.p124f4040} fill={isSmallAndMonoBlue ? "var(--fill-0, #203A85)" : isSmallAndMono ? "var(--fill-0, #F0FFFF)" : isFullAndMono ? "var(--fill-0, white)" : "url(#paint0_linear_40_122)"} id="Vector" />
          {isFullAndColoured && (
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_40_122" x1="-0.000369926" x2="33.0417" y1="4.12078" y2="4.12078">
                <stop stopColor="#269381" />
                <stop offset="0.49" stopColor="#1F8697" />
                <stop offset="1" stopColor="#085E98" />
              </linearGradient>
            </defs>
          )}
        </svg>
      </div>
      <div className={`absolute ${isSmallAndIsMonoOrMonoBlue ? "inset-[50.14%_85.29%_33.73%_4.16%]" : "inset-[51.9%_91.31%_12.67%_3.27%]"}`} data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox={isSmallAndIsMonoOrMonoBlue ? "0 0 8.2175 8.25258" : "0 0 20.6109 20.6573"}>
          <path d={isSmallAndIsMonoOrMonoBlue ? svgPaths.p24f08800 : svgPaths.pd494600} fill={isSmallAndMonoBlue ? "var(--fill-0, #203A85)" : isSmallAndMono ? "var(--fill-0, #F0FFFF)" : isFullAndMono ? "var(--fill-0, white)" : "url(#paint0_linear_40_128)"} id="Vector" />
          {isFullAndColoured && (
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_40_128" x1="18.0507" x2="5.16338" y1="0.0537318" y2="16.7645">
                <stop stopColor="#064161" />
                <stop offset="1" stopColor="#166A5B" />
              </linearGradient>
            </defs>
          )}
        </svg>
      </div>
      <div className={`absolute ${isSmallAndIsMonoOrMonoBlue ? "inset-[9.26%_85.28%_74.61%_4.16%]" : "inset-[0_91.31%_85.83%_3.27%]"}`} data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox={isSmallAndIsMonoOrMonoBlue ? "0 0 8.22098 8.25151" : "0 0 20.5987 8.26188"}>
          <path d={isSmallAndIsMonoOrMonoBlue ? svgPaths.p295530f1 : svgPaths.p36a7e700} fill={isSmallAndMonoBlue ? "var(--fill-0, #203A85)" : isSmallAndMono ? "var(--fill-0, #F0FFFF)" : isFullAndMono ? "var(--fill-0, white)" : "url(#paint0_linear_40_126)"} id="Vector" />
          {isFullAndColoured && (
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_40_126" x1="0.00724584" x2="20.611" y1="4.13196" y2="4.13196">
                <stop stopColor="#30B0CD" />
                <stop offset="0.48" stopColor="#2394CC" />
                <stop offset="1" stopColor="#2E74B2" />
              </linearGradient>
            </defs>
          )}
        </svg>
      </div>
      {isFullAndIsColouredOrMono && (
        <>
          <div className="absolute inset-[43.98%_96.99%_41.87%_0.85%]" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.2175 8.25258">
              <path d={svgPaths.p24f08800} fill={isFullAndMono ? "var(--fill-0, white)" : "url(#paint0_linear_40_118)"} id="Vector" />
              {isFullAndColoured && (
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_40_118" x1="1.68758" x2="6.80954" y1="1.38898" y2="7.05176">
                    <stop stopColor="#259184" />
                    <stop offset="1" stopColor="#1A7060" />
                  </linearGradient>
                </defs>
              )}
            </svg>
          </div>
          <div className="absolute inset-[8.12%_96.99%_77.73%_0.85%]" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.22098 8.25151">
              <path d={svgPaths.p295530f1} fill={isFullAndMono ? "var(--fill-0, white)" : "url(#paint0_linear_40_120)"} id="Vector" />
              {isFullAndColoured && (
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_40_120" x1="6.87899" x2="1.37327" y1="0.805604" y2="7.26394">
                    <stop stopColor="#2FAECD" />
                    <stop offset="0.47" stopColor="#3FB9C6" />
                    <stop offset="1" stopColor="#35B4BD" />
                  </linearGradient>
                </defs>
              )}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}