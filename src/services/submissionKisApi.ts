/**
 * API service for KIS (Known-Item Search) Submission Management.
 */
import { apiFetch, apiRequest } from './api';
import { getBackendBaseUrl } from './settings';

export interface KisQueryResponse {
  id: number;
  query_code: string;
  query_text: string;
  author_name?: string | null;
  author_email?: string | null;
  created_at: string;
  updated_at?: string | null;
  result_count: number;
}

export interface KisResultResponse {
  id: number;
  query_id: number;
  video_name: string;
  frame_idx: number;
  rank: number;
  confidence?: number | null;
  author_name?: string | null;
  author_email?: string | null;
  created_at?: string | null;
}

export interface KisQueryDetailResponse extends KisQueryResponse {
  results: KisResultResponse[];
}

export interface KisQueryItemCreate {
  query_code: string;
  query_text: string;
  author_name?: string | null;
  author_email?: string | null;
}

/**
 * List all KIS queries with result counts across the team.
 */
export async function fetchKisQueries(search?: string): Promise<KisQueryResponse[]> {
  const queryParam = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<KisQueryResponse[]>(`/submission/kis/queries${queryParam}`);
}

/**
 * Fetch detailed query information along with its submitted results.
 */
export async function fetchKisQueryDetail(id: number): Promise<KisQueryDetailResponse> {
  return apiRequest<KisQueryDetailResponse>(`/submission/kis/queries/${id}`);
}

/**
 * Batch import or upsert KIS queries from parsed .txt files with author attribution.
 */
export async function batchImportKisQueries(
  queries: KisQueryItemCreate[]
): Promise<KisQueryResponse[]> {
  return apiRequest<KisQueryResponse[]>('/submission/kis/queries/batch', {
    method: 'POST',
    body: JSON.stringify({ queries }),
  });
}

/**
 * Delete a KIS query and its associated results.
 */
export async function deleteKisQuery(id: number): Promise<void> {
  await apiRequest<{ success: boolean; message: string }>(
    `/submission/kis/queries/${id}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Import or overwrite submission results for a specific KIS query from raw text.
 */
export async function importKisResults(
  queryId: number,
  rawText: string,
  authorName?: string,
  authorEmail?: string
): Promise<KisResultResponse[]> {
  return apiRequest<KisResultResponse[]>(
    `/submission/kis/queries/${queryId}/results/import`,
    {
      method: 'POST',
      body: JSON.stringify({
        raw_submission_text: rawText,
        author_name: authorName,
        author_email: authorEmail,
      }),
    }
  );
}

/**
 * Export raw submission text formatted as `<video_name>, <frame_idx>` per line.
 */
export async function exportKisSubmissionText(queryId: number): Promise<string> {
  const baseURL = getBackendBaseUrl();
  const cleanBase = baseURL.replace(/\/+$/, '');
  const response = await apiFetch(`${cleanBase}/submission/kis/queries/${queryId}/export`);
  if (!response.ok) {
    throw new Error(`Failed to export submission text (status ${response.status})`);
  }
  return response.text();
}
