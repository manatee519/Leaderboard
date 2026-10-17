
"use client";

import { useState } from "react";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  colors: { name: string; image: string }[];
  sizes?: string[];
};

type CartItem = {
  key: string;
  name: string;
  color: string;
  size: string;
  image: string;
  price: number;
  quantity: number;
};

const PRODUCTS: Product[] = [
  {
    id: "hoodie",
    name: "MANATEE519 HOODIE",
    price: 40,
    description: "Signature MANATEE design. Front and sleeve graphics.",
    colors: [
      { name: "Black", image: "/hoodie-black.png" },
      { name: "Heather Grey", image: "/hoodie-grey.png" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "hat",
    name: "MANATEE519 HAT",
    price: 30,
    description: "Classic cap with a bold heat-transfer MANATEE logo.",
    colors: [
      { name: "Black", image: "/hat-black.png" },
      { name: "Grey", image: "/hat-grey.png" },
      { name: "Caramel", image: "/hat-caramel.png" },
    ],
  },
  {
    id: "fanny",
    name: "MANATEE519 FANNY PACK",
    price: 20,
    description: "Everyday essentials with the MANATEE signature logo.",
    colors: [
      { name: "Black", image: "/fanny-black.png" },
      { name: "Storm Grey", image: "/fanny-grey.png" },
      { name: "Sahara", image: "/fanny-sahara.png" },
      { name: "Midnight Blue", image: "/fanny-navy.png" },
      { name: "Blue Mist", image: "/fanny-blue.png" },
    ],
  },
];

const usd = (amount: number) => `$${amount.toFixed(2)}`;

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 9,
  border: "1px solid #343441",
  background: "#111118",
  color: "white",
  fontSize: 14,
};

export default function MerchPage() {
  const [selectedColors, setSelectedColors] = useState<
    Record<string, number>
  >({});
  const [selectedSizes, setSelectedSizes] = useState<
    Record<string, string>
  >({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("Canada");
  const [copied, setCopied] = useState(false);

  function addToCart(product: Product) {
    const colorIndex = selectedColors[product.id] ?? 0;
    const color = product.colors[colorIndex];
    const size = selectedSizes[product.id] || product.sizes?.[0] || "One Size";
    const key = `${product.id}-${color.name}-${size}`;

    setCart((previous) => {
      const existing = previous.find((item) => item.key === key);

      if (existing) {
        return previous.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previous,
        {
          key,
          name: product.name,
          color: color.name,
          size,
          image: color.image,
          price: product.price,
          quantity: 1,
        },
      ];
    });

    setCopied(false);
    setCartOpen(true);
  }

  function changeQuantity(key: string, difference: number) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + difference }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
    setCopied(false);
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const orderDetails = [
    "MANATEE519 MERCH PRE-ORDER REQUEST",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Country: ${country}`,
    "",
    ...cart.map(
      (item) =>
        `${item.quantity}x ${item.name} | ${item.color} | ${item.size} | ${usd(item.price * item.quantity)} USD`
    ),
    "",
    `Subtotal: ${usd(subtotal)} USD`,
    country === "Canada"
      ? "Shipping: FREE within Canada"
      : "Shipping: To be quoted",
    "",
    "This is a pre-order request. Payment has not been collected.",
  ].join("\n");

 async function copyOrder() {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cart }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.error || "Checkout failed");
    }

    window.location.href = data.url;
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Unable to start checkout."
    );
  }
}
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <main className="merch">
      <div className="container">
        <nav className="nav">
          <a href="/" className="brand">
            MANATEE<span>519</span>
          </a>
          <div className="navActions">
            <a href="/" className="backLink">LEADERBOARD</a>
            <button
              className="cartButton"
              onClick={() => setCartOpen(true)}
            >
              CART ({itemCount})
            </button>
          </div>
        </nav>

        <section className="hero">
          <p className="eyebrow">OFFICIAL MANATEE519 MERCH</p>
          <h1>
            THE FIRST <span>DROP.</span>
          </h1>
          <p className="heroText">
            Exclusive MANATEAM collection.
            <br />
            Made to order. Built for the community.
          </p>
          <div className="preorderTag">PRE-ORDER COLLECTION</div>
          <p className="shipping">🇨🇦 FREE SHIPPING ACROSS CANADA</p>
        </section>

        <div className="sectionTitle">
          <h2>SHOP THE DROP</h2>
          <p>All prices in USD</p>
        </div>

        <section className="products">
          {PRODUCTS.map((product) => {
            const colorIndex = selectedColors[product.id] ?? 0;
            const color = product.colors[colorIndex];

            return (
              <article className="productCard" key={product.id}>
                <div className="productImage">
                  <div className="dropLabel">FIRST DROP</div>
                  <Image
                    key={color.image}
                    src={color.image}
                    alt={`${product.name} in ${color.name}`}
                    fill
                    unoptimized
                    sizes="(max-width: 700px) 100vw, 350px"
                    style={{ objectFit: "contain" }}
                  />
                </div>

                <div className="productInfo">
                  <h3>{product.name}</h3>
                  <p className="description">{product.description}</p>
                  <div className="price">
                    {usd(product.price)} <small>USD</small>
                  </div>

                  <label>SELECT COLOUR</label>
                  <div className="colorButtons">
                    {product.colors.map((option, index) => (
                      <button
                        key={option.name}
                        className={
                          index === colorIndex
                            ? "colorChoice active"
                            : "colorChoice"
                        }
                        onClick={() =>
                          setSelectedColors((previous) => ({
                            ...previous,
                            [product.id]: index,
                          }))
                        }
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>

                  {product.sizes && (
                    <>
                      <label>SELECT SIZE</label>
                      <select
                        style={inputStyle}
                        value={
                          selectedSizes[product.id] ||
                          product.sizes[0]
                        }
                        onChange={(event) =>
                          setSelectedSizes((previous) => ({
                            ...previous,
                            [product.id]: event.target.value,
                          }))
                        }
                      >
                        {product.sizes.map((size) => (
                          <option key={size}>{size}</option>
                        ))}
                      </select>
                    </>
                  )}

                  <button
                    className="addButton"
                    onClick={() => addToCart(product)}
                  >
                    ADD TO CART +
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="information">
          <div>
            <h3>🇨🇦 FREE CANADIAN SHIPPING</h3>
            <p>Every Canadian order ships free.</p>
          </div>
          <div>
            <h3>🌎 INTERNATIONAL ORDERS</h3>
            <p>Shipping is quoted separately.</p>
          </div>
          <div>
            <h3>🔥 MADE TO ORDER</h3>
            <p>Each item is produced after ordering.</p>
          </div>
        </section>

        <footer>
          <strong>MANATEE519</strong>
          <p>© 2026 MANATEE519. All rights reserved.</p>
          <a href="/">RETURN TO LEADERBOARD</a>
        </footer>
      </div>

      {cartOpen && (
        <div className="overlay">
          <div className="cartPanel">
            <div className="cartHeader">
              <h2>YOUR CART ({itemCount})</h2>
              <button onClick={() => setCartOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="emptyCart">
                <p>Your cart is empty.</p>
                <button
                  className="addButton"
                  onClick={() => setCartOpen(false)}
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div className="cartItem" key={item.key}>
                    <div className="cartThumb">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="80px"
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <div className="cartItemDetails">
                      <strong>{item.name}</strong>
                      <p>{item.color} / {item.size}</p>
                      <span>{usd(item.price * item.quantity)}</span>
                      <div className="quantity">
                        <button
                          onClick={() =>
                            changeQuantity(item.key, -1)
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            changeQuantity(item.key, 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="total">
                  <span>SUBTOTAL</span>
                  <strong>{usd(subtotal)} USD</strong>
                </div>

                <p className="shippingNote">
                  🇨🇦 Free Canadian shipping. International
                  shipping quoted separately.
                </p>

                <h3 className="checkoutTitle">PRE-ORDER DETAILS</h3>

                <input
                  style={inputStyle}
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setCopied(false);
                  }}
                />

                <input
                  style={inputStyle}
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setCopied(false);
                  }}
                />

                <select
                  style={inputStyle}
                  value={country}
                  onChange={(event) => {
                    setCountry(event.target.value);
                    setCopied(false);
                  }}
                >
                  <option>Canada</option>
                  <option>United States</option>
                  <option>Other</option>
                </select>

                <button
                  className="addButton"
                  disabled={!name.trim() || !validEmail}
                  onClick={copyOrder}
                >
SECURE CHECKOUT
                </button>

            <p className="disclaimer">
  You will be redirected to Stripe for secure payment.
</p>
   
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #08080b;
        }

        .merch {
          min-height: 100vh;
          color: white;
          font-family: Arial, Helvetica, sans-serif;
          background:
            radial-gradient(
              ellipse at 50% 0%,
              #391021 0%,
              #101017 38%,
              #070709 75%
            );
        }

        .container {
          max-width: 1250px;
          margin: auto;
          padding: 0 24px;
        }

        .nav {
          height: 90px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #34303a;
          gap: 15px;
        }

        .brand {
          color: white;
          text-decoration: none;
          font-size: 23px;
          font-weight: 1000;
          letter-spacing: -1px;
        }

        .brand span {
          color: #ff1456;
        }

        .navActions {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .backLink {
          color: #aaa;
          text-decoration: none;
          font-size: 12px;
          font-weight: bold;
        }

        .cartButton,
        .addButton {
          border: 0;
          color: white;
          background: #f01250;
          font-weight: 900;
          cursor: pointer;
          border-radius: 8px;
          transition: 0.2s;
        }

        .cartButton {
          padding: 13px 20px;
        }

        .addButton {
          width: 100%;
          padding: 16px;
          margin-top: 22px;
          font-size: 14px;
        }

        .cartButton:hover,
        .addButton:hover {
          background: #ff376b;
        }

        .addButton:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .hero {
          text-align: center;
          padding: 85px 10px 90px;
        }

        .eyebrow {
          color: #ff5b87;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 5px;
        }

        .hero h1 {
          font-size: clamp(46px, 9vw, 105px);
          font-weight: 1000;
          letter-spacing: -4px;
          margin: 20px 0;
          line-height: 1.05;
        }

        .hero h1 span {
          color: #f01250;
        }

        .heroText {
          color: #bbb;
          line-height: 1.9;
          font-size: 17px;
        }

        .preorderTag {
          display: inline-block;
          border: 1px solid #f01250;
          color: #ff6994;
          border-radius: 30px;
          padding: 12px 25px;
          font-size: 12px;
          letter-spacing: 2px;
          font-weight: 900;
          margin-top: 25px;
        }

        .shipping {
          color: #ddd;
          font-weight: bold;
          margin-top: 25px;
          font-size: 14px;
        }

        .sectionTitle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .sectionTitle h2 {
          font-size: 26px;
          letter-spacing: 1px;
        }

        .sectionTitle p {
          color: #999;
          font-size: 13px;
        }

        .products {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .productCard {
          background: #15151b;
          border: 1px solid #34303a;
          border-radius: 16px;
          overflow: hidden;
          transition: 0.2s;
        }

        .productCard:hover {
          border-color: #b82650;
          transform: translateY(-3px);
        }

        .productImage {
          position: relative;
          height: 310px;
          background: #fff;
          overflow: hidden;
        }

        .dropLabel {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          background: #f01250;
          padding: 8px 11px;
          font-size: 10px;
          font-weight: 900;
          border-radius: 5px;
          letter-spacing: 1px;
        }

        .productInfo {
          padding: 23px;
        }

        .productInfo h3 {
          font-size: 19px;
          margin: 0 0 12px;
        }

        .description {
          color: #aaa;
          font-size: 13px;
          line-height: 1.7;
          min-height: 45px;
        }

        .price {
          color: #ff346c;
          font-size: 30px;
          font-weight: 900;
          margin: 20px 0;
        }

        .price small {
          font-size: 12px;
          color: #999;
        }

        .productInfo label {
          display: block;
          color: #bbb;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
          margin: 20px 0 12px;
        }

        .colorButtons {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .colorChoice {
          border: 1px solid #3b3b47;
          background: #202029;
          color: #ccc;
          border-radius: 7px;
          padding: 10px;
          font-size: 11px;
          cursor: pointer;
        }

        .colorChoice.active {
          background: #f01250;
          border-color: #f01250;
          color: white;
          font-weight: bold;
        }

        .information {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 85px 0;
        }

        .information > div {
          text-align: center;
          background: #14141a;
          border: 1px solid #303039;
          border-radius: 12px;
          padding: 30px 15px;
        }

        .information h3 {
          font-size: 14px;
          color: #fff;
        }

        .information p {
          color: #aaa;
          font-size: 13px;
          line-height: 1.7;
        }

        footer {
          text-align: center;
          border-top: 1px solid #333;
          padding: 40px 0;
          color: #777;
          font-size: 12px;
        }

        footer strong {
          color: #fff;
          font-size: 19px;
        }

        footer a {
          display: block;
          color: #ff477a;
          margin-top: 18px;
          text-decoration: none;
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.86);
          display: flex;
          justify-content: flex-end;
        }

        .cartPanel {
          width: 100%;
          max-width: 490px;
          height: 100vh;
          overflow-y: auto;
          background: #17171d;
          border-left: 1px solid #383842;
          padding: 25px;
        }

        .cartHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #383842;
          padding-bottom: 15px;
        }

        .cartHeader h2 {
          font-size: 20px;
        }

        .cartHeader button {
          border: 0;
          background: transparent;
          color: white;
          font-size: 25px;
          cursor: pointer;
        }

        .cartItem {
          display: flex;
          gap: 15px;
          padding: 22px 0;
          border-bottom: 1px solid #34343d;
        }

        .cartThumb {
          position: relative;
          flex-shrink: 0;
          width: 85px;
          height: 85px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .cartItemDetails {
          flex: 1;
        }

        .cartItemDetails strong {
          font-size: 13px;
        }

        .cartItemDetails p {
          color: #aaa;
          font-size: 12px;
        }

        .cartItemDetails span {
          color: #ff477a;
          font-weight: bold;
        }

        .quantity {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 12px;
        }

        .quantity button {
          background: #30303b;
          border: 0;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 5px;
          cursor: pointer;
        }

        .total {
          display: flex;
          justify-content: space-between;
          padding: 25px 0;
          font-size: 19px;
        }

        .total strong {
          color: #ff477a;
        }

        .shippingNote {
          color: #bbb;
          font-size: 13px;
          line-height: 1.7;
        }

        .checkoutTitle {
          margin-top: 30px;
          font-size: 16px;
        }

        .cartPanel input,
        .cartPanel select {
          margin: 8px 0;
        }

        .disclaimer {
          color: #999;
          font-size: 12px;
          line-height: 1.8;
          margin-top: 18px;
        }

        .emptyCart {
          padding: 40px 0;
          text-align: center;
          color: #aaa;
        }

        @media (max-width: 950px) {
          .products {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .container {
            padding: 0 15px;
          }

          .nav {
            height: 75px;
          }

          .brand {
            font-size: 19px;
          }

          .navActions {
            gap: 10px;
          }

          .backLink {
            font-size: 10px;
          }

          .cartButton {
            padding: 11px;
            font-size: 11px;
          }

          .hero {
            padding: 60px 0;
          }

          .hero h1 {
            letter-spacing: -2px;
          }

          .products,
          .information {
            grid-template-columns: 1fr;
          }

          .productImage {
            height: 300px;
          }

          .sectionTitle h2 {
            font-size: 20px;
          }

          .information {
            margin: 50px 0;
          }
        }
      `}</style>
    </main>
  );
}
