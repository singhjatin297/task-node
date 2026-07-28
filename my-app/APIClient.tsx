import { useCallback } from "react";
import { useAuth } from "./context/auth";

export const useApiClient = () => {
  const { getAccessToken } = useAuth();

  const client = useCallback(
    async (url: string, options: RequestInit = {}) => {
      try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          throw new Error("Unauthorized");
        }

        const res = await fetch(url, {
          credentials: "include",
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        // const data = await res.json();
        // if (!res.ok || data.status == 401) {
        //   throw new Error("Internal Server Error");
        // }
        return res;
      } catch (err) {
        throw new Error(`Error: ${err}`);
      }
    },
    [getAccessToken],
  );
  return client;
};
