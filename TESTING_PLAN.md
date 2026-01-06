# 🧪 Phase 3: Testing & Debugging Plan

I have performed an initial sweep of the codebase and fixed highly critical issues. Your application is now ready for a full round of functional testing.

## ✅ Fixes Already Applied (Pre-Test)

1.  **Admin Product Stock Bug (`app/admin/products/page.tsx`)**:
    *   **Issue**: Toggling a product from "Active" to "Inactive" (or vice versa) was hardcoded to reset stock to `0` or `10`, destroying actual inventory data.
    *   **Fix**: Updated logic to preserve the existing `stock` count when changing status.

2.  **Order Stock Safety (`app/api/orders/route.ts`)**:
    *   **Issue**: Potential race condition where two users buying the last item at the same time could result in negative stock.
    *   **Fix**: Implemented atomic database checks (`stock >= quantity`) within the transaction. The order will now fail gracefully if stock runs out mid-request.

3.  **Order Input Security (`app/api/orders/route.ts`)**:
    *   **Issue**: API previously relied on client-side validation and loose typing.
    *   **Fix**: Added strict **Zod** schema validation. Invalid data (e.g., negative quantities, missing address fields) is now rejected with a 400 Validation Error.

4.  **UI Enhancements**:
    *   **Product List View**: Fixed "giant image" issue by creating a dedicated horizontal card layout with descriptions.
    *   **Message Subjects**: Cleaned up "Re: Re: Re:" chains.
    *   **Back Buttons**: Added navigation buttons for smoother flow.

---

## 📋 Testing Plan for QA

Please perform the following tests manually to verify the system stability.

### 1. 🛒 Purchase Flow (The "Golden Path")
*   [ ] **Login** as a customer.
*   [ ] Go to **Products**, switch to **List View** (Verify layout).
*   [ ] **Add to Cart** multiple items.
*   [ ] Go to **Checkout**.
*   [ ] Select **Cash on Delivery**.
*   [ ] **Place Order**.
*   [ ] **Verify**:
    *   You get a "Order Confirmed" screen.
    *   You are redirected/navigated correctly.
    *   **Stock**: Check if the stock count decreased in the database or Admin panel.

### 2. 🛡️ Admin Management
*   [ ] **Login** as Admin.
*   [ ] Go to **Products**.
*   [ ] **Toggle Status** of a product (Active <-> Inactive).
    *   *Check*: Does the stock count stay the same? (It should!)
*   [ ] **View Orders**: Check if the new order from Step 1 appears.
*   [ ] **Mark as Read**: Click a message in "Messages" and verifying the counter decreases.

### 3. 🧪 Edge Cases (Try to Break It)
*   [ ] **Out of Stock**: Find a product with 1 item. Add to cart. Complete order. Try to buy it again. (Should fail).
*   [ ] **Empty Fields**: Try to register/checkout with empty fields. (Should show validation errors).

### 4. 🐛 Known "Smells" (To Watch Out For)
*   **Email Verification**: If you sign up a new user, you might be blocked from ordering if `email_verified` is false in the database.
    *   *Workaround*: Manually set `email_verified = now()` in Supabase or Prisma if emails aren't sending.

---

## 📝 Reporting Bugs

If you encounter errors:
1.  Take a screenshot.
2.  Copy the error message from the console (F12).
3.  Report it here, and I will fix it immediately!
