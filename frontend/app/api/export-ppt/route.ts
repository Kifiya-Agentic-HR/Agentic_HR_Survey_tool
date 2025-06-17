import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';

export async function POST(request: NextRequest) {
  try {
    const { imageData, tabName, question, timestamp } = await request.json();
    const pptx = new PptxGenJS();
    pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { color: 'FFFFFF' },
      objects: [
        {
          text: {
            text: `${tabName.charAt(0).toUpperCase() + tabName.slice(1)} Analysis Report`,
            options: {
              x: 0.5,
              y: 0.2,
              w: 9,
              h: 0.5,
              fontSize: 24,
              bold: true,
              align: 'center',
              color: '000000',
            },
          },
        },
        {
          text: {
            text: `Question: ${question || 'N/A'}\nGenerated: ${timestamp}`,
            options: {
              x: 0.5,
              y: 0.8,
              w: 9,
              h: 0.4,
              fontSize: 12,
              align: 'left',
              color: '666666',
            },
          },
        },
      ],
    });
    const slide = pptx.addSlide('MASTER_SLIDE');
    const imgWidth = 1920; // Assume canvas width
    const imgHeight = 1080; // Assume canvas height
    const slideWidth = 10;
    const slideHeight = 5.625;
    const ratio = Math.min((slideWidth - 1) / imgWidth, (slideHeight - 2.5) / imgHeight);
    const imgScaledWidth = imgWidth * ratio;
    const imgScaledHeight = imgHeight * ratio;
    slide.addImage({
      data: imageData,
      x: (slideWidth - imgScaledWidth) / 2,
      y: 1.5,
      w: imgScaledWidth,
      h: imgScaledHeight,
    });
    const buffer = await pptx.writeFile({ type: 'buffer' });
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${tabName}_report_${new Date().toISOString().split('T')[0]}.pptx"`,
      },
    });
  } catch (error) {
    console.error('Error generating PPT:', error);
    return NextResponse.json({ error: 'Failed to generate PPT' }, { status: 500 });
  }
}