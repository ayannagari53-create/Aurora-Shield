import { AuthService, supabase } from './auth';
import { ComplianceScanRecord, LabelAngle, ReportItem, StructuredProductData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function getValidToken(): Promise<string> {
  // Prefer Supabase SDK session which automatically refreshes when needed
  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  }
  // Fallback to locally stored token (only for non‑Supabase dev mode)
  const token = AuthService.getToken();
  if (!token) throw new Error('No authentication token available');
  return token;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getValidToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    Authorization: `Bearer ${token}`
  };
  // Debug log (token value not printed)
  console.log('API request', endpoint, 'Authorization header set');

  // Set application/json only if not FormData and Content-Type not already provided
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }



  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errMsg = 'API request failed';
    try {
      const errJson = await response.json();
      errMsg = errJson.message || errJson.error || errMsg;
    } catch {
      errMsg = `Server responded with status ${response.status} ${response.statusText}`;
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const scanApi = {
  checkHealth: () => request<{ status: string; service: string }>('/api/health'),

  createScan: (category: string, productName?: string) =>
    request<{ success: boolean; scan: ComplianceScanRecord }>('/api/scans', {
      method: 'POST',
      body: JSON.stringify({ category, productName })
    }),

  uploadImages: (scanId: string, files: File[], angles: LabelAngle[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('images', file);
      formData.append('angles', angles[index] || 'OTHER');
    });

    return request<{ success: boolean; uploadedCount: number; images: any[] }>(`/api/scans/${scanId}/images`, {
      method: 'POST',
      body: formData
    });
  },

  runOcr: (scanId: string) =>
    request<{ success: boolean; ocrResults: any[] }>(`/api/scans/${scanId}/ocr`, {
      method: 'POST'
    }),

  analyzeScan: (scanId: string) =>
    request<{
      success: boolean;
      extractedData: StructuredProductData;
      conflicts: any[];
      ruleResults: any[];
      status: string;
      overallScore: number;
    }>(`/api/scans/${scanId}/analyze`, {
      method: 'POST'
    }),

  verifyScan: (scanId: string, verifiedData: StructuredProductData, editedFields: string[], notes?: string) =>
    request<{ success: boolean; scan: ComplianceScanRecord }>(`/api/scans/${scanId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ verifiedData, editedFields, notes })
    }),

  getCompliance: (scanId: string) =>
    request<{ success: boolean; status: string; overallScore: number; ruleResults: any[]; conflicts: any[] }>(
      `/api/scans/${scanId}/compliance`,
      { method: 'POST' }
    ),

  getScan: (scanId: string) =>
    request<{ success: boolean; scan: ComplianceScanRecord }>(`/api/scans/${scanId}`),

  listScans: () =>
    request<{ success: boolean; scans: ComplianceScanRecord[]; total: number }>('/api/scans'),

  deleteScan: (scanId: string) =>
    request<{ success: boolean; message: string }>(`/api/scans/${scanId}`, {
      method: 'DELETE'
    }),

  listReports: () =>
    request<{ success: boolean; reports: ReportItem[]; total: number }>('/api/reports'),

  getReportPdfBlobUrl: async (scanId: string): Promise<string> => {
    // token obtained via getValidToken below
    const token = await getValidToken();
    const res = await fetch(`${API_BASE_URL}/api/reports/${scanId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Unable to download PDF report');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }
};
