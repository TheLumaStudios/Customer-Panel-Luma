-- Add credential fields to VDS table
-- This allows storing root password, SSH access, and control panel credentials

ALTER TABLE vds
  ADD COLUMN IF NOT EXISTS root_password TEXT,
  ADD COLUMN IF NOT EXISTS ssh_port INTEGER DEFAULT 22,
  ADD COLUMN IF NOT EXISTS control_panel_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS control_panel_username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS control_panel_password TEXT,
  ADD COLUMN IF NOT EXISTS vnc_port INTEGER,
  ADD COLUMN IF NOT EXISTS vnc_password TEXT,
  ADD COLUMN IF NOT EXISTS rescue_password TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN vds.root_password IS 'Root/Administrator password';
COMMENT ON COLUMN vds.ssh_port IS 'SSH port number (default 22)';
COMMENT ON COLUMN vds.control_panel_url IS 'Control panel URL (SolusVM, Virtualizor, etc.)';
COMMENT ON COLUMN vds.control_panel_username IS 'Control panel username';
COMMENT ON COLUMN vds.control_panel_password IS 'Control panel password';
COMMENT ON COLUMN vds.vnc_port IS 'VNC port for console access';
COMMENT ON COLUMN vds.vnc_password IS 'VNC password';
COMMENT ON COLUMN vds.rescue_password IS 'Rescue mode password';
COMMENT ON COLUMN vds.notes IS 'Additional notes about VDS access';
