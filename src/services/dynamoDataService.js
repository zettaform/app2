import { API_CONFIG, buildApiUrl, ENDPOINTS } from '../config/api-config.js';

// ========================================
// DYNAMODB DATA SERVICE
// ========================================
// Service for interacting with DynamoDB through the backend API

class DynamoDataService {
  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
    this.headers = API_CONFIG.headers;
    this.environment = process.env.REACT_APP_ENVIRONMENT || 'dev';
  }

  // Helper method for API calls with error handling
  async makeApiCall(endpoint, options = {}) {
    try {
      const url = buildApiUrl(endpoint);
      const response = await fetch(url, {
        headers: this.headers,
        timeout: this.timeout,
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`DynamoDB API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all DynamoDB tables with details
  async getTables() {
    try {
      const result = await this.makeApiCall(ENDPOINTS.tables);
      return result;
    } catch (error) {
      console.error('Failed to get tables:', error);
      return { success: false, error: error.message, tables: [] };
    }
  }

  // Scan a specific table with pagination
  async scanTable(tableName, options = {}) {
    try {
      const {
        limit = 50,
        lastEvaluatedKey = null,
        filterExpression = null,
        expressionAttributeValues = null
      } = options;

      let params = new URLSearchParams({
        limit: limit.toString()
      });

      if (lastEvaluatedKey) {
        params.append('lastEvaluatedKey', encodeURIComponent(JSON.stringify(lastEvaluatedKey)));
      }

      if (filterExpression) {
        params.append('filterExpression', filterExpression);
      }

      if (expressionAttributeValues) {
        params.append('expressionAttributeValues', JSON.stringify(expressionAttributeValues));
      }

      const endpoint = `${ENDPOINTS.tableScan.replace(':tableName', tableName)}?${params}`;
      const result = await this.makeApiCall(endpoint);
      return result;
    } catch (error) {
      console.error(`Failed to scan table ${tableName}:`, error);
      return { success: false, error: error.message, items: [] };
    }
  }

  // Get table statistics
  async getTableStats(tableName) {
    try {
      const tables = await this.getTables();
      if (tables.success && tables.tables) {
        const table = tables.tables.find(t => t.name === tableName);
        return table || null;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get table stats for ${tableName}:`, error);
      return null;
    }
  }

  // Get table item count
  async getTableItemCount(tableName) {
    try {
      const stats = await this.getTableStats(tableName);
      return stats ? stats.itemCount || 0 : 0;
    } catch (error) {
      console.error(`Failed to get item count for ${tableName}:`, error);
      return 0;
    }
  }

  // Get table size in bytes
  async getTableSize(tableName) {
    try {
      const stats = await this.getTableStats(tableName);
      return stats ? stats.sizeBytes || 0 : 0;
    } catch (error) {
      console.error(`Failed to get size for ${tableName}:`, error);
      return 0;
    }
  }

  // Search items in a table
  async searchTable(tableName, searchTerm, options = {}) {
    try {
      const {
        limit = 50,
        lastEvaluatedKey = null
      } = options;

      // This would need a search endpoint in your backend
      // For now, we'll use the scan endpoint with basic filtering
      const result = await this.scanTable(tableName, {
        limit,
        lastEvaluatedKey,
        filterExpression: 'contains(#searchField, :searchTerm)',
        expressionAttributeValues: {
          '#searchField': 'email', // Default search field
          ':searchTerm': searchTerm
        }
      });

      return result;
    } catch (error) {
      console.error(`Failed to search table ${tableName}:`, error);
      return { success: false, error: error.message, items: [] };
    }
  }

  // Get table schema
  async getTableSchema(tableName) {
    try {
      const stats = await this.getTableStats(tableName);
      if (stats) {
        return {
          keySchema: stats.keySchema || [],
          attributes: stats.attributes || [],
          indexes: stats.indexes || []
        };
      }
      return null;
    } catch (error) {
      console.error(`Failed to get schema for ${tableName}:`, error);
      return null;
    }
  }

  // Get table indexes
  async getTableIndexes(tableName) {
    try {
      const schema = await this.getTableSchema(tableName);
      return schema ? schema.indexes || [] : [];
    } catch (error) {
      console.error(`Failed to get indexes for ${tableName}:`, error);
      return [];
    }
  }

  // Check if table exists
  async tableExists(tableName) {
    try {
      const stats = await this.getTableStats(tableName);
      return !!stats;
    } catch (error) {
      console.error(`Failed to check if table ${tableName} exists:`, error);
      return false;
    }
  }

  // Get environment information
  getEnvironment() {
    return this.environment;
  }

  // Get all table names
  async getAllTableNames() {
    try {
      const tables = await this.getTables();
      if (tables.success && tables.tables) {
        return tables.tables.map(t => t.name);
      }
      return [];
    } catch (error) {
      console.error('Failed to get table names:', error);
      return [];
    }
  }

  // Get tables by status
  async getTablesByStatus(status = 'ACTIVE') {
    try {
      const tables = await this.getTables();
      if (tables.success && tables.tables) {
        return tables.tables.filter(t => t.status === status);
      }
      return [];
    } catch (error) {
      console.error(`Failed to get tables with status ${status}:`, error);
      return [];
    }
  }
}

// Export singleton instance
const dynamoDataService = new DynamoDataService();
export default dynamoDataService;
