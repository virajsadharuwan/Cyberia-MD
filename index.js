const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const cors = require("cors");

const app = express();
app.use(cors());

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.json({ error: "Phone number is required" });
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    try {
        const sock = makeWASocket({
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
        });
        if (!sock.authState.creds.registered) {
            await delay(1500);
            phone = phone.replace(/[^0-9]/g, '');
            const code = await sock.requestPairingCode(phone);
            res.json({ code: code });
        }
    } catch (err) { res.json({ error: "Server Error" }); }
});

app.get('/', (req, res) => { res.send("OTTE-MD Pairing Server Active!"); });
app.listen(process.env.PORT || 3000);

