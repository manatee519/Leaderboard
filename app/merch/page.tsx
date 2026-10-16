
"use client";

import { useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  colors: string[];
  sizes?: string[];
  emoji: string;
};

type CartItem = {
  id: string;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
};

const products: Product[] = [
  {
    id: "hoodie",
    name: "MANATEE Hoodie",
    price: 40,
    colors: ["Black", "Heather Grey"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    emoji: "🧥",
  },
  {
    id: "hat",
    name: "MANATEE Hat",
    price: 30,
    colors: ["Black", "Grey", "Caramel"],
    emoji: "🧢",
  },
  {
    id: "fanny",
    name: "MANATEE Fanny Pack",
    price: 20,
    colors: [
      "Black",
      "Storm Grey",
      "Sahara",
      "Midnight Blue",
      "Blue Mist",
    ],
    emoji: "🎒",
  },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export default function MerchPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selections, setSelections] = useState<
    Record<string, { color: string; size: string }>
  >({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [country, setCountry] = useState("Canada");
  const [copied, setCopied] = useState(false);

  const selected = (product: Product) =>
    selections[product.id] || {
      color: product.colors[0],
      size: product.sizes?.[0] || "One Size",
    };

  function updateSelection(
    id: string,
    field: "color" | "size",
    value: string
  ) {
    const product = products.find((p) => p.id === id)!;
    setSelections((previous) => ({
      ...previous,
      [id]: {
        ...(previous[id] || {
          color: product.colors[0],
          size: product.sizes?.[0] || "One Size",
        }),
        [field]: value,
      },
    }));
  }

  function addToCart(product: Product) {
    const choice = selected(product);
    const id = `${product.id}-${choice.color}-${choice.size}`;

    setCart((previous) => {
      const existing = previous.find((item) => item.id === id);

      if (existing) {
        return previous.map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previous,
        {
          id,
          name: product.name,
          price: product.price,
          color: choice.color,
          size: choice.size,
          quantity: 1,
        },
      ];
    });
  }

  function changeQuantity(id: string, difference: number) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity + difference,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const count = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const orderText = [
    "MANATEE519 MERCH PRE-ORDER REQUEST",
    "",
    `Name: ${customerName}`,
    `Email: ${customerEmail}`,
    `Country: ${country}`,
    "",
    ...cart.map(
      (item) =>
        `${item.quantity}x ${item.name} | ${item.color} | ${item.size} | ${money(item.price * item.quantity)}`
    ),
    "",
    `Subtotal: ${money(subtotal)} USD`,
    country === "Canada"
      ? "Shipping: FREE within Canada"
      : "Shipping: To be quoted",
    "",
    "This is a pre-order request, not a paid order.",
  ].join("\n");

  async function copyOrder() {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
    } catch {
      window.alert("Unable to copy. Please try again.");
    }
  }

  const fieldStyle = {
    background: "#11131b",
    color: "#fff",
    border: "1px solid #373947",
    borderRadius: 9,
    padding: "12px",
    width: "100%",
    fontSize: 14,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top, #35101d 0%, #0a0a0e 50%, #050507 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "30px 18px 90px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 15,
            marginBottom: 60,
          }}
        >
          <a
            href="/"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            MANATEE519
          </a>
          <button
            onClick={() => setCheckoutOpen(true)}
            style={{
              background: "#ef1252",
              color: "white",
              border: 0,
              padding: "12px 18px",
              borderRadius: 9,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            CART ({count})
          </button>
        </header>

        <section
          style={{
            textAlign: "center",
            padding: "30px 0 65px",
          }}
        >
          <div
            style={{
              color: "#ff477a",
              letterSpacing: 4,
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            OFFICIAL COMMUNITY COLLECTION
          </div>

          <h1
            style={{
              fontSize: "clamp(42px, 9vw, 94px)",
              fontWeight: 1000,
              letterSpacing: -4,
              margin: "15px 0",
              lineHeight: 1,
            }}
          >
            MANATEE
            <span style={{ color: "#ff1455" }}>519</span>
          </h1>

          <h2
            style={{
              fontSize: "clamp(20px, 4vw, 34px)",
              letterSpacing: 4,
              marginBottom: 15,
            }}
          >
            THE FIRST DROP
          </h2>

          <p style={{ color: "#aaa", lineHeight: 1.8 }}>
            Exclusive community merch.
            <br />
            Made to order. Built for the MANATEAM.
          </p>

          <div
            style={{
              display: "inline-block",
              border: "1px solid #ef1252",
              color: "#ff6a94",
              padding: "12px 22px",
              borderRadius: 30,
              marginTop: 20,
              fontWeight: "bold",
            }}
          >
            PRE-ORDERS OPEN SOON
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 290px), 1fr))",
            gap: 22,
          }}
        >
          {products.map((product) => {
            const choice = selected(product);

            return (
              <article
                key={product.id}
                style={{
                  background: "#15151b",
                  border: "1px solid #303039",
                  borderRadius: 17,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    minHeight: 210,
                    background:
                      "linear-gradient(145deg, #30202b, #101014)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 85,
                    position: "relative",
                  }}
                >
                  {product.emoji}
                  <span
                    style={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      background: "#ed1450",
                      fontSize: 11,
                      padding: "7px 10px",
                      borderRadius: 5,
                      fontWeight: "bold",
                    }}
                  >
                    FIRST DROP
                  </span>
                </div>

                <div style={{ padding: 22 }}>
                  <h3 style={{ fontSize: 22, margin: "0 0 8px" }}>
                    {product.name}
                  </h3>

                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: "bold",
                      color: "#ff477a",
                      marginBottom: 22,
                    }}
                  >
                    {money(product.price)}
                    <span
                      style={{
                        color: "#999",
                        fontSize: 12,
                        marginLeft: 7,
                      }}
                    >
                      USD
                    </span>
                  </div>

                  <label
                    style={{
                      display: "block",
                      color: "#aaa",
                      marginBottom: 8,
                    }}
                  >
                    Colour
                  </label>

                  <select
                    value={choice.color}
                    onChange={(e) =>
                      updateSelection(
                        product.id,
                        "color",
                        e.target.value
                      )
                    }
                    style={{ ...fieldStyle, marginBottom: 18 }}
                  >
                    {product.colors.map((color) => (
                      <option key={color}>{color}</option>
                    ))}
                  </select>

                  {product.sizes && (
                    <>
                      <label
                        style={{
                          display: "block",
                          color: "#aaa",
                          marginBottom: 8,
                        }}
                      >
                        Size
                      </label>
                      <select
                        value={choice.size}
                        onChange={(e) =>
                          updateSelection(
                            product.id,
                            "size",
                            e.target.value
                          )
                        }
                        style={{
                          ...fieldStyle,
                          marginBottom: 18,
                        }}
                      >
                        {product.sizes.map((size) => (
                          <option key={size}>{size}</option>
                        ))}
                      </select>
                    </>
                  )}

                  <button
                    onClick={() => addToCart(product)}
                    style={{
                      width: "100%",
                      padding: 15,
                      background: "#ef1252",
                      color: "white",
                      border: 0,
                      borderRadius: 9,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ADD TO CART +
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section
          style={{
            textAlign: "center",
            padding: "70px 15px",
            lineHeight: 1.9,
          }}
        >
          <h2>🇨🇦 FREE CANADIAN SHIPPING</h2>
          <p style={{ color: "#aaa" }}>
            Free shipping across Canada.
            <br />
            International shipping quoted separately.
            <br />
            All items are made to order.
          </p>
          <p style={{ color: "#ff7a9c", fontSize: 13 }}>
            Pre-order requests do not reserve inventory or
            collect payment.
          </p>
        </section>

        <footer
          style={{
            borderTop: "1px solid #303039",
            paddingTop: 25,
            textAlign: "center",
            color: "#777",
            fontSize: 13,
          }}
        >
          MANATEE519 © 2026
          <br />
          <a
            href="/"
            style={{ color: "#ff477a", lineHeight: 3 }}
          >
            RETURN TO LEADERBOARD
          </a>
        </footer>
      </div>

      {checkoutOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.85)",
            zIndex: 100,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 15,
          }}
        >
          <div
            style={{
              background: "#19191f",
              border: "1px solid #454550",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>YOUR PRE-ORDER</h2>
              <button
                onClick={() => setCheckoutOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "white",
                  fontSize: 28,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <p style={{ color: "#aaa" }}>
                Your cart is empty.
              </p>
            ) : (
              <>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "15px 0",
                      borderBottom: "1px solid #333",
                    }}
                  >
                    <strong>{item.name}</strong>
                    <p style={{ color: "#aaa", fontSize: 13 }}>
                      {item.color} / {item.size}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        {money(item.price * item.quantity)}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <button
                          onClick={() =>
                            changeQuantity(item.id, -1)
                          }
                        >
                          −
                        </button>
                        {item.quantity}
                        <button
                          onClick={() =>
                            changeQuantity(item.id, 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <h2 style={{ textAlign: "right" }}>
                  {money(subtotal)} USD
                </h2>

                <p style={{ color: "#aaa", fontSize: 13 }}>
                  Canadian shipping is free. International
                  shipping will be quoted separately.
                </p>

                <input
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  style={{
                    ...fieldStyle,
                    marginBottom: 12,
                  }}
                />

                <input
                  type="email"
                  placeholder="Your email"
                  value={customerEmail}
                  onChange={(e) =>
                    setCustomerEmail(e.target.value)
                  }
                  style={{
                    ...fieldStyle,
                    marginBottom: 12,
                  }}
                />

                <select
                  value={country}
                  onChange={(e) =>
                    setCountry(e.target.value)
                  }
                  style={{
                    ...fieldStyle,
                    marginBottom: 12,
                  }}
                >
                  <option>Canada</option>
                  <option>United States</option>
                  <option>Other</option>
                </select>

                <button
                  disabled={
                    !customerName.trim() ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                      customerEmail
                    )
                  }
                  onClick={copyOrder}
                  style={{
                    width: "100%",
                    padding: 16,
                    background: "#ef1252",
                    color: "white",
                    border: 0,
                    borderRadius: 9,
                    fontWeight: "bold",
                    cursor: "pointer",
                    opacity:
                      !customerName.trim() ||
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                        customerEmail
                      )
                        ? 0.5
                        : 1,
                  }}
                >
                  {copied
                    ? "ORDER DETAILS COPIED!"
                    : "COPY PRE-ORDER REQUEST"}
                </button>

                <p
                  style={{
                    color: "#aaa",
                    fontSize: 12,
                    lineHeight: 1.7,
                  }}
                >
                  This copies your order details so you can
                  send them to MANATEE519. No payment is
                  collected and no order is submitted
                  automatically.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
