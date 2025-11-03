import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', children, ...rest }: ButtonProps) {
  const base = {
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none'
  } as React.CSSProperties;

  const style = variant === 'primary' ? { ...base, background: '#0ea5a4', color: '#fff' } : { ...base, background: 'transparent' };

  return (
    <button style={style} {...rest}>
      {children}
    </button>
  );
}
