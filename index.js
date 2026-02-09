const express = require('express');
const cors = require('cors');
const { Client } = require('basic-ftp');
const { Writable } = require('stream');

const app = express();

// Configuración de CORS agresiva para evitar bloqueos
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => res.send('Valheim FTP Proxy: ONLINE 🟢'));

app.post('/read', async (req, res) => {
    console.log("Petición de lectura recibida para:", req.body.filename);
    const { host, port, user, password, filename } = req.body;
    const client = new Client();
    try {
        await client.access({ host, port: parseInt(port), user, password, secure: false });
        
        let content = "";
        // Creamos un Writable real de Node.js
        const writable = new Writable({
          write(chunk, encoding, callback) {
            content += chunk.toString();
            callback();
          }
        });

        await client.downloadTo(writable, filename);
        res.json({ content, status: "ok" });
    } catch (err) {
        console.error("Error FTP:", err.message);
        res.status(500).json({ error: err.message, status: "error" });
    } finally {
        client.close();
    }
});

app.post('/save', async (req, res) => {
    const { host, port, user, password, filename, content } = req.body;
    const client = new Client();
    try {
        await client.access({ host, port: parseInt(port), user, password, secure: false });
        const { Readable } = require('stream');
        const source = new Readable();
        source.push(content);
        source.push(null);
        await client.uploadFrom(source, filename);
        res.json({ success: true, status: "ok" });
    } catch (err) {
        res.status(500).json({ error: err.message, status: "error" });
    } finally {
        client.close();
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Proxy listo en puerto ${PORT}`));
