// Simple CSV parser utility
export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      let value = values[index];
      // Convert boolean strings
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      // Convert numeric strings
      if (!isNaN(value) && value !== '') value = Number(value);
      obj[header] = value;
    });
    return obj;
  });
};

// Load users from CSV
export const loadUsersFromCSV = async () => {
  try {
    const response = await fetch('/src/data/users.csv');
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Failed to load users CSV:', error);
    return [];
  }
};
