const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Voucher များကို သိမ်းဆည်းရန် In-memory Database (Database အစား ခေတ္တသုံးရန်)
let activeVouchers = new Map(); // Format: { "147516": { duration: "3hour", used: false } }

// ၁။ Voucher ကုဒ် အလိုအလျောက် ထုတ်ပေးသည့် API
app.get('/api/generate-voucher', (req, res) => {
    const duration = req.query.duration || '3hour';
    // ၆ လုံးပါ ဂဏန်းအလန်း ထုတ်ပေးခြင်း
    const voucherCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Voucher ကို စာရင်းထဲ မှတ်တမ်းတင်မည်
    activeVouchers.set(voucherCode, { duration: duration, used: false });

    res.json({
        success: true,
        voucherCode: voucherCode,
        duration: duration,
        message: `Generated Voucher: ${voucherCode} (${duration})`
    });
});

// ၂။ Portal လင့်ခ် နှင့် Voucher ကို စစ်ဆေးပြီး အင်တာနက်ဖွင့်ပေးမည့် API
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

        // Gateway ဆီသို့ Authentication လှမ်းပို့ရန် URL
        const targetAuthUrl = `http://${gwAddress}:${gwPort}/wifidog/auth?token=${token}&voucher=${voucherCode}`;
        
        console.log(`> Authenticating via Gateway: ${targetAuthUrl}`);

        try {
            await axios.get(targetAuthUrl, { timeout: 5000 });
        } catch (err) {
            console.log("Gateway response notice:", err.message);
        }

        // Voucher ကို အသုံးပြီးပြီဖြစ်ကြောင်း မှတ်သားမည်
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
