const express = require('express');
const cors = require('cors');
const { Client } = require('basic-ftp');
const { Readable } = require('stream');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Valheim FTP Proxy: ONLINE 🟢'));

app.post('/read', async (req, res) => {
    const { host, port, user, password, filename } = req.body;
    const client = new Client();
    try {
        await client.access({ host, port: parseInt(port), user, password, secure: false });
        let content = "";
        const writable = {
            write: (chunk) => { content += chunk.toString(); return true; },
            end: () => {}, on: () => {}, once: () => {}, emit: () => {}
        };
        await client.downloadTo(writable, filename);
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});

app.post('/save', async (req, res) => {
    const { host, port, user, password, filename, content } = req.body;
    const client = new Client();
    try {
        await client.access({ host, port: parseInt(port), user, password, secure: false });
        const source = new Readable();
        source.push(content);
        source.push(null);
        await client.uploadFrom(source, filename);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server on port ${PORT}`));
