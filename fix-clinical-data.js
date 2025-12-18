const fs = require('fs');
const path = 'd:/GitHub/New folder/GIT-nile-ivf---ob_gyn-center-1-/pages/PatientMasterRecord.tsx';

let content = fs.readFileSync(path, 'utf8');

// Fix first occurrence: h.type === 'Visit' condition
content = content.replace(
  /{h\.type === 'Visit' \? renderClinicalData\(h\.clinical_data, h\.department\) : \(\s*<div className="text-sm text-gray-700">\s*<pre className="whitespace-pre-wrap">\{JSON\.stringify\(h\.clinical_data, null, 2\)\}<\/pre>\s*<\/div>\s*\)}/gs,
  '{renderClinicalData(h.clinical_data, h.department)}'
);

// Fix second occurrence: selectedDetail.type === 'Visit' condition
content = content.replace(
  /{selectedDetail\.type === 'Visit'\s*\? renderClinicalData\(selectedDetail\.clinical_data, selectedDetail\.department\)\s*: \(\s*<div className="text-sm text-gray-700">\s*<pre className="whitespace-pre-wrap">\{JSON\.stringify\(selectedDetail\.clinical_data, null, 2\)\}<\/pre>\s*<\/div>\s*\)}/gs,
  '{renderClinicalData(selectedDetail.clinical_data, selectedDetail.department)}'
);

fs.writeFileSync(path, content);
console.log('Fixed clinical data display');
