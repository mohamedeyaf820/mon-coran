import React from "react";

// Seven strokes drawn for the welcome page (24 grid, 1.6 line, round ends). The page does
// not use the icon set of the rest of the app: this keeps its signature its own.

function Svg({ children, size = 20, className }) {
  return (
    <svg
      className={className ? `landing-icon ${className}` : "landing-icon"}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const BookIcon = (props) => (
  <Svg {...props}>
    <path d="M12 6.5C10.2 5.2 7.6 4.7 4 5v13c3.6-.3 6.2.2 8 1.5 1.8-1.3 4.4-1.8 8-1.5V5c-3.6-.3-6.2.2-8 1.5Z" />
    <path d="M12 6.5v13" />
  </Svg>
);

export const HeadphonesIcon = (props) => (
  <Svg {...props}>
    <path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" />
    <path d="M4.5 15.5A1.5 1.5 0 0 1 6 14h1v5H6a1.5 1.5 0 0 1-1.5-1.5v-2Z" />
    <path d="M19.5 15.5A1.5 1.5 0 0 0 18 14h-1v5h1a1.5 1.5 0 0 0 1.5-1.5v-2Z" />
  </Svg>
);

export const HandsIcon = (props) => (
  <Svg {...props}>
    <path d="M12 20.5c-4 0-7-2.2-8-5.5 0-.8.6-1.3 1.3-1 1 .4 2.4 1.2 4 1.2h5.4c1.6 0 3-.8 4-1.2.7-.3 1.3.2 1.3 1-1 3.3-4 5.5-8 5.5Z" />
    <path d="M12 3.5c-1.6 1.4-2.6 3.2-2.6 5 0 1.8 1.2 3.5 2.6 3.5s2.6-1.7 2.6-3.5c0-1.8-1-3.6-2.6-5Z" />
  </Svg>
);

export const PhoneIcon = (props) => (
  <Svg {...props}>
    <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M10.5 18.5h3" />
  </Svg>
);

/** Points to the inline end; the stylesheet mirrors it in right-to-left. */
export const ArrowIcon = (props) => (
  <Svg {...props} className="landing-icon--arrow">
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Svg>
);

export const PlayIcon = (props) => (
  <Svg {...props}>
    <path d="M8 5.5v13l10-6.5-10-6.5Z" />
  </Svg>
);

export const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
