/** Flat ink-and-paper illustration, used only in the opening scene. */
export function ChessKnight({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 480"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        stroke="#29465f"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M120 373C127 322 160 283 173 240L133 259L91 245L70 216L142 134L155 76L196 102L218 63L238 119C297 153 308 212 281 268C262 308 255 342 273 373Z"
          fill="#ede3cb"
        />
        <path
          d="M238 119C297 153 308 212 281 268C262 308 255 342 273 373H232C220 337 232 292 250 252C272 203 260 158 238 119Z"
          fill="#8fa7b5"
          stroke="none"
        />
        <path d="M218 88L211 125C251 155 265 196 247 241" />
        <path d="M152 148L180 140M89 219L117 223L142 209M173 240L200 211" />
        <path d="M134 284C159 281 176 271 187 258" />
        <circle cx="164" cy="167" r="6" fill="#29465f" stroke="none" />
        <path d="M158 105L169 123M234 153L245 143M246 177L261 171M252 203L269 200M249 228L265 231" />
        <path d="M119 373H274L286 398H105Z" fill="#ede3cb" />
        <path d="M111 398H280L299 428H91Z" fill="#8fa7b5" />
        <path d="M94 428H297V444H94Z" fill="#ede3cb" />
        <path d="M131 386H258M123 414H266" strokeWidth="2" />
      </g>
      <g stroke="#8fa7b5" strokeWidth="2" strokeLinecap="round">
        <path d="M72 124L61 112M64 143H46M302 95V119M290 107H314M322 299L334 287M328 317H346" />
      </g>
    </svg>
  );
}
