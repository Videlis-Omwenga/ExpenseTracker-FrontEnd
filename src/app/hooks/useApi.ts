import { useCallback } from "react";
import { apiClient } from "../utils/apiClient";
import { BASE_API_URL } from "../static/apiConfig";

export function useApi() {
  const get = useCallback(async (endpoint: string) => {
    const response = await apiClient(`${BASE_API_URL}${endpoint}`, {
      method: "GET",
    });
    return response.json();
  }, []);

  const post = useCallback(async (endpoint: string, data: any) => {
    const response = await apiClient(`${BASE_API_URL}${endpoint}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  }, []);

  const put = useCallback(async (endpoint: string, data: any) => {
    const response = await apiClient(`${BASE_API_URL}${endpoint}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  }, []);

  const del = useCallback(async (endpoint: string) => {
    const response = await apiClient(`${BASE_API_URL}${endpoint}`, {
      method: "DELETE",
    });
    return response.json();
  }, []);

  return { get, post, put, delete: del };
}
