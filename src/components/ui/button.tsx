import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-mono ring-offset-background transition-all duration-75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase",
  {
    variants: {
      variant: {
        default:
          "border border-foreground bg-background text-foreground hover:border-accent hover:text-accent hover:shadow-accent-glow",
        lockin:
          "border border-accent text-accent shadow-accent-glow font-display text-[10px] hover:bg-accent hover:text-background",
        lockinDisabled:
          "border border-muted-foreground text-muted-foreground font-display text-[10px] cursor-not-allowed",
        ghost:
          "text-muted-foreground hover:text-foreground",
        accent:
          "bg-accent text-background font-display text-[10px] border border-accent hover:shadow-accent-glow",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-8 py-3",
        full: "px-4 py-2 w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
