import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="M7 16.5a2.5 2.5 0 0 1-5 0" />
      <path d="M11.5 12a2.5 2.5 0 0 1-5 0" />
      <path d="M16.5 7.5a2.5 2.5 0 0 1-5 0" />
      <path d="M21 3a2.5 2.5 0 0 1-5 0" />
      <path d="M16.5 16.5a2.5 2.5 0 0 1-5 0" />
      <path d="M12 12a2.5 2.5 0 0 1 5 0" />
      <path d="M7.5 7.5a2.5 2.5 0 0 1 5 0" />
      <path d="M21 7.5a2.5 2.5 0 0 1-5 0" />
      <path d="M7.5 16.5a2.5 2.5 0 0 1 5 0" />
      <path d="M12 21a2.5 2.5 0 0 1 5 0" />
      <path d="M3 21a2.5 2.5 0 0 1 5 0" />
      <path d="M21 12a2.5 2.5 0 0 1-5 0" />
    </svg>
  );
}
