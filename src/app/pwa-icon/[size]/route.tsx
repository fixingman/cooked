import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: { size: string } }
) {
  const size = Math.min(Math.max(parseInt(params.size, 10) || 192, 16), 512);
  const r = Math.round(size * 0.22);
  const iconSize = Math.round(size * 0.60);
  const showHighlight = size >= 96;

  return new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        background: "linear-gradient(150deg, #F5960A 0%, #CC6F00 100%)",
        borderRadius: r,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="white"
        stroke="none"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        {showHighlight && (
          <ellipse cx="12" cy="13.5" rx="2" ry="3" fill="rgba(255,255,255,0.18)" />
        )}
      </svg>
    </div>,
    { width: size, height: size }
  );
}
