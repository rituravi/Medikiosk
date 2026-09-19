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
  otp_is_set: boolean;
}

export type Role = "admin" | "doctor" | "triage" | "patient";

export interface AuthResponse {
  token: string;
  role: Role;
  patient: Patient | null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function setToken(token: string) {
  window.localStorage.setItem("token", token);
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("role") as Role | null;
}

export function setRole(role: Role) {
  window.localStorage.setItem("role", role);
}

export function clearToken() {
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("role");
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
  consent: boolean;
  guardian_consent?: boolean;
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

export async function transcribeAudio(audio: Blob, language: string): Promise<string> {
  const token = getToken();
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  formData.append("language", language);

  const res = await fetch(`${API_URL}/api/patients/transcribe-voice/`, {
    method: "POST",
    headers: token ? { Authorization: `Token ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body === "object" && body !== null
        ? Object.values(body).flat().join(" ")
        : "Transcription failed";
    throw new Error(message || `Transcription failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.transcript;
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

export function updatePatient(payload: Partial<RegisterPayload>) {
  return request<Patient>("/api/patients/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePatientAccount() {
  return request<void>("/api/patients/me/", { method: "DELETE" });
}

export function setPatientOtp(otp: string) {
  return request<{ detail: string }>("/api/patients/me/otp/", {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export interface AccessLogEntry {
  id: number;
  doctor_name: string;
  accessed_at: string;
}

export function fetchAccessLog() {
  return request<AccessLogEntry[]>("/api/patients/me/access-log/");
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
  kind: "REGISTRATION" | "DOCUMENT" | "AYURVEDA_ASSESSMENT";
  title: string;
  document_type: DocumentType | null;
  file_url: string | null;
  extracted_text: string | null;
  notes: string | null;
  ocr_status: MedicalDocument["ocr_status"] | null;
}

export interface PatientSummary {
  patient: Patient;
  prakriti?: PrakritiProfile;
  timeline: TimelineEntry[];
}

export function fetchSummary(order: "asc" | "desc" = "desc") {
  return request<PatientSummary>(`/api/patients/summary/?order=${order}`);
}

export interface AdminPatient {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  full_name: string;
  phone_number: string;
  date_of_birth: string;
  created_at: string;
}

export function adminFetchUsers() {
  return request<AdminPatient[]>("/api/patients/admin/users/");
}

export function adminResetPassword(patientId: number, newPassword: string) {
  return request<{ detail: string }>(
    `/api/patients/admin/users/${patientId}/reset-password/`,
    { method: "POST", body: JSON.stringify({ new_password: newPassword }) },
  );
}

export function adminToggleActive(patientId: number) {
  return request<{ is_active: boolean }>(
    `/api/patients/admin/users/${patientId}/toggle-active/`,
    { method: "POST" },
  );
}

export interface Doctor {
  id: number;
  username: string;
  full_name: string;
  specialization: string;
  created_at: string;
}

export function adminFetchDoctors() {
  return request<Doctor[]>("/api/patients/admin/doctors/");
}

export function adminCreateDoctor(payload: {
  username: string;
  password: string;
  full_name: string;
  specialization?: string;
}) {
  return request<Doctor>("/api/patients/admin/doctors/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface DoctorPatient {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: "M" | "F" | "O";
  phone_number: string;
}

export function doctorFetchPatients() {
  return request<DoctorPatient[]>("/api/patients/doctor/patients/");
}

export function doctorFetchPatientSummary(patientId: number, otp: string) {
  return request<PatientSummary>(`/api/patients/doctor/patients/${patientId}/summary/`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

// --- Ayurveda: Dashavidha Pariksha + Ahara-Vihara assessment ---

export type SingleDosha = "VATA" | "PITTA" | "KAPHA" | "";
export type DoshaType =
  | "VATA"
  | "PITTA"
  | "KAPHA"
  | "VATA_PITTA"
  | "PITTA_KAPHA"
  | "VATA_KAPHA"
  | "TRIDOSHA"
  | "";
export type Grade = "PRAVARA" | "MADHYAMA" | "AVARA" | "";
export type AgniType = "SAMA" | "VISHAMA" | "TIKSHNA" | "MANDA" | "";

export interface PrakritiProfile {
  id: number;
  body_frame: SingleDosha;
  skin_type: SingleDosha;
  hair_type: SingleDosha;
  appetite_pattern: SingleDosha;
  sleep_pattern: SingleDosha;
  mental_temperament: SingleDosha;
  self_report_notes: string;
  self_report_updated_at: string | null;
  prakriti_type: DoshaType;
  clinical_notes: string;
  finalized_by_name?: string;
  finalized_at: string | null;
  is_finalized: boolean;
}

export type PrakritiSelfReport = Pick<
  PrakritiProfile,
  | "body_frame"
  | "skin_type"
  | "hair_type"
  | "appetite_pattern"
  | "sleep_pattern"
  | "mental_temperament"
  | "self_report_notes"
>;

export function fetchPrakriti() {
  return request<PrakritiProfile>("/api/ayurveda/me/prakriti/");
}

export function updatePrakritiSelfReport(payload: Partial<PrakritiSelfReport>) {
  return request<PrakritiProfile>("/api/ayurveda/me/prakriti/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface AharaVihara {
  diet_type: "VEGETARIAN" | "EGGETARIAN" | "NON_VEGETARIAN" | "VEGAN" | "";
  meal_pattern: "REGULAR" | "IRREGULAR" | "FREQUENT_SNACKING" | "";
  water_intake: "LOW" | "ADEQUATE" | "EXCESSIVE" | "";
  taste_preferences: string;
  sleep_duration_hours: number | null;
  sleep_quality: "SOUND" | "DISTURBED" | "INSOMNIA" | "";
  bowel_habits: "REGULAR" | "IRREGULAR" | "CONSTIPATED" | "LOOSE" | "";
  physical_activity_level: "SEDENTARY" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE" | "";
  addictions: string;
  occupation_stress_level: "LOW" | "MODERATE" | "HIGH" | "";
  ahara_vihara_notes: string;
}

export interface AyurvedaAssessmentClinical {
  vikriti_type: DoshaType;
  vikriti_notes: string;
  sara_grade: Grade;
  sara_notes: string;
  samhanana_grade: Grade;
  samhanana_notes: string;
  height_cm: number | null;
  weight_kg: number | null;
  pramana_assessment: "ADEQUATE" | "INADEQUATE" | "";
  pramana_notes: string;
  satmya_grade: Grade;
  satmya_notes: string;
  sattva_grade: Grade;
  sattva_notes: string;
  abhyavaharana_shakti: Grade;
  agni_type: AgniType;
  ahara_shakti_notes: string;
  vyayama_shakti_grade: Grade;
  vyayama_shakti_notes: string;
}

export interface AyurvedaAssessment extends AharaVihara, AyurvedaAssessmentClinical {
  id: number;
  patient: number;
  status: "DRAFT" | "FINALIZED";
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
  vaya: "BALA" | "MADHYA" | "VRIDDHA";
}

export function fetchMyAyurvedaAssessments() {
  return request<AyurvedaAssessment[]>("/api/ayurveda/me/assessments/");
}

export function createMyAyurvedaAssessment(payload: Partial<AharaVihara>) {
  return request<AyurvedaAssessment>("/api/ayurveda/me/assessments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMyAyurvedaAssessment(id: number, payload: Partial<AharaVihara>) {
  return request<AyurvedaAssessment>(`/api/ayurveda/me/assessments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function doctorFetchPrakriti(patientId: number, otp: string) {
  return request<PrakritiProfile>(`/api/ayurveda/doctor/patients/${patientId}/prakriti/`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export function doctorFinalizePrakriti(
  patientId: number,
  otp: string,
  payload: { prakriti_type: DoshaType; clinical_notes: string },
) {
  return request<PrakritiProfile>(`/api/ayurveda/doctor/patients/${patientId}/prakriti/`, {
    method: "POST",
    body: JSON.stringify({ otp, ...payload }),
  });
}

export function doctorFetchAyurvedaAssessments(patientId: number, otp: string) {
  return request<AyurvedaAssessment[]>(
    `/api/ayurveda/doctor/patients/${patientId}/assessments/`,
    { method: "POST", body: JSON.stringify({ otp }) },
  );
}

export function doctorFinalizeAyurvedaAssessment(
  patientId: number,
  otp: string,
  payload: Partial<AyurvedaAssessmentClinical> & { assessment_id?: number },
) {
  return request<AyurvedaAssessment>(
    `/api/ayurveda/doctor/patients/${patientId}/assessments/finalize/`,
    { method: "POST", body: JSON.stringify({ otp, ...payload }) },
  );
}

// --- Triage: AI symptom screening + priority queue ---

export interface CheckIn {
  id: number;
  symptoms_text: string;
  status: "WAITING" | "PRIORITY" | "IN_CONSULT" | "COMPLETED";
  is_emergency: boolean;
  red_flags: string;
  created_at: string;
}

export function submitCheckIn(symptoms_text: string) {
  return request<CheckIn>("/api/triage/check-in/", {
    method: "POST",
    body: JSON.stringify({ symptoms_text }),
  });
}

export function fetchMyCheckIns() {
  return request<CheckIn[]>("/api/triage/check-in/mine/");
}

export interface QueueCheckIn {
  id: number;
  patient_name: string;
  patient_phone: string;
  symptoms_text: string;
  status: "WAITING" | "PRIORITY" | "IN_CONSULT" | "COMPLETED";
  is_emergency: boolean;
  red_flags: string;
  ai_reasoning: string;
  acknowledged_by_name?: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function fetchTriageQueue() {
  return request<QueueCheckIn[]>("/api/triage/queue/");
}

export function acknowledgeCheckIn(checkInId: number) {
  return request<QueueCheckIn>(`/api/triage/queue/${checkInId}/acknowledge/`, {
    method: "POST",
  });
}

export function completeCheckIn(checkInId: number) {
  return request<QueueCheckIn>(`/api/triage/queue/${checkInId}/complete/`, {
    method: "POST",
  });
}

export interface TriageStaffMember {
  id: number;
  username: string;
  full_name: string;
  created_at: string;
}

export function adminFetchTriageStaff() {
  return request<TriageStaffMember[]>("/api/triage/admin/staff/");
}

export function adminCreateTriageStaff(payload: {
  username: string;
  password: string;
  full_name: string;
}) {
  return request<TriageStaffMember>("/api/triage/admin/staff/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
