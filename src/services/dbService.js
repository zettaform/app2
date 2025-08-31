// Helper function to read from localStorage
const readStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error);
    return defaultValue;
  }
};

// Helper function to write to localStorage
const writeStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage key ${key}:`, error);
    return false;
  }
};

// User related operations
const userDb = {
  // Get all users
  getAll() {
    return readStorage('users', []);
  },

  // Find user by ID
  findById(id) {
    const users = this.getAll();
    return users.find(user => user.id === id) || null;
  },

  // Find user by email
  findByEmail(email) {
    const users = this.getAll();
    return users.find(user => user.email === email) || null;
  },

  // Create a new user
  create(userData) {
    const users = this.getAll();
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    writeStorage('users', users);
    return newUser;
  },

  // Update a user
  update(id, updates) {
    const users = this.getAll();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    users[userIndex] = updatedUser;
    writeStorage('users', users);
    return updatedUser;
  },

  // Delete a user
  delete(id) {
    const users = this.getAll();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    users.splice(userIndex, 1);
    writeStorage('users', users);
    return true;
  },

  // Update user's onboarding status
  updateOnboarding(userId, onboardingData) {
    const users = this.getAll();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...users[userIndex],
      onboarding: {
        ...users[userIndex].onboarding,
        ...onboardingData
      },
      updatedAt: new Date().toISOString()
    };
    
    users[userIndex] = updatedUser;
    writeStorage('users', users);
    return updatedUser;
  },

  // Complete user's onboarding
  completeOnboarding(userId) {
    return this.updateOnboarding(userId, {
      complete: true,
      completedAt: new Date().toISOString()
    });
  }
};

export { userDb };
