const fs = require('fs');
fetch('https://www.urbancompany.com/')
  .then(r => r.text())
  .then(t => {
    const regex = /https:\/\/res\.cloudinary\.com[A-Za-z0-9\/._-]+/g;
    const matches = t.match(regex);
    if (matches) {
       console.log(Array.from(new Set(matches)).join('\n'));
    } else {
       console.log("No images found");
    }
  })
  .catch(console.error);
