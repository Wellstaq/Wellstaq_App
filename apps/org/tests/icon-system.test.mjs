import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as iconsax from 'iconsax-react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
function load(file, imports) {
 const compiled=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 const loaded={exports:{}};
 vm.runInNewContext(compiled,{module:loaded,exports:loaded.exports,require:key=>{assert.ok(key in imports,key);return imports[key];}});
 return loaded.exports;
}
const imports={react:React,'react/jsx-runtime':jsx,'iconsax-react':iconsax};
const icons=load('../../../packages/ui/src/icons.tsx',imports);
test('every shared icon renders a real Iconsax SVG and inherits control colors',()=>{
 assert.ok(Object.keys(icons).length>100);
 for(const [name,Icon] of Object.entries(icons)) {
  const html=renderToStaticMarkup(React.createElement(Icon,{'aria-hidden':true,className:'h-5 w-5'}));
  assert.match(html,/<svg/,name);
  assert.match(html,/currentColor/,name);
  assert.match(html,/class="h-5 w-5"/,name);
 }
});
test('search uses the Iconsax SearchNormal1 glyph',()=>{
 const actual=renderToStaticMarkup(React.createElement(icons.Search));
 const expected=renderToStaticMarkup(React.createElement(iconsax.SearchNormal1,{size:24,color:'currentColor',variant:'Linear'}));
 assert.equal(actual,expected);
});
const {BooleanRadio}=load('../../../packages/ui/src/boolean-radio.tsx',imports);
test('evidence and approval are independent radio groups, so both can be Yes',()=>{
 const html=renderToStaticMarkup(React.createElement('div',null,
  React.createElement(BooleanRadio,{label:'Evidence required',value:true,onChange(){}}),
  React.createElement(BooleanRadio,{label:'Requires admin approval',value:true,onChange(){}})));
 assert.equal((html.match(/type="radio"/g)||[]).length,4);
 assert.equal((html.match(/checked=""/g)||[]).length,2);
 const names=[...html.matchAll(/name="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(new Set(names).size,2);
 assert.match(html,/<legend[^>]*>Evidence required/);
 assert.match(html,/<legend[^>]*>Requires admin approval/);
});
