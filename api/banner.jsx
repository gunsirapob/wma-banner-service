import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// โหลดฟอนต์จากหน้าแรกของ GitHub
const fontData = fetch(
  new URL('../LINESeedSansTH_Bd.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

export default async function handler(req) {
  const { searchParams } = new URL(req.url);

  // รับค่า T1, T2, BG, CTA จาก Google Sheet
  const t1 = searchParams.get('t1') || "";
  const t2 = searchParams.get('t2') || "";
  const bg = searchParams.get('bg') || "https://picsum.photos/1920/945";
  const cta = searchParams.get('cta') || "https://picsum.photos/500/150";
  
  const font = await fontData;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', fontFamily: 'LINESeed' }}>
        {/* 1. วางรูปพื้นหลัง */}
        <img src={bg} style={{ position: 'absolute', width: '1920px', height: '945px', objectFit: 'cover' }} />
        
        {/* 2. วางข้อความและปุ่มตรงกลาง */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '0 200px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '90px', color: '#002D63', marginBottom: '20px', fontWeight: 'bold' }}>
            {t1}
          </h1>
          <p style={{ fontSize: '45px', color: '#333', marginBottom: '50px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
            {t2}
          </p>
          <img src={cta} style={{ width: '550px', objectFit: 'contain' }} />
        </div>
      </div>
    ),
    {
      width: 1920,
      height: 945,
      fonts: [{ name: 'LINESeed', data: font, style: 'normal' }],
    }
  );
}
