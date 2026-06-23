const transporter = require("../config/mailer");

async function sendMail(order, user) {
    const itemsHtml = order.products
        .map(p => `<li>${p.name} x${p.quantity} — ${p.price * p.quantity} €</li>`)
        .join("");

    const html = `
        <h2>Merci pour votre commande, ${user.username} !</h2>
        <p>Votre paiement a été confirmé. Voici le récapitulatif :</p>
        <ul>${itemsHtml}</ul>
        <p><strong>Total : ${order.totalPrice} €</strong></p>
        <p>Numéro de commande : ${order._id}</p>
    `;

    await transporter.sendMail({
        from: `"TK Punchmag" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Confirmation de votre commande",
        html,
    });
}

module.exports = sendMail;