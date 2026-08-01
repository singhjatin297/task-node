import * as db from "../db/index.js";
import type { User } from "../lib.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const loginService = async (email: string, password: string) => {
  try {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await db.query(query, [email]);
    if (!result) {
      return null;
    }

    const userData = result.rows[0] as User | undefined;
    if (!userData) {
      throw new Error("INVALID USERDATA");
    }

    const passwordMatches = userData.password === password;
    if (!passwordMatches) {
      throw new Error("INVALID CREDENTIALS");
    }

    const RefreshSecret = process.env.REFRESH_SECRET;
    if (!RefreshSecret) {
      throw new Error("MISSING REFRESH JWT SECRET");
    }
    const RefreshToken = jwt.sign({ email: userData.email }, RefreshSecret, {
      expiresIn: "30d",
    });

    const AccessSecret = process.env.ACCESS_SECRET;
    if (!AccessSecret) {
      throw new Error("ACCESS JWT SECRET NOT CONFIGURED");
    }
    const AccessToken = jwt.sign({ email: userData.email }, AccessSecret, {
      expiresIn: "1h",
    });

    const tokens = {
      RefreshToken,
      AccessToken,
    };

    return tokens;
  } catch (err) {
    console.log("Error logging in: ", err);
    throw err;
  }
};

export const signupService = async (email: string, password: string) => {
  try {
    const query = `INSERT INTO users (email, password) VALUES($1, $2)`;
    const result = await db.query(query, [email, password]);
    if (!result) {
      return null;
    }

    const userData = result.rows[0] as User | undefined;
    if (userData) {
      const RefreshSecret = process.env.REFRESH_SECRET;
      if (!RefreshSecret) {
        throw new Error("MISSING REFRESH JWT SECRET");
      }
      const RefreshToken = jwt.sign({ email: userData.email }, RefreshSecret, {
        expiresIn: "30d",
      });

      const AccessSecret = process.env.ACCESS_SECRET;
      if (!AccessSecret) {
        throw new Error("MISSING ACCESS JWT SECRET");
      }
      const AccessToken = jwt.sign({ email: userData.email }, AccessSecret, {
        expiresIn: "1h",
      });

      const tokens = {
        RefreshToken,
        AccessToken,
      };

      return tokens;
    }
  } catch (err) {
    console.log("Error in signup: ", err);
    throw err;
  }
};

export const refreshService = async (token: string) => {
  try {
    const RefreshSecret = process.env.REFRESH_SECRET!;

    const decoded = jwt.verify(token, RefreshSecret) as { email: string };
    if (!decoded || typeof decoded.email !== "string") {
      throw new Error("Invalid token");
    }

    const email = decoded.email;

    const RefreshToken = jwt.sign({ email }, RefreshSecret, {
      expiresIn: "30d",
    });

    const AccessSecret = process.env.ACCESS_SECRET!;
    const AccessToken = jwt.sign({ email }, AccessSecret, { expiresIn: "1h" });

    const tokens = {
      RefreshToken,
      AccessToken,
    };

    return tokens;
  } catch (err) {
    console.log("Error in refresh: ", err);
    throw err;
  }
};
