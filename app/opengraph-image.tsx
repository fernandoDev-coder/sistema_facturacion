import { ImageResponse } from "next/og";

export const alt = "FaktuDash";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f8fafc",
          color: "#071a3d",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 64,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#ffffff",
            border: "1px solid #dbe3ef",
            borderRadius: 28,
            display: "flex",
            gap: 42,
            height: "100%",
            padding: 56,
            width: "100%",
          }}
        >
          <div
            style={{
              alignItems: "center",
              border: "6px solid #071a3d",
              borderRadius: 32,
              display: "flex",
              height: 190,
              justifyContent: "center",
              position: "relative",
              width: 190,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "6px solid #071a3d",
                borderRadius: 18,
                display: "flex",
                height: 118,
                position: "relative",
                width: 88,
              }}
            />
            <div
              style={{
                background: "#1557f0",
                border: "8px solid #ffffff",
                borderRadius: 999,
                bottom: 22,
                height: 70,
                position: "absolute",
                right: 20,
                width: 70,
              }}
            />
            <div
              style={{
                background: "#ffffff",
                borderRadius: 999,
                bottom: 46,
                height: 10,
                position: "absolute",
                right: 54,
                transform: "rotate(45deg)",
                width: 24,
              }}
            />
            <div
              style={{
                background: "#ffffff",
                borderRadius: 999,
                bottom: 50,
                height: 10,
                position: "absolute",
                right: 33,
                transform: "rotate(-48deg)",
                width: 42,
              }}
            />
            <div style={{ color: "#071a3d", fontSize: 72, fontWeight: 900, position: "absolute" }}>€</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 88, fontWeight: 900, letterSpacing: 0 }}>
              <span>Faktu</span>
              <span style={{ color: "#1557f0" }}>Dash</span>
            </div>
            <div style={{ color: "#334155", display: "flex", fontSize: 36, lineHeight: 1.25, maxWidth: 720 }}>
              Facturas, presupuestos y clientes en un solo panel.
            </div>
            <div
              style={{
                color: "#1557f0",
                display: "flex",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 6,
                marginTop: 16,
                textTransform: "uppercase",
              }}
            >
              Factura. Organiza. Cobra. Crece.
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
