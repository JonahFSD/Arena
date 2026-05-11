-- Jake Oswald - admin
INSERT INTO users (id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'jake@austinchristianu.org'),
  'jake@austinchristianu.org',
  'Jake Oswald',
  'admin'
)
ON CONFLICT (email)
DO UPDATE SET role = 'admin', id = EXCLUDED.id;

-- Connor Dore - admin
INSERT INTO users (id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'connordore36@gmail.com'),
  'connordore36@gmail.com',
  'Connor Dore',
  'admin'
)
ON CONFLICT (email)
DO UPDATE SET role = 'admin', id = EXCLUDED.id;
