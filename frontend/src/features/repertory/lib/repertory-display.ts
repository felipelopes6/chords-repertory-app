import type { Repertory } from '../types';

const createdAtFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
});

export function sortRepertoriesByCreatedAt(repertories: Repertory[]) {
  return [...repertories].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function formatRepertoryCreatedAt(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return 'Criada em data indisponível';
  }

  return `Criada em ${createdAtFormatter.format(date)}`;
}
