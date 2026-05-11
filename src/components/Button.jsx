function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-brand-red to-rose-500 text-white hover:from-rose-500 hover:to-brand-red shadow-[0_8px_18px_rgba(255,77,109,0.35)]",
    secondary:
      "bg-gradient-to-r from-brand-blue to-cyan-400 text-white hover:from-cyan-400 hover:to-brand-blue shadow-[0_8px_18px_rgba(59,130,246,0.35)]",
    ghost: "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200",
    warning:
      "bg-gradient-to-r from-brand-yellow to-amber-300 text-amber-900 hover:from-amber-300 hover:to-brand-yellow shadow-[0_8px_18px_rgba(250,204,21,0.35)]",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-2.5 text-sm sm:text-base",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`rounded-2xl font-extrabold tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
