#!/bin/bash

echo "Starting localtunnel..."
echo ""

# Start localtunnel and capture the URL
npx localtunnel --port 5000 > /tmp/tunnel-output.log 2>&1 &
TUNNEL_PID=$!

# Wait for the URL to appear
for i in {1..30}; do
    if grep -q "https://" /tmp/tunnel-output.log 2>/dev/null; then
        break
    fi
    sleep 1
    echo -n "."
done

echo ""
echo ""
echo "=================================================="
echo "🌐 PUBLIC URL:"
echo ""
grep -o "https://[^[:space:]]*" /tmp/tunnel-output.log 2>/dev/null || echo "URL not found yet"
echo ""
echo "=================================================="
echo ""
echo "Tunnel PID: $TUNNEL_PID"
echo "To stop: kill $TUNNEL_PID"
echo ""
cat /tmp/tunnel-output.log
echo ""
echo "Tunnel is running in the background..."
