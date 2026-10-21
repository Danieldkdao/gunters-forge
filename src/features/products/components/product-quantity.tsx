"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";

export const ProductQuantity = ({
  quantity, onIncrement, onDecrement, label, size = "sm", min = 1, max = 999, disabled = false,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
  size?: "sm" | "lg";
  min?: number;
  max?: number;
  disabled?: boolean;
}) => (
  <ButtonGroup aria-label={`${label} quantity`}>
    <Button type="button" variant="outline" size={size === "lg" ? "icon-lg" : "icon-sm"}
      aria-label={`Decrease ${label} quantity`} disabled={disabled || quantity <= min} onClick={onDecrement}>
      <MinusIcon aria-hidden="true" />
    </Button>
    <ButtonGroupText className={size === "lg" ? "min-w-12 justify-center text-lg tabular-nums" : "min-w-8 justify-center tabular-nums"}>
      <span aria-live="polite" aria-atomic="true">{quantity}</span>
    </ButtonGroupText>
    <Button type="button" variant="outline" size={size === "lg" ? "icon-lg" : "icon-sm"}
      aria-label={`Increase ${label} quantity`} disabled={disabled || quantity >= max} onClick={onIncrement}>
      <PlusIcon aria-hidden="true" />
    </Button>
  </ButtonGroup>
);
