// src/components/ui/ExpandableText/index.tsx
import { useState } from "react";
import { ExpandableTextProps } from "./types";

export const ExpandableText = ({
  content,
  lineClamp = 3,
  expandLabel = "Ver mais",
  collapseLabel = "Ver menos",
  className = "",
}: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  // Lógica simples para decidir se precisa do botão
  // Se o texto for curto (ex: < 150 chars), nem renderiza botão
  const needsTruncation = content.length > 150;

  // Mapeamento seguro para classes do Tailwind (Tailwind não gosta de interpolação dinâmica completa como `line-clamp-${n}`)
  const clampClass = {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
    4: "line-clamp-4",
    5: "line-clamp-5",
    6: "line-clamp-6",
  }[lineClamp];

  return (
    <div className={`flex flex-col items-start ${className}`}>
      <p
        className={`text-base text-gray-600 leading-relaxed transition-all duration-300 ease-in-out ${
          !isExpanded && needsTruncation ? clampClass : ""
        }`}
      >
        {content}
      </p>

      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded-sm"
          aria-expanded={isExpanded}
        >
          {isExpanded ? collapseLabel : expandLabel}
        </button>
      )}
    </div>
  );
};
