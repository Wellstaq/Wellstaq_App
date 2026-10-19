import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
const icon = () => React.createElement('svg');
const components = new Proxy({}, { get: () => icon });
const imports = {
 'react': { ...React, default: React },
 'react/jsx-runtime': jsx,
 'motion/react': { AnimatePresence: ({children}) => children },
 '@/components/ui/drawer': { DrawerLayer: icon },
 '@/components/ui/action-form': { ActionForm: icon },
 '@wellstaq/ui/icons': components,
 'next/image': { default: icon },
 '@/hooks/use-click-outside': { useClickOutside() {} },
 '@/components/ui/confirm-modal': { ConfirmModal: icon },
 'sonner': { toast: {} },
 'recharts': components,
 '@/components/providers/dashboard-data-provider': { useDashboardData: () => ({ organizationId: 'org-1', branches: [], currentUser: null }) },
 '@/services/api': { api: {} },
 '@/lib/scope': { useDashboardScope: () => ({ scope: { type: 'overview' } }) },
 '@/components/dashboard/stat-card': { StatCard: ({title,value}) => React.createElement('div', null, title, ': ', value) },
 '@/lib/permissions': { hasPermission: () => false },
 '@/lib/errors': { getUserErrorMessage: () => 'Unavailable' },
 '@/lib/department-members': { loadDepartmentMemberCounts() {} },
};
const compiled = ts.transpileModule(fs.readFileSync(new URL('../app/dashboard/departments/page.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = {exports:{}};
vm.runInNewContext(compiled, {module:loaded,exports:loaded.exports,require:key=>{assert.ok(key in imports,key);return imports[key];}});
test('Departments shows loading before effects fetch data, never a false empty state or zero metrics',()=>{
 const html=renderToStaticMarkup(React.createElement(loaded.exports.default));
 assert.match(html,/Loading departments/);
 assert.match(html,/Total Staff: Loading/);
 assert.doesNotMatch(html,/No department available/);
 assert.doesNotMatch(html,/Total Staff: 0/);
});
