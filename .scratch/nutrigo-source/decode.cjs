const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const kiwi = require('./parser/node_modules/kiwi-schema');
const { decompress } = require('./parser/node_modules/fzstd');
const root = __dirname;
const file = fs.readFileSync(path.join(root, 'canvas.fig'));
if (file.subarray(0, 8).toString() !== 'fig-kiwi') throw new Error('Not a Kiwi Figma canvas');
const chunks = [];
for (let position = 12; position < file.length;) {
  const length = file.readUInt32LE(position); position += 4;
  if (position + length > file.length) throw new Error('Truncated chunk');
  const data = file.subarray(position, position + length); position += length;
  chunks.push(data[0] === 0x28 && data[1] === 0xb5 ? decompress(data) : zlib.inflateRawSync(data));
}
const schema = kiwi.decodeBinarySchema(chunks[0]);
fs.writeFileSync(path.join(root, 'schema.json'), JSON.stringify(schema, null, 2));
console.log('definitions', schema.definitions.map(d => d.name).filter(n => /Message|Node|Document/.test(n)));
const codec = kiwi.compileSchema(schema);
console.log('decoders', Object.keys(codec).filter(k => /decode.*(Message|Document)$/.test(k)));
if (typeof codec.decodeMessage === 'function') {
  const document = codec.decodeMessage(chunks[1]);
  fs.writeFileSync(path.join(root, 'document.json'), JSON.stringify(document));
  console.log('document fields', Object.keys(document));
  console.log('nodes', document.nodeChanges?.length);
}
