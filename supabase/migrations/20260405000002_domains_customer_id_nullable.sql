-- cf-zone-link and similar admin flows link Cloudflare zones to the domains
-- table before a customer has been assigned (zone discovery / bulk import).
-- The original schema declared `domains.customer_id NOT NULL` which made
-- those inserts crash with:
--   null value in column "customer_id" of relation "domains" violates not-null constraint
--
-- Relax the constraint: an unassigned domain row is legitimate. Customer
-- assignment happens later via update.

ALTER TABLE domains ALTER COLUMN customer_id DROP NOT NULL;

COMMENT ON COLUMN domains.customer_id IS
  'Owning customer (profiles.id). NULL for admin-tracked / cloudflare-only zones awaiting assignment.';
