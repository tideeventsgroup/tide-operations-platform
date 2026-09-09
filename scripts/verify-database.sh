#!/usr/bin/env bash

set -euo pipefail

SUPABASE_TELEMETRY_DISABLED=1 npx supabase start >/dev/null
SUPABASE_TELEMETRY_DISABLED=1 npx supabase migration list --local
