import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        secondary: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        link: 'underline-offset-4 hover:underline text-blue-600 dark:text-blue-400',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
        info: 'bg-blue-600 text-white hover:bg-blue-700',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md text-xs',
        lg: 'h-11 px-8 rounded-md text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';