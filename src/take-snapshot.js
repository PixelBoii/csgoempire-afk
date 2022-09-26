import fs from 'fs';

export default async function(account) {
    const trades = await account.getActiveTrades();

    let state = [];

    for (let item of trades.deposits) {
        if (!item.cancellable()) {
            continue;
        }

        state.push({
            id: item.id,
            asset_id: item.asset_id,
            market_name: item.market_name,
            custom_price_percentage: item.custom_price_percentage,
            market_value: item.market_value,
        });
    }

    fs.writeFileSync('./state.json', JSON.stringify(state));

    console.log('Inventory saved to state.json without cancelling any items.');

    process.exit(0);
}