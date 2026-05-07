import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';

// 🛠 ท่าไม้ตายจัดการ "สระอำ" ให้เรียงตัวสวยงาม
const fixThaiVowels = (text) => {
  if (!text) return '';
  // 1. กรณีมีวรรณยุกต์นำหน้าสระอำ (เช่น น้ำ, ซ้ำ) -> แยกชิ้นส่วนและสลับตำแหน่งให้ถูกต้อง
  let fixedText = text.replace(/([่-๋])ำ/g, 'ํ$1า');
  // 2. กรณีสระอำเดี่ยวๆ (เช่น ทำ, ดำ) -> เปลี่ยนเป็น วงกลม + สระอา
  fixedText = fixedText.replace(/ำ/g, 'ํา');
  return fixedText;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  let { l1, l2, bgId, driveToken } = req.body;

  // จับข้อความมาเข้าเครื่องสแกนแก้สระอำก่อนนำไปใช้งาน
  l1 = fixThaiVowels(l1);
  l2 = fixThaiVowels(l2);

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

    const templatePath = path.join(process.cwd(), 'Cover_temp.svg');
    let svgContent = fs.readFileSync(templatePath, 'utf8');

    // ระบบตัดบรรทัด
    const formattedL2 = (l2 || '').replace(/\n/g, '</tspan><tspan x="0" dy="55">');

    svgContent = svgContent
      .replace('{{L1}}', l1 || '')
      .replace('{{L2}}', formattedL2)
      .replace('{{BG_BASE64}}', bgBase64 || '');

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
    console.error("Generate Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}
