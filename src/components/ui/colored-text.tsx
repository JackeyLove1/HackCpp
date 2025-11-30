'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'

const coloredTextVariants = cva('', {
  variants: {
    textColor: {
      red: 'text-red-500',
      green: 'text-green-500',
      blue: 'text-blue-500',
      yellow: 'text-yellow-500',
      purple: 'text-purple-500',
      gray: 'text-gray-500',
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    textColor: 'primary',
    weight: 'normal',
  },
})

interface ColoredTextProps extends 
  React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof coloredTextVariants> {
  children: React.ReactNode
  customColor?: string
}

const ColoredText = ({
  className,
  textColor,
  weight,
  children,
  customColor,
  ...props
}: ColoredTextProps) => {
  const style = customColor ? { color: customColor } : undefined

  return (
    <span
      className={cn(coloredTextVariants({ textColor, weight }), className)}
      style={style}
      {...props}
    >
      {children}
    </span>
  )
}

export { ColoredText, coloredTextVariants } 