export const getInitData = (): string => {
  const telegramData = window.Telegram?.WebApp?.initData;
  if (telegramData && telegramData.length > 0) {
    return telegramData;
  }
  return localStorage.getItem("mockInitData") || "";
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const initData = getInitData();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-telegram-init-data": initData,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return (await response.json()) as T;
};
