'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col sm:flex-row gap-4 font-asap',
        month: 'w-full',
        month_caption:
          'relative mx-10 mb-4 flex h-8 items-center justify-center z-20',
        caption_label: 'text-[15px] font-bold text-[#1F2A44]',
        nav: 'absolute top-0 flex w-full justify-between z-10 px-4',
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 text-[#D9D9D9] hover:text-[#1CA7A6] p-0',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 text-[#D9D9D9] hover:text-[#1CA7A6] p-0',
        ),
        weekday: 'size-10 p-0 text-[11px] font-semibold text-[#1F2A44]/60',
        day_button:
          'cursor-pointer relative flex size-10 items-center justify-center whitespace-nowrap rounded-md p-0 text-[11px] font-semibold text-[#1F2A44] transition-all hover:bg-[#1CA7A6]/10 group-data-selected:bg-[#1CA7A6] group-data-selected:text-white group-data-selected:rounded-full group-data-selected:size-[26px] mx-auto',
        day: 'group size-10 px-0 py-px',
        range_start: 'range-start',
        range_end: 'range-end',
        range_middle: 'range-middle',
        today:
          '*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 rtl:*:after:translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors',
        outside:
          'text-muted-foreground data-selected:bg-accent/50 data-selected:text-muted-foreground',
        hidden: 'invisible',
        week_number: 'size-8 p-0 text-xs font-medium text-muted-foreground/80',
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-4 w-4 rtl:rotate-180" />;
          } else {
            return <ChevronRight className="h-4 w-4 rtl:rotate-180" />;
          }
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
