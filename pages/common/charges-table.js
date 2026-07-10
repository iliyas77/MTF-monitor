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
                <td class="text-muted">${l}</td>
                <td class="text-end text-primary">${fmtDec(b)}</td>
                <td class="text-end">${fmtDec(s)}</td>
                <td class="text-end fw-semibold">${fmtDec(b + s)}</td>
            </tr>`).join('');
        return `
            <div class="table-responsive">
                <table class="table table-sm w-100">
                    <thead class="table-light">
                        <tr>
                            <th>Charge</th>
                            <th class="text-end">${renderIcon('fa-arrow-down', { className: 'me-1' })}Buy</th>
                            <th class="text-end">${renderIcon('fa-arrow-up', { colour: 'text-danger', className: 'me-1' })}Sell</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="small">
                            <td class="text-muted">Order Value</td>
                            <td class="text-end text-primary">${fmtDec(buy.orderValue)}</td>
                            <td class="text-end">${fmtDec(sell.orderValue)}</td>
                            <td class="text-end fw-semibold">${fmtDec(buy.orderValue + sell.orderValue)}</td>
                        </tr>
                        ${body}
                        <tr class="fw-medium text-body-secondary border-top">
                            <td>Total Charges</td>
                            <td class="text-end text-primary">${fmtDec(buy.total)}</td>
                            <td class="text-end">${fmtDec(sell.total)}</td>
                            <td class="text-end text-muted">${fmtDec(buy.total + sell.total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    global.MTFRegister({ chargeSides, chargesTable });
})(typeof window !== 'undefined' ? window : globalThis);
