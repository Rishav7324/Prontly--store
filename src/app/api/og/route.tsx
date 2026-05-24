import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'Prontly Store';
    const type = searchParams.get('type') || 'Asset';
    const price = searchParams.get('price');
    const category = searchParams.get('category') || 'Marketplace';
    const image = searchParams.get('image');
    const logoUrl = 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            backgroundImage: 'radial-gradient(circle at 50% 120%, #1e1b4b 0%, #09090b 100%)',
            padding: '80px',
          }}
        >
          {/* Logo Section */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <img 
              src={logoUrl} 
              style={{ height: '60px', width: '60px', borderRadius: '16px', marginRight: '20px', objectFit: 'cover' }} 
              alt="Logo" 
            />
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', letterSpacing: '-0.05em' }}>
              PRONTLY <span style={{ color: '#5b52d6', marginLeft: '8px' }}>STORE</span>
            </span>
          </div>

          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: '40px' }}>
              <div style={{ display: 'flex', padding: '10px 20px', borderRadius: '30px', backgroundColor: 'rgba(91, 82, 214, 0.1)', border: '1px solid rgba(91, 82, 214, 0.2)', color: '#5b52d6', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', alignSelf: 'flex-start' }}>
                {category}
              </div>
              <h1 style={{ fontSize: '72px', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em', maxWidth: '700px' }}>
                {title}
              </h1>
              {price && (
                <div style={{ display: 'flex', fontSize: '48px', color: '#5b52d6', fontWeight: 'bold' }}>
                  ₹{price}
                </div>
              )}
              <p style={{ fontSize: '28px', color: '#a1a1aa', lineHeight: 1.4, marginTop: '20px' }}>
                Unlock professional {type.toLowerCase()} for your digital workflow.
              </p>
            </div>

            {image && (
              <div style={{ display: 'flex', width: '400px', height: '400px', borderRadius: '40px', overflow: 'hidden', border: '8px solid rgba(255,255,255,0.05)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
                <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Product" />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', width: '100%', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '16px 32px', borderRadius: '16px', backgroundColor: 'white', color: 'black', fontSize: '24px', fontWeight: 'bold' }}>
                Get It Now
              </div>
              <span style={{ marginLeft: '24px', fontSize: '24px', color: '#5b52d6', fontWeight: 'bold' }}>store.prontly.in</span>
            </div>
            <div style={{ display: 'flex', color: '#a1a1aa', fontSize: '20px' }}>
              Premium Digital Assets
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
