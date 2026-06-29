import React, { useState, useEffect } from "react";
import { FaShoppingCart, FaCreditCard, FaCheckCircle, FaTrash, FaPlus, FaMinus, FaChevronRight, FaStore } from "react-icons/fa";
import "./MerchStore.css";

const TEAMS_LIST = [
  { id: "Chennai Kings", primaryColor: "#eab308", secondaryColor: "#1e3a8a", pattern: "stripes" },
  { id: "Mumbai Titans", primaryColor: "#0ea5e9", secondaryColor: "#1e293b", pattern: "gradient" },
  { id: "Delhi Devils", primaryColor: "#f97316", secondaryColor: "#7f1d1d", pattern: "checks" },
  { id: "Bengaluru Bulls", primaryColor: "#ef4444", secondaryColor: "#111827", pattern: "chevron" }
];

export default function MerchStore() {
  const [selectedTeam, setSelectedTeam] = useState(TEAMS_LIST[0]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("store"); // "store", "checkout", "success"
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiry, setExpiry] = useState("");
  const [orderId, setOrderId] = useState("");

  const products = [
    {
      id: "jersey",
      name: "Official Supporter Jersey",
      basePrice: 1499,
      description: "Matchday ready replica jersey with custom team pattern.",
      hasSize: true
    },
    {
      id: "cap",
      name: "Franchise Curved Cap",
      basePrice: 599,
      description: "Classic 6-panel baseball cap with secondary accent coloring.",
      hasSize: false
    },
    {
      id: "mug",
      name: "Stadium Supporter Mug",
      basePrice: 399,
      description: "High-grade ceramic mug printed in your team's gradient colors.",
      hasSize: false
    },
    {
      id: "bottle",
      name: "Neon Insulated Flask",
      basePrice: 899,
      description: "Double-walled steel bottle styled with premium brand outlines.",
      hasSize: false
    }
  ];

  const addToCart = (product, size = "M") => {
    const cartKey = `${product.id}-${size}`;
    setCart(prev => {
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        return prev.map(item => item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, size, qty: 1, cartKey }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.basePrice * item.qty, 0);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !cvv || !expiry) {
      alert("Please fill in all credit card details.");
      return;
    }
    setOrderId("ORD-" + Math.floor(100000 + Math.random() * 900000));
    setCheckoutStep("success");
    setCart([]);
  };

  return (
    <div className="merch-store-container">
      {/* Store Header */}
      <div className="merch-header">
        <div className="mh-left">
          <FaStore className="store-icon" />
          <div>
            <h1>Franchise Merch Store</h1>
            <p className="subtitle">Custom-colored fan gear dynamically synced to your team profile</p>
          </div>
        </div>
        <div className="mh-right">
          <div className="team-selector-wrap">
            <label>Preview Team Colorways:</label>
            <select
              value={selectedTeam.id}
              onChange={(e) => setSelectedTeam(TEAMS_LIST.find(t => t.id === e.target.value))}
            >
              {TEAMS_LIST.map(t => (
                <option key={t.id} value={t.id}>{t.id}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="cart-toggle-btn">
            <FaShoppingCart />
            <span>Cart</span>
            {cart.length > 0 && <span className="cart-count">{cart.reduce((a, b) => a + b.qty, 0)}</span>}
          </button>
        </div>
      </div>

      {checkoutStep === "store" && (
        <div className="products-grid">
          {products.map(prod => (
            <div key={prod.id} className="product-card">
              {/* Dynamic SVG Visual Previews */}
              <div className="product-preview-box">
                {prod.id === "jersey" && (
                  <svg width="120" height="120" viewBox="0 0 100 100">
                    {/* Floating Shadow */}
                    <ellipse cx="50" cy="90" rx="30" ry="3" fill="rgba(0,0,0,0.3)" />
                    {/* Jersey Sleeves */}
                    <path d="M15,35 L30,22 L42,32 L26,48 Z" fill={selectedTeam.secondaryColor} />
                    <path d="M85,35 L70,22 L58,32 L74,48 Z" fill={selectedTeam.secondaryColor} />
                    {/* Jersey Torso */}
                    <path d="M30,22 L70,22 L74,80 L26,80 Z" fill={selectedTeam.primaryColor} />
                    {/* Patterns overlay */}
                    {selectedTeam.pattern === "stripes" && (
                      <g fill={selectedTeam.secondaryColor}>
                        <rect x="36" y="22" width="4" height="58" />
                        <rect x="48" y="22" width="4" height="58" />
                        <rect x="60" y="22" width="4" height="58" />
                      </g>
                    )}
                    {selectedTeam.pattern === "gradient" && (
                      <defs>
                        <linearGradient id="svgGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={selectedTeam.primaryColor} />
                          <stop offset="100%" stopColor={selectedTeam.secondaryColor} />
                        </linearGradient>
                      </defs>
                    )}
                    {selectedTeam.pattern === "gradient" && (
                      <path d="M30,22 L70,22 L74,80 L26,80 Z" fill="url(#svgGrad)" />
                    )}
                    {selectedTeam.pattern === "checks" && (
                      <g fill={selectedTeam.secondaryColor} opacity="0.3">
                        <rect x="30" y="22" width="10" height="12" />
                        <rect x="50" y="22" width="10" height="12" />
                        <rect x="40" y="34" width="10" height="12" />
                        <rect x="60" y="34" width="10" height="12" />
                        <rect x="30" y="46" width="10" height="12" />
                        <rect x="50" y="46" width="10" height="12" />
                      </g>
                    )}
                    {/* Collar V-Neck */}
                    <path d="M42,22 L58,22 L50,30 Z" fill={selectedTeam.secondaryColor} />
                  </svg>
                )}

                {prod.id === "cap" && (
                  <svg width="120" height="120" viewBox="0 0 100 100">
                    <ellipse cx="50" cy="85" rx="30" ry="3" fill="rgba(0,0,0,0.3)" />
                    {/* Cap Dome */}
                    <path d="M22,60 C22,25 78,25 78,60 Z" fill={selectedTeam.primaryColor} />
                    {/* Cap secondary segment button */}
                    <circle cx="50" cy="27" r="4" fill={selectedTeam.secondaryColor} />
                    {/* Cap Visor */}
                    <path d="M18,60 C28,62 72,62 82,60 C80,68 20,68 18,60 Z" fill={selectedTeam.secondaryColor} />
                  </svg>
                )}

                {prod.id === "mug" && (
                  <svg width="120" height="120" viewBox="0 0 100 100">
                    <ellipse cx="50" cy="85" rx="25" ry="3" fill="rgba(0,0,0,0.3)" />
                    {/* Handle */}
                    <path d="M68,36 C82,36 82,66 68,66" stroke={selectedTeam.secondaryColor} strokeWidth="7" fill="none" />
                    {/* Mug Body */}
                    <rect x="28" y="28" width="42" height="48" rx="4" fill={selectedTeam.primaryColor} />
                    {/* Top gradient border */}
                    <ellipse cx="49" cy="28" rx="21" ry="4" fill={selectedTeam.secondaryColor} />
                  </svg>
                )}

                {prod.id === "bottle" && (
                  <svg width="120" height="120" viewBox="0 0 100 100">
                    <ellipse cx="50" cy="90" rx="18" ry="3" fill="rgba(0,0,0,0.3)" />
                    {/* Bottle Lid */}
                    <rect x="42" y="16" width="16" height="8" rx="2" fill={selectedTeam.secondaryColor} />
                    <rect x="46" y="12" width="8" height="4" fill="#0f172a" />
                    {/* Neck */}
                    <path d="M40,24 L60,24 L56,36 L44,36 Z" fill={selectedTeam.secondaryColor} />
                    {/* Body */}
                    <rect x="36" y="36" width="28" height="48" rx="6" fill={selectedTeam.primaryColor} />
                    {/* Accent strips */}
                    <rect x="36" y="44" width="28" height="4" fill={selectedTeam.secondaryColor} />
                    <rect x="36" y="70" width="28" height="4" fill={selectedTeam.secondaryColor} />
                  </svg>
                )}
              </div>

              {/* Product Info */}
              <div className="product-details">
                <h3>{prod.name}</h3>
                <p className="price">₹{prod.basePrice}</p>
                <p className="desc">{prod.description}</p>
                
                <div className="card-actions">
                  <button onClick={() => addToCart(prod)} className="buy-btn">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {checkoutStep === "checkout" && (
        <div className="checkout-form-container">
          <button onClick={() => setCheckoutStep("store")} className="back-store-btn">
            ← Return to Store
          </button>
          <div className="checkout-grid">
            {/* Card Payment Form */}
            <form onSubmit={handleCheckoutSubmit} className="checkout-card-form glass-panel">
              <h3><FaCreditCard /> Secure Card Payment</h3>
              
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="4000123456789010"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                    placeholder="123"
                  />
                </div>
              </div>

              <button type="submit" className="confirm-pay-btn">
                Pay ₹{cartTotal}
              </button>
            </form>

            {/* Checkout Summary */}
            <div className="checkout-summary-panel glass-panel">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {cart.map(item => (
                  <div key={item.cartKey} className="summary-item-row">
                    <span>{item.name} (x{item.qty})</span>
                    <span>₹{item.basePrice * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <span>Total Amount:</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkoutStep === "success" && (
        <div className="checkout-success-panel glass-panel">
          <FaCheckCircle className="success-icon animate-bounce" />
          <h2>Order Placed Successfully!</h2>
          <p className="order-id">Order ID: {orderId}</p>
          <p className="msg">Your custom fan merchandise is being created. Thank you for supporting {selectedTeam.id}!</p>
          <button onClick={() => setCheckoutStep("store")} className="return-home-btn">
            Back to Store
          </button>
        </div>
      )}

      {/* Slide-out Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="cart-drawer-overlay">
          <div className="cart-drawer">
            <div className="cart-drawer-header">
              <h2>Shopping Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="close-cart-btn">&times;</button>
            </div>

            <div className="cart-drawer-items">
              {cart.length > 0 ? (
                cart.map(item => (
                  <div key={item.cartKey} className="cart-item-row">
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p className="cart-item-price">₹{item.basePrice}</p>
                      {item.hasSize && <span className="size-badge">Size: {item.size}</span>}
                    </div>
                    <div className="cart-qty-controls">
                      <button onClick={() => updateQty(item.cartKey, -1)}><FaMinus size={10} /></button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.cartKey, 1)}><FaPlus size={10} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.cartKey)} className="remove-item-btn">
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-cart-drawer">Your cart is empty. Add fan gear to get started!</div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-drawer-total">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <button onClick={() => { setIsCartOpen(false); setCheckoutStep("checkout"); }} className="checkout-btn">
                  Proceed to Checkout <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
