"use client";

/* eslint-disable */
import * as React from "react";
import { Button as SensoryButton } from "./sensory-ui/button";
import { buttonVariants } from "./button";
import type { VariantProps } from "class-variance-authority";

export interface OmoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Disable the sensory sound explicitly if needed */
  sound?: false | string;
}

/**
 * Global Sensory UI Integration Wrapper
 * All interactive elements in OmoZoku must use this wrapper to ensure
 * consistent tactile interaction, sound, and glassmorphic styling.
 */
const OmoButton = React.forwardRef<HTMLButtonElement, OmoButtonProps>(
  ({ className, variant, size, sound, ...props }, ref) => {
    return (
      <SensoryButton
        ref={ref}
        variant={variant as any}
        size={size as any}
        className={className}
        sound={sound as any}
        {...props}
      />
    );
  }
);
OmoButton.displayName = "OmoButton";

export { OmoButton };
