import { ImageResponse } from '@vercel/og';
import React from 'react';

export const config = { runtime: 'edge' };

// โหลดฟอนต์ (Path เดิมจากหน้าแรก)
const fontData = fetch(
  new URL('../LINESeedSansTH_Bd.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const t1 = searchParams.get('t1') || "";
  const t2 = searchParams.get('t2') || "";
  const bg = searchParams.get('bg') || "https://picsum.photos/1920/945";
  const cta = searchParams.get('cta') || "https://picsum.photos/500/150";
  const font = await fontData;

  return new ImageResponse(
    React.createElement('div', {
      style: { display: 'flex', width: '100%', height: '100%', position: 'relative', fontFamily: 'LINESeed' }
    }, [
      // 1. รูปพื้นหลัง
      React.createElement('img', {
        src: bg,
        style: { position: 'absolute', width: '1920px', height: '945px', objectFit: 'cover' }
      }),
      // 2. เลเยอร์ข้อความและปุ่ม
      React.createElement('div', {
        style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '0 200px', textAlign: 'center' }
      }, [
        React.createElement('h1', {
          style: { fontSize: '90px', color: '#002D63', marginBottom: '20px', fontWeight: 'bold' }
        }, t1),
        React.createElement('p', {
          style: { fontSize: '45px', color: '#333', marginBottom: '50px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }
        }, t2),
        React.createElement('img', {
          src: cta,
          style: { width: '550px', objectFit: 'contain' }
        })
      ])
    ]),
    {
      width: 1920,
      height: 945,
      fonts: [{ name: 'LINESeed', data: font, style: 'normal' }],
    }
  );
}
