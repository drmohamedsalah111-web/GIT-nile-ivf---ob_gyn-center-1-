const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'pages', 'SecretaryDashboard.tsx');
try {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('File deleted');
  } else {
    console.log('File not found');
  }
} catch (err) {
  console.error('Error:', err);
}
