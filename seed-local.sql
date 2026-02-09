-- Insert default users with business permissions
INSERT OR IGNORE INTO users (id, username, password, type, content_business, channel_business) VALUES 
  (1, 'admin', 'password123', 'Admin', 1, 1),
  (2, 'Pelayo', 'Bd122476', 'Admin', 1, 1),
  (3, 'Charlotte', 'password123', 'Lead', 0, 0),
  (4, 'Vambai', 'password123', 'Lead', 0, 0),
  (5, 'Comfort', 'password123', 'User', 0, 0),
  (6, 'Kudzanai', 'password123', 'User', 0, 0),
  (7, 'Unesu', 'password123', 'Admin', 1, 1);
