import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const baseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const components = [
  { type:'cpu', name:'Процессор AMD Ryzen 5 5600 OEM [AM4, 6 x 3.5 ГГц, L3 - 32 МБ, DDR4-3200]', brand:'AMD', price:10199, socket:'AM4', tdp:65, specs:{cores:6,threads:12,frequency_ghz:3.5,performanceScore:70,rating:4.93,reviews:6500}, compatibility:{ram:{socket:'DDR4',max_capacity:128},case:{form_factor:'ATX'}} },
  { type:'cpu', name:'Процессор AMD Ryzen 7 5700X OEM [AM4, 8 x 3.4 ГГц, L3 - 32 МБ, DDR4-3200]', brand:'AMD', price:14999, socket:'AM4', tdp:65, specs:{cores:8,threads:16,frequency_ghz:3.4,performanceScore:82,rating:4.92,reviews:4900}, compatibility:{ram:{socket:'DDR4',max_capacity:128},case:{form_factor:'ATX'}} },
  { type:'cpu', name:'Процессор AMD Ryzen 5 7500F OEM [AM5, 6 x 3.7 ГГц, L3 - 32 МБ, DDR5-5200]', brand:'AMD', price:11299, socket:'AM5', tdp:65, specs:{cores:6,threads:12,frequency_ghz:3.7,performanceScore:80,rating:4.92,reviews:4300}, compatibility:{ram:{socket:'DDR5',max_capacity:192},case:{form_factor:'ATX'}} },
  { type:'cpu', name:'Процессор Intel Core i5-14600K BOX [LGA1700, 14 x 3.5 ГГц, DDR5-5600]', brand:'Intel', price:31999, socket:'LGA1700', tdp:125, specs:{cores:14,threads:20,performanceScore:89,rating:4.86,reviews:1200}, compatibility:{ram:{socket:'DDR5',max_capacity:192},case:{form_factor:'ATX'}} },
  { type:'cpu', name:'Процессор AMD Ryzen 7 7800X3D OEM [AM5, 8 x 4.2 ГГц, L3 - 96 МБ, DDR5-5200]', brand:'AMD', price:28999, socket:'AM5', tdp:120, specs:{cores:8,threads:16,performanceScore:98,rating:4.93,reviews:2500}, compatibility:{ram:{socket:'DDR5',max_capacity:192},case:{form_factor:'ATX'}} },

  { type:'motherboard', name:'Материнская плата MSI MPG B550 GAMING PLUS [AM4, AMD B550, 4xDDR4-3200, 2xPCI-E x16, ATX]', brand:'MSI', price:13499, socket:'AM4', tdp:0, specs:{chipset:'B550',form_factor:'ATX',ram_type:'DDR4',ram_slots:4,performanceScore:78,rating:4.81,reviews:4200}, compatibility:{cpu:{socket:'AM4'},ram:{socket:'DDR4',max_capacity:128},storage:{interfaces:['NVMe','SATA']},case:{form_factor:'ATX'}} },
  { type:'motherboard', name:'Материнская плата GIGABYTE A520M K V2 [AM4, AMD A520, 2xDDR4-3200, Micro-ATX]', brand:'GIGABYTE', price:4499, socket:'AM4', tdp:0, specs:{chipset:'A520',form_factor:'Micro-ATX',ram_type:'DDR4',ram_slots:2,performanceScore:56,rating:4.68,reviews:1500}, compatibility:{cpu:{socket:'AM4'},ram:{socket:'DDR4',max_capacity:64},storage:{interfaces:['NVMe','SATA']},case:{form_factor:'Micro-ATX'}} },
  { type:'motherboard', name:'Материнская плата MSI B650 GAMING PLUS WIFI [AM5, AMD B650, 4xDDR5-5600, 3xM.2, ATX]', brand:'MSI', price:17999, socket:'AM5', tdp:0, specs:{chipset:'B650',form_factor:'ATX',ram_type:'DDR5',ram_slots:4,performanceScore:86,rating:4.85,reviews:638}, compatibility:{cpu:{socket:'AM5'},ram:{socket:'DDR5',max_capacity:192},storage:{interfaces:['NVMe','SATA']},case:{form_factor:'ATX'}} },
  { type:'motherboard', name:'Материнская плата MSI B760 GAMING PLUS WIFI [LGA1700, Intel B760, 4xDDR5-5600, ATX]', brand:'MSI', price:9999, socket:'LGA1700', tdp:0, specs:{chipset:'B760',form_factor:'ATX',ram_type:'DDR5',ram_slots:4,performanceScore:82,rating:4.89,reviews:1200}, compatibility:{cpu:{socket:'LGA1700'},ram:{socket:'DDR5',max_capacity:192},storage:{interfaces:['NVMe','SATA']},case:{form_factor:'ATX'}} },

  { type:'gpu', name:'Видеокарта MSI GeForce RTX 4060 VENTUS 2X OC 8GB GDDR6', brand:'MSI', price:34999, socket:null, tdp:115, specs:{vram_gb:8,performanceScore:73,rating:4.87,reviews:3200,length_mm:199}, compatibility:{gpu:{min_pcie_lanes:16},case:{min_gpu_length_mm:199}} },
  { type:'gpu', name:'Видеокарта Palit GeForce RTX 4070 SUPER Dual 12GB GDDR6X', brand:'Palit', price:67999, socket:null, tdp:220, specs:{vram_gb:12,performanceScore:90,rating:4.91,reviews:1800,length_mm:269}, compatibility:{gpu:{min_pcie_lanes:16},case:{min_gpu_length_mm:269}} },
  { type:'gpu', name:'Видеокарта Sapphire AMD Radeon RX 7800 XT PULSE 16GB GDDR6', brand:'Sapphire', price:59999, socket:null, tdp:263, specs:{vram_gb:16,performanceScore:86,rating:4.88,reviews:980,length_mm:280}, compatibility:{gpu:{min_pcie_lanes:16},case:{min_gpu_length_mm:280}} },
  { type:'gpu', name:'Видеокарта MSI GeForce RTX 4080 SUPER VENTUS 3X OC 16GB GDDR6X', brand:'MSI', price:119999, socket:null, tdp:320, specs:{vram_gb:16,performanceScore:98,rating:4.9,reviews:540,length_mm:322}, compatibility:{gpu:{min_pcie_lanes:16},case:{min_gpu_length_mm:322}} },
  { type:'gpu', name:'Видеокарта ASRock AMD Radeon RX 7900 XTX Phantom Gaming 24GB', brand:'ASRock', price:104999, socket:null, tdp:355, specs:{vram_gb:24,performanceScore:96,rating:4.82,reviews:410,length_mm:330}, compatibility:{gpu:{min_pcie_lanes:16},case:{min_gpu_length_mm:330}} },

  { type:'ram', name:'Оперативная память Kingston FURY Beast 16 ГБ DDR5-5600', brand:'Kingston', price:5899, socket:'DDR5', tdp:8, specs:{capacity_gb:16,frequency_mhz:5600,performanceScore:58,rating:4.9,reviews:2200}, compatibility:{ram:{socket:'DDR5',max_capacity:16}} },
  { type:'ram', name:'Оперативная память ADATA XPG GAMMIX D35 16 ГБ DDR4-3200', brand:'ADATA', price:3899, socket:'DDR4', tdp:8, specs:{capacity_gb:16,frequency_mhz:3200,performanceScore:52,rating:4.83,reviews:3400}, compatibility:{ram:{socket:'DDR4',max_capacity:16}} },
  { type:'ram', name:'Оперативная память Corsair Vengeance 32 ГБ DDR5-6000', brand:'Corsair', price:10999, socket:'DDR5', tdp:10, specs:{capacity_gb:32,frequency_mhz:6000,performanceScore:78,rating:4.91,reviews:1800}, compatibility:{ram:{socket:'DDR5',max_capacity:32}} },
  { type:'ram', name:'Оперативная память G.Skill Trident Z5 64 ГБ DDR5-6400', brand:'G.Skill', price:21999, socket:'DDR5', tdp:12, specs:{capacity_gb:64,frequency_mhz:6400,performanceScore:91,rating:4.88,reviews:720}, compatibility:{ram:{socket:'DDR5',max_capacity:64}} },
  { type:'ram', name:'Оперативная память Kingston FURY Beast 32 ГБ DDR4-3600', brand:'Kingston', price:7999, socket:'DDR4', tdp:10, specs:{capacity_gb:32,frequency_mhz:3600,performanceScore:68,rating:4.86,reviews:2900}, compatibility:{ram:{socket:'DDR4',max_capacity:32}} },

  { type:'storage', name:'SSD накопитель Samsung 990 PRO 1 ТБ NVMe PCIe 4.0', brand:'Samsung', price:9999, socket:null, tdp:8, specs:{capacity_tb:1,interface:'NVMe',performanceScore:94,rating:4.92,reviews:4100}, compatibility:{storage:{interface:'NVMe'}} },
  { type:'storage', name:'SSD накопитель WD Black SN850X 2 ТБ NVMe PCIe 4.0', brand:'Western Digital', price:14999, socket:null, tdp:8, specs:{capacity_tb:2,interface:'NVMe',performanceScore:95,rating:4.91,reviews:2500}, compatibility:{storage:{interface:'NVMe'}} },
  { type:'storage', name:'SSD накопитель Crucial P3 Plus 2 ТБ NVMe PCIe 4.0', brand:'Crucial', price:11999, socket:null, tdp:6, specs:{capacity_tb:2,interface:'NVMe',performanceScore:76,rating:4.78,reviews:3300}, compatibility:{storage:{interface:'NVMe'}} },
  { type:'storage', name:'Жесткий диск Seagate IronWolf 4 ТБ SATA III', brand:'Seagate', price:10499, socket:null, tdp:9, specs:{capacity_tb:4,interface:'SATA',performanceScore:42,rating:4.74,reviews:1900}, compatibility:{storage:{interface:'SATA'}} },

  { type:'case', name:'Корпус Fractal Design Meshify 2 Black TG Light Tint ATX', brand:'Fractal Design', price:15999, socket:null, tdp:0, specs:{form_factor:'ATX',max_gpu_length_mm:467,performanceScore:88,rating:4.86,reviews:900}, compatibility:{case:{form_factor:'ATX'}} },
  { type:'case', name:'Корпус NZXT H5 Flow Black ATX', brand:'NZXT', price:9499, socket:null, tdp:0, specs:{form_factor:'ATX',max_gpu_length_mm:365,performanceScore:78,rating:4.82,reviews:1300}, compatibility:{case:{form_factor:'ATX'}} },
  { type:'case', name:'Корпус DeepCool MATREXX 40 3FS Micro-ATX', brand:'DeepCool', price:5499, socket:null, tdp:0, specs:{form_factor:'Micro-ATX',max_gpu_length_mm:320,performanceScore:65,rating:4.72,reviews:2100}, compatibility:{case:{form_factor:'Micro-ATX'}} },

  { type:'psu', name:'Блок питания Corsair RM750e 750W 80+ Gold', brand:'Corsair', price:9999, socket:null, tdp:0, specs:{watts:750,efficiency:'80+ Gold',performanceScore:82,rating:4.86,reviews:2600}, compatibility:{psu:{min_watts:750}} },
  { type:'psu', name:'Блок питания Seasonic Focus GX-850 850W 80+ Gold', brand:'Seasonic', price:12999, socket:null, tdp:0, specs:{watts:850,efficiency:'80+ Gold',performanceScore:90,rating:4.93,reviews:1700}, compatibility:{psu:{min_watts:850}} },
  { type:'psu', name:'Блок питания be quiet! Pure Power 12 M 1000W 80+ Gold', brand:'be quiet!', price:16999, socket:null, tdp:0, specs:{watts:1000,efficiency:'80+ Gold',performanceScore:94,rating:4.9,reviews:820}, compatibility:{psu:{min_watts:1000}} },
  { type:'psu', name:'Блок питания MSI MAG A650GL 650W 80+ Gold', brand:'MSI', price:7999, socket:null, tdp:0, specs:{watts:650,efficiency:'80+ Gold',performanceScore:74,rating:4.74,reviews:1400}, compatibility:{psu:{min_watts:650}} },

  { type:'cooler', name:'Кулер для процессора DeepCool AK400 [LGA1700/AM4/AM5, TDP 220 Вт]', brand:'DeepCool', price:3299, socket:null, tdp:5, specs:{fans:1,performanceScore:70,rating:4.83,reviews:5100}, compatibility:{cooler:{sockets:['LGA1700','AM4','AM5'],tdp_max:220}} },
  { type:'cooler', name:'Система жидкостного охлаждения DeepCool LS520 SE [240 мм, TDP 280 Вт]', brand:'DeepCool', price:8999, socket:null, tdp:12, specs:{radiator_mm:240,performanceScore:86,rating:4.81,reviews:1100}, compatibility:{cooler:{sockets:['LGA1700','AM4','AM5'],tdp_max:280}} },
  { type:'cooler', name:'Кулер для процессора ID-COOLING SE-224-XTS [TDP 220 Вт]', brand:'ID-COOLING', price:2499, socket:null, tdp:5, specs:{fans:1,performanceScore:66,rating:4.76,reviews:3000}, compatibility:{cooler:{sockets:['LGA1700','AM4','AM5'],tdp_max:220}} },

  { type:'sound', name:'Звуковая карта Creative Sound Blaster Audigy Fx PCI-E', brand:'Creative', price:4499, socket:null, tdp:4, specs:{channels:'5.1',performanceScore:52,rating:4.7,reviews:650}, compatibility:{} },
  { type:'peripheral', name:'Набор Logitech MK295 Silent Wireless', brand:'Logitech', price:3499, socket:null, tdp:0, specs:{type:'keyboard_mouse',performanceScore:55,rating:4.8,reviews:2100}, compatibility:{} },
  { type:'software', name:'Microsoft Windows 11 Home электронная лицензия', brand:'Microsoft', price:13999, socket:null, tdp:0, specs:{license:'digital',performanceScore:50,rating:4.6,reviews:900}, compatibility:{} },
  { type:'extra', name:'Комплект вентиляторов ARCTIC P12 PWM PST 3 шт.', brand:'ARCTIC', price:2999, socket:null, tdp:6, specs:{fans:3,performanceScore:68,rating:4.86,reviews:1200}, compatibility:{} },

  { type:'case', name:'Корпус Montech AIR 903 MAX Black ATX', brand:'Montech', price:7999, socket:null, tdp:0, specs:{form_factor:'ATX',max_gpu_length_mm:400,performanceScore:76,rating:4.78,reviews:760}, compatibility:{case:{form_factor:'ATX'}} },
  { type:'case', name:'Корпус Zalman i3 NEO Black ATX', brand:'Zalman', price:6499, socket:null, tdp:0, specs:{form_factor:'ATX',max_gpu_length_mm:355,performanceScore:70,rating:4.75,reviews:1800}, compatibility:{case:{form_factor:'ATX'}} },

  { type:'cooler', name:'Кулер PCCooler GI-X6R [TDP 160 Вт]', brand:'PCCooler', price:1999, socket:null, tdp:4, specs:{fans:1,performanceScore:58,rating:4.62,reviews:1400}, compatibility:{cooler:{sockets:['LGA1700','AM4','AM5'],tdp_max:160}} },
  { type:'cooler', name:'СЖО Arctic Liquid Freezer III 360 [TDP 320 Вт]', brand:'ARCTIC', price:12999, socket:null, tdp:14, specs:{radiator_mm:360,performanceScore:94,rating:4.88,reviews:620}, compatibility:{cooler:{sockets:['LGA1700','AM4','AM5'],tdp_max:320}} },

  { type:'sound', name:'Звуковая карта ASUS Xonar SE PCI-E', brand:'ASUS', price:3999, socket:null, tdp:4, specs:{channels:'5.1',performanceScore:55,rating:4.72,reviews:520}, compatibility:{} },
  { type:'sound', name:'Звуковая карта Creative Sound Blaster Z SE', brand:'Creative', price:10499, socket:null, tdp:6, specs:{channels:'7.1',performanceScore:76,rating:4.84,reviews:430}, compatibility:{} },
  { type:'sound', name:'USB ЦАП FiiO K3', brand:'FiiO', price:9999, socket:null, tdp:2, specs:{type:'usb_dac',performanceScore:72,rating:4.8,reviews:390}, compatibility:{} },

  { type:'extra', name:'Комплект вентиляторов DeepCool FK120 3 шт.', brand:'DeepCool', price:3499, socket:null, tdp:6, specs:{fans:3,performanceScore:70,rating:4.8,reviews:980}, compatibility:{} },
  { type:'extra', name:'Контроллер ARGB ID-COOLING HA-02', brand:'ID-COOLING', price:1599, socket:null, tdp:2, specs:{type:'argb_controller',performanceScore:45,rating:4.65,reviews:510}, compatibility:{} },
  { type:'extra', name:'Термопаста Arctic MX-6 4 г', brand:'ARCTIC', price:799, socket:null, tdp:0, specs:{type:'thermal_paste',performanceScore:60,rating:4.9,reviews:3500}, compatibility:{} },

  { type:'peripheral', name:'Клавиатура Redragon Kumara RGB', brand:'Redragon', price:3999, socket:null, tdp:0, specs:{type:'keyboard',performanceScore:62,rating:4.74,reviews:2400}, compatibility:{} },
  { type:'peripheral', name:'Мышь Logitech G305 Lightspeed', brand:'Logitech', price:4999, socket:null, tdp:0, specs:{type:'mouse',performanceScore:72,rating:4.86,reviews:4100}, compatibility:{} },
  { type:'peripheral', name:'Монитор AOC 24G2SPAE 24 IPS 165 Гц', brand:'AOC', price:15999, socket:null, tdp:0, specs:{type:'monitor',refresh_hz:165,performanceScore:78,rating:4.82,reviews:1700}, compatibility:{} },

  { type:'software', name:'Kaspersky Standard 1 устройство / 1 год', brand:'Kaspersky', price:1999, socket:null, tdp:0, specs:{license:'digital',performanceScore:42,rating:4.7,reviews:1100}, compatibility:{} },
  { type:'software', name:'Microsoft 365 Personal 1 год', brand:'Microsoft', price:6999, socket:null, tdp:0, specs:{license:'subscription',performanceScore:55,rating:4.76,reviews:800}, compatibility:{} },
  { type:'software', name:'Acronis Cyber Protect Home Office', brand:'Acronis', price:2999, socket:null, tdp:0, specs:{license:'digital',performanceScore:48,rating:4.64,reviews:360}, compatibility:{} }
];

async function main() {
  const root = await mysql.createConnection(baseConfig);
  await root.query(await fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8'));
  await root.end();

  const db = await mysql.createConnection({ ...baseConfig, database: process.env.DB_NAME || 'pc_configurator_pro', namedPlaceholders: true });
  const adminHash = await bcrypt.hash('Admin12345', Number(process.env.BCRYPT_ROUNDS || 12));
  const userHash = await bcrypt.hash('User12345', Number(process.env.BCRYPT_ROUNDS || 12));
  await db.execute(`INSERT IGNORE INTO users (username,email,password_hash,role) VALUES
    ('admin','admin@example.com',:adminHash,'admin'), ('demo','demo@example.com',:userHash,'user')`, { adminHash, userHash });

  await db.execute('DELETE FROM orders');
  await db.execute('DELETE FROM configurations');
  await db.execute('DELETE FROM components');
  for (const c of components) {
    await db.execute(`INSERT INTO components (type,name,brand,price,specs,socket,tdp,compatibility)
      VALUES (:type,:name,:brand,:price,:specs,:socket,:tdp,:compatibility)`, {
      ...c, specs: JSON.stringify(c.specs), compatibility: JSON.stringify(c.compatibility)
    });
  }

  const [demoRows] = await db.execute('SELECT id FROM users WHERE email = :email LIMIT 1', { email: 'demo@example.com' });
  const demoUserId = demoRows[0]?.id;
  const [allComponents] = await db.execute('SELECT * FROM components ORDER BY type, price');
  const byType = type => allComponents.filter(c => c.type === type);
  const pick = (type, index = 0) => byType(type)[index] || byType(type)[0];
  const sampleBuilds = [
    { name:'Народная игровая сборка AM4', goal:'gaming', budget:85000, parts:[pick('cpu',1),pick('motherboard',0),pick('gpu',0),pick('ram',4),pick('storage',2),pick('case',1),pick('psu',3),pick('cooler',0)] },
    { name:'CompCraft Workstation DDR5', goal:'work', budget:140000, parts:[pick('cpu',2),pick('motherboard',2),pick('gpu',1),pick('ram',2),pick('storage',1),pick('case',0),pick('psu',0),pick('cooler',1)] },
    { name:'Дизайн и 3D Pro', goal:'design', budget:220000, parts:[pick('cpu',4),pick('motherboard',2),pick('gpu',3),pick('ram',3),pick('storage',1),pick('case',3),pick('psu',1),pick('cooler',4)] },
    { name:'Тихий домашний сервер', goal:'server', budget:95000, parts:[pick('cpu',0),pick('motherboard',1),pick('ram',1),pick('storage',3),pick('case',2),pick('psu',3),pick('cooler',2)] }
  ];
  for (const b of sampleBuilds) {
    const total = b.parts.reduce((sum, c) => sum + Number(c.price || 0), 0);
    const normalizedParts = b.parts.map(c => ({ ...c, specs: typeof c.specs === 'string' ? JSON.parse(c.specs) : c.specs, compatibility: typeof c.compatibility === 'string' ? JSON.parse(c.compatibility) : c.compatibility }));
    await db.execute(`INSERT INTO configurations (user_id,name,total_price,goal,budget,components,bottleneck_score)
      VALUES (:userId,:name,:total,:goal,:budget,:components,:score)`, {
      userId: demoUserId, name: b.name, total, goal: b.goal, budget: b.budget,
      components: JSON.stringify(normalizedParts), score: Math.floor(7 + Math.random() * 13)
    });
  }
  await db.end();
  console.log('Seed completed. Admin: admin@example.com / Admin12345, demo: demo@example.com / User12345');
}

main().catch(err => { console.error(err); process.exit(1); });
