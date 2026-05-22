"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cloud, AlertCircle, CheckCircle2 } from "lucide-react";
import { saveTokens } from "@/lib/dropbox/tokens";
import { getAccountInfo } from "@/lib/dropbox/client";

type State = "loading" | "success" | "error";

export default function DropboxCallbackPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const params       = new URLSearchParams(window.location.search);
        const code         = params.get("code");
        const returnedState = params.get("state");
        const storedState  = sessionStorage.getItem("dropbox-pkce-state");
        const codeVerifier = sessionStorage.getItem("dropbox-pkce-verifier");

        if (!code || !returnedState || returnedState !== storedState || !codeVerifier) {
          throw new Error("Invalid OAuth state — possible CSRF attempt.");
        }

        sessionStorage.removeItem("dropbox-pkce-state");
        sessionStorage.removeItem("dropbox-pkce-verifier");

        const redirectUri = `${window.location.origin}/auth/dropbox/callback`;

        const tokenRes = await fetch("/api/dropbox/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, codeVerifier, redirectUri }),
        });

        if (!tokenRes.ok) {
          const { error } = await tokenRes.json();
          throw new Error(error ?? "Token exchange failed");
        }

        const { accessToken, refreshToken, expiresAt } = await tokenRes.json();
        const { displayName } = await getAccountInfo(accessToken);

        saveTokens({ accessToken, refreshToken, expiresAt, accountName: displayName });
        setState("success");

        setTimeout(() => router.replace("/settings"), 1200);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
        setState("error");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-parchment-100 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        {state === "loading" && (
          <>
            <div className="w-14 h-14 bg-parchment-200 rounded-full flex items-center justify-center animate-pulse">
              <Cloud size={26} className="text-ink-400" />
            </div>
            <p className="font-serif text-lg text-ink-900">Connecting to Dropbox…</p>
          </>
        )}
        {state === "success" && (
          <>
            <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={26} className="text-sage-600" />
            </div>
            <p className="font-serif text-lg text-ink-900">Connected!</p>
            <p className="text-sm text-ink-400">Taking you back to Settings…</p>
          </>
        )}
        {state === "error" && (
          <>
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle size={26} className="text-red-500" />
            </div>
            <p className="font-serif text-lg text-ink-900">Connection failed</p>
            <p className="text-sm text-ink-400">{errorMsg}</p>
            <button
              onClick={() => router.replace("/settings")}
              className="mt-2 text-sm text-saffron-500 hover:text-saffron-600 font-medium"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
