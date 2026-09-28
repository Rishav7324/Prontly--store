import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = (searchParams.get('title') || 'Prontly Store').slice(0, 80);
    const type = (searchParams.get('type') || 'Digital Asset').slice(0, 30);
    const price = searchParams.get('price');
    const category = (searchParams.get('category') || 'Premium Marketplace').slice(0, 40);
    const image = searchParams.get('image');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#0C0A09',
            backgroundImage: 'radial-gradient(circle at 85% 15%, #292524 0%, #0C0A09 65%)',
            padding: '70px 80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top Brand Bar */}
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  height: '48px',
                  width: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#A16207',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '24px',
                  fontWeight: 900,
                  marginRight: '16px',
                }}
              >
                P
              </div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#FAFAF9', letterSpacing: '-0.03em' }}>
                PRONTLY <span style={{ color: '#A16207', marginLeft: '6px' }}>STORE</span>
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(161, 98, 7, 0.15)',
                border: '1px solid rgba(161, 98, 7, 0.4)',
                color: '#D97706',
                fontSize: '16px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {category}
            </div>
          </div>

          {/* Middle Content */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: image ? '40px' : '0px' }}>
              <h1
                style={{
                  fontSize: title.length > 45 ? '54px' : '64px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  lineHeight: 1.15,
                  marginBottom: '20px',
                  letterSpacing: '-0.02em',
                  maxWidth: image ? '680px' : '900px',
                }}
              >
                {title}
              </h1>

              {price && (
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '4px' }}>
                  <span style={{ fontSize: '46px', color: '#D97706', fontWeight: 800 }}>
                    ₹{price}
                  </span>
                  <span style={{ fontSize: '20px', color: '#78716C', marginLeft: '12px', fontWeight: 600 }}>
                    Perpetual License
                  </span>
                </div>
              )}

              <p style={{ fontSize: '24px', color: '#A8A29E', lineHeight: 1.4, marginTop: '16px', maxWidth: '640px' }}>
                Verified digital workflow systems & high-performance assets.
              </p>
            </div>

            {image && (
              <div
                style={{
                  display: 'flex',
                  width: '360px',
                  height: '360px',
                  borderRadius: '28px',
                  overflow: 'hidden',
                  border: '4px solid rgba(214, 211, 209, 0.15)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                  backgroundColor: '#1C1917',
                }}
              >
                <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Asset" />
              </div>
            )}
          </div>

          {/* Bottom Trust Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(214, 211, 209, 0.12)',
              paddingTop: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  padding: '12px 26px',
                  borderRadius: '12px',
                  backgroundColor: '#A16207',
                  color: '#FFFFFF',
                  fontSize: '18px',
                  fontWeight: 700,
                }}
              >
                Instant Digital Delivery
              </div>
              <span style={{ marginLeft: '20px', fontSize: '20px', color: '#D6D3D1', fontWeight: 600 }}>
                store.prontly.in
              </span>
            </div>
            <div style={{ display: 'flex', color: '#78716C', fontSize: '18px', fontWeight: 600 }}>
              Curated Production Assets
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: any) {
    return new Response(`Failed to generate OpenGraph image`, { status: 500 });
  }
}
