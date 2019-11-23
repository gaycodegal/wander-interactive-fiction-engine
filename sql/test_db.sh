#!/bin/bash

rm test.db
touch test.db
sqlite3 test.db <<EOF
.read ./up.sql
EOF
