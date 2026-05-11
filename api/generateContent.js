import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // รับแค่ bgId กับ Token เพราะ Content ไม่มี Text แล้ว
  const { bgId, driveToken } = req.body;

  try {
    let bgBase64 = '';
    
    // ดึงรูปจาก Drive
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

    // บังคับอ่านไฟล์ Content_temp.svg โดยเฉพาะ
    const templatePath = path.join(process.cwd(), 'Content_temp.svg');
    let svgContent = fs.readFileSync(templatePath, 'utf8');

    // แทนที่รูปภาพใน Template
    svgContent = svgContent.replace('{{BG_BASE64}}', bgBase64 || '');

    const resvg = new Resvg(svgContent, {
      font: { loadSystemFonts: false },
      fitTo: { mode: 'width', value: 1080 }
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(pngBuffer);

  } catch (error) {
    console.error("Content Generate Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate content image', details: error.message });
  }
}
