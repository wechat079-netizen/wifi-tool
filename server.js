const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setups
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Frontend ဖိုင်များထားရှိမည့် folder အတွက်

// API endpoint to start threads / engine
app.post('/api/start-engine', (req, res) => {
    let { gatewayIp, gatewayPort, sessionId } = req.body;

    // အကယ်၍ Session ID နေရာတွင် URL လင့်ခ်ရှည်ကြီး ထည့်လိုက်ပါက အလိုအလျောက် ဖြတ်ထုတ်ရန်
    if (sessionId && typeof sessionId === 'string' && sessionId.startsWith('http')) {
        try {
            const urlObj = new URL(sessionId);
            // URL ထဲမှ gw_id သို့မဟုတ် gw_sn ကို Session ID အဖြစ် အလိုအလျောက် ရယူမည်
            sessionId = urlObj.searchParams.get('gw_id') || urlObj.searchParams.get('gw_sn') || sessionId;
        } catch (e) {
            console.log("URL parsing error:", e.message);
        }
    }

    if (!sessionId) {
        return res.status(400).json({ success: false, message: "Gateway ID or Session ID is missing!" });
    }

    console.log(`> Launching requests to gateway ${gatewayIp}:${gatewayPort} with ID: ${sessionId}`);

    // ဒီနေရာမှာ သင့်ရဲ့ Network Tool လုပ်ဆောင်ရမယ့် logic တွေကို ဆက်ရေးနိုင်ပါတယ်

    res.json({ 
        success: true, 
        message: `Engine started successfully with ID: ${sessionId}`,
        gateway: `${gatewayIp}:${gatewayPort}`,
        resolvedId: sessionId
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
