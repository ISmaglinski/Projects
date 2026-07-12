import { ImageResponse } from "next/og";
import { people, personOrder } from "./site-data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Smaglinski — three brothers, one instinct: build.";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f3efe7",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#20231f",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: -0.5,
          }}
        >
          SMAGLINSKI
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {personOrder.map((key) => {
            const person = people[key];
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 160,
                  height: 160,
                  borderRadius: 28,
                  background: person.accent,
                  color: "#fffdf9",
                  fontSize: 56,
                  fontWeight: 700,
                  letterSpacing: -1,
                }}
              >
                {person.firstName.slice(0, 2)}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            color: "#20231f",
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.05,
          }}
        >
          Three brothers. One instinct: build.
        </div>
      </div>
    ),
    { ...size },
  );
}
