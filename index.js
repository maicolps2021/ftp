const express = require('express');
const cors = require('cors');
const { Client } = require('basic-ftp');
const { Writable, Readable } = require('stream');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Valheim FTP Proxy: V3 ONLINE 🟢'));

app.post('/read', async (req, res) => {
    const { host, port, user, password, filename, path = "" } = req.body;
    const client = new Client();
    client.ftp.timeout = 30000; // Aumentar timeout para evitar ECONNRESET
    try {
        await client.access({ host, port: parseInt(port), user, password, secure: false });
        
        // CONSTRUIR RUTA: carpeta + nombre de archivo
        const fullPath = path ? `${path.replace(/\/$/, '')}/${filename}` : filename;
        console.log("Descargando:", fullPath);

        let content = "";
        const writable = new Writable({
          write(chunk, encoding, callback) {
            content += chunk.toString();
            callback();
          }
        });

        await client.downloadTo(writable, fullPath);
        res.json({ content, status: "ok" });
    } catch (err) {
        console.error("Error FTP:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});

app.post('/save', async (req, res) => {
    const { host, port, user, password, filename, path = "", content } = req.body;
    const client = new Client();
    try {
        await client.access({ host, port: parseInt(port), user, password, secure: false });
        const fullPath = path ? `${path.replace(/\/$/, '')}/${filename}` : filename;
        
        const source = new Readable();
        source.push(content);
        source.push(null);
        
        await client.uploadFrom(source, fullPath);
        res.json({ success: true, status: "ok" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Proxy listo`));
