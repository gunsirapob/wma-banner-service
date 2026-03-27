import { ImageResponse } from '@vercel/og';
import React from 'react';

export const config = { runtime: 'edge' };

// 1. โหลดฟอนต์ภาษาไทยจากหน้าแรกของ GitHub
const fontData = fetch(
  new URL('../LINESeedSansTH_Bd.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

export default async function handler(req) {
  const { searchParams } = new URL(req.url);

  // 2. รับค่าที่ส่งมาจาก Google Apps Script
  const t1 = searchParams.get('t1') || "";
  const t2 = searchParams.get('t2') || "";
  const bg = searchParams.get('bg') || "https://picsum.photos/1920/945"; // รูปสำรองถ้าหา BG ไม่เจอ
  const cta = searchParams.get('cta') || "https://picsum.photos/500/150"; // รูปสำรองถ้าหาปุ่มไม่เจอ
  
  const font = await fontData;

  // 3. เริ่มกระบวนการวาดรูป (ใช้ React.createElement แทนเครื่องหมาย < >)
  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          fontFamily: 'LINESeed',
        },
      },
      [
        // เลเยอร์ที่ 1: รูปพื้นหลัง (BG)
        React.createElement('img', {
          src: bg,
          style: {
            position: 'absolute',
            width: '1920px',
            height: '945px',
            objectFit: 'cover',
          },
        }),
        // เลเยอร์ที่ 2: กล่องข้อความและปุ่ม (CTA)
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              padding: '0 200px',
              textAlign: 'center',
            },
          },
          [
            // หัวข้อ (T1)
            React.createElement(
              'h1',
              {
                style: {
                  fontSize: '90px',
                  color: '#002D63',
                  marginBottom: '20px',
                  fontWeight: 'bold',
                },
              },
              t1
            ),
            // รายละเอียด (T2)
            React.createElement(
              'p',
              {
                style: {
                  fontSize: '45px',
                  color: '#333',
                  marginBottom: '50px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.4',
                },
              },
              t2
            ),
            // รูปปุ่ม (CTA)
            React.createElement('img', {
              src: cta,
              style: {
                width: '550px',
                objectFit: 'contain',
              },
            }),
          ]
        ),
      ]
    ),
    {
      width: 1920,
      height: 945,
      fonts: [
        {
          name: 'LINESeed',
          data: font,
          style: 'normal',
        },
      ],
    }
  );
}
