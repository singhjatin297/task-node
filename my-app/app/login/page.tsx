"use client";

import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState<string>("user@example.com");
  const [password, setPassword] = useState<string>("Password@123");
  const { setToken } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = { email, password };
    if (!email || !password) return window.alert("Please fill all the fields");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? "Login failed");
      }

      setToken(result.token);
      router.push("/dashboard");
    } catch (err) {
      console.log("Login Error", err);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
