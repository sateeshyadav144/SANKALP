import { describe, it, expect } from 'vitest';
import mermaid from 'mermaid';
import { sanitizeMermaid } from '../utils/mermaidSanitizer';
import { ARCHITECTURE_TEMPLATES } from '../modules/visuals/DiagramStudio';

describe('Mermaid Diagrams Syntax Suite', () => {
  it('parses all ARCHITECTURE_TEMPLATES without syntax error', async () => {
    mermaid.initialize({ startOnLoad: false });

    for (const tmpl of ARCHITECTURE_TEMPLATES) {
      const sanitized = sanitizeMermaid(tmpl.code);
      await expect(mermaid.parse(sanitized)).resolves.not.toThrow();
    }
  });

  it('sanitizes legacy unquoted labels and cylinder databases without error', async () => {
    // The exact string that caused the parsing error in the user screenshot:
    const errorSnippet = `flowchart TD
    Microservice -->|6. RLS Query (auth.uid)| DB[(PostgreSQL + RLS)]
    DB -->|7. Isolated Student Data| Microservice
    Microservice -->|8. Secure Response| Client`;

    const cleaned = sanitizeMermaid(errorSnippet);
    await expect(mermaid.parse(cleaned)).resolves.not.toThrow();
  });

  it('sanitizes legacy 8-node flowchart with unquoted parentheses and parses cleanly', async () => {
    const legacyRawCode = `flowchart TD
    Client[Web/Mobile Client] -->|1. Credentials| Gateway[Sankalp API Gateway]
    Gateway -->|2. Verify| Auth[Supabase Auth Service]
    Auth -->|3. Signed JWT| Client
    Client -->|4. Bearer Token| Gateway
    Gateway -->|5. Token Relay| Service[Campus Services Engine]
    Service -->|6. RLS Query (auth.uid)| DB[(PostgreSQL + RLS)]
    DB -->|7. Isolated Student Data| Service
    Service -->|8. Secure Response| Client`;

    const cleaned = sanitizeMermaid(legacyRawCode);
    await expect(mermaid.parse(cleaned)).resolves.not.toThrow();
  });
});
