import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Cooked — Your cooking companion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }
  ).then((r) => r.text());

  const match = css.match(/src: url\(([^)]+)\) format\('woff2'\)/);
  if (!match?.[1]) throw new Error(`Font URL not found for: ${family}`);
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export default async function Image() {
  const [texturina, inter] = await Promise.all([
    loadGoogleFont("Texturina:wght@700", "Cooked"),
    loadGoogleFont("Inter:wght@400", "Your cooking companion"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Flame badge */}
      <div
        style={{
          width: 120,
          height: 120,
          background: "#E8890C",
          borderRadius: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 36,
          boxShadow: "0 8px 32px rgba(232,137,12,0.35)",
        }}
      >
        <svg
          width={64}
          height={64}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      </div>

      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: "#1C1917",
          letterSpacing: "-3px",
          lineHeight: 1,
          fontFamily: "Texturina",
        }}
      >
        Cooked
      </div>

      <div
        style={{
          fontSize: 30,
          color: "#78716C",
          marginTop: 20,
          fontFamily: "Inter",
          letterSpacing: "0.3px",
        }}
      >
        Your cooking companion
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Texturina", data: texturina, weight: 700, style: "normal" },
        { name: "Inter", data: inter, weight: 400, style: "normal" },
      ],
    }
  );
}
