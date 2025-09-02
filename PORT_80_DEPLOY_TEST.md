# Port 80 Deploy Test - Try Different Ports

This file triggers a deployment that tries different ports to bypass potential security group issues.

## Port 80/8080 Deployment Process:

1. **KILL ALL PROCESSES** - Stops everything
2. **CLEAN EVERYTHING** - Removes all files
3. **INSTALL NODE.JS** - Fresh Node.js installation
4. **CREATE APP ON PORT 80** - Tries port 80 (HTTP default)
5. **CREATE APP ON PORT 8080** - Also tries port 8080
6. **START BOTH APPS** - Runs both applications
7. **TEST CONNECTIVITY** - Tests all ports

## Expected Results:

- ✅ App running on port 80
- ✅ App running on port 8080
- ✅ At least one port accessible externally
- ✅ Health checks working

## Application Endpoints:

- **Port 80**: http://52.70.4.30:80/
- **Port 8080**: http://52.70.4.30:8080/
- **Health Port 80**: http://52.70.4.30:80/health
- **Health Port 8080**: http://52.70.4.30:8080/health

This deployment tries multiple ports to identify which ones are accessible through the security group.

Timestamp: $(date)