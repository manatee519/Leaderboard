
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const prices: Record<string, number> = {
  hoodie: 4000,
  hat: 3000,
  fanny: 2000,
};

type CartItem = {
  name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
};

export async function POST(request: NextRequest) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(key);
    const body = await request.json();
    const cart: CartItem[] = body.cart;

    if (!Array.isArray(cart) || cart.length === 0 || cart.length > 30) {
      return NextResponse.json(
        { error: "Invalid cart." },
        { status: 400 }
      );
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.map((item) => {
        const id = item.name.toLowerCase().includes("hoodie")
          ? "hoodie"
          : item.name.toLowerCase().includes("hat")
          ? "hat"
          : item.name.toLowerCase().includes("fanny")
          ? "fanny"
          : "";

        if (
          !prices[id] ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 10 ||
          typeof item.color !== "string" ||
          typeof item.size !== "string"
        ) {
          throw new Error("Invalid product.");
        }

        return {
          price_data: {
            currency: "usd",
            unit_amount: prices[id],
            product_data: {
              name: `${item.name} - ${item.color} - ${item.size}`.slice(
                0,
                200
              ),
            },
          },
          quantity: item.quantity,
        };
      });

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["CA"],
      },
      success_url: `${origin}/merch?payment=success`,
      cancel_url: `${origin}/merch?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
} catch (error) {
  console.error("Stripe checkout error:", error);
  return NextResponse.json(
    { error: "Checkout failed. Check server logs." },
    { status: 400 }
  );
}
  }
}
