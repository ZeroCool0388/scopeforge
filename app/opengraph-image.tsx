import { ImageResponse } from 'next/og';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#f7f8fa',
        padding: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        color: '#20212c',
      }}
    >
      <div style={{ fontSize: 28, color: '#5146df', marginBottom: 35 }}>
        ScopeForge / Steve Grady
      </div>
      <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.1 }}>
        A vague brief.
      </div>
      <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.1 }}>
        A clear way forward.
      </div>
      <div style={{ fontSize: 25, marginTop: 30 }}>
        Goals. Boundaries. Better questions. A proposal you can stand behind.
      </div>
      <div style={{ fontSize: 18, marginTop: 48, color: '#666670' }}>
        Synthetic demo — fictional customers
      </div>
    </div>,
    size,
  );
}
