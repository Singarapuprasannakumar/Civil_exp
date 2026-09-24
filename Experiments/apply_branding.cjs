const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

const dir = 'p:/Projects/Civil_Project/Experiments/Experiments';
walk(dir, function(err, results) {
  if (err) throw err;
  let changed = 0;
  for (const file of results) {
    if (!file.endsWith('Page.tsx')) continue;
    try {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes('const encodedUri = encodeURI(csvContent);') && !content.includes('Singarapu Prasanna Kumar')) {
        content = content.replace(
          'const encodedUri = encodeURI(csvContent);',
          `csvContent += "\\nProject:,GeoTech Lab - Soil Testing Suite\\n";\n    csvContent += "Created & Developed By:,Singarapu Prasanna Kumar\\n";\n    csvContent += "Copyright:,© " + new Date().getFullYear() + " Singarapu Prasanna Kumar. All Rights Reserved.\\n";\n    const encodedUri = encodeURI(csvContent);`
        );
        fs.writeFileSync(file, content);
        console.log('Updated export in ' + file);
        changed++;
      }
    } catch(e) {}
  }
  console.log('Total files updated: ' + changed);
});
