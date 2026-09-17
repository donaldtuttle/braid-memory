import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

// DOM interaction harness, not a substitute for rendered browser/visual QA.
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/#experiment' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Event', 'MouseEvent', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
const { createRoot } = await import('react-dom/client');
const { Experiment } = await import('../src/components/experiment/Experiment');
const root = createRoot(document.getElementById('root')!);
const objects = new Map<string, Blob>();
const downloads: { filename: string; blob: Blob }[] = [];
const createURL = URL.createObjectURL, revokeURL = URL.revokeObjectURL;
URL.createObjectURL = blob => { const id = `blob:test-${objects.size}`; objects.set(id, blob); return id; };
URL.revokeObjectURL = id => { objects.delete(id); };
dom.window.HTMLAnchorElement.prototype.click = function () { downloads.push({ filename: this.download, blob: objects.get(this.href)! }); };
const text = () => document.body.textContent ?? '';
const button = (name: string) => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === name || b.getAttribute('aria-label') === name)!;
async function click(name: string) { const el = button(name); assert.ok(el, `Missing button ${name}`); await act(async () => el.click()); }
async function run() {
  await act(async () => {
    document.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  });
  const deadline = Date.now() + 10000;
  while ((document.querySelector('fieldset') as HTMLFieldSetElement).disabled && Date.now() < deadline) {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 25)); });
  }
  assert.equal((document.querySelector('fieldset') as HTMLFieldSetElement).disabled, false, 'Comparison timed out');
}
after(async () => { await act(async () => root.unmount()); URL.createObjectURL = createURL; URL.revokeObjectURL = revokeURL; dom.window.close(); });

test('complete comparison, replay, condition changes, settings, and both downloads', async () => {
  await act(async () => root.render(<Experiment />));
  assert.ok(text().includes('Find the right memory.'));
  assert.equal(button('Download JSON'), undefined);
  await run();
  assert.ok(text().includes('Comparison complete. Results below.'), text());
  assert.ok(text().includes('No clear benefit'));
  assert.ok(text().includes('84.4%'));
  assert.ok(text().includes('80.0%'));
  assert.ok(text().includes('35.3%'));

  await click('Next update');
  assert.ok(text().includes('Update 2 of 8'));
  const reveal = document.querySelector('input[type=checkbox]') as HTMLInputElement;
  await act(async () => reveal.click());
  assert.ok(text().includes('Answer:'));
  await click('Previous update');
  assert.ok(text().includes('Update 1 of 8'));
  await click('Play replay');
  assert.ok(button('Pause replay'));
  await click('Pause replay');
  const history = document.querySelector('[aria-label="Replay history"]') as HTMLSelectElement;
  await act(async () => { history.value = '1'; history.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
  assert.equal((document.querySelector('[aria-label="Replay history"]') as HTMLSelectElement).value, '1');
  await click('Longer delays');
  assert.ok(text().includes('56.9%'));
  assert.ok(text().includes('40.6%'));
  assert.ok(text().includes('Update 1 of 8'));

  await click('Download JSON');
  await click('Download CSV');
  assert.equal(downloads.length, 2);
  assert.equal(downloads[0].filename, 'memory-experiment-20260917.json');
  const exported = JSON.parse(await downloads[0].blob.text());
  assert.equal(exported.conditions.length, 4);
  assert.equal(exported.conditions[0].cases.length, 40);
  assert.equal((await downloads[1].blob.text()).trim().split('\r\n').length, 3841);

  await click('New seed');
  assert.ok(text().includes('Settings changed. Run again to replace the displayed results.'));
  // Old results/downloads must remain bound to the completed run, not the new controls.
  await click('Download JSON');
  assert.equal(JSON.parse(await downloads[2].blob.text()).settings.seed, 20260917);
  const histories = document.querySelector('[aria-label="Histories per condition"]') as HTMLSelectElement;
  await act(async () => { histories.value = '10'; histories.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
  await run();
  assert.ok(text().includes('Comparison complete. Results below.'));
  await click('Download JSON');
  const second = JSON.parse(await downloads[3].blob.text());
  assert.equal(second.settings.histories, 10);
  assert.equal(second.conditions[0].summaries.ordinary.total, 80);
  assert.equal(document.querySelectorAll('[role="alert"]').length, 0);
});
