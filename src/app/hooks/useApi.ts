import { useCallback } from "react";
import { apiClient } from "../utils/apiClient";
import { BASE_API_URL } from "../static/apiConfig";

export function useApi() {
  const get = useCallback(async (endpoint: string) => {
    const response = await apiClient(`${BASE_API_URL}${endpoint}`, {
      method: "GET",
    });
    const data = await response.json();
    return { data, response };
  }, []);

  const post = useCallback(async (endpoint: string, body: unknown) => {
    const response = await apiClient(`${BASE_API_URL}${endpoint}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return { data, response };
  }, []);

  const put = useCallback(async (endpoint: string, body: unknown) => {
    const response = await apiClient(`${BASE_API_URL}${endpoint}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return { data, response };
  }, []);

  const del = useCallback(async (endpoint: string) => {
    const response = await apiClient(`${BASE_API_URL}${endpoint}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return { data, response };
  }, []);

  return { get, post, put, delete: del };
}
