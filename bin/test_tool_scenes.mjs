import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = { module: { exports: {} }, exports: {} };
vm.runInNewContext(fs.readFileSync(new URL('../public/assets/js/tools.js', import.meta.url), 'utf8'), context);
const { CALCS } = context.module.exports;
assert.equal(Object.keys(CALCS).length, 8);
for (const [id, spec] of Object.entries(CALCS)) {
  const defaults = Object.fromEntries(spec.inputs.map(i => [i.k, i.value]));
  const variants = [defaults];
  if (id === 'ozone-buildup') variants.push({ ...defaults, g: 0, target: 0 });
  if (id === 'hydraulic-cylinder') variants.push({ ...defaults, f: 1000, p: 350 });
  for (const input of spec.inputs.filter(i => i.options)) {
    for (const [value] of input.options) variants.push({ ...defaults, [input.k]: value, ...(input.k === 'sec' && value === 'tube' ? { h: 5 } : {}) });
  }
  for (const v of variants) {
    const r = spec.calc(v);
    assert.ok(r.out, `${id}: calculation result`);
    assert.doesNotMatch(JSON.stringify(r.out), /NaN|undefined|Infinity/);
    const p = spec.scene.params(v, r);
    assert.ok(p, `${id}: scene parameters`);
    for (const [key, value] of Object.entries(p)) {
      assert.notEqual(value, undefined, `${id}.${key}`);
      if (typeof value === 'number') assert.ok(Number.isFinite(value), `${id}.${key}`);
    }
    for (const phase of [0, 0.5, 1]) {
      const svg = spec.scene.draw(p, phase);
      assert.ok(svg.includes('<'), `${id}: SVG markup`);
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/, `${id}: phase ${phase}`);
    }
  }
  console.log(`PASS ${id}: defaults, ${variants.length - 1} select variants, phases 0 / 0.5 / 1`);
}
