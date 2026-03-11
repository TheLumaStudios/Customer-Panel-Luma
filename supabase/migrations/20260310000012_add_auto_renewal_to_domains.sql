-- domains tablosuna auto_renewal kolonu ekle
ALTER TABLE domains
ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false;

COMMENT ON COLUMN domains.auto_renewal IS 'Otomatik yenileme durumu';
