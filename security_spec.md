# Security Specification - INBOXA COL

## 1. Data Invariants
- **User Role integrity:** A user's role can only be set to 'seller', 'warehouse', or 'admin'. Once set, it cannot be modified by the user themselves.
- **Product Stock Protection:** Stock cannot be negative. Only admins can update product prices.
- **Order Ownership:** Sellers can only view/create orders where they are the `sellerId`.
- **Order Lifecycle:** Orders must follow the sequence: Solicitado -> Validado -> En Preparación -> Despachado -> Finalizado/Pagado. 
- **Warehouse Privacy:** Users with the 'warehouse' role can see delivery data but shouldn't have access to financial totals (implemented via UI restrictions and role-checked list reads).
- **Payment Semaphore:** Only admins can mark an order as 'Finalizado/Pagado' or update the `paidAt` timestamp.

## 2. The "Dirty Dozen" Payloads (Denial Tests)

### 1. Identity Spoofing (Seller becoming Admin)
```json
{
  "uid": "seller_123",
  "data": { "role": "admin" },
  "operation": "update",
  "path": "users/seller_123"
}
```
*Expected: PERMISSION_DENIED*

### 2. Negative Stock Injection
```json
{
  "code": "PROD-001",
  "stock": -10,
  "operation": "update",
  "path": "products/prod_1"
}
```
*Expected: PERMISSION_DENIED*

### 3. Order hijacking (Seller 1 reading Seller 2's orders)
```json
{
  "auth": { "uid": "seller_1" },
  "operation": "get",
  "path": "orders/order_from_seller_2"
}
```
*Expected: PERMISSION_DENIED*

### 4. Illegal State Skip (Solicitado to Despachado)
```json
{
  "status": "Despachado",
  "operation": "update",
  "path": "orders/new_order"
}
```
*Expected: PERMISSION_DENIED (Must pass through Validado/Preparación)*

### 5. Price manipulation (Seller updating product price)
```json
{
  "price": 0.01,
  "operation": "update",
  "path": "products/prod_1"
}
```
*Expected: PERMISSION_DENIED*

### 6. Orphaned Order (Order with non-existent seller)
```json
{
  "sellerId": "ghost_uid",
  "operation": "create",
  "path": "orders/new_order"
}
```
*Expected: PERMISSION_DENIED*

### 7. Giant ID Payload (Denial of Wallet)
```json
{
  "id": "A".repeat(2000),
  "operation": "create",
  "path": "products/large_id"
}
```
*Expected: PERMISSION_DENIED*

### 8. Shadow Field Update
```json
{
  "isVerified": true,
  "operation": "update",
  "path": "users/my_profile"
}
```
*Expected: PERMISSION_DENIED (Keys not in whitelisted affectedKeys)*

### 9. Unauthorized Refund (Seller marking order as Paid)
```json
{
  "status": "Finalizado/Pagado",
  "operation": "update",
  "path": "orders/order_123"
}
```
*Expected: PERMISSION_DENIED (Admin only)*

### 10. Temporal Spoofing (Setting createdAt in the past)
```json
{
  "createdAt": "2020-01-01T00:00:00Z",
  "operation": "create",
  "path": "orders/new_order"
}
```
*Expected: PERMISSION_DENIED (Must match request.time)*

### 11. PII Scraping (Reading all user emails as non-admin)
```json
{
  "operation": "list",
  "path": "users"
}
```
*Expected: PERMISSION_DENIED*

### 12. Immutable Field Tamper
```json
{
  "originalSellerId": "new_uid",
  "operation": "update",
  "path": "orders/order_123"
}
```
*Expected: PERMISSION_DENIED*

## 3. Test Runner Roadmap
The tests will be implemented in `firestore.rules.test.ts` ensuring that each user role can only perform the actions allowed by the business logic.
