// Mock API service for simulating backend calls
const API_BASE_URL = 'https://api.example.com'; // Simulated endpoint

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock customer data
const mockCustomers = [
  {
    id: '1',
    name: 'Patricia Semklo',
    email: 'patricia.semklo@app.com',
    location: '🇬🇧 London, UK',
    orders: 24,
    lastOrder: '#123567',
    spent: 2890.66,
    refunds: 0,
    avatar: null,
    status: 'active',
    joinDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'Dominik Lamakani',
    email: 'dominik.lamakani@gmail.com',
    location: '🇩🇪 Dortmund, DE',
    orders: 77,
    lastOrder: '#779912',
    spent: 14767.04,
    refunds: 4,
    avatar: null,
    status: 'active',
    joinDate: '2022-08-22'
  },
  {
    id: '3',
    name: 'Ivan Mesaros',
    email: 'imivanmes@gmail.com',
    location: '🇫🇷 Paris, FR',
    orders: 44,
    lastOrder: '#889924',
    spent: 4996.00,
    refunds: 1,
    avatar: null,
    status: 'active',
    joinDate: '2023-03-10'
  },
  {
    id: '4',
    name: 'Maria Martinez',
    email: 'martinezhome@gmail.com',
    location: '🇮🇹 Bologna, IT',
    orders: 29,
    lastOrder: '#897726',
    spent: 3220.66,
    refunds: 2,
    avatar: null,
    status: 'inactive',
    joinDate: '2023-05-18'
  },
  {
    id: '5',
    name: 'Vicky Jung',
    email: 'itsvicky@contact.com',
    location: '🇬🇧 London, UK',
    orders: 22,
    lastOrder: '#123567',
    spent: 2890.66,
    refunds: 0,
    avatar: null,
    status: 'active',
    joinDate: '2023-07-02'
  }
];

// Mock API functions
export const mockApi = {
  // Fetch all customers
  async getCustomers() {
    console.log('🔄 API Call: GET /customers');
    await delay(800 + Math.random() * 1200); // 800-2000ms delay
    
    // Simulate occasional API errors (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Failed to fetch customers');
    }
    
    console.log('✅ API Response: Customers fetched successfully');
    return {
      data: mockCustomers,
      total: mockCustomers.length,
      page: 1,
      limit: 10
    };
  },

  // Fetch single customer
  async getCustomer(id) {
    console.log(`🔄 API Call: GET /customers/${id}`);
    await delay(400 + Math.random() * 600); // 400-1000ms delay
    
    const customer = mockCustomers.find(c => c.id === id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    console.log('✅ API Response: Customer fetched successfully');
    return { data: customer };
  },

  // Create new customer
  async createCustomer(customerData) {
    console.log('🔄 API Call: POST /customers', customerData);
    await delay(600 + Math.random() * 800); // 600-1400ms delay
    
    const newCustomer = {
      id: String(Date.now()),
      ...customerData,
      orders: 0,
      spent: 0,
      refunds: 0,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    mockCustomers.push(newCustomer);
    console.log('✅ API Response: Customer created successfully');
    return { data: newCustomer };
  },

  // Update customer
  async updateCustomer(id, updates) {
    console.log(`🔄 API Call: PUT /customers/${id}`, updates);
    await delay(500 + Math.random() * 700); // 500-1200ms delay
    
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }
    
    mockCustomers[index] = { ...mockCustomers[index], ...updates };
    console.log('✅ API Response: Customer updated successfully');
    return { data: mockCustomers[index] };
  },

  // Delete customer
  async deleteCustomer(id) {
    console.log(`🔄 API Call: DELETE /customers/${id}`);
    await delay(400 + Math.random() * 600); // 400-1000ms delay
    
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }
    
    mockCustomers.splice(index, 1);
    console.log('✅ API Response: Customer deleted successfully');
    return { success: true };
  },

  // Search customers
  async searchCustomers(query) {
    console.log(`🔄 API Call: GET /customers/search?q=${query}`);
    await delay(300 + Math.random() * 500); // 300-800ms delay
    
    const results = mockCustomers.filter(customer => 
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.email.toLowerCase().includes(query.toLowerCase()) ||
      customer.location.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log('✅ API Response: Search completed');
    return {
      data: results,
      total: results.length,
      query
    };
  }
};

export default mockApi;
