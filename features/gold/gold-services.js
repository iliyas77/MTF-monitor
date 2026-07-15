/**
 * Gold & Silver Price Service Layer
 * 
 * Architecture: Provider-based adapter pattern.
 * The UI never knows how prices are fetched. All retrieval goes through
 * GoldPriceService / SilverPriceService. Under the hood, a configurable
 * provider adapter handles the actual data fetching.
 * 
 * Supported providers:
 *   - 'coingecko'  : Free live international spot prices via CoinGecko API (default)
 *   - 'mock'       : Local JSON file for development/testing only
 *   - 'backend'    : (Future) Your own backend endpoint
 *   - 'paid-api'   : (Future) GoldAPI.io, MetalpriceAPI, etc.
 * 
 * To switch providers, change ACTIVE_PROVIDER below. The UI and business
 * logic remain completely untouched.
 */
(function (global) {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const ACTIVE_PROVIDER = 'coingecko'; // 'coingecko' | 'mock' | 'backend' | 'paid-api'

    const CACHE = {};

    // Helper: Date → YYYY-MM-DD
    function fmtDate(date) {
        return new Date(date).toISOString().split('T')[0];
    }

    // ==========================================
    // PROVIDER: CoinGecko (Live, Free, No Key)
    // ==========================================
    // Returns international spot prices converted to INR.
    // Not exact Indian retail, but the best free live option.
    const CoinGeckoProvider = {
        _goldCache: null,
        _silverCache: null,

        async _ensureLoaded() {
            if (this._goldCache && this._silverCache) return;
            const [goldRes, silverRes] = await Promise.all([
                fetch('https://api.coingecko.com/api/v3/coins/pax-gold/market_chart?vs_currency=usd&days=30&interval=daily'),
                fetch('https://api.coingecko.com/api/v3/coins/kinesis-silver/market_chart?vs_currency=usd&days=30&interval=daily')
            ]);
            if (!goldRes.ok || !silverRes.ok) throw new Error('CoinGecko API fetch failed');
            const goldData = await goldRes.json();
            const silverData = await silverRes.json();

            this._goldCache = {};
            this._silverCache = {};

            if (goldData.prices) {
                goldData.prices.forEach(([ts, price]) => {
                    this._goldCache[fmtDate(new Date(ts))] = price;
                });
            }
            if (silverData.prices) {
                silverData.prices.forEach(([ts, price]) => {
                    this._silverCache[fmtDate(new Date(ts))] = price;
                });
            }
        },

        // Normalize: Troy Ounce USD → per Gram, then derive 22K/18K
        _normalizeGold(usdPerOunce) {
            if (usdPerOunce == null) return null;
            const perGram = usdPerOunce / 31.1034768;
            const p24 = Number(perGram.toFixed(2));
            return { p24, p22: Number((p24 * 0.9167).toFixed(2)), p18: Number((p24 * 0.75).toFixed(2)) };
        },

        _normalizeSilver(usdPerOunce) {
            if (usdPerOunce == null) return null;
            const sGram = Number((usdPerOunce / 31.1034768).toFixed(2));
            return { sGram, sKg: Number((sGram * 1000).toFixed(2)) };
        },

        async getGoldPrice(_city, date) {
            await this._ensureLoaded();
            return this._normalizeGold(this._goldCache[date]);
        },

        async getSilverPrice(_city, date) {
            await this._ensureLoaded();
            return this._normalizeSilver(this._silverCache[date]);
        },

        async getGoldHistory(_city, endDate, days) {
            await this._ensureLoaded();
            const history = [];
            const end = new Date(endDate);
            for (let i = 0; i < days; i++) {
                const d = fmtDate(new Date(end.getTime() - i * 86400000));
                const rates = this._normalizeGold(this._goldCache[d]);
                if (rates) history.push({ date: d, ...rates });
            }
            return history;
        },

        async getSilverHistory(_city, endDate, days) {
            await this._ensureLoaded();
            const history = [];
            const end = new Date(endDate);
            for (let i = 0; i < days; i++) {
                const d = fmtDate(new Date(end.getTime() - i * 86400000));
                const rates = this._normalizeSilver(this._silverCache[d]);
                if (rates) history.push({ date: d, ...rates });
            }
            return history;
        },

        clearCache() {
            this._goldCache = null;
            this._silverCache = null;
        }
    };



    // ==========================================
    // PROVIDER REGISTRY
    // ==========================================
    const PROVIDERS = {
        coingecko: CoinGeckoProvider
        // backend: BackendProvider,   // Future
        // 'paid-api': PaidApiProvider  // Future
    };

    function getProvider() {
        // Only CoinGeckoProvider is active now; future providers can be swapped via ACTIVE_PROVIDER
        return CoinGeckoProvider;
    }

    // ==========================================
    // PUBLIC SERVICE INTERFACES
    // ==========================================
    const GoldPriceService = {
        async getPrice(city, date) {
            const key = `${city}_${date}_Gold`;
            if (CACHE[key] !== undefined) return CACHE[key];
            const rates = await getProvider().getGoldPrice(city, date);
            CACHE[key] = rates;
            return rates;
        },

        async getHistory(city, endDate, days = 30) {
            return getProvider().getGoldHistory(city, endDate, days);
        },

        clearCache() {
            for (const k in CACHE) { if (k.endsWith('_Gold')) delete CACHE[k]; }
            getProvider().clearCache();
        }
    };

    const SilverPriceService = {
        async getPrice(city, date) {
            const key = `${city}_${date}_Silver`;
            if (CACHE[key] !== undefined) return CACHE[key];
            const rates = await getProvider().getSilverPrice(city, date);
            CACHE[key] = rates;
            return rates;
        },

        async getHistory(city, endDate, days = 30) {
            return getProvider().getSilverHistory(city, endDate, days);
        },

        clearCache() {
            for (const k in CACHE) { if (k.endsWith('_Silver')) delete CACHE[k]; }
            getProvider().clearCache();
        }
    };

    const CityPriceService = {
        getSupportedCities() {
            return ['Hyderabad', 'Vijayawada', 'Chennai', 'Bangalore', 'Mumbai', 'Delhi'];
        }
    };

    // Export
    global.GoldPriceService = GoldPriceService;
    global.SilverPriceService = SilverPriceService;
    global.CityPriceService = CityPriceService;

    global.MTFRegister({
        GoldPriceService,
        SilverPriceService,
        CityPriceService
    });

})(typeof window !== 'undefined' ? window : globalThis);
