const transporter = require("../config/mailer");

async function sendMail({ to, subject, html }) {
    try {
        const info = await transporter.sendMail({
            from: `"TK Punchmag" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
        });

        console.log("✅ Email envoyé:", info.messageId);
        return info;

    } catch (error) {
        console.error("🔥 Erreur envoi email:", error.message);
        throw error;
    }
}

module.exports = sendMail;