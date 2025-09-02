# Force Deploy Test - NO STOPPING UNTIL RUNNING

This file triggers a force deployment that will NOT stop until the application is running.

## What this force deployment does:

1. **KILLS ALL PROCESSES** - Stops any existing Node.js/PM2 processes
2. **CLEANS EVERYTHING** - Removes all previous deployment files
3. **FORCE INSTALLS NODE.JS** - Removes and reinstalls Node.js completely
4. **FORCE INSTALLS PM2** - Removes and reinstalls PM2 completely
5. **CREATES SIMPLE APP** - Creates a minimal Express.js application
6. **CONFIGURES ENVIRONMENT** - Sets up all required environment variables
7. **INSTALLS DEPENDENCIES** - Installs Express, CORS, dotenv
8. **STARTS WITH PM2** - Launches application with PM2 process manager
9. **VERIFIES RUNNING** - Tests local and external connectivity

## Expected Results:

- ✅ All existing processes killed
- ✅ Clean environment created
- ✅ Node.js and PM2 freshly installed
- ✅ Simple application created and running
- ✅ Application accessible on port 3001
- ✅ Health check endpoint working
- ✅ API endpoints responding

## Application Endpoints:

- **Main**: http://52.70.4.30:3001/
- **Health**: http://52.70.4.30:3001/health
- **API Test**: http://52.70.4.30:3001/api/test

This force deployment will NOT stop until the application is successfully running on EC2!

Timestamp: $(date)