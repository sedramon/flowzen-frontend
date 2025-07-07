export interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}