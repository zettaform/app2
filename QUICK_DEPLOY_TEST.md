# Quick Deploy Test

This file triggers a quick deployment test to verify basic functionality.

## What this test does:

1. **Tests SSH Connection** - Verifies connectivity to EC2
2. **Creates Simple Test App** - Deploys a minimal Express.js application
3. **Installs Dependencies** - Ensures Node.js and npm work
4. **Starts Application** - Runs the test app on port 3001
5. **Verifies Functionality** - Tests local connectivity

## Expected Results:

- ✅ SSH connection successful
- ✅ Test application deployed
- ✅ Node.js and dependencies installed
- ✅ Application running on port 3001
- ✅ Health check endpoint working

This is a minimal test to verify the basic deployment process works before attempting the full application deployment.

Timestamp: $(date)