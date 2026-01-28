const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const path = require('path');

// Feather icons (outline style)
const { FiGrid, FiSearch, FiBookmark, FiShare2, FiLock, FiUser, FiFolder, FiMessageCircle,
  FiCode, FiDatabase, FiCloud, FiLayers, FiMonitor, FiSmartphone, FiCheckCircle,
  FiArrowRight, FiGithub, FiMail, FiMapPin } = require('react-icons/fi');

const WORKSPACE = 'D:/project/Clone/apw/plans/reports/workspace';
const OUTPUT = 'D:/project/Clone/apw/plans/reports/presentation-260128-1844-apw-project-intro.pptx';

// Colors
const DARK_BG = '1a1a2e', DARK_SECONDARY = '16213e', ACCENT_RED = 'E60023', ACCENT_BLUE = '00d4ff', WHITE = 'FFFFFF', GRAY = 'a0aec0';

async function rasterizeIcon(IconComponent, color, size, filename) {
  const svgString = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color: `#${color}`, size: size, strokeWidth: 1.5 })
  );
  await sharp(Buffer.from(svgString)).png().toFile(path.join(WORKSPACE, filename));
  return path.join(WORKSPACE, filename);
}

async function createGradientBg(filename, color1, color2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#${color1}"/><stop offset="100%" style="stop-color:#${color2}"/>
    </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(WORKSPACE, filename));
  return path.join(WORKSPACE, filename);
}

async function createAccentLine(filename) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="6">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#${ACCENT_RED}"/><stop offset="100%" style="stop-color:#${ACCENT_BLUE}"/>
    </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)" rx="3"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(WORKSPACE, filename));
  return path.join(WORKSPACE, filename);
}

async function main() {
  console.log('Đang tạo icons và assets...');
  await createGradientBg('bg-dark.png', DARK_BG, DARK_SECONDARY);
  await createAccentLine('accent-line.png');

  const icons = {
    grid: await rasterizeIcon(FiGrid, WHITE, 64, 'icon-grid.png'),
    search: await rasterizeIcon(FiSearch, WHITE, 48, 'icon-search.png'),
    bookmark: await rasterizeIcon(FiBookmark, WHITE, 48, 'icon-bookmark.png'),
    share: await rasterizeIcon(FiShare2, WHITE, 48, 'icon-share.png'),
    lock: await rasterizeIcon(FiLock, WHITE, 40, 'icon-lock.png'),
    user: await rasterizeIcon(FiUser, WHITE, 40, 'icon-user.png'),
    folder: await rasterizeIcon(FiFolder, WHITE, 40, 'icon-folder.png'),
    message: await rasterizeIcon(FiMessageCircle, WHITE, 40, 'icon-message.png'),
    code: await rasterizeIcon(FiCode, WHITE, 40, 'icon-code.png'),
    database: await rasterizeIcon(FiDatabase, WHITE, 40, 'icon-database.png'),
    cloud: await rasterizeIcon(FiCloud, WHITE, 40, 'icon-cloud.png'),
    layers: await rasterizeIcon(FiLayers, WHITE, 40, 'icon-layers.png'),
    monitor: await rasterizeIcon(FiMonitor, WHITE, 48, 'icon-monitor.png'),
    phone: await rasterizeIcon(FiSmartphone, WHITE, 48, 'icon-phone.png'),
    check: await rasterizeIcon(FiCheckCircle, ACCENT_BLUE, 32, 'icon-check.png'),
    arrow: await rasterizeIcon(FiArrowRight, GRAY, 32, 'icon-arrow.png'),
    github: await rasterizeIcon(FiGithub, WHITE, 48, 'icon-github.png'),
    mail: await rasterizeIcon(FiMail, WHITE, 48, 'icon-mail.png'),
    pin: await rasterizeIcon(FiMapPin, WHITE, 40, 'icon-pin.png'),
  };

  console.log('Đang tạo bài thuyết trình...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'APW - Ứng dụng Pinterest Clone';
  pptx.author = 'APW Team';

  const addDarkBg = (slide) => slide.addImage({ path: path.join(WORKSPACE, 'bg-dark.png'), x: 0, y: 0, w: 10, h: 5.625 });
  const addAccentLine = (slide, x, y, w) => slide.addImage({ path: path.join(WORKSPACE, 'accent-line.png'), x, y, w, h: 0.05 });

  // ===== SLIDE 1: Trang bìa =====
  let slide1 = pptx.addSlide();
  addDarkBg(slide1);
  slide1.addImage({ path: icons.grid, x: 4.65, y: 1.2, w: 0.7, h: 0.7 });
  slide1.addText('APW - Pinterest Clone', { x: 0.5, y: 2, w: 9, h: 0.8, fontSize: 44, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });
  addAccentLine(slide1, 3.5, 2.85, 3);
  slide1.addText('Khám phá, Lưu trữ & Chia sẻ Nội dung Hình ảnh', { x: 0.5, y: 3, w: 9, h: 0.5, fontSize: 20, color: GRAY, align: 'center', fontFace: 'Arial' });
  slide1.addText([
    { text: 'React 19', options: { color: ACCENT_BLUE } },
    { text: '  |  ', options: { color: GRAY } },
    { text: 'TypeScript', options: { color: WHITE } },
    { text: '  |  ', options: { color: GRAY } },
    { text: 'Supabase', options: { color: ACCENT_BLUE } },
  ], { x: 0.5, y: 4.2, w: 9, h: 0.4, fontSize: 16, align: 'center', fontFace: 'Arial' });

  // ===== SLIDE 2: Vấn đề & Giải pháp =====
  let slide2 = pptx.addSlide();
  addDarkBg(slide2);
  slide2.addText('Vấn đề & Giải pháp', { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: 'Arial' });
  addAccentLine(slide2, 0.5, 0.95, 2.5);

  slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.4, w: 4.3, h: 1.8, fill: { color: DARK_SECONDARY }, line: { color: '2d3a5a', pt: 1 }, rectRadius: 0.1 });
  slide2.addText('VẤN ĐỀ', { x: 0.7, y: 1.5, w: 4, h: 0.35, fontSize: 12, bold: true, color: ACCENT_RED, fontFace: 'Arial' });
  slide2.addText('Người dùng cần nền tảng hiện đại để khám phá, sắp xếp và chia sẻ nguồn cảm hứng hình ảnh hiệu quả.', { x: 0.7, y: 1.9, w: 3.9, h: 1, fontSize: 14, color: GRAY, fontFace: 'Arial' });

  slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: 1.4, w: 4.3, h: 1.8, fill: { color: DARK_SECONDARY }, line: { color: '2d3a5a', pt: 1 }, rectRadius: 0.1 });
  slide2.addText('GIẢI PHÁP', { x: 5.4, y: 1.5, w: 4, h: 0.35, fontSize: 12, bold: true, color: ACCENT_BLUE, fontFace: 'Arial' });
  slide2.addText('Ứng dụng phong cách Pinterest với công nghệ hiện đại: React 19, TypeScript & Supabase.', { x: 5.4, y: 1.9, w: 3.9, h: 1, fontSize: 14, color: GRAY, fontFace: 'Arial' });

  slide2.addImage({ path: icons.search, x: 2.5, y: 3.6, w: 0.5, h: 0.5 });
  slide2.addText('Khám phá', { x: 2.1, y: 4.15, w: 1.3, h: 0.3, fontSize: 11, color: WHITE, align: 'center', fontFace: 'Arial' });
  slide2.addImage({ path: icons.bookmark, x: 4.75, y: 3.6, w: 0.5, h: 0.5 });
  slide2.addText('Lưu trữ', { x: 4.35, y: 4.15, w: 1.3, h: 0.3, fontSize: 11, color: WHITE, align: 'center', fontFace: 'Arial' });
  slide2.addImage({ path: icons.share, x: 7, y: 3.6, w: 0.5, h: 0.5 });
  slide2.addText('Chia sẻ', { x: 6.6, y: 4.15, w: 1.3, h: 0.3, fontSize: 11, color: WHITE, align: 'center', fontFace: 'Arial' });

  // ===== SLIDE 3: Tính năng chính =====
  let slide3 = pptx.addSlide();
  addDarkBg(slide3);
  slide3.addText('Tính năng Chính', { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: 'Arial' });
  addAccentLine(slide3, 0.5, 0.95, 2.2);

  const features = [
    { icon: icons.lock, title: 'Xác thực', desc: 'Đăng nhập email/mật khẩu an toàn' },
    { icon: icons.grid, title: 'Lưới Masonry', desc: 'Giao diện feed kiểu Pinterest' },
    { icon: icons.pin, title: 'Quản lý Pin', desc: 'Tạo, xem & lưu ghim' },
    { icon: icons.user, title: 'Hồ sơ người dùng', desc: 'Tùy chỉnh ảnh đại diện' },
    { icon: icons.folder, title: 'Album ảnh', desc: 'Tổ chức bộ sưu tập' },
    { icon: icons.message, title: 'Bình luận', desc: 'Tương tác nội dung' },
  ];

  features.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.7 + col * 3.1, y = 1.3 + row * 1.7;
    slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.8, h: 1.4, fill: { color: DARK_SECONDARY }, line: { color: '2d3a5a', pt: 1 }, rectRadius: 0.08 });
    slide3.addImage({ path: f.icon, x: x + 0.15, y: y + 0.2, w: 0.35, h: 0.35 });
    slide3.addText(f.title, { x: x + 0.6, y: y + 0.2, w: 2, h: 0.35, fontSize: 13, bold: true, color: WHITE, fontFace: 'Arial' });
    slide3.addText(f.desc, { x: x + 0.6, y: y + 0.55, w: 2, h: 0.6, fontSize: 11, color: GRAY, fontFace: 'Arial' });
  });

  // ===== SLIDE 4: Công nghệ =====
  let slide4 = pptx.addSlide();
  addDarkBg(slide4);
  slide4.addText('Công nghệ Sử dụng', { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: 'Arial' });
  addAccentLine(slide4, 0.5, 0.95, 2.5);

  const techStack = [
    { icon: icons.code, title: 'Frontend', items: 'React 19, TypeScript, Vite', color: ACCENT_BLUE },
    { icon: icons.layers, title: 'Giao diện', items: 'TailwindCSS, Lucide Icons', color: '38bdf8' },
    { icon: icons.database, title: 'State', items: 'TanStack Query, Context', color: 'a78bfa' },
    { icon: icons.cloud, title: 'Backend', items: 'Supabase (Auth, DB, Storage)', color: '3fcf8e' },
  ];

  techStack.forEach((t, i) => {
    const x = 0.6 + i * 2.35;
    slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.4, w: 2.2, h: 2.5, fill: { color: DARK_SECONDARY }, line: { color: '2d3a5a', pt: 1 }, rectRadius: 0.1 });
    slide4.addImage({ path: t.icon, x: x + 0.85, y: 1.6, w: 0.5, h: 0.5 });
    slide4.addText(t.title, { x, y: 2.25, w: 2.2, h: 0.4, fontSize: 14, bold: true, color: t.color, align: 'center', fontFace: 'Arial' });
    slide4.addText(t.items, { x: x + 0.1, y: 2.7, w: 2, h: 1, fontSize: 11, color: GRAY, align: 'center', fontFace: 'Arial' });
  });

  // ===== SLIDE 5: Kiến trúc =====
  let slide5 = pptx.addSlide();
  addDarkBg(slide5);
  slide5.addText('Tổng quan Kiến trúc', { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: 'Arial' });
  addAccentLine(slide5, 0.5, 0.95, 2.6);

  const archNodes = [
    { x: 0.8, label: 'Người dùng', icon: icons.user },
    { x: 3.1, label: 'React App', icon: icons.code },
    { x: 5.4, label: 'Supabase', icon: icons.cloud },
    { x: 7.7, label: 'Cơ sở dữ liệu', icon: icons.database },
  ];

  archNodes.forEach((n, i) => {
    slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: n.x, y: 2, w: 1.8, h: 1.6, fill: { color: DARK_SECONDARY }, line: { color: ACCENT_BLUE, pt: 1 }, rectRadius: 0.1 });
    slide5.addImage({ path: n.icon, x: n.x + 0.65, y: 2.2, w: 0.5, h: 0.5 });
    slide5.addText(n.label, { x: n.x, y: 2.8, w: 1.8, h: 0.4, fontSize: 12, color: WHITE, align: 'center', fontFace: 'Arial' });
    if (i < 3) slide5.addShape(pptx.shapes.RIGHT_ARROW, { x: n.x + 1.9, y: 2.55, w: 0.5, h: 0.3, fill: { color: ACCENT_BLUE } });
  });
  slide5.addText('Đồng bộ thời gian thực với Supabase subscriptions', { x: 0.5, y: 4.2, w: 9, h: 0.4, fontSize: 13, color: GRAY, align: 'center', fontFace: 'Arial', italic: true });

  // ===== SLIDE 6: Màn hình Demo =====
  let slide6 = pptx.addSlide();
  addDarkBg(slide6);
  slide6.addText('Màn hình Demo', { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: 'Arial' });
  addAccentLine(slide6, 0.5, 0.95, 2);

  const screens = ['Trang chủ', 'Chi tiết Pin', 'Hồ sơ'];
  screens.forEach((s, i) => {
    const x = 0.8 + i * 3.1;
    slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.4, w: 2.8, h: 3.2, fill: { color: DARK_SECONDARY }, line: { color: '4a5568', pt: 2 }, rectRadius: 0.15 });
    slide6.addShape(pptx.shapes.RECTANGLE, { x: x + 0.1, y: 1.55, w: 2.6, h: 0.25, fill: { color: '2d3a5a' } });
    slide6.addText(s, { x, y: 4.7, w: 2.8, h: 0.35, fontSize: 12, color: GRAY, align: 'center', fontFace: 'Arial' });
  });
  slide6.addImage({ path: icons.monitor, x: 1.6, y: 2.5, w: 0.6, h: 0.6 });
  slide6.addImage({ path: icons.pin, x: 4.7, y: 2.5, w: 0.6, h: 0.6 });
  slide6.addImage({ path: icons.user, x: 7.8, y: 2.5, w: 0.6, h: 0.6 });

  // ===== SLIDE 7: Lộ trình =====
  let slide7 = pptx.addSlide();
  addDarkBg(slide7);
  slide7.addText('Lộ trình Phát triển', { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 32, bold: true, color: WHITE, fontFace: 'Arial' });
  addAccentLine(slide7, 0.5, 0.95, 2.3);

  const roadmap = [
    { phase: 'Giai đoạn 1', title: 'Tính năng Cốt lõi', status: 'Hoàn thành', done: true, desc: 'Xác thực, Pin, Hồ sơ, Album, Bình luận' },
    { phase: 'Giai đoạn 2', title: 'Tính năng Xã hội', status: 'Đang phát triển', done: false, desc: 'Theo dõi, Thích, Thông báo' },
    { phase: 'Giai đoạn 3', title: 'Gợi ý AI', status: 'Kế hoạch', done: false, desc: 'Feed thông minh, Pin tương tự' },
  ];

  roadmap.forEach((r, i) => {
    const y = 1.5 + i * 1.2;
    slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 1, y, w: 8, h: 1, fill: { color: DARK_SECONDARY }, line: { color: r.done ? ACCENT_BLUE : '2d3a5a', pt: r.done ? 2 : 1 }, rectRadius: 0.08 });
    slide7.addImage({ path: r.done ? icons.check : icons.arrow, x: 1.3, y: y + 0.3, w: 0.4, h: 0.4 });
    slide7.addText(r.phase, { x: 2, y: y + 0.15, w: 1.8, h: 0.35, fontSize: 12, bold: true, color: r.done ? ACCENT_BLUE : GRAY, fontFace: 'Arial' });
    slide7.addText(r.title, { x: 3.8, y: y + 0.15, w: 2.5, h: 0.35, fontSize: 14, bold: true, color: WHITE, fontFace: 'Arial' });
    slide7.addText(r.status, { x: 7, y: y + 0.15, w: 1.5, h: 0.35, fontSize: 11, color: r.done ? ACCENT_BLUE : GRAY, align: 'right', fontFace: 'Arial' });
    slide7.addText(r.desc, { x: 2, y: y + 0.55, w: 6, h: 0.3, fontSize: 10, color: GRAY, fontFace: 'Arial' });
  });

  // ===== SLIDE 8: Cảm ơn =====
  let slide8 = pptx.addSlide();
  addDarkBg(slide8);
  slide8.addText('Cảm ơn!', { x: 0.5, y: 1.5, w: 9, h: 0.8, fontSize: 48, bold: true, color: WHITE, align: 'center', fontFace: 'Arial' });
  addAccentLine(slide8, 3.5, 2.35, 3);
  slide8.addText('Được xây dựng với ❤️ như một dự án học tập', { x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 18, color: GRAY, align: 'center', fontFace: 'Arial' });
  slide8.addImage({ path: icons.github, x: 4, y: 3.5, w: 0.5, h: 0.5 });
  slide8.addImage({ path: icons.mail, x: 5.5, y: 3.5, w: 0.5, h: 0.5 });
  slide8.addText('Hãy Kết nối!', { x: 0.5, y: 4.3, w: 9, h: 0.4, fontSize: 16, color: ACCENT_BLUE, align: 'center', fontFace: 'Arial', bold: true });

  await pptx.writeFile({ fileName: OUTPUT });
  console.log(`✅ Đã lưu bài thuyết trình: ${OUTPUT}`);
}

main().catch(console.error);
