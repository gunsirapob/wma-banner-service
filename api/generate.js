import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { l1, l2, bgId } = req.body;

  try {
    // 1. ดึงรูป Background จาก Google Drive และแปลงเป็น Base64
    const driveUrl = `https://drive.google.com/uc?export=download&id=${bgId}`;
    const response = await axios.get(driveUrl, { responseType: 'arraybuffer' });
    const bgBase64 = `data:image/jpeg;base64,${Buffer.from(response.data).toString('base64')}`;

    // 2. อ่านไฟล์ SVG Template
    const templatePath = path.join(process.cwd(), 'Cover_temp.svg');
    let svgContent = fs.readFileSync(templatePath, 'utf8');

    // 3. แทนที่ข้อมูลเข้าไปใน SVG
    svgContent = svgContent
      .replace('{{L1}}', l1 || '')
      .replace('{{L2}}', l2 || '')
      .replace('{{BG_BASE64}}', bgBase64);

    // 4. ตั้งค่าฟอนต์ (อ้างอิงไฟล์ .ttf ในเครื่อง)
    const resvg = new Resvg(svgContent, {
      font: {
        fontFiles: [
          path.join(process.cwd(), 'LINESeedSansTH_XBd.ttf'),
          path.join(process.cwd(), 'LINESeedSansTH_Bd.ttf')
        ],
        loadSystemFonts: false,
        defaultFontFamily: 'LINE Seed Sans TH',
      },
      fitTo: { mode: 'width', value: 1080 } // ปรับขนาดหน้าปกเป็น 1080px
    });

    // 5. Render และส่งไฟล์ภาพกลับไป
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(pngBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}
