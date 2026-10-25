import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Magnet } from './Magnet'
import { StarBorder } from './StarBorder'

export function AcaoPrimaria({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) {
  return (
    <Magnet>
      <StarBorder ativo={!props.disabled}>
        <button {...props} className={`btn${className ? ` ${className}` : ''}`}>
          {children}
        </button>
      </StarBorder>
    </Magnet>
  )
}
