'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { OmoButton } from '@/components/ui/OmoButton';

interface FilterPillsProps {
  items: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function FilterPills({ items, active, onChange, className }: FilterPillsProps) {
  const handleSelect = useCallback((id: string) => {
    onChange(id);
  }, [onChange]);

  return (
    <div
      className={cn('scroll-rail flex gap-2', className)}
      role="tablist"
      aria-label="Filter options"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <OmoButton
            key={item.id}
            variant={isActive ? 'default' : 'outline'}
            size="pill"
            onClick={() => handleSelect(item.id)}
            className="font-body text-sm font-semibold shadow-sm transition-all"
          >
            {item.label}
          </OmoButton>
        );
      })}
    </div>
  );
}
