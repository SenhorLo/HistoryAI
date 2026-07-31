import type { ConversationSummary } from "./api";

export interface ConversationGroup {
  label: string;
  items: ConversationSummary[];
}

/**
 * Agrupa as conversas por recência, como na barra lateral de referência.
 * Os limites são por dia de calendário, não por 24h corridas: uma conversa
 * das 23h de ontem tem que cair em "Ontem", não em "Hoje".
 */
export function groupConversations(
  conversations: ConversationSummary[],
): ConversationGroup[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayMs = 86_400_000;

  const buckets: ConversationGroup[] = [
    { label: "Hoje", items: [] },
    { label: "Ontem", items: [] },
    { label: "Últimos 7 dias", items: [] },
    { label: "Anteriores", items: [] },
  ];

  for (const c of conversations) {
    const updated = new Date(c.updatedAt).getTime();
    const daysAgo = Math.floor((startOfToday.getTime() - updated) / dayMs);

    if (updated >= startOfToday.getTime()) buckets[0].items.push(c);
    else if (daysAgo < 1) buckets[1].items.push(c);
    else if (daysAgo < 7) buckets[2].items.push(c);
    else buckets[3].items.push(c);
  }

  return buckets.filter((b) => b.items.length > 0);
}
