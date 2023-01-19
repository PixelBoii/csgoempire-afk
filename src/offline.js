import fs from 'fs';

const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

export default async function(account) {
    const trades = await account.getActiveTrades();

    let state = [];

    let itemsToCancel = trades.deposits.filter(item => item.cancellable());

    for (let itemChunk of chunk(itemsToCancel, 50)) {
        try {
            await account.cancelDeposits(itemChunk.map(item => item.deposit_id));
        } catch(e) {
            console.error(`There was an error canceling ${itemChunk.length} deposits. The state was partially saved, meaning it can be restored by going online again.`);
            console.error('Please try again in a few minutes from now. If the error persists, please open an issue on our GitHub page. When doing so, please include the following error message:');
            console.error(e);

            break;
        }

        for (let item of itemChunk) {
            state.push({
                id: item.id,
                asset_id: item.asset_id,
                market_name: item.market_name,
                custom_price_percentage: item.custom_price_percentage,
                market_value: item.market_value,
            });
        }
    }

    fs.writeFileSync('./state.json', JSON.stringify(state));

    console.log('Inventory saved to state.json');

    process.exit(0);
}