import {openMission, inventory, primary} from './lib.mjs';
for (const id of process.argv[2].split(',')) {
  const p = await openMission(id);
  try { await primary(p); console.log(id, JSON.stringify(await inventory(p))); } catch (e) { console.log(id, 'ERR', e.message); }
  await p.close();
}
