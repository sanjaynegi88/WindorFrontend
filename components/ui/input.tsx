import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define input size variants
const inputVariants = cva(
  `
    flex w-full bg-white border border-[rgba(112,128,144,0.23)] transition-[color,box-shadow] 
    text-[#1F2A44] placeholder:text-[#1F2A44]/50 font-asap font-medium
    focus-visible:border-[#1CA7A6] focus-visible:ring-[#1CA7A6]/30  focus-visible:outline-none    
    disabled:cursor-not-allowed disabled:opacity-60 
    rounded-[6px]
    [&[readonly]]:bg-muted/80 [&[readonly]]:cursor-not-allowed
    file:h-full [&[type=file]]:py-0 file:border-solid file:border-input file:bg-transparent 
    file:font-medium file:not-italic file:text-foreground file:p-0 file:border-0 file:border-e
    aria-invalid:border-destructive/60 aria-invalid:ring-destructive/10 dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/20
  `,
  {
    variants: {
      variant: {
        lg: 'h-10 px-4 text-sm file:pe-4 file:me-4',
        md: 'h-[46px] md:h-[65px] px-[15px] md:px-[19px] text-[14px] md:text-[20px] leading-[23px] file:pe-3 file:me-3',
        sm: 'h-7 px-2.5 text-xs file:pe-2.5 file:me-2.5',
      },
    },
    defaultVariants: {
      variant: 'md',
    },
  },
);

const inputAddonVariants = cva(
  'flex items-center shrink-0 justify-center bg-muted/10 border border-input shadow-xs shadow-[rgba(0,0,0,0.05)] text-secondary-foreground [&_svg]:text-secondary-foreground/60',
  {
    variants: {
      variant: {
        sm: 'rounded-md h-7 min-w-7 text-xs px-2.5 [&_svg:not([class*=size-])]:size-3.5',
        md: 'rounded-md h-8.5 min-w-8.5 px-3 text-[0.8125rem] leading-(--text-sm--line-height) [&_svg:not([class*=size-])]:size-4.5',
        lg: 'rounded-md h-10 min-w-10 px-4 text-sm [&_svg:not([class*=size-])]:size-4.5',
      },
      mode: {
        default: '',
        icon: 'px-0 justify-center',
      },
    },
    defaultVariants: {
      variant: 'md',
      mode: 'default',
    },
  },
);

const inputGroupVariants = cva(
  `
    flex items-stretch
    [&_[data-slot=input]]:grow
    [&_[data-slot=input-addon]:has(+[data-slot=input])]:rounded-e-none [&_[data-slot=input-addon]:has(+[data-slot=input])]:border-e-0
    [&_[data-slot=input-addon]:has(+[data-slot=datefield])]:rounded-e-none [&_[data-slot=input-addon]:has(+[data-slot=datefield])]:border-e-0 
    [&_[data-slot=input]+[data-slot=input-addon]]:rounded-s-none [&_[data-slot=input]+[data-slot=input-addon]]:border-s-0
    [&_[data-slot=input-addon]:has(+[data-slot=button])]:rounded-e-none
    [&_[data-slot=input]+[data-slot=button]]:rounded-s-none
    [&_[data-slot=button]+[data-slot=input]]:rounded-s-none
    [&_[data-slot=input-addon]+[data-slot=input]]:rounded-s-none
    [&_[data-slot=input-addon]+[data-slot=datefield]]:[&_[data-slot=input]]:rounded-s-none
    [&_[data-slot=datefield]:has(+[data-slot=input-addon])]:[&_[data-slot=input]]:rounded-e-none
    [&_[data-slot=input]:has(+[data-slot=button])]:rounded-e-none
    [&_[data-slot=input]:has(+[data-slot=input-addon])]:rounded-e-none
    [&_[data-slot=datefield]]:grow
    [&_[data-slot=datefield]+[data-slot=input-addon]]:rounded-s-none [&_[data-slot=datefield]+[data-slot=input-addon]]:border-s-0
  `,
  {
    variants: {},
    defaultVariants: {},
  },
);

const inputWrapperVariants = cva(
  `
    flex items-center gap-1.5
    has-[:focus-visible]:ring-ring/30 
    has-[:focus-visible]:border-ring
    has-[:focus-visible]:outline-none 
    has-[:focus-visible]:ring-[3px]

    [&_[data-slot=datefield]]:grow 
    [&_[data-slot=input]]:data-focus-within:ring-transparent  
    [&_[data-slot=input]]:data-focus-within:ring-0 
    [&_[data-slot=input]]:data-focus-within:border-0 
    [&_[data-slot=input]]:flex 
    [&_[data-slot=input]]:w-full 
    [&_[data-slot=input]]:outline-none 
    [&_[data-slot=input]]:transition-colors 
    [&_[data-slot=input]]:text-foreground
    [&_[data-slot=input]]:placeholder:text-muted-foreground 
    [&_[data-slot=input]]:border-0 
    [&_[data-slot=input]]:bg-transparent 
    [&_[data-slot=input]]:p-0
    [&_[data-slot=input]]:shadow-none 
    [&_[data-slot=input]]:focus-visible:ring-0 
    [&_[data-slot=input]]:h-auto 
    [&_[data-slot=input]]:disabled:cursor-not-allowed
    [&_[data-slot=input]]:disabled:opacity-50    

    [&_svg]:text-muted-foreground 
    [&_svg]:shrink-0
  `,
  {
    variants: {
      variant: {
        sm: 'gap-1.25 [&_svg:not([class*=size-])]:size-3.5',
        md: 'gap-1.5 [&_svg:not([class*=size-])]:size-4',
        lg: 'gap-1.5 [&_svg:not([class*=size-])]:size-4',
      },
    },
    defaultVariants: {
      variant: 'md',
    },
  },
);

interface InputProps extends React.ComponentProps<'input'>, VariantProps<typeof inputVariants> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

function Input({
  className,
  type,
  variant,
  startIcon,
  endIcon,
  ...props
}: InputProps) {
  return (
    <div className="relative w-full group/input">
      {startIcon && (
        <div className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-[#1CA7A6] transition-colors">
          {startIcon}
        </div>
      )}
      <input
        data-slot="input"
        type={type}
        className={cn(
          inputVariants({ variant }),
          startIcon && "pl-10 md:pl-14",
          endIcon && "pr-10 md:pr-14",
          className
        )}
        {...props}
      />
      {endIcon && (
        <div className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-[#1CA7A6] transition-colors">
          {endIcon}
        </div>
      )}
    </div>
  );
}

function InputAddon({
  className,
  variant,
  mode,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputAddonVariants>) {
  return (
    <div
      data-slot="input-addon"
      className={cn(inputAddonVariants({ variant, mode }), className)}
      {...props}
    />
  );
}

function InputGroup({
  className,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupVariants>) {
  return (
    <div
      data-slot="input-group"
      className={cn(inputGroupVariants(), className)}
      {...props}
    />
  );
}

function InputWrapper({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputWrapperVariants>) {
  return (
    <div
      data-slot="input-wrapper"
      className={cn(
        inputVariants({ variant }),
        inputWrapperVariants({ variant }),
        className,
      )}
      {...props}
    />
  );
}

export {
  Input,
  InputAddon,
  InputGroup,
  InputWrapper,
  inputVariants,
  inputAddonVariants,
};
