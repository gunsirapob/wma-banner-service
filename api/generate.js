import { Resvg } from '@resvg/resvg-js';
import axios from 'axios';
import path from 'path';

const fixThaiSpacing = (text) => {
  if (!text) return '';
  return text.replace(/ำ/g, 'ำ\u00A0\u00A0');
};

const SVG_URL = 'https://raw.githubusercontent.com/gunsirapob/wma-banner-service/main/Cover_temp.svg';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  let { l1, l2, bgId, driveToken } = req.body;
  l1 = fixThaiSpacing(l1);
  l2 = fixThaiSpacing(l2);

  try {
    // โหลด background
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

    // ✅ ดึง SVG ล่าสุดจาก GitHub ทุกครั้ง
    const svgRes = await axios.get(SVG_URL);
    let svgContent = svgRes.data;

    // แทนค่า template
    const formattedL2 = (l2 || '').replace(/\n/g, '</tspan><tspan x="0" dy="55">');
    svgContent = svgContent
      .replace('{{L1}}', l1 || '')
      .replace('{{L2}}', formattedL2)
      .replace('{{BG_BASE64}}', bgBase64 || '');

    // Render PNG
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

    const pngBuffer = resvg.render().asPng();
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(pngBuffer);

  } catch (error) {
    console.error("Generate Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}
