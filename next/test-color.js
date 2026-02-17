const Color = require('colorjs.io');
console.log('Color type:', typeof Color);
try {
  const c = new Color('oklch(0.7 0.22 25)');
  console.log('c toString:', c.toString({format:'hex'}));
} catch (e) {
  console.error('Error constructing Color with new:', e.message);
  // try calling as function
  try {
    const cf = Color('oklch(0.7 0.22 25)');
    console.log('c via function toString:', cf.toString({format:'hex'}));
  } catch (e2) {
    console.error('Error calling Color function:', e2.message);
  }
}
