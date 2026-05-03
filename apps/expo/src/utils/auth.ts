import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";

import { getBaseUrl } from "./base-url";

const nativeAuthClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    expoClient({
      scheme: "expo",
      storagePrefix: "expo",
      storage: SecureStore,
    }),
  ],
});

const webAuthClient = {
  getCookie: () => undefined,
  signIn: {
    social: () => Promise.resolve(undefined),
  },
  signOut: () => Promise.resolve(undefined),
  useSession: () => ({ data: undefined }),
};

export const authClient =
  Platform.OS === "web" ? webAuthClient : nativeAuthClient;
