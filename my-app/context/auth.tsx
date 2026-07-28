"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  getAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  const logout = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" });
    setToken(null);
  }, []);

  const refresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const response = await res.json();

      if (!res.ok) {
        await logout();
        setToken(null);
        return null;
      } else {
        setToken(response.accessToken);
        return response.accessToken;
      }
    } catch (err) {
      console.error("Refresh auth failed", err);
      await logout();
      throw new Error("Session Expired");
    }
  }, [logout]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (token) {
      const data = JSON.parse(atob(token.split(".")[1]));
      const expiryTime = data.exp * 1000 - Date.now();
      if (expiryTime > 30_000) return token;
    }

    return refresh();
  }, [refresh, token]);

  return (
    <AuthContext.Provider value={{ token, setToken, getAccessToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

// import {
//   useCallback,
//   createContext,
//   Dispatch,
//   ReactNode,
//   SetStateAction,
//   useContext,
//   useRef,
//   useState,
// } from "react";

// interface AuthContextType {
//   token: string;
//   setToken: Dispatch<SetStateAction<string>>;
//   getAccessToken: () => Promise<string | null>;
//   logout: () => Promise<void>;
//   refresh: () => Promise<string | null>;
// }
// const AuthContext = createContext<AuthContextType | null>(null);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [token, setToken] = useState<string>("");

//   const logout = useCallback(async () => {
//     await fetch("/api/logout", {
//       method: "POST",
//       credentials: "include",
//       headers: { "Content-Type": "application/json" },
//     });
//     setToken("");
//   }, []);

//   const refreshPromise = useRef<Promise<string | null> | null>(null);
//   const refresh = useCallback(async (): Promise<string | null> => {
//     if (refreshPromise.current) return refreshPromise.current;

//     refreshPromise.current = (async () => {
//       try {
//         const res = await fetch("/api/refresh", {
//           method: "POST",
//           credentials: "include",
//           headers: { "Content-Type": "application/json" },
//         });

//         if (!res.ok) {
//           await logout();
//           return null;
//         }

//         const authData = await res.json();
//         const accessToken = authData.accessToken;
//         setToken(accessToken);
//         return accessToken;
//       } catch {
//         await logout();
//         throw new Error("Session Expired");
//       } finally {
//         refreshPromise.current = null;
//       }
//     })();
//     return refreshPromise.current;
//   }, [logout]);

//   const getAccessToken = useCallback(async (): Promise<string | null> => {
//     if (token) {
//       const data = JSON.parse(atob(token.split(".")[1]));
//       const expiryTime = data.exp * 1000 - Date.now();
//       if (expiryTime > 30_000) return token;
//     }

//     return refresh();
//   }, [refresh, token]);

//   return (
//     <AuthContext.Provider
//       value={{ token, setToken, getAccessToken, logout, refresh }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
//   return ctx;
// };
