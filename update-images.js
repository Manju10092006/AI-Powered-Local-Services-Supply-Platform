const fs = require('fs');

const data = JSON.parse(fs.readFileSync('assets/data/services.json', 'utf8'));

// High quality Unsplash image maps for categories
const imagePool = {
  'cleaning': [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1584820927498-cafe4c158b4b?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1583944686411-9a7c36a4955b?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1585255479632-d17e57303e91?w=800&q=80&fit=crop'
  ],
  'plumbing': [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1634594273291-a1e6498e9fc7?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1594916892644-defc305ab71f?w=800&q=80&fit=crop'
  ],
  'electrical': [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1628148810757-5de9cbddb20a?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1506540203117-66a988d8b9cc?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1558231018-80dc4f6868d4?w=800&q=80&fit=crop'
  ],
  'ac-repair': [
    'https://images.unsplash.com/photo-1506905925237-4c4f9f6eeb41?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1626015707769-e0b4b2fb66a2?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1599827552599-2f3fa14798e4?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1546820542-a160d2bbf40e?w=800&q=80&fit=crop'
  ],
  'salon': [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1521590832167-7bfcbaa6362d?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1516975080661-460b6164f981?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1595015038814-72a392815124?w=800&q=80&fit=crop'
  ],
  'painting': [
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1560156942-1e967aed3741?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1604169550742-5ab9f6f6bfad?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop'
  ],
  'carpentry': [
    'https://images.unsplash.com/photo-1533036696417-e8188151121d?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1505015920881-0f83c2f7c95e?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1587635671168-150244ff5def?w=800&q=80&fit=crop'
  ],
  'pest-control': [
    'https://images.unsplash.com/photo-1517482811406-3b60fb41fe6b?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1603704254425-452f4ac4acbf?w=800&q=80&fit=crop'
  ],
  'appliance': [
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1584288005697-b28eac4b3d75?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1626806787426-5911cc1847e4?w=800&q=80&fit=crop'
  ],
  'shifting': [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1598463997120-e22a4d3392e6?w=800&q=80&fit=crop'
  ],
  'interiors': [
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=800&q=80&fit=crop'
  ],
  'emergency': [
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80&fit=crop',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&q=80&fit=crop'
  ]
};

// Add general fallback images
const fallbackImages = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1506905925237-4c4f9f6eeb41?w=800&q=80&fit=crop'
];

let usedCounts = {};

data.services = data.services.map(s => {
  const cat = s.category;
  const pool = imagePool[cat] || fallbackImages;
  
  if (!usedCounts[cat]) usedCounts[cat] = 0;
  
  // Pick an image sequentially from the pool to vary them nicely
  const imgUrl = pool[usedCounts[cat] % pool.length];
  usedCounts[cat]++;
  
  s.image = imgUrl; 
  return s;
});

// Update the catImages array directly inside index.html as well 
fs.writeFileSync('assets/data/services.json', JSON.stringify(data, null, 2));
console.log('Services updated with high quality urls');
