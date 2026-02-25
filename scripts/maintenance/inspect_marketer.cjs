
const fs = require('fs');
const path = require('path');

const KV_PATH = 'c:/Users/ahmed/Desktop/dashmkhzny23amzoon/afleet/afleet-85-main/server/kv_store.json';

try {
    const data = JSON.parse(fs.readFileSync(KV_PATH, 'utf8'));
    const m1 = (data.marketers || []).find(m => m.id === 'm1');
    const commissions = (data.commissions || []).filter(c => c.marketerId === 'm1');
    const withdrawals = (data.withdrawals || []).filter(w => w.marketerId === 'm1');

    console.log('--- Marketer Data (m1) ---');
    console.log(JSON.stringify(m1, null, 2));

    console.log('\n--- Commissions Breakdown ---');
    const commStats = commissions.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + Number(c.amount || 0);
        return acc;
    }, {});
    console.log(commStats);

    console.log('\n--- Withdrawals Breakdown ---');
    const withStats = withdrawals.reduce((acc, w) => {
        acc[w.status] = (acc[w.status] || 0) + Number(w.amount || 0);
        return acc;
    }, {});
    console.log(withStats);

} catch (e) {
    console.error(e);
}
