const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// public ဖိုင်တွဲထဲမှ HTML ကို static အနေဖြင့် ချိတ်ရန်
app.use(express.static(path.join(__dirname, 'public')));

// Voucher များကို သိမ်းဆည်းရန် In-memory Database
let activeVouchers = new Map();

// Voucher အသစ်ထုတ်ပေးသည့် API
app.get('/api/generate-voucher', (req, res) => {
    const duration = req.query.duration || '3hour';
    const voucherCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    activeVouchers.set(voucherCode, { duration: duration, used: false });

    res.json({
        success: true,
        voucherCode: voucherCode,
        duration: duration,
        message: `Generated Voucher: ${voucherCode} (${duration})`
    });
});

// Portal လင့်ခ်နှင့် Voucher ကို စစ်ဆေးပြီး အင်တာနက်ဖွင့်ပေးမည့် API
app.post('/api/use-voucher', async (req, res) => {
    let { portalUrl, voucherCode } = req.body;

    if (!portalUrl || !portalUrl.startsWith('http')) {
        return res.status(400).json({ success: false, message: "Invalid Portal URL!" });
    }

    if (!voucherCode || !activeVouchers.has(voucherCode)) {
        return res.status(400).json({ success: false, message: "Invalid or expired Voucher code!" });
    }

    let voucherData = activeVouchers.get(voucherCode);
    if (voucherData.used) {
        return res.status(400).json({ success: false, message: "This Voucher has already been used!" });
    }

    try {
        const urlObj = new URL(portalUrl);
        const gwAddress = urlObj.searchParams.get('gw_address') || '192.168.60.1';
        const gwPort = urlObj.searchParams.get('gw_port') || '2060';
        const token = urlObj.searchParams.get('gw_id') || urlObj.searchParams.get('gw_sn');

        const targetAuthUrl = `http://${gwAddress}:${gwPort}/wifidog/auth?token=${token}&voucher=${voucherCode}`;
        
        console.log(`> Connecting to Gateway: ${targetAuthUrl}`);

        try {
            await axios.get(targetAuthUrl, { timeout: 5000 });
        } catch (err) {
            console.log("Gateway response notice:", err.message);
        }

        voucherData.used = true;
        activeVouchers.set(voucherCode, voucherData);

        res.json({
            success: true,
            message: `Successfully connected using Voucher ${voucherCode} (${voucherData.duration})!`
        });

    } catch (e) {
        res.status(500).json({ success: false, message: "Error processing request: " + e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
