const fs = require('fs');
const path = require('path');

const manga = fs.readFileSync(path.join(__dirname, '../src/assets/type-manga.svg'), 'utf8');
const ranobe = fs.readFileSync(path.join(__dirname, '../src/assets/type-ranobe.svg'), 'utf8');

const getD = (s) => {
  const m = s.match(/ d="([^"]+)"/);
  return m ? m[1] : '';
};

const out = `/**
 * Полные path из type-manga.svg и type-ranobe.svg (fill-rule evenodd).
 * Сгенерировано scripts/extract-svg-paths.cjs
 */
export const MANGA_PATH = ${JSON.stringify(getD(manga))};
export const RANOBE_PATH = ${JSON.stringify(getD(ranobe))};
`;

fs.writeFileSync(path.join(__dirname, '../src/components/icons/typeMediaPaths.ts'), out);
console.log('Written typeMediaPaths.ts, manga length:', getD(manga).length, 'ranobe length:', getD(ranobe).length);
