import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { l1, l2, bgId } = req.body;

  try {
    // 1. ดึงภาพ Background จาก Google Drive และแปลงเป็น Base64
    let bgBase64 = '';
    if (bgId) {
      const driveUrl = `https://drive.google.com/uc?id=${bgId}&export=download`;
      const response = await axios.get(driveUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      bgBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }

    // 2. อ่านไฟล์ SVG Template จาก GitHub
    const templatePath = path.join(process.cwd(), 'Cover_temp.svg');
    let svgContent = fs.readFileSync(templatePath, 'utf8');

    // 3. ยัดข้อความ L1, L2 และ รูปภาพ Base64 ลงไปใน SVG
    svgContent = svgContent
      .replace('{{L1}}', l1 || '')
      .replace('{{L2}}', l2 || '')
      .replace('{{BG_BASE64}}', bgBase64);

    // 4. Render ภาพด้วย Resvg
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
