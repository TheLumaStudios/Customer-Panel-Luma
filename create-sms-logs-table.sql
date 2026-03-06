-- Drop existing table completely and start fresh
DROP TABLE IF EXISTS sms_logs CASCADE;

-- Create SMS logs table from scratch
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'simulated')),
  cost DECIMAL(10, 2) DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sms_logs_customer_id ON sms_logs(customer_id);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_phone ON sms_logs(phone);

-- Add comments to table and columns
COMMENT ON TABLE sms_logs IS 'Stores logs of all SMS messages sent through the system';
COMMENT ON COLUMN sms_logs.customer_id IS 'Reference to the customer (nullable if customer is deleted)';
COMMENT ON COLUMN sms_logs.phone IS 'Phone number the SMS was sent to';
COMMENT ON COLUMN sms_logs.message IS 'Content of the SMS message';
COMMENT ON COLUMN sms_logs.status IS 'Status of the SMS: sent, failed, or simulated';
COMMENT ON COLUMN sms_logs.cost IS 'Cost of sending the SMS in TRY';
COMMENT ON COLUMN sms_logs.error_message IS 'Error message if the SMS failed to send';
COMMENT ON COLUMN sms_logs.sent_at IS 'Timestamp when the SMS was sent';
