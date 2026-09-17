export type ListPage = {
  offset: number;
  limit: number;
  has_more: boolean;
};

export function paginateItems<T>(items: readonly T[], offset: number, limit: number): { items: T[]; page: ListPage } {
  return {
    items: items.slice(offset, offset + limit),
    page: {
      offset,
      limit,
      has_more: offset + limit < items.length,
    },
  };
}
