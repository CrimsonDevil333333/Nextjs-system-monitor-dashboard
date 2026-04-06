#!/bin/bash
# Verify password using su command
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

# Try to su with the password - will succeed if password is correct
if echo "$PASSWORD" | su -c "echo OK" "$USERNAME" >/dev/null 2>&1; then
    echo "OK"
else
    echo "FAIL"
fi
