import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b57d0] focus-visible:ring-offset-2";

  const sizeStyles = {
    sm: "text-xs px-3.5 py-1.5 rounded-full gap-1.5",
    md: "text-sm px-5 py-2.5 rounded-full gap-2",
    lg: "text-base px-6 py-3 rounded-full gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-[#0b57d0] text-white hover:bg-[#0842a0] active:bg-[#06327a] shadow-xs",
    secondary:
      "bg-[#d3e3fd] text-[#041e49] hover:bg-[#c2e7ff] active:bg-[#b0dcff]",
    outline:
      "border border-[#e0e3e7] text-[#1f1f1f] bg-white hover:bg-[#f0f4f9] active:bg-[#e4ebf5]",
    ghost:
      "text-[#444746] hover:text-[#1f1f1f] hover:bg-[#f0f4f9] active:bg-[#e4ebf5]",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === "right" && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
};
