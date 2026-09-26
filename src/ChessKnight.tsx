import { useId } from "react";

/** Original chess-piece illustration, shared by the public pages. */
export function ChessKnight({
  className = "",
  ink = false,
}: {
  className?: string;
  ink?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 240 300"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={`${id}-body`}
          x1="38"
          y1="70"
          x2="195"
          y2="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={ink ? "#819bad" : "#fffdf4"} />
          <stop offset=".48" stopColor={ink ? "#36586e" : "#e9dcc4"} />
          <stop offset="1" stopColor={ink ? "#183649" : "#b9a789"} />
        </linearGradient>
        <linearGradient
          id={`${id}-base`}
          x1="53"
          y1="230"
          x2="197"
          y2="285"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={ink ? "#668398" : "#f5ead4"} />
          <stop offset="1" stopColor={ink ? "#142d40" : "#baa684"} />
        </linearGradient>
      </defs>
      <path
        d="M68 229C70 204 78 183 99 162L121 139L85 148L64 136L42 149C36 152 28 148 24 141L20 132L44 99L71 71L93 62L96 29L117 47L136 27L140 66C180 84 203 121 194 159C190 179 175 196 174 229Z"
        fill={`url(#${id}-body)`}
        stroke={ink ? "#173649" : "#a89576"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M139 67C169 88 182 113 177 142C174 161 158 174 157 193"
        stroke={ink ? "#adc0cb" : "#fff8e7"}
        strokeOpacity=".55"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M123 141C139 122 150 122 157 129M65 136L75 125M54 96L74 86"
        stroke={ink ? "#102b3b" : "#8d795a"}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M86 96L101 91L97 102Z" fill={ink ? "#eef0e8" : "#3b413d"} />
      <path
        d="M47 119L43 127"
        stroke={ink ? "#102b3b" : "#8d795a"}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M72 229H174L183 241H62Z"
        fill={`url(#${id}-base)`}
        stroke={ink ? "#173649" : "#a89576"}
        strokeWidth="2"
      />
      <path
        d="M62 247H184L192 263H54Z"
        fill={`url(#${id}-base)`}
        stroke={ink ? "#173649" : "#a89576"}
        strokeWidth="2"
      />
      <path
        d="M56 266H190C194 266 197 270 198 275L201 286H45L48 275C49 270 52 266 56 266Z"
        fill={`url(#${id}-base)`}
        stroke={ink ? "#173649" : "#a89576"}
        strokeWidth="2"
      />
      <path
        d="M64 250H180M55 271H190"
        stroke={ink ? "#91a9b8" : "#fff8e7"}
        strokeOpacity=".65"
        strokeWidth="2"
      />
    </svg>
  );
}
