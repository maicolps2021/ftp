// Servidor Proxy FTP para Valheim Dashboard
const express = require('express');
const cors = require('cors');
const { Client } = require('basic-ftp');
const { Readable } = require('stream');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/read', async (req, res) => {
    const { host, port, user, password, filename } = req.body;
    const client = new Client();
    try {
        await client.access({ host, port, user, password, secure: false });
        let content = "";
        const writable = {
            write: (chunk) => { content += chunk.toString(); },
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
        await client.access({ host, port, user, password, secure: false });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy FTP corriendo en puerto ${PORT}`));
