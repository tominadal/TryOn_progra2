export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle FormData and URLSearchParams separately
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  } else if (options.body instanceof URLSearchParams) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    cache: "no-store",
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    if (response.status === 401 && endpoint !== "/auth/login" && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.assign('/login?expired=true');
    }
    const errorData = await response.json().catch(() => ({}));
    const detail = Array.isArray(errorData.detail) ? JSON.stringify(errorData.detail) : errorData.detail;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}
