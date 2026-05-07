import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';

// 🛠 ฟังก์ชันเปลี่ยน สระอำ เป็น นิคหิต + สระอา (ใช้ Unicode เพื่อป้องกันโค้ดเพี้ยน)
const fixThaiVowels = (text) => {
  if (!text) return '';
  // \u0E48-\u0E4B คือ ไม้เอก ถึง ไม้จัตวา
  // \u0E33 คือ สระอำ
  // \u0E4D คือ นิคหิต (วงกลมด้านบน)
  // \u0E32 คือ สระอา
  
  // 1. ถ้ามี วรรณยุกต์ + สระอำ (เช่น น้ำ) -> ให้สลับเป็น นิคหิต + วรรณยุกต์ + สระอา
  let result = text.replace(/([\u0E48-\u0E4B])\u0E33/g, '\u0E4D$1\u0E32');
  
  // 2. ถ้าเป็น สระอำ เดี่ยวๆ (เช่น ทำ) -> ให้เปลี่ยนเป็น นิคหิต + สระอา
  result = result.replace(/\u0E33/g, '\u0E4D\u0E32');
  
  return result;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  let { l1, l2, bgId, driveToken } = req.body;

  // เอาข้อความมาผ่านตัวกรอง Unicode ก่อน
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

    // ระบบตัดบรรทัด L2
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
