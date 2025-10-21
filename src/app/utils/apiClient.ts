import { BASE_API_URL } from "../static/apiConfig";
import { toast } from "react-toastify";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("expenseTrackerRefreshToken");

  if (!refreshToken) {
    console.error("No refresh token available");
    return null;
  }

  try {
    const response = await fetch(`${BASE_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      const { access_token, refresh_token } = data;

      // Update tokens in localStorage
      localStorage.setItem("expenseTrackerToken", access_token);
      localStorage.setItem("expenseTrackerRefreshToken", refresh_token);

      console.log("Access token refreshed successfully");
      return access_token;
    } else {
      const errorData = await response.json();
      console.error("Failed to refresh token:", errorData);

      // If refresh fails, clear tokens and redirect to login
      localStorage.removeItem("expenseTrackerToken");
      localStorage.removeItem("expenseTrackerRefreshToken");
      localStorage.removeItem("tokenExpiry");

      toast.error("Session expired. Please login again.");
      window.location.href = "/";
      return null;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    localStorage.removeItem("expenseTrackerToken");
    localStorage.removeItem("expenseTrackerRefreshToken");
    localStorage.removeItem("tokenExpiry");
    window.location.href = "/";
    return null;
  }
}

export async function apiClient(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("expenseTrackerToken");

  // Add authorization header if token exists
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // If unauthorized (401), try to refresh the token
    if (response.status === 401) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          // Retry the original request with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
          return fetch(url, config);
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          processQueue(null, newToken);
          isRefreshing = false;

          // Retry the original request with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          };

          return fetch(url, config);
        } else {
          processQueue(new Error("Failed to refresh token"), null);
          isRefreshing = false;
          return response;
        }
      } catch (error) {
        processQueue(error, null);
        isRefreshing = false;
        throw error;
      }
    }

    return response;
  } catch (error) {
    console.error("API Client Error:", error);
    throw error;
  }
}

// Helper function to check if token is about to expire
export function checkTokenExpiry(): void {
  const tokenExpiry = localStorage.getItem("tokenExpiry");

  if (!tokenExpiry) return;

  const expiryDate = new Date(tokenExpiry);
  const now = new Date();
  const timeUntilExpiry = expiryDate.getTime() - now.getTime();

  // If token expires in less than 5 minutes, refresh it proactively
  if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
    console.log("Token expiring soon, refreshing...");
    refreshAccessToken();
  } else if (timeUntilExpiry <= 0) {
    console.log("Token expired, refreshing...");
    refreshAccessToken();
  }
}

// Set up periodic token check (every 1 minute)
if (typeof window !== "undefined") {
  setInterval(checkTokenExpiry, 60 * 1000);
}
