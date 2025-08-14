import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 1行固定＆高さ固定のバッジ
 * - whitespace-nowrap: 折り返し防止
 * - h-*: 高さ固定
 * - leading-none: 縦位置のブレ防止
 * - rounded-full: 常にピル形状
 * - shape=circle: 正円（数字/アイコン用）
 */
const badgeVariants = cva(
    "inline-flex items-center justify-center shrink-0 rounded-full whitespace-nowrap leading-none " +
        "border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
            },
            size: {
                sm: "h-6 px-2 text-xs",
                md: "h-7 px-3 text-sm",
                lg: "h-8 px-3.5 text-sm",
            },
            shape: {
                pill: "", // そのままピル
                circle: "px-0 aspect-square", // 正円（h-* と組み合わせ）
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
            shape: "pill",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, shape, ...props }: BadgeProps) {
    return (
        <div
            className={cn(badgeVariants({ variant, size, shape }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
