// DynamoDB Service for React App
// This service connects to AWS DynamoDB and fetches customer data
// All data operations use DynamoDB, no localStorage dependency

import awsDynamoService from './awsDynamoService.js';

class DynamoDBService {
  constructor() {
    this.customers = [];
    this.isConnected = false;
  }

  // Fetch customers from DynamoDB
  async fetchCustomers() {
    try {
      console.log('Fetching customers from DynamoDB...');
      
      const result = await awsDynamoService.listCustomers(100);
      
      if (result.success) {
        this.customers = this.transformCustomers(result.customers);
        this.isConnected = true;
        console.log('Transformed customers:', this.customers);
        return this.customers;
      } else {
        console.error('DynamoDB Error:', result.error);
        this.isConnected = false;
        return [];
      }
    } catch (error) {
      console.error('Connection Error:', error);
      this.isConnected = false;
      return [];
    }
  }

  // Transform DynamoDB data to match React table format
  // Normalize possible attribute names so UI always receives the expected shape
  transformCustomers(dynamoCustomers) {
    return dynamoCustomers.map((raw, index) => {
      // Handle different casing / naming variants
      const getAttr = (...alts) => alts.find((a) => raw[a] !== undefined);

      const customerId = getAttr('customer_id', 'CustomerID', 'id', 'customerId') || index.toString();
      const firstName = getAttr('first_name', 'FirstName', 'firstname', 'firstName') || 'Unknown';
      const lastName = getAttr('last_name', 'LastName', 'lastname', 'lastName') || 'User';
      const email = getAttr('email', 'Email', 'eMail') || 'no-email@example.com';
      const address = getAttr('address', 'Address');
      const status = getAttr('status', 'Status') || 'active';
      const tier = getAttr('subscription_tier', 'SubscriptionTier', 'tier') || 'basic';
      const createdAt = getAttr('created_at', 'CreatedAt', 'created') || null;
      const phone = getAttr('phone', 'Phone', 'phone_number');

      return {
        id: customerId,
        image: this.getRandomAvatar(index),
        name: `${firstName} ${lastName}`.trim(),
        email,
        location: this.formatLocation(address),
        orders: '0',
        lastOrder: '#000000',
        spent: '$0.00',
        refunds: '0',
        fav: false,
        status,
        subscription_tier: tier,
        created_at: createdAt,
        phone,
        onboardingCompleted: true,
      };
    });
  }

  // Format address for location display
  formatLocation(address) {
    if (!address) return '🌍 Unknown';
    
    const countryFlags = {
      'USA': '🇺🇸',
      'UK': '🇬🇧',
      'CA': '🇨🇦',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'JP': '🇯🇵',
      'CN': '🇨🇳',
      'AU': '🇦🇺'
    };

    const flag = countryFlags[address.country] || '🌍';
    const city = address.city || 'Unknown City';
    const state = address.state || address.country || 'Unknown';
    
    return `${flag} ${city}, ${state}`;
  }

  // Get S3 avatar for customer
  getRandomAvatar(index) {
    const s3AvatarUrls = [
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-01.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-02.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-03.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-04.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-05.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-06.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-07.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-08.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-09.jpg",
      "https://customer-avatars-dbz-1755859767.s3.amazonaws.com/avatars/dbz-avatar-10.jpg"
    ];
    return s3AvatarUrls[index % s3AvatarUrls.length];
  }

  // Add new customer to DynamoDB
  async addCustomer(customerData) {
    try {
      const result = await awsDynamoService.createCustomer(customerData);
      
      if (result.success) {
        return await this.fetchCustomers(); // Refresh data
      }
      return false;
    } catch (error) {
      console.error('Error adding customer:', error);
      return false;
    }
  }

  // Update customer in DynamoDB
  async updateCustomer(customerId, updates) {
    try {
      const result = await awsDynamoService.updateCustomer(customerId, updates);
      
      if (result.success) {
        return await this.fetchCustomers(); // Refresh data
      }
      return false;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  }

  // Delete customer from DynamoDB
  async deleteCustomer(customerId) {
    try {
      const result = await awsDynamoService.deleteCustomer(customerId);
      
      if (result.success) {
        return await this.fetchCustomers(); // Refresh data
      }
      return false;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      customerCount: this.customers.length,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export default new DynamoDBService();
