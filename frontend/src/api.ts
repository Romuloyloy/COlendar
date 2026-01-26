const API_BASE = "http://127.0.0.1:8000/api";

async function check(res: Response, label: string) {
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${label} failed: ${res.status} ${t}`);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  await check(res, `GET ${path}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await check(res, `POST ${path}`);
  return res.json();
}
