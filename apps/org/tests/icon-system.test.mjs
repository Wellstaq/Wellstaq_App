import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as iconsax from 'iconsax-react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import postcss from 'postcss';
function load(file, imports) {
 const compiled=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 const loaded={exports:{}};
 vm.runInNewContext(compiled,{module:loaded,exports:loaded.exports,require:key=>{assert.ok(key in imports,key);return imports[key];}});
 return loaded.exports;
}
const imports={react:React,'react/jsx-runtime':jsx,'iconsax-react':iconsax};
const {ActionForm}=load('../components/ui/action-form.tsx',imports);
const icons=load('../../../packages/ui/src/icons.tsx',imports);
const {cn}=load('../../../packages/ui/src/utils.ts',{'clsx':{clsx},'tailwind-merge':{twMerge}});
const {Button}=load('../../../packages/ui/src/button.tsx',{...imports,'./utils':{cn}});
const {Input}=load('../../../packages/ui/src/input.tsx',{...imports,'./utils':{cn}});
const {FilterDropdown}=load('../components/ui/filter-dropdown.tsx',{
 ...imports,
 '@wellstaq/ui/icons':icons,
 '@/lib/utils':{cn},
 '@/hooks/use-click-outside':{useClickOutside(){}},
});
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

test('icon-and-label buttons stay grouped with an 8px gap in either order',()=>{
 for(const children of [
  [React.createElement(icons.Plus,{key:'icon'}),'Add branch'],
  ['Continue',React.createElement(icons.ArrowRight,{key:'icon'})],
 ]) {
  const html=renderToStaticMarkup(React.createElement(Button,{className:'w-full justify-center'},...children));
  assert.match(html,/justify-center/);
  assert.doesNotMatch(html,/justify-between/);
  assert.match(html,/gap-2/);
 }
});

test('full-width menu buttons preserve left alignment with an 8px icon-label gap',()=>{
 const html=renderToStaticMarkup(React.createElement(Button,{className:'w-full justify-start'},
  React.createElement(icons.User,{key:'icon'}),'View profile'));
 assert.match(html,/justify-start/);
 assert.match(html,/gap-2/);
 assert.doesNotMatch(html,/justify-between|justify-center/);
});

test('text-only, icon-only and conditional buttons stay centered',()=>{
 for(const [props,children] of [
  [{},['Continue']],
  [{size:'icon','aria-label':'Close'},[React.createElement(icons.X,{key:'icon'})]],
  [{},[false,'Continue']],
 ]) {
  const html=renderToStaticMarkup(React.createElement(Button,props,...children));
  assert.match(html,/justify-center/);
  assert.doesNotMatch(html,/justify-between/);
 }
});

test('shared fields override oversized page-level height and padding classes',()=>{
 const html=renderToStaticMarkup(React.createElement(Input,{id:'name',className:'h-12 min-h-12 max-h-16 py-4'}));
 assert.match(html,/h-10 min-h-0 max-h-10 py-0/);
 assert.doesNotMatch(html,/h-12|max-h-16|py-4/);
 assert.match(html,/name="name"/);
});

test('custom selectors enforce the same 40px classes and automatic spacing',()=>{
 const html=renderToStaticMarkup(React.createElement(FilterDropdown,{
  value:'one',options:[{value:'one',label:'One'}],onValueChange(){},ariaLabel:'Category',
  buttonClassName:'h-12 min-h-12 py-4 w-full',
 }));
 assert.match(html,/data-control="select"/);
 assert.match(html,/h-10 min-h-0 max-h-10 py-0/);
 assert.match(html,/justify-between/);
 assert.doesNotMatch(html,/h-12|py-4/);
 assert.match(html,/aria-haspopup="listbox"/);
});

test('password hints keep each status icon 8px from its text without changing the input',()=>{
 const {Label}=load('../../../packages/ui/src/label.tsx',{...imports,'./utils':{cn}});
 const {FieldError}=load('../components/onboarding/field-error.tsx',imports);
 const passwordValidation=load('../lib/password-validation.ts',{});
 const {Step3Password}=load('../components/onboarding/step-3-password.tsx',{
  ...imports,
  '@/components/ui/button':{Button},
  '@/components/ui/action-form':{ActionForm},
  '@/components/ui/input':{Input},
  '@/components/ui/label':{Label},
  '@wellstaq/ui/icons':icons,
  '@/components/onboarding/field-error':{FieldError},
  '@/lib/password-validation':passwordValidation,
 });
 for(const password of ['', 'Password1!']) {
  const html=renderToStaticMarkup(React.createElement(Step3Password,{
   data:{password},updateData(){},onNext(){},isLoading:false,
  }));
  const hints=[...html.matchAll(/<li class="([^"]+)">/g)];
  assert.equal(hints.length,passwordValidation.PASSWORD_RULES.length);
  for(const [,className] of hints) {
   assert.match(className,/justify-start/);
   assert.match(className,/gap-2/);
   assert.doesNotMatch(className,/justify-between/);
  }
  assert.match(html,/h-10 min-h-0 max-h-10 py-0/);
  assert.match(html,/aria-label="Show password"/);
 }
});

test('the shared stylesheet caps single-line controls without capping textareas',()=>{
 const css=postcss.parse(fs.readFileSync(new URL('../../../packages/ui/src/theme.css',import.meta.url),'utf8'));
 const rule=css.nodes.find(node=>node.type==='rule' && node.selector.startsWith(':where(input:not('));
 assert.ok(rule);
 assert.equal(rule.nodes.find(node=>node.prop==='height').value,'40px');
 assert.equal(rule.nodes.find(node=>node.prop==='max-height').value,'40px');
 assert.doesNotMatch(rule.selector,/textarea/);
 for(const type of ['checkbox','radio','range','file','hidden','color']) {
  assert.ok(rule.selector.includes(`:not([type="${type}"])`));
 }
 const compound=css.nodes.find(node=>node.type==='rule' && node.selector==='[data-control="input"] > input');
 assert.equal(compound.nodes.find(node=>node.prop==='height').value,'100%');
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
