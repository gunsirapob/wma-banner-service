import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';
import satori from 'satori';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { l1, l2, bgId, driveToken } = req.body;

  try {
    let bgBase64 = '';
    if (bgId && driveToken) {
      const driveUrl = `https://www.googleapis.com/drive/v3/files/${bgId}?alt=media`;
      const response = await axios.get(driveUrl, {
        headers: { Authorization: `Bearer ${driveToken}` },
        responseType: 'arraybuffer'
      });
      const buffer = Buffer.from(response.data, 'binary');
      const mimeType = response.headers['content-type'] || 'image/jpeg';
      bgBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    // 🌟 1. ให้ Satori แปลงข้อความ L1, L2 เป็นกราฟิก SVG ที่จัดสระภาษาไทยแบบเป๊ะๆ 100%
    const textElements = {
      type: 'div',
      props: {
        style: { display: 'flex', width: 1080, height: 1080, position: 'relative' },
        children: [
          {
            type: 'div',
            props: {
              // ตำแหน่งของ L1 (ถ้าสูง/ต่ำไป ปรับที่เลข top: 780 ได้ครับ)
              style: { position: 'absolute', top: 780, left: 75, fontFamily: 'LINE Seed', fontWeight: 800, fontSize: 95, color: 'white', display: 'flex' },
              children: l1 || ''
            }
          },
          {
            type: 'div',
            props: {
              // ตำแหน่งของ L2 (ถ้าสูง/ต่ำไป ปรับที่เลข top: 910 ได้ครับ)
              style: { position: 'absolute', top: 910, left: 75, fontFamily: 'LINE Seed', fontWeight: 700, fontSize: 41, color: 'white', display: 'flex', flexDirection: 'column', lineHeight: 1.2 },
              children: (l2 || '').split('\n').map(line => ({
                type: 'div',
                props: { children: line }
              }))
            }
          }
        ]
      }
    };

    const textSvgOverlay = await satori(textElements, {
      width: 1080,
      height: 1080,
      fonts: [
        {
          name: 'LINE Seed',
          data: fs.readFileSync(path.join(process.cwd(), 'LINESeedSansTH_XBd.ttf')),
          weight: 800,
          style: 'normal',
        },
        {
          name: 'LINE Seed',
          data: fs.readFileSync(path.join(process.cwd(), 'LINESeedSansTH_Bd.ttf')),
          weight: 700,
          style: 'normal',
        }
      ]
    });

    // 🌟 2. อ่านไฟล์เทมเพลตเดิม แล้วประกอบร่าง!
    const templatePath = path.join(process.cwd(), 'Cover_temp.svg');
    let svgContent = fs.readFileSync(templatePath, 'utf8');

    // ใส่รูปปลาเผา/รูปพื้นหลัง
    svgContent = svgContent.replace('{{BG_BASE64}}', bgBase64 || '');
    
    // **ซ่อนข้อความระบบเก่าที่สระเพี้ยนทิ้งไปเลย**
    svgContent = svgContent.replace('{{L1}}', '').replace('{{L2}}', '');
    
    // **แปะข้อความจาก Satori (ที่สระสมบูรณ์แล้ว) ลงไปชั้นบนสุด!**
    svgContent = svgContent.replace('</svg>', `${textSvgOverlay}</svg>`);

    // 🌟 3. วาดรูปขั้นตอนสุดท้าย
    const resvg = new Resvg(svgContent, {
      fitTo: { mode: 'width', value: 1080 }
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(pngBuffer);

  } catch (error) {
    console.error("Generate Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}
