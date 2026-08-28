/**
 * API client utility for AIC HCMC Search Engine.
 *
 * Uses the native fetch API. Base URL is dynamically retrieved from
 * user settings in localStorage (fallback to VITE_API_BASE_URL defined in .env).
 */
import { getBackendBaseUrl } from './settings';

/**
 * Universal fetch wrapper that automatically injects headers such as
 * `ngrok-skip-browser-warning: 69420` to bypass ngrok's interstitial page
 * and prevent CORS block issues when tunneling.
 */
export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  
  // ngrok bypass header to prevent HTML interstitial warning page
  headers.set('ngrok-skip-browser-warning', '69420');

  // Standard Content-Type header unless body is FormData
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Universal API request wrapper with JSON deserialization, error handling,
 * and automated ngrok header injection.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseURL = getBackendBaseUrl().replace(/\/+$/, '');
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Prevent duplicate /api/v1 if both baseURL and endpoint supply it
  if (baseURL.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1/')) {
    cleanEndpoint = cleanEndpoint.replace(/^\/api\/v1/, '');
  }

  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${baseURL}${cleanEndpoint}`;

  const response = await apiFetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    let errorMessage = `API request failed with status ${response.status}`;
    if (errorData) {
      if (Array.isArray(errorData.detail)) {
        // FastAPI 422 validation error array format: [{ loc: ['body', 'field_name'], msg: 'error msg' }]
        errorMessage = errorData.detail
          .map((d: { loc?: (string | number)[]; msg?: string }) => `${d.loc?.slice(1)?.join('.') || 'field'}: ${d.msg}`)
          .join('; ');
      } else if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/* ─── Shared Types ─── */

export interface KeyframeItem {
  keyframe_id: number;
  video_id: string;
  keyframe_name: string;
  frame_idx: number | null;
  timestamp_sec: number | null;
  image_path: string;
  public_url: string | null;
}

export interface GeminiConfig {
  api_key?: string | null;
  model?: string;
  base_url?: string | null;
}

/* ─── Tree & Keyframes Types ─── */

export interface VideoTreeNode {
  id: string;
  name: string;
  type: 'video';
  title?: string | null;
  video_path?: string | null;
  thumbnail_url?: string | null;
  keyframe_count: number;
}

export interface CollectionTreeNode {
  id: string;
  name: string;
  type: 'collection';
  total_videos: number;
  total_keyframes: number;
  children: VideoTreeNode[];
}

export interface PaginatedKeyframesResponse {
  video_id: string;
  total_keyframes: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  items: KeyframeItem[];
}

/* ─── Object Search Types ─── */

export interface MultiObjectSearchRequest {
  video_id: string;
  query: string;
  gemini_config?: GeminiConfig | null;
  threshold?: number;
  limit?: number;
  offset?: number;
}

export interface MultiObjectSearchResponse {
  video_id: string;
  query: string;
  extracted_objects: string[];
  total: number;
  limit: number;
  offset: number;
  items: KeyframeItem[];
}

export interface VocabularyItem {
  class_name: string;
  class_entity: string;
}

/* ─── Video Vector Search Types ─── */

export interface VideoVectorSearchItem {
  video_id: string;
  feature_id: number;
  collection_name: string;
  title: string | null;
  video_path: string | null;
  thumbnail_url: string | null;
  author: string | null;
  length_seconds: number | null;
  segment_id: string;
  segment_index: number;
  file_name: string;
  transcript_text: string;
  similarity: number;
}

export interface VideoVectorSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  threshold?: number;
}

export interface VideoVectorSearchResponse {
  total: number;
  limit: number;
  offset: number;
  query: string;
  items: VideoVectorSearchItem[];
}

/* ─── Keyframe Vector Search Types ─── */

export interface KeyframeVectorSearchItem {
  keyframe_id: number;
  video_id: string;
  keyframe_name: string;
  frame_idx: number | null;
  timestamp_sec: number | null;
  image_path: string;
  public_url: string | null;
  similarity: number;
}

export interface KeyframeVectorSearchRequest {
  query: string;
  video_id?: string | null;
  limit?: number;
  offset?: number;
  threshold?: number;
}

export interface KeyframeVectorSearchResponse {
  video_id?: string | null;
  total: number;
  limit: number;
  offset: number;
  query: string;
  items: KeyframeVectorSearchItem[];
}

/* ─── Full-Text Search Types ─── */

export interface FullTextSearchItem {
  video_id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  video_path: string | null;
  score: number;
  matched_headline: string | null;
}

export interface FullTextSearchRequest {
  query: string;
  gemini_config?: GeminiConfig | null;
  limit?: number;
  offset?: number;
}

export interface FullTextSearchResponse {
  total: number;
  limit: number;
  offset: number;
  query: string;
  optimized_tsquery: string | null;
  extracted_entities: string[] | null;
  items: FullTextSearchItem[];
}

/* ─── KIS Verification Types ─── */

export interface VLMConfig {
  base_url: string;
  api_key?: string;
  model: string;
  temperature?: number;
  max_concurrency?: number;
  timeout_seconds?: number;
}

export interface VerifiedKeyframeItem {
  keyframe_id: number;
  video_id: string;
  image_url: string | null;
  is_matched: boolean;
  confidence: number;
  reason: string;
}

export interface KISSearchRequest {
  query: string;
  vlm_config: VLMConfig;
  candidate_keyframe_ids?: number[] | null;
  video_id?: string | null;
  min_confidence?: number;
  limit?: number;
  offset?: number;
}

export interface KISSearchResponse {
  total_candidates: number;
  total_matched: number;
  limit: number;
  offset: number;
  items: VerifiedKeyframeItem[];
}

/* ─── API Functions ─── */

/**
 * Fetch the dataset collection & video tree hierarchy.
 */
export async function fetchCollectionTree(
  videoLimit?: number,
  signal?: AbortSignal,
): Promise<CollectionTreeNode[]> {
  const params = new URLSearchParams();
  if (videoLimit !== undefined) params.set('video_limit', String(videoLimit));
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  return apiRequest<CollectionTreeNode[]>(`/tree${queryStr}`, { signal });
}

/**
 * List paginated keyframes for a specific video.
 */
export async function fetchVideoKeyframes(
  videoId: string,
  page: number = 1,
  limit: number = 24,
  signal?: AbortSignal,
): Promise<PaginatedKeyframesResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiRequest<PaginatedKeyframesResponse>(
    `/videos/${encodeURIComponent(videoId)}/keyframes?${params}`,
    { signal },
  );
}

/**
 * Search the object vocabulary whitelist by substring.
 */
export async function fetchObjectVocabulary(
  query?: string,
  limit: number = 50,
  signal?: AbortSignal,
): Promise<VocabularyItem[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query) params.set('query', query);

  return apiRequest<VocabularyItem[]>(
    `/keyframes/objects/vocabulary?${params}`,
    { signal },
  );
}

/**
 * Search keyframes by objects extracted from query within a specific video (POST).
 */
export async function searchByObjects(
  body: MultiObjectSearchRequest,
  signal?: AbortSignal,
): Promise<MultiObjectSearchResponse> {
  return apiRequest<MultiObjectSearchResponse>(
    '/keyframes/search-by-objects',
    {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    },
  );
}

/**
 * Execute weighted PostgreSQL Full-Text Search across video transcripts,
 * title, description, and keywords.
 */
export async function searchFullText(
  body: FullTextSearchRequest,
  signal?: AbortSignal,
): Promise<FullTextSearchResponse> {
  return apiRequest<FullTextSearchResponse>(
    '/search/full-text-search',
    {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    },
  );
}

/**
 * Known-Item Search (KIS) visual verification with VLM.
 */
export async function searchKisVerification(
  body: KISSearchRequest,
  signal?: AbortSignal,
): Promise<KISSearchResponse> {
  return apiRequest<KISSearchResponse>(
    '/search/kis-search',
    {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    },
  );
}

/**
 * Global Video Transcript Vector Search via Ollama Embeddings.
 */
export async function searchVideoVector(
  body: VideoVectorSearchRequest,
  signal?: AbortSignal,
): Promise<VideoVectorSearchResponse> {
  return apiRequest<VideoVectorSearchResponse>(
    '/search/video/vector-search',
    {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    },
  );
}

/**
 * Scoped Keyframe Vector Similarity Search via CLIP ViT-B/32.
 */
export async function searchKeyframeVector(
  body: KeyframeVectorSearchRequest,
  signal?: AbortSignal,
): Promise<KeyframeVectorSearchResponse> {
  return apiRequest<KeyframeVectorSearchResponse>(
    '/search/keyframe/vector-search',
    {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    },
  );
}

