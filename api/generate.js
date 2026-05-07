import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { l1, l2, bgId, driveToken } = req.body;

  try {
    // ---- โหลด font เป็น base64 ----
    const fontBd = fs.readFileSync(
      path.join(process.cwd(), 'LINESeedSansTH_Bd.ttf')
    ).toString('base64');

    const fontXBd = fs.readFileSync(
      path.join(process.cwd(), 'LINESeedSansTH_XBd.ttf')
    ).toString('base64');

    // ---- โหลด background จาก Google Drive ----
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

    // ---- โหลด SVG template ----
    const templatePath = path.join(process.cwd(), 'Cover_temp.svg');
    let svgContent = fs.readFileSync(templatePath, 'utf8');

    // ---- ยัด font เข้าไปใน <defs> ของ SVG ----
    svgContent = svgContent.replace(
      '<defs>',
      `<defs>
    <style>
      @font-face {
        font-family: 'LINE Seed Sans TH';
        font-weight: 700;
        src: url('data:font/ttf;base64,${fontBd}') format('truetype');
      }
      @font-face {
        font-family: 'LINE Seed Sans TH';
        font-weight: 800;
        src: url('data:font/ttf;base64,${fontXBd}') format('truetype');
      }
    </style>`
    );

    // ---- แทนที่ข้อความใน template ----
    const formattedL2 = (l2 || '').replace(/\n/g, '</tspan><tspan x="0" dy="55">');

    svgContent = svgContent
      .replace('{{L1}}', l1 || '')
      .replace('{{L2}}', formattedL2)
      .replace('{{BG_BASE64}}', bgBase64 || '');

    // ---- แปลง SVG → PNG ----
    const resvg = new Resvg(svgContent, {
      font: {
        fontFiles: [
          path.join(process.cwd(), 'LINESeedSansTH_Bd.ttf'),
          path.join(process.cwd(), 'LINESeedSansTH_XBd.ttf')
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
