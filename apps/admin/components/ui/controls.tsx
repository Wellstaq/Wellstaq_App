import * as React from "react";
import { Button as SharedButton, type ButtonProps } from "@wellstaq/ui/button";
import { Input as SharedInput, type InputProps } from "@wellstaq/ui/input";
import { cn } from "@wellstaq/ui/utils";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, ...props }, ref) {
  return <SharedButton ref={ref} className={cn(className, "h-10 py-0")} {...props} />;
});

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return <SharedInput ref={ref} className={cn(className, "h-10 py-0")} {...props} />;
});
