/**
 * M41 — Charges breakdown table molecule.
 */
(function (global) {
    'use strict';

    const { fmtDec } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function chargeSides(t) {
        const { getChargeConfig, calcOrderBrokerage, getEffectiveSellPrice } = tradeSheets();
        const chargeCfg = getChargeConfig(t.broker, t.buyDate, t.sellDate);
        const qty = t.quantity || 0;
        const buyVal = (t.buyPrice || 0) * qty;
        const sellVal = (getEffectiveSellPrice ? getEffectiveSellPrice(t) : t.sellPrice || 0) * qty;

        const buy = {
            orderValue: buyVal,
            brokerage: calcOrderBrokerage(buyVal, chargeCfg),
            stt: buyVal * chargeCfg.sttBuyPct,
            exchange: buyVal * chargeCfg.exchangePct,
            sebi: buyVal * chargeCfg.sebiPct,
            stamp: buyVal * chargeCfg.stampPct,
            pledge: chargeCfg.pledgeCharge || 0,
            unpledge: 0,
            dp: 0
        };
        buy.gst = (buy.brokerage + buy.exchange + buy.sebi + buy.pledge) * chargeCfg.gstPct;
        buy.total = buy.brokerage + buy.stt + buy.exchange + buy.sebi + buy.stamp + buy.pledge + buy.gst;

        const sell = {
            orderValue: sellVal,
            brokerage: calcOrderBrokerage(sellVal, chargeCfg),
            stt: sellVal * chargeCfg.sttSellPct,
            exchange: sellVal * chargeCfg.exchangePct,
            sebi: sellVal * chargeCfg.sebiPct,
            stamp: 0,
            pledge: 0,
            unpledge: chargeCfg.unpledgeCharge || 0,
            dp: chargeCfg.dpCharge || 0
        };
        sell.gst = (sell.brokerage + sell.exchange + sell.sebi + sell.unpledge + sell.dp) * chargeCfg.gstPct;
        sell.total = sell.brokerage + sell.stt + sell.exchange + sell.sebi + sell.unpledge + sell.dp + sell.gst;

        return { buy, sell, tradeType: chargeCfg.tradeType };
    }

    function chargesTable(buy, sell) {
        const { renderIcon } = global.MTFComponents;
        const rows = [
            ['Brokerage', buy.brokerage, sell.brokerage],
            ['STT', buy.stt, sell.stt],
            ['Exchange / Txn', buy.exchange, sell.exchange],
            ['SEBI', buy.sebi, sell.sebi],
            ['Stamp Duty', buy.stamp, sell.stamp],
            ['Pledge', buy.pledge, sell.pledge],
            ['Unpledge', buy.unpledge, sell.unpledge],
            ['DP Charges', buy.dp, sell.dp],
            ['GST (18%)', buy.gst, sell.gst]
        ].filter(([, b, s]) => (b + s) > 0);
        const body = rows.map(([l, b, s]) => `
            <tr>
                <td class="text-base-content/60">${l}</td>
                <td class="text-end buy-price-col">${fmtDec(b)}</td>
                <td class="text-end">${fmtDec(s)}</td>
                <td class="text-end font-semibold">${fmtDec(b + s)}</td>
            </tr>`).join('');
        return `
            <div class="overflow-x-auto">
                <table class="table table-sm w-full w-full">
                    <thead class="bg-base-200">
                        <tr>
                            <th>Charge</th>
                            <th class="text-end buy-price-col">${renderIcon('fa-arrow-down', { className: 'mr-1' })}Buy</th>
                            <th class="text-end">${renderIcon('fa-arrow-up', { colour: 'text-error', className: 'mr-1' })}Sell</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="text-sm">
                            <td class="text-base-content/60">Order Value</td>
                            <td class="text-end buy-price-col">${fmtDec(buy.orderValue)}</td>
                            <td class="text-end">${fmtDec(sell.orderValue)}</td>
                            <td class="text-end font-semibold">${fmtDec(buy.orderValue + sell.orderValue)}</td>
                        </tr>
                        ${body}
                        <tr class="font-medium text-base-content/80 border-t border-base-200">
                            <td>Total Charges</td>
                            <td class="text-end buy-price-col">${fmtDec(buy.total)}</td>
                            <td class="text-end">${fmtDec(sell.total)}</td>
                            <td class="text-end text-base-content/55">${fmtDec(buy.total + sell.total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    global.MTFRegister({ chargeSides, chargesTable });
})(typeof window !== 'undefined' ? window : globalThis);