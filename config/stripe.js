const Stripe = require("stripe");

console.log("Stripe key:", process.env.STRIPE_SECRET_KEY?.substring(0, 10));

module.exports = new Stripe(process.env.STRIPE_SECRET_KEY);
