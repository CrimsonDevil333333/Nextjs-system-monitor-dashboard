#!/bin/bash
# Verify password using su or sudo command
USERNAME="$1"

if [ -z "$USERNAME" ]; then
    echo "FAIL"
    exit 1
fi

read -r PASSWORD

if [ -z "$PASSWORD" ]; then
    echo "FAIL"
    exit 1
fi

# Check if sudo is available and we can use it for password verification
if command -v sudo &> /dev/null && sudo -n true 2>/dev/null; then
    # Use sudo with -S flag (read password from stdin)
    if echo "$PASSWORD" | sudo -S -k -u "$USERNAME" echo OK 2>/dev/null; then
        echo "OK"
    else
        echo "FAIL"
    fi
# Fall back to su
elif command -v su &> /dev/null; then
    if echo "$PASSWORD" | su -c "echo OK" "$USERNAME" >/dev/null 2>&1; then
        echo "OK"
    else
        echo "FAIL"
    fi
else
    echo "FAIL"
    exit 1
fi
