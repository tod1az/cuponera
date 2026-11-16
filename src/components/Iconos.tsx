type P = { className?: string };
const svg = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const IconoCopiar = ({ className = "size-5" }: P) => (
  <svg {...svg} className={className}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);

export const IconoCheck = ({ className = "size-5" }: P) => (
  <svg {...svg} className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconoFlecha = ({ className = "size-4" }: P) => (
  <svg {...svg} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconoMas = ({ className = "size-6" }: P) => (
  <svg {...svg} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconoSubir = ({ className = "size-7" }: P) => (
  <svg {...svg} className={className}>
    <path d="M12 15V3M7 8l5-5 5 5" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  </svg>
);

export const IconoChevron = ({ className = "size-5" }: P) => (
  <svg {...svg} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconoBasura = ({ className = "size-4" }: P) => (
  <svg {...svg} className={className}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
);

export const IconoDeshacer = ({ className = "size-4" }: P) => (
  <svg {...svg} className={className}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);
