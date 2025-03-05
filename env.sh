#!/bin/sh

# Inject environment variables into the built application
cat << EOF > /usr/share/nginx/html/env-config.js
window.ENV = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}"
};
EOF