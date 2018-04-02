#!/bin/bash
# Starting with a sleep so we can wait for rabbitmq to stand up.
sleep 3
node /app/dist/src/index.js