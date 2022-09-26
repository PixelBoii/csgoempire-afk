import fs from 'fs';

export default async function(account) {
    const trades = await account.getActiveTrades();

    let state = [];

    for (let item of trades.deposits) {
        if (!item.cancellable()) {
            continue;
        }

        try {
            await item.cancel();
        } catch(e) {
            console.error(`There was an error canceling your ${item.market_name} deposit. The state was partially saved, meaning it can be restored by going online again.`);
            console.error('Please try again in a few minutes from now. If the error persists, please open an issue on our GitHub page. When doing so, please include the following error message:');
            console.error(e);

            break;
        }

        state.push({
            id: item.id,
            market_name: item.market_name,
            custom_price_percentage: item.custom_price_percentage,
            market_value: item.market_value,
        });
    }

    fs.writeFileSync('./state.json', JSON.stringify(state));

    console.log('Inventory saved to state.json');

    process.exit(0);
}