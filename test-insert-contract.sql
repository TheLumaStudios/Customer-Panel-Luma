-- Insert a test contract directly
INSERT INTO customer_contracts (
  customer_id,
  template_id,
  contract_content,
  contract_hash,
  version,
  status,
  is_mandatory,
  sent_by,
  sent_at,
  expires_at
)
SELECT
  '59c6d842-5aa0-4da1-98e6-6b9affcd31ab', -- customer_id (Enes POYRAZ)
  ct.id, -- template_id (first template)
  ct.content,
  encode(sha256(ct.content::bytea), 'hex'),
  ct.version,
  'pending',
  ct.is_mandatory,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), -- sent_by (first admin)
  NOW(),
  NOW() + INTERVAL '30 days'
FROM contract_templates ct
WHERE ct.status IN ('active', 'draft')
LIMIT 1;

-- Verify insertion
SELECT
  cc.id,
  cc.customer_id,
  cc.status,
  c.email,
  ct.name
FROM customer_contracts cc
LEFT JOIN customers c ON c.id = cc.customer_id
LEFT JOIN contract_templates ct ON ct.id = cc.template_id
WHERE c.email = 'enespoyraz0@icloud.com'
ORDER BY cc.created_at DESC
LIMIT 1;
