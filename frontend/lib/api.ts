export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Patient {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: "M" | "F" | "O";
  phone_number: string;
  address: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  current_medications: string;
  past_surgeries: string;
  family_history: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  patient: Patient | null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function setToken(token: string) {
  window.localStorage.setItem("token", token);
}

export function clearToken() {
  window.localStorage.removeItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body === "object" && body !== null
        ? Object.values(body).flat().join(" ")
        : "Request failed";
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
  full_name: string;
  date_of_birth: string;
  gender: "M" | "F" | "O";
  phone_number?: string;
  address?: string;
  blood_group?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  past_surgeries?: string;
  family_history?: string;
}

export interface VoiceParsedFields {
  full_name: string;
  date_of_birth: string;
  gender: "M" | "F" | "O" | "";
  phone_number: string;
  address: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  current_medications: string;
  past_surgeries: string;
  family_history: string;
}

export function parseVoiceTranscript(transcript: string) {
  return request<VoiceParsedFields>("/api/patients/parse-voice/", {
    method: "POST",
    body: JSON.stringify({ transcript }),
  });
}

export function registerPatient(payload: RegisterPayload) {
  return request<AuthResponse>("/api/patients/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginPatient(username: string, password: string) {
  return request<AuthResponse>("/api/patients/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function fetchMe() {
  return request<Patient>("/api/patients/me/");
}

export type DocumentType =
  | "PRESCRIPTION"
  | "LAB_REPORT"
  | "DISCHARGE_SUMMARY"
  | "OTHER";

export interface MedicalDocument {
  id: number;
  document_type: DocumentType;
  title: string;
  file_url: string;
  notes: string;
  extracted_text: string;
  ocr_status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  ocr_error: string;
  uploaded_at: string;
}

export function fetchDocuments() {
  return request<MedicalDocument[]>("/api/documents/");
}

export async function uploadDocument(params: {
  document_type: DocumentType;
  title: string;
  notes?: string;
  file: File;
}): Promise<MedicalDocument> {
  const token = getToken();
  const formData = new FormData();
  formData.append("document_type", params.document_type);
  formData.append("title", params.title);
  if (params.notes) formData.append("notes", params.notes);
  formData.append("file", params.file);

  const res = await fetch(`${API_URL}/api/documents/`, {
    method: "POST",
    headers: token ? { Authorization: `Token ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body === "object" && body !== null
        ? Object.values(body).flat().join(" ")
        : "Upload failed";
    throw new Error(message || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

export function deleteDocument(id: number) {
  return request<void>(`/api/documents/${id}/`, { method: "DELETE" });
}

export interface TimelineEntry {
  date: string;
  kind: "REGISTRATION" | "DOCUMENT";
  title: string;
  document_type: DocumentType | null;
  file_url: string | null;
  extracted_text: string | null;
  notes: string | null;
  ocr_status: MedicalDocument["ocr_status"] | null;
}

export interface PatientSummary {
  patient: Patient;
  timeline: TimelineEntry[];
}

export function fetchSummary(order: "asc" | "desc" = "desc") {
  return request<PatientSummary>(`/api/patients/summary/?order=${order}`);
}
