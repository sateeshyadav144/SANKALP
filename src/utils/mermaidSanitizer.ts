/**
 * SANKALP Smart Campus Ecosystem - Mermaid Syntax Sanitizer
 * Automatically sanitizes and repairs common Mermaid syntax issues:
 * 1. Unquoted arrow labels with parentheses or special symbols: -->|6. RLS Query (auth.uid)| -> -->|"6. RLS Query (auth.uid)"|
 * 2. Unquoted cylinder shapes with spaces or symbols: DB[(PostgreSQL + RLS)] -> DB[("PostgreSQL + RLS")]
 * 3. Unquoted square bracket node shapes with parentheses: Node[Client (Browser)] -> Node["Client (Browser)"]
 */

export const sanitizeMermaid = (code: string): string => {
  if (!code || typeof code !== 'string') return '';
  let cleaned = code;

  // 1. Fix cylinder nodes without quotes: e.g. DB[(PostgreSQL + RLS)] -> DB[("PostgreSQL + RLS")]
  cleaned = cleaned.replace(/\[\(\s*(?!"|\s*")([^)\r\n]+?)\s*\)\]/g, '[("$1")]');

  // 2. Fix arrow labels that have unquoted special characters (parentheses, dots, colons, spaces, plus)
  // Handles -->|...|, ---|...|, -.->|...|, ==>|...|
  cleaned = cleaned.replace(/(-->|---|-.->|==>)\|([^"|\r\n]+?)\|/g, (_match, arrow, label) => {
    const trimmed = label.trim();
    if (!trimmed) return `${arrow}||`;
    if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
      return `${arrow}|"${trimmed.replace(/"/g, "'")}"|`;
    }
    return `${arrow}|${trimmed}|`;
  });

  // 3. Fix unquoted square bracket nodes with parentheses:
  // e.g. Node[Some text (detail)] -> Node["Some text (detail)"]
  cleaned = cleaned.replace(/([A-Za-z0-9_]+)\[\s*(?!"|\()([^\]\r\n]*[\(\)][^\]\r\n]*)\s*\]/g, '$1["$2"]');

  return cleaned;
};

