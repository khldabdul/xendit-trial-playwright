/**
 * HAR (HTTP Archive) related type definitions
 */

/**
 * HAR file structure (simplified)
 */
export interface HAR {
  log: HARLog;
}

/**
 * HAR log structure
 */
export interface HARLog {
  version: string;
  creator: HARCreator;
  entries: HAREntry[];
  pages: HARPage[];
}

/**
 * HAR creator info
 */
export interface HARCreator {
  name: string;
  version: string;
}

/**
 * HAR page info
 */
export interface HARPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: HARPageTimings;
}

/**
 * HAR page timings
 */
export interface HARPageTimings {
  onContentLoad: number;
  onLoad: number;
}

/**
 * HAR entry (request/response pair)
 */
export interface HAREntry {
  pageref: string;
  startedDateTime: string;
  time: number;
  request: HARRequest;
  response: HARResponse;
  cache: HARCache;
  timings: HARTimings;
  _resourceType?: string;
}

/**
 * HAR request
 */
export interface HARRequest {
  method: string;
  url: string;
  httpVersion: string;
  headers: HARHeader[];
  queryString: HARQueryString[];
  cookies: HARCookie[];
  headersSize: number;
  bodySize: number;
}

/**
 * HAR response
 */
export interface HARResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: HARHeader[];
  cookies: HARCookie[];
  content: HARContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
}

/**
 * HAR header
 */
export interface HARHeader {
  name: string;
  value: string;
}

/**
 * HAR query string parameter
 */
export interface HARQueryString {
  name: string;
  value: string;
}

/**
 * HAR cookie
 */
export interface HARCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

/**
 * HAR content
 */
export interface HARContent {
  size: number;
  mimeType: string;
  text?: string;
  encoding?: string;
}

/**
 * HAR cache
 */
export interface HARCache {
  beforeRequest?: HARCacheEntry;
  afterRequest?: HARCacheEntry;
}

/**
 * HAR cache entry
 */
export interface HARCacheEntry {
  expires?: string;
  lastAccess: string;
  eTag: string;
  hitCount: number;
}

/**
 * HAR timings
 */
export interface HARTimings {
  blocked: number;
  dns: number;
  connect: number;
  send: number;
  wait: number;
  receive: number;
  ssl: number;
}

/**
 * HAR analysis results
 */
export interface HARAnalysis {
  totalRequests: number;
  failedRequests: number;
  slowRequests: number;
  avgResponseTime: number;
  bandwidthUsed: number;
  largestResource: {
    url: string;
    size: number;
  };
  errors: HARAnalysisError[];
}

/**
 * HAR analysis error
 */
export interface HARAnalysisError {
  url: string;
  status: number;
  statusText: string;
  type: 'network' | 'server' | 'client' | 'timeout';
}

/**
 * HAR summary for human-readable output
 */
export interface HARSummary {
  totalRequests: number;
  failedRequests: number;
  domains: string[];
  requestTypes: Record<string, number>;
  totalSize: number;
  errors: HARSummaryError[];
}

/**
 * HAR summary error
 */
export interface HARSummaryError {
  url: string;
  method: string;
  status: number;
  statusText: string;
}
