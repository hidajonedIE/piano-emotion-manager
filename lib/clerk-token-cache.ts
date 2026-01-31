import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { TokenCache } from "@clerk/clerk-expo";

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        if (Platform.OS === "web") {
          return localStorage.getItem(key);
        }
        const item = await SecureStore.getItemAsync(key);
        return item;
      } catch (error) {
        console.error("[TokenCache] Error getting token:", error);
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      try {
        if (Platform.OS === "web") {
          localStorage.setItem(key, token);
          return;
        }
        await SecureStore.setItemAsync(key, token);
      } catch (error) {
        console.error("[TokenCache] Error saving token:", error);
      }
    },
    clearToken: async (key: string) => {
      try {
        if (Platform.OS === "web") {
          localStorage.removeItem(key);
          return;
        }
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error("[TokenCache] Error clearing token:", error);
      }
    },
  };
};

export const tokenCache = createTokenCache();
