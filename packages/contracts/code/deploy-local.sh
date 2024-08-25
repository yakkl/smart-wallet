#!/bin/zsh

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if FORK_RPC_URL is set
if [ -z "$FORK_RPC_URL" ]; then
  echo "FORK_RPC_URL is not set. Please check your .env file."
  exit 1
fi

# Define the state file and initialization file
STATE_FILE="./anvil-state"
INIT_FILE="./anvil-initialized"

# Check if the initialization file exists
if [ -f "$INIT_FILE" ]; then
    echo "Found '$INIT_FILE'. Loading existing Anvil state..."
    anvil --fork-url $FORK_RPC_URL --tracing --dump-state $STATE_FILE --load-state $STATE_FILE
else
    echo "Initializing Anvil for the first time..."
    anvil --fork-url $FORK_RPC_URL --tracing --dump-state $STATE_FILE
    
    # Create the initialization file with the warning message
    echo "Don't remove this file or your anvil fork will be reset to the original state the next time you run deploy-local.sh." > $INIT_FILE
fi

# May have to do the following to reach into anvil and get the state file
# curl -X POST --data '{"jsonrpc":"2.0","method":"anvil_dumpState","params":["./anvil_state.json"],"id":1}' -H "Content-Type: application/json" http://localhost:8545
