
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'Prontly Store';
    const type = searchParams.get('type') || 'Asset';
    const category = searchParams.get('category') || 'Marketplace';

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
            fontFamily: 'Inter',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                height: '60px',
                width: '60px',
                borderRadius: '16px',
                backgroundColor: '#5b52d6',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '20px',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '-0.05em',
              }}
            >
              PRONTLY <span style={{ color: '#5b52d6', marginLeft: '8px' }}>STORE</span>
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '10px 20px',
                borderRadius: '30px',
                backgroundColor: 'rgba(91, 82, 214, 0.1)',
                border: '1px solid rgba(91, 82, 214, 0.2)',
                color: '#5b52d6',
                fontSize: '20px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '24px',
              }}
            >
              {category}
            </div>
            <h1
              style={{
                fontSize: '80px',
                fontWeight: 900,
                color: 'white',
                lineHeight: 1.1,
                marginBottom: '20px',
                letterSpacing: '-0.02em',
                maxWidth: '900px',
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: '32px',
                color: '#a1a1aa',
                lineHeight: 1.4,
              }}
            >
              Unlock professional {type.toLowerCase()} for your digital workflow.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '40px',
            }}
          >
            <div
              style={{
                padding: '16px 32px',
                borderRadius: '16px',
                backgroundColor: 'white',
                color: 'black',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              View on Store
            </div>
            <span
              style={{
                marginLeft: '24px',
                fontSize: '24px',
                color: '#5b52d6',
                fontWeight: 'bold',
              }}
            >
              store.prontly.in
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
