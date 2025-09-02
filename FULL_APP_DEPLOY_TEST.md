# Full App Deploy Test - Complete Application with Login

This file triggers the deployment of the FULL application with complete login functionality.

## Full Application Features:

1. **Complete Express Server** - Full-featured Express.js application
2. **Login Functionality** - POST /api/login endpoint with JWT authentication
3. **Registration** - POST /api/register endpoint for new users
4. **Protected Routes** - GET /api/profile with token verification
5. **Test Endpoints** - GET /api/test-login for testing login functionality
6. **Health Checks** - GET /health endpoint for monitoring
7. **Security** - Helmet, CORS, rate limiting
8. **AWS Integration** - DynamoDB configuration
9. **JWT Authentication** - Secure token-based authentication
10. **Password Hashing** - bcrypt for secure password storage

## Test Credentials:

- **Email**: test@example.com
- **Password**: password123

## API Endpoints:

- **Main**: http://52.70.4.30:3001/
- **Health**: http://52.70.4.30:3001/health
- **Test Login**: http://52.70.4.30:3001/api/test-login
- **Login**: POST http://52.70.4.30:3001/api/login
- **Register**: POST http://52.70.4.30:3001/api/register
- **Profile**: GET http://52.70.4.30:3001/api/profile

## Expected Results:

- ✅ Full application running on port 3001
- ✅ Login functionality working
- ✅ JWT authentication working
- ✅ All API endpoints responding
- ✅ Health checks passing

This deployment will get the COMPLETE application with login functionality running!

Timestamp: $(date)