const fs = require('fs');
const data = JSON.parse(fs.readFileSync('assets/data/services.json', 'utf8'));

// Deep, distinct Unsplash mapping ensuring perfect assignment
const imgMap = {
  // Fans
  'fan installation': 'https://images.unsplash.com/photo-1563223190-d4dbef0d65ff?w=400&q=80&fit=crop',
  'fan repair': 'https://images.unsplash.com/photo-1563223190-d4dbef0d65ff?w=400&q=80&fit=crop',
  'fan regulator': 'https://images.unsplash.com/photo-1558231018-80dc4f6868d4?w=400&q=80&fit=crop',
  
  // Switches
  'switchboard': 'https://images.unsplash.com/photo-1558231018-80dc4f6868d4?w=400&q=80&fit=crop',
  'socket': 'https://images.unsplash.com/photo-1582274528604-15f22e841261?w=400&q=80&fit=crop',
  'switch': 'https://images.unsplash.com/photo-1628148810757-5de9cbddb20a?w=400&q=80&fit=crop',

  // Wiring
  'wiring': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80&fit=crop',
  'mcb': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80&fit=crop',
  'fuse': 'https://plus.unsplash.com/premium_photo-1663089688180-444ff0066e5d?w=400&q=80&fit=crop',

  // Spa & Salon
  'massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80&fit=crop',
  'spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80&fit=crop',
  'facial': 'https://images.unsplash.com/photo-1516975080661-460b6164f981?w=400&q=80&fit=crop',
  'hair': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80&fit=crop',
  'makeup': 'https://images.unsplash.com/photo-1595015038814-72a392815124?w=400&q=80&fit=crop',
  
  // Cleaning
  'bathroom': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80&fit=crop',
  'kitchen': 'https://images.unsplash.com/photo-1556910103-1c02745a80fa?w=400&q=80&fit=crop',
  'full home': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80&fit=crop',
  'sofa': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80&fit=crop',
  'carpet': 'https://plus.unsplash.com/premium_photo-1663126298656-33616be83232?w=400&q=80&fit=crop',
  'mattress': 'https://images.unsplash.com/photo-1558296245-e64e565ad7bd?w=400&q=80&fit=crop',
  'deep cleaning': 'https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?w=400&q=80&fit=crop',
  
  // Plumbing
  'tap': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80&fit=crop', // tap focus
  'pipe': 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&q=80&fit=crop',
  'leak': 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&q=80&fit=crop',
  'drain': 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=400&q=80&fit=crop',
  'tank': 'https://plus.unsplash.com/premium_photo-1664302152996-32d8471bd80d?w=400&q=80&fit=crop',

  // AC & Appliances
  'ac repair': 'https://images.unsplash.com/photo-1626015707769-e0b4b2fb66a2?w=400&q=80&fit=crop',
  'ac service': 'https://images.unsplash.com/photo-1626015707769-e0b4b2fb66a2?w=400&q=80&fit=crop',
  'gas': 'https://images.unsplash.com/photo-1599827552599-2f3fa14798e4?w=400&q=80&fit=crop',
  'washing machine': 'https://images.unsplash.com/photo-1626806787426-5911cc1847e4?w=400&q=80&fit=crop',
  'refrigerator': 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=400&q=80&fit=crop',
  'fridge': 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=400&q=80&fit=crop',
  'microwave': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80&fit=crop',
  'tv': 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80&fit=crop',

  // Painting
  'paint': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80&fit=crop',
  
  // Carpentry
  'furniture': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80&fit=crop',
  'door': 'https://images.unsplash.com/photo-1518136247453-74e7b5265980?w=400&q=80&fit=crop',
  'lock': 'https://images.unsplash.com/photo-1558231018-80dc4f6868d4?w=400&q=80&fit=crop',

  // Fallbacks
  'electrician': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80&fit=crop',
  'plumber': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80&fit=crop',
  'cleaner': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80&fit=crop',
  'default': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80&fit=crop'
};

data.services.forEach(s => {
  const title = s.title.toLowerCase();
  let selectedImg = null;
  
  // Strict matching to prevent generic overlap
  for (const [key, url] of Object.entries(imgMap)) {
    if (key === 'default' || key === 'cleaner' || key === 'electrician' || key === 'plumber') continue;
    if (title.includes(key)) {
      selectedImg = url;
      break;
    }
  }

  // Next attempt category defaults
  if (!selectedImg) {
    if (s.category === 'electrical') selectedImg = imgMap['electrician'];
    else if (s.category === 'plumbing') selectedImg = imgMap['plumber'];
    else if (s.category === 'cleaning') selectedImg = imgMap['cleaner'];
    else if (s.category === 'salon') selectedImg = imgMap['spa'];
    else selectedImg = imgMap['default'];
  }
  
  s.image = selectedImg;
});

fs.writeFileSync('assets/data/services.json', JSON.stringify(data, null, 2));
console.log('Fixed distinct image mapping!');
