import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct OAuth callback route
    const currentUrl = window.location.href;
    const newUrl = currentUrl.replace("/sso-callback", "/oauth/callback");
    window.location.href = newUrl;
  }, []);

  return null;
}
