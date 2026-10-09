// Single place that knows the URL shape — components never hand-build paths.
export const routes = {
  home: "/dashboard",
  dashboard: "/dashboard",
  settings: "/dashboard/settings",
  case: (id: string) => `/dashboard/cases/${id}`,
  review: (id: string, opts?: { edit?: boolean }) =>
    `/dashboard/cases/${id}/review${opts?.edit ? "?edit=1" : ""}`,
  documents: (id: string) => `/dashboard/cases/${id}/documents`,
  outcome: (id: string) => `/dashboard/cases/${id}/outcome`,
  questionnaire: (id: string, from?: "documents") =>
    `/dashboard/cases/${id}/questionnaire${from ? `?from=${from}` : ""}`,
} as const;
