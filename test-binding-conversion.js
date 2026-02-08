/**
 * Test script to verify binding path conversion functionality
 * This script tests the getValue function logic that resolves binding paths to JSON values
 */

// Replicate the getValue function from Canvas.tsx
function getValue(obj, path, defaultValue) {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === undefined || result === null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}

// Replicate the extractBinding function from Canvas.tsx
function extractBinding(value) {
  if (value.startsWith('{') && value.endsWith('}') && value.length > 2) {
    const binding = value.slice(1, -1).trim();
    return binding.length > 0 ? binding : null;
  }
  return null;
}

// Test data - sample invoice data
const sampleData = {
  invoiceNumber: "INV-2024-001",
  date: "2024-01-15",
  customer: {
    name: "John Doe",
    email: "john@example.com",
    address: {
      street: "123 Main St",
      city: "New York",
      zip: "10001"
    }
  },
  items: [
    { description: "Product A", quantity: 2, price: 50.00 },
    { description: "Product B", quantity: 1, price: 75.00 }
  ],
  subtotal: 175.00,
  tax: 17.50,
  total: 192.50,
  status: "PAID"
};

// Test cases
const tests = [
  // Test single-level paths
  { 
    name: "Single-level path",
    binding: "invoiceNumber",
    expected: "INV-2024-001"
  },
  { 
    name: "Single-level path (date)",
    binding: "date",
    expected: "2024-01-15"
  },
  
  // Test nested paths
  { 
    name: "Nested path (2 levels)",
    binding: "customer.name",
    expected: "John Doe"
  },
  { 
    name: "Nested path (3 levels)",
    binding: "customer.address.street",
    expected: "123 Main St"
  },
  { 
    name: "Nested path (city)",
    binding: "customer.address.city",
    expected: "New York"
  },
  
  // Test numeric values
  { 
    name: "Numeric value (subtotal)",
    binding: "subtotal",
    expected: 175.00
  },
  { 
    name: "Numeric value (tax)",
    binding: "tax",
    expected: 17.50
  },
  
  // Test edge cases
  { 
    name: "Non-existent path",
    binding: "nonexistent.path",
    expected: undefined
  },
  { 
    name: "Non-existent nested path",
    binding: "customer.nonexistent.field",
    expected: undefined
  },
  { 
    name: "Empty binding",
    binding: "",
    expected: undefined // Empty path returns undefined as split('') creates array with one empty string
  }
];

// Test extractBinding function
const extractBindingTests = [
  { 
    name: "Single braces with path",
    value: "{customer.name}",
    expected: "customer.name"
  },
  { 
    name: "Single braces with simple value",
    value: "{total}",
    expected: "total"
  },
  { 
    name: "Empty braces",
    value: "{}",
    expected: null
  },
  { 
    name: "Braces with spaces",
    value: "{  customer.name  }",
    expected: "customer.name"
  },
  { 
    name: "No braces",
    value: "customer.name",
    expected: null
  },
  { 
    name: "Only opening brace",
    value: "{customer.name",
    expected: null
  }
];

// Test double braces replacement (as used in text elements)
const doubleBindingTests = [
  {
    name: "Single binding in text",
    content: "Invoice Number: {{invoiceNumber}}",
    expected: "Invoice Number: INV-2024-001"
  },
  {
    name: "Multiple bindings in text",
    content: "Customer: {{customer.name}} - {{customer.email}}",
    expected: "Customer: John Doe - john@example.com"
  },
  {
    name: "Nested binding in text",
    content: "Address: {{customer.address.street}}, {{customer.address.city}}",
    expected: "Address: 123 Main St, New York"
  },
  {
    name: "Non-existent binding in text",
    content: "Value: {{nonexistent.field}}",
    expected: "Value: {{nonexistent.field}}"
  }
];

// Run getValue tests
console.log("=== Testing getValue Function ===\n");
let passedTests = 0;
let failedTests = 0;

tests.forEach(test => {
  const result = getValue(sampleData, test.binding, undefined);
  const passed = result === test.expected;
  
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${test.name}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result}`);
  }
});

// Run extractBinding tests
console.log("\n=== Testing extractBinding Function ===\n");

extractBindingTests.forEach(test => {
  const result = extractBinding(test.value);
  const passed = result === test.expected;
  
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${test.name}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result}`);
  }
});

// Test double braces replacement pattern (as used in Canvas.tsx line 1958)
console.log("\n=== Testing Double Braces {{binding}} Replacement ===\n");

doubleBindingTests.forEach(test => {
  const result = test.content.replace(/\{\{([^}]+)\}\}/g, (match, binding) => {
    return getValue(sampleData, binding.trim(), match);
  });
  const passed = result === test.expected;
  
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${test.name}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result}`);
  }
});

// Summary
console.log("\n=== Test Summary ===");
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests === 0) {
  console.log("\n✅ All tests passed! Binding path conversion is working correctly.");
  process.exit(0);
} else {
  console.log("\n❌ Some tests failed. Please review the failures above.");
  process.exit(1);
}
