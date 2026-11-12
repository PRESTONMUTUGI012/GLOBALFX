class DerivAPIConnector {
    constructor(appId) {
        this.appId = appId;
        this.ws = null;
        this.isConnected = false;
        this.subscribers = {};
    }

    connect() {
        return new Promise((resolve, reject) => {
            const endpoint = `wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`;
            this.ws = new WebSocket(endpoint);
            this.ws.onopen = () => { this.isConnected = true; resolve(true); };
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.msg_type === 'tick' && data.tick) {
                    if (this.subscribers[data.tick.symbol]) this.subscribers[data.tick.symbol](data.tick);
                }
            };
            this.ws.onerror = (err) => reject(err);
            this.ws.onclose = () => { this.isConnected = false; setTimeout(() => this.connect(), 3000); };
        });
    }

    subscribeTicks(symbol, callback) {
        this.subscribers[symbol] = callback;
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify({ forget_all: 'ticks' }));
            this.ws.send(JSON.stringify({ ticks: symbol }));
        }
    }
}
