import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // รับรูป bgBase64 ที่ Google Sheet ส่งมาให้แบบพร้อมใช้
  const { l1, l2, bgBase64 } = req.body;

  try {
    // 1. อ่านไฟล์ SVG Template
    const templatePath = path.join(process.cwd(), 'Cover_temp.svg');
    let svgContent = fs.readFileSync(templatePath, 'utf8');

    // 2. แปะข้อความ และ แปะรูป ลงไปใน SVG ดื้อๆ เลย
    svgContent = svgContent
      .replace('{{L1}}', l1 || '')
      .replace('{{L2}}', l2 || '')
      .replace('{{BG_BASE64}}', bgBase64 || '');

    // 3. Render ภาพด้วย Resvg
    const resvg = new Resvg(svgContent, {
      font: {
        fontFiles: [
          path.join(process.cwd(), 'LINESeedSansTH_XBd.ttf'),
          path.join(process.cwd(), 'LINESeedSansTH_Bd.ttf')
        ],
        loadSystemFonts: false,
        defaultFontFamily: 'LINE Seed Sans TH',
      },
      fitTo: { mode: 'width', value: 1080 }
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(pngBuffer);

  } catch (error) {
    console.error("Generate Error:", error);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}
