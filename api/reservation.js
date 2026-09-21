const { Resend } = require('resend');

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            service: 'Kingu Ramen Resend Email Service',
            targetEmail: 'allysa.techaf@gmail.com',
            hasApiKey: Boolean(process.env.RESEND_API_KEY)
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        name = 'Pelanggan Kingu Ramen',
        phone = '-',
        date = '-',
        time = '-',
        pax = '1-2',
        zone = 'Kaunter Chef Izakaya',
        notes = '-',
        refCode = `KR-RES-${Math.floor(1000 + Math.random() * 9000)}`
    } = req.body || {};

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn('RESEND_API_KEY is not configured in Vercel environment variables.');
        return res.status(200).json({
            success: false,
            message: 'RESEND_API_KEY not set yet in Vercel Environment Variables. Reservation logged locally.',
            details: { refCode, name, phone, date, time, pax, zone, notes, target: 'allysa.techaf@gmail.com' }
        });
    }

    try {
        const resend = new Resend(apiKey);

        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Tempahan Meja Baru - Kingu Ramen</title>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f4;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: #1c1917; border: 1px solid #c9933e33; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <tr>
              <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #1f1b16 0%, #120e0b 100%); border-bottom: 2px solid #c9933e;">
                <h1 style="margin: 0; font-size: 26px; color: #c9933e; letter-spacing: 2px; text-transform: uppercase;">KINGU RAMEN</h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #a8a29e; letter-spacing: 1px;">THE CAMPUS AMPANG • NOTIFIKASI TEMPAHAN MEJA</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <div style="background: rgba(201, 147, 62, 0.1); border-left: 4px solid #c9933e; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
                  <span style="font-size: 12px; color: #c9933e; font-weight: bold; text-transform: uppercase;">Kod Rujukan Tempahan:</span>
                  <div style="font-size: 20px; font-weight: bold; color: #fafaf9; margin-top: 2px;">${refCode}</div>
                </div>

                <table width="100%" style="font-size: 15px; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #292524;">
                    <td style="padding: 10px 0; color: #a8a29e;">Nama Pelanggan:</td>
                    <td style="padding: 10px 0; color: #fafaf9; font-weight: 600; text-align: right;">${name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #292524;">
                    <td style="padding: 10px 0; color: #a8a29e;">Nombor Telefon:</td>
                    <td style="padding: 10px 0; color: #c9933e; font-weight: 600; text-align: right;"><a href="tel:${phone}" style="color: #c9933e; text-decoration: none;">${phone}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #292524;">
                    <td style="padding: 10px 0; color: #a8a29e;">Tarikh:</td>
                    <td style="padding: 10px 0; color: #fafaf9; font-weight: 600; text-align: right;">${date}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #292524;">
                    <td style="padding: 10px 0; color: #a8a29e;">Waktu:</td>
                    <td style="padding: 10px 0; color: #fafaf9; font-weight: 600; text-align: right;">${time}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #292524;">
                    <td style="padding: 10px 0; color: #a8a29e;">Bilangan Tetamu:</td>
                    <td style="padding: 10px 0; color: #fafaf9; font-weight: 600; text-align: right;">${pax} Orang</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #292524;">
                    <td style="padding: 10px 0; color: #a8a29e;">Zon Duduk:</td>
                    <td style="padding: 10px 0; color: #fafaf9; font-weight: 600; text-align: right;">${zone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #a8a29e;">Nota Khas:</td>
                    <td style="padding: 10px 0; color: #e7e5e4; font-style: italic; text-align: right;">${notes || 'Tiada'}</td>
                  </tr>
                </table>

                <div style="margin-top: 30px; text-align: center;">
                  <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="background: #25D366; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                    Hubungi Pelanggan di WhatsApp
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; text-align: center; background: #141210; border-top: 1px solid #292524; font-size: 12px; color: #78716c;">
                Dihantar kepada: <strong>allysa.techaf@gmail.com</strong><br>
                Sistem Tempahan Automatik Kingu Ramen • Powered by Resend & Vercel
              </td>
            </tr>
          </table>
        </body>
        </html>
        `;

        const { data, error } = await resend.emails.send({
            from: 'Kingu Ramen <onboarding@resend.dev>',
            to: ['allysa.techaf@gmail.com'],
            subject: `[Tempahan Meja Baru] ${name} - ${date} (${time})`,
            html: emailHtml
        });

        if (error) {
            console.error('Resend email error:', error);
            return res.status(500).json({ success: false, error });
        }

        return res.status(200).json({ success: true, data, refCode });
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
