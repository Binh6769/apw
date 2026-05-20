const pptxgen = require('pptxgenjs');
const path = require('path');
const html2pptx = require('./html2pptx.cjs');

async function createPresentation() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'OpenCode';
    pptx.title = 'Anime: A World of Animation';

    const slidesDir = path.join(__dirname, 'slides');
    const slideFiles = [
        'slide1.html', 'slide2.html', 'slide3.html', 'slide4.html',
        'slide5.html', 'slide6.html', 'slide7.html', 'slide8.html',
        'slide9.html', 'slide10.html'
    ];

    for (const file of slideFiles) {
        const filePath = path.join(slidesDir, file);
        await html2pptx(filePath, pptx);
    }

    await pptx.writeFile({ fileName: 'The_World_Wide_Web.pptx' });
    console.log('Presentation created: The_World_Wide_Web.pptx');
}

createPresentation().catch(console.error);
