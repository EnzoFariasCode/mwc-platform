// src/components/ui/ExpandableText/types.ts

export interface ExpandableTextProps {
  /**
   * O texto completo a ser exibido.
   */
  content: string | null | undefined;

  /**
   * Quantidade de linhas visíveis antes de truncar.
   * @default 3
   */
  lineClamp?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Texto do botão quando está fechado.
   * @default "Ver mais"
   */
  expandLabel?: string;

  /**
   * Texto do botão quando está aberto.
   * @default "Ver menos"
   */
  collapseLabel?: string;

  /**
   * Classes extras para customização via Tailwind
   */
  className?: string;
}
