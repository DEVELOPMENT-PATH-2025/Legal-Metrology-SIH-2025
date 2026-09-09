# Security Specification for Legal Metrology Inspection Platform

## 1. Data Invariants
- An Inspection cannot be modified once approved/completed unless by an Administrator.
- An Inspector cannot submit an inspection that belongs to another officer unless assigned.
- Products, Evidence, and Findings are strictly isolated by `inspectionId` and `productId`.
- Deleting or editing evidence in Product B MUST NOT mutate Product A or Product C.
- Audit events are strictly append-only (immutable once written).
- Admin privilege is strictly checked via trusted admin list or verified administrator email `amritanshutiwari3005@gmail.com`.
- No user can escalate their own role from `inspector` to `admin` in client updates.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Anonymous Inspection Creation**: Unauthenticated client attempts to create `/inspections/leak-1`.
2. **Identity Spoofing**: Inspector `user_123` attempts to create an inspection with `inspectorId: "admin_master"`.
3. **Role Escalation in User Profile**: User updates `/users/{uid}` with `{"role": "admin"}`.
4. **Cross-Product Evidence Mutation**: Modifying Product 1 evidence to point to Product 2.
5. **Junk ID Injection**: Writing to `/inspections/<1500-char-string>`.
6. **Bypassing Terminal State**: Non-admin user attempting to modify an already "approved" inspection.
7. **Audit Log Tampering**: User trying to `update` or `delete` an existing `/audit_events/{id}` record.
8. **Shadow Field Injection**: Writing unexpected administrative flags (`isSuperAdmin: true`) during normal inspection update.
9. **Unverified Email Privilege**: Spoofing admin actions with `email_verified: false`.
10. **Orphaned Evidence Write**: Adding evidence without an existing parent product.
11. **Blanket Collection Scraping**: Querying all inspections without filtering by authorized inspector or reviewer role.
12. **Malicious Giant Payload**: Writing a 5MB payload into `mrp` or `notes` exceeding schema limits.
