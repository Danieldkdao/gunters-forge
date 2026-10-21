// Calculate the costs and totals in integer cents
export const calculateOrderTotals = (
  cartItems: { price: number; quantity: number }[],
) => {
  if (
    cartItems.some(
      ({ price, quantity }) =>
        !Number.isSafeInteger(price) ||
        price < 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1,
    )
  )
    throw new Error("Invalid order amounts.");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = Math.round((subtotal * 5) / 100);
  const total = subtotal + tax;
  if (!Number.isSafeInteger(total) || total > 2147483647) {
    throw new Error("Order total is too large.");
  }
  return { subtotal, tax, total };
};
