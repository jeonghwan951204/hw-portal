// 공통 버튼 — 화면마다 제각각이던 버튼 크기·색을 variant/size 로 통일한다.
// Link 등 다른 요소를 버튼 모양으로 쓰려면 as 로 넘긴다. (<Button as={Link} to="/x">)
const VARIANTS = {
  primary: "border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700",
  secondary: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800",
  outline: "border-blue-200 bg-white text-blue-600 hover:bg-blue-50",
  danger: "border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700",
  dangerOutline: "border-red-200 bg-white text-red-600 hover:bg-red-50",
  ghost: "border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800",
};

const SIZES = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

export const buttonClass = ({ variant = "primary", size = "md", className = "" } = {}) =>
  `inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

export default function Button({ as: Component = "button", variant, size, className, type, ...props }) {
  const typeProps = Component === "button" ? { type: type ?? "button" } : {};
  return <Component {...typeProps} {...props} className={buttonClass({ variant, size, className })} />;
}
