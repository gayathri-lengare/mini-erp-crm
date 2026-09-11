import { createApp } from '../app.js';
import { runSeed } from './seed.js';
import { pool } from '../config/db.js';
import { Server } from 'http';

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: Server;

async function request(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; ok: boolean; data: any }> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data: any = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    throw new Error(`Assertion failure: ${message}`);
  }
  console.log(`PASSED: ${message}`);
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log(' STARTING 18-STEP AUTOMATED INTEGRATION & VERIFICATION TEST');
  console.log('===============================================================');

  // 0. Clean & seed database
  await runSeed();

  // Start temporary test server
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => resolve());
  });

  try {
    // -------------------------------------------------------------
    // Step 1: Login as Sales
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Login as Sales ---');
    const salesLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'sales@example.com', password: 'password123' }),
    });
    assert(salesLogin.status === 200, 'Sales login returned 200');
    assert(salesLogin.data.success === true, 'Sales login success flag is true');
    assert(salesLogin.data.data.user.role === 'SALES', 'User role is SALES');
    const salesToken = salesLogin.data.data.token;
    assert(!!salesToken, 'Sales received valid JWT token');

    const salesHeaders = { Authorization: `Bearer ${salesToken}` };

    // -------------------------------------------------------------
    // Step 2: Create customer
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Create customer ---');
    const newCustomerPayload = {
      customer_name: 'Metro Wholesale Mart',
      mobile: '9876501234',
      email: 'contact@metrowholesale.in',
      business_name: 'Metro Wholesale Pvt Ltd',
      gst_number: '29ABCDE1234F1Z5',
      customer_type: 'Wholesale',
      address: '100 Ring Road, Bangalore',
      status: 'Active',
      notes: 'Initial walk-in enquiry for electronics supply.',
    };
    const createCustRes = await request('/customers', {
      method: 'POST',
      headers: salesHeaders,
      body: JSON.stringify(newCustomerPayload),
    });
    assert(createCustRes.status === 201, 'Customer creation returned 201');
    const createdCustomerId = createCustRes.data.data.id;
    assert(createdCustomerId > 0, `Customer created with ID ${createdCustomerId}`);

    // -------------------------------------------------------------
    // Step 3: View customer
    // -------------------------------------------------------------
    console.log('\n--- Step 3: View customer ---');
    const viewCustRes = await request(`/customers/${createdCustomerId}`, {
      headers: salesHeaders,
    });
    assert(viewCustRes.status === 200, 'View customer returned 200');
    assert(
      viewCustRes.data.data.customer_name === 'Metro Wholesale Mart',
      'Customer name matches'
    );
    assert(viewCustRes.data.data.mobile === '9876501234', 'Customer mobile matches');

    // -------------------------------------------------------------
    // Step 4: Add follow-up note
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Add follow-up note ---');
    const followUpRes = await request(`/customers/${createdCustomerId}/follow-ups`, {
      method: 'POST',
      headers: salesHeaders,
      body: JSON.stringify({
        note: 'Spoke with purchasing head. Sending price catalog.',
        follow_up_date: '2026-09-18',
      }),
    });
    assert(followUpRes.status === 201, 'Follow-up created returned 201');
    assert(followUpRes.data.data.customer_id === createdCustomerId, 'Follow-up customer ID matches');

    // Verify follow-up in customer follow-up history
    const getFollowUpsRes = await request(`/customers/${createdCustomerId}/follow-ups`, {
      headers: salesHeaders,
    });
    assert(getFollowUpsRes.status === 200, 'Follow-up history retrieved');
    assert(getFollowUpsRes.data.data.length === 1, 'Customer has exactly 1 follow-up recorded');

    // -------------------------------------------------------------
    // Step 5: Login as Admin
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Login as Admin ---');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
    });
    assert(adminLogin.status === 200, 'Admin login returned 200');
    assert(adminLogin.data.data.user.role === 'ADMIN', 'Admin role confirmed');
    const adminToken = adminLogin.data.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // -------------------------------------------------------------
    // Step 6: Create product with stock = 10
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Create product with stock = 10 ---');
    const productPayload = {
      product_name: 'Premium Wireless Headset',
      sku: 'AUD-WHS-010',
      category: 'Electronics',
      unit_price: 2500.0,
      current_stock: 10,
      minimum_stock: 3,
      warehouse_location: 'Bay C-104',
    };
    const createProdRes = await request('/products', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(productPayload),
    });
    assert(createProdRes.status === 201, 'Product created returned 201');
    const createdProductId = createProdRes.data.data.id;
    assert(createProdRes.data.data.current_stock === 10, 'Initial product stock is 10');

    // -------------------------------------------------------------
    // Step 7: Login as Sales
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Confirm Sales active session ---');
    assert(!!salesToken, 'Sales token ready');

    // -------------------------------------------------------------
    // Step 8 & 9: Create challan for quantity = 4, Save as Draft
    // -------------------------------------------------------------
    console.log('\n--- Step 8 & 9: Create challan for quantity = 4 (Draft) ---');
    const draftChallanPayload = {
      customer_id: createdCustomerId,
      status: 'DRAFT',
      items: [
        {
          product_id: createdProductId,
          quantity: 4,
        },
      ],
    };
    const draftChallanRes = await request('/challans', {
      method: 'POST',
      headers: salesHeaders,
      body: JSON.stringify(draftChallanPayload),
    });
    assert(draftChallanRes.status === 201, 'Draft challan created returned 201');
    assert(draftChallanRes.data.data.status === 'DRAFT', 'Challan status is DRAFT');
    const challan1Id = draftChallanRes.data.data.id;

    // Verify product snapshot was stored
    const challan1Items = draftChallanRes.data.data.items;
    assert(challan1Items.length === 1, 'Challan has 1 item');
    assert(
      challan1Items[0].product_name_snapshot === 'Premium Wireless Headset',
      'Product snapshot stored name correctly'
    );
    assert(
      challan1Items[0].sku_snapshot === 'AUD-WHS-010',
      'Product snapshot stored SKU correctly'
    );
    assert(
      Number(challan1Items[0].unit_price_snapshot) === 2500,
      'Product snapshot stored unit price correctly'
    );

    // -------------------------------------------------------------
    // Step 10: Verify stock remains 10 (Draft does NOT deduct)
    // -------------------------------------------------------------
    console.log('\n--- Step 10: Verify stock remains 10 ---');
    const checkStock1Res = await request(`/products/${createdProductId}`, {
      headers: salesHeaders,
    });
    assert(
      checkStock1Res.data.data.current_stock === 10,
      'Stock is still 10 after saving Draft challan'
    );

    // -------------------------------------------------------------
    // Step 11: Confirm challan
    // -------------------------------------------------------------
    console.log('\n--- Step 11: Confirm challan ---');
    const confirmRes = await request(`/challans/${challan1Id}/confirm`, {
      method: 'PUT',
      headers: salesHeaders,
    });
    assert(confirmRes.status === 200, 'Confirm challan returned 200');
    assert(confirmRes.data.data.status === 'CONFIRMED', 'Challan status is now CONFIRMED');

    // Verify cannot re-confirm already confirmed challan
    const reconfirmRes = await request(`/challans/${challan1Id}/confirm`, {
      method: 'PUT',
      headers: salesHeaders,
    });
    assert(reconfirmRes.status === 400, 'Re-confirming already confirmed challan returned 400');

    // -------------------------------------------------------------
    // Step 12: Verify stock becomes 6
    // -------------------------------------------------------------
    console.log('\n--- Step 12: Verify stock becomes 6 ---');
    const checkStock2Res = await request(`/products/${createdProductId}`, {
      headers: salesHeaders,
    });
    assert(
      checkStock2Res.data.data.current_stock === 6,
      'Stock became exactly 6 (10 - 4 = 6)'
    );

    // -------------------------------------------------------------
    // Step 13: Verify OUT stock movement exists
    // -------------------------------------------------------------
    console.log('\n--- Step 13: Verify OUT stock movement exists ---');
    const movementsRes = await request(
      `/stock-movements?product_id=${createdProductId}&movement_type=OUT`,
      {
        headers: adminHeaders,
      }
    );
    assert(movementsRes.status === 200, 'Stock movements retrieved');
    const outMovements = movementsRes.data.data.items;
    assert(outMovements.length >= 1, 'Found OUT stock movement');
    assert(
      outMovements[0].quantity_changed === 4,
      'OUT stock movement has quantity_changed = 4'
    );
    assert(outMovements[0].movement_type === 'OUT', 'Movement type is OUT');

    // -------------------------------------------------------------
    // Step 14: Create another challan for quantity = 10
    // -------------------------------------------------------------
    console.log('\n--- Step 14: Create another challan for quantity = 10 ---');
    const challan2Payload = {
      customer_id: createdCustomerId,
      status: 'DRAFT',
      items: [
        {
          product_id: createdProductId,
          quantity: 10,
        },
      ],
    };
    const challan2Res = await request('/challans', {
      method: 'POST',
      headers: salesHeaders,
      body: JSON.stringify(challan2Payload),
    });
    assert(challan2Res.status === 201, 'Second draft challan created');
    const challan2Id = challan2Res.data.data.id;

    // -------------------------------------------------------------
    // Step 15 & 16: Try to confirm it -> API must reject with 400
    // -------------------------------------------------------------
    console.log('\n--- Step 15 & 16: Try to confirm with insufficient stock ---');
    const rejectRes = await request(`/challans/${challan2Id}/confirm`, {
      method: 'PUT',
      headers: salesHeaders,
    });
    assert(rejectRes.status === 400, 'API correctly rejected confirmation with 400');
    assert(rejectRes.data.success === false, 'success flag is false');
    console.log('Error Message received:', rejectRes.data.message);
    assert(
      rejectRes.data.message.includes('Insufficient stock') &&
        rejectRes.data.message.includes('Available: 6') &&
        rejectRes.data.message.includes('Requested: 10'),
      'Meaningful error message detailing available vs requested quantity'
    );

    // -------------------------------------------------------------
    // Step 17: Verify stock remains 6
    // -------------------------------------------------------------
    console.log('\n--- Step 17: Verify stock remains 6 ---');
    const checkStock3Res = await request(`/products/${createdProductId}`, {
      headers: salesHeaders,
    });
    assert(
      checkStock3Res.data.data.current_stock === 6,
      'Stock safely remained 6 (no negative or partial decrement)'
    );

    // -------------------------------------------------------------
    // Step 18: Verify no partial stock movement was created
    // -------------------------------------------------------------
    console.log('\n--- Step 18: Verify no partial stock movement was created ---');
    const movementsAfterReject = await request(
      `/stock-movements?product_id=${createdProductId}&movement_type=OUT`,
      {
        headers: adminHeaders,
      }
    );
    assert(
      movementsAfterReject.data.data.items.length === 1,
      'Exactly 1 OUT movement exists (no spurious movement added by rejected transaction)'
    );

    // -------------------------------------------------------------
    // Extra Verification: Negative & Role Boundary Tests
    // -------------------------------------------------------------
    console.log('\n--- Extra: Negative & RBAC Boundary Tests ---');

    // 1. Invalid login
    const badLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@example.com', password: 'wrongpassword' }),
    });
    assert(badLogin.status === 401, 'Invalid password returns 401');

    // 2. Unauthorized role: Sales trying to create a product (Only ADMIN / WAREHOUSE allowed)
    const unauthorizedProd = await request('/products', {
      method: 'POST',
      headers: salesHeaders,
      body: JSON.stringify({
        product_name: 'Illegal Product',
        sku: 'ILL-001',
        category: 'Test',
        unit_price: 100,
      }),
    });
    assert(unauthorizedProd.status === 403, 'Sales blocked from creating product with 403');

    // 3. Duplicate SKU
    const dupSkuRes = await request('/products', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(productPayload), // Same SKU: AUD-WHS-010
    });
    assert(dupSkuRes.status === 409, 'Duplicate SKU rejected with 409 Conflict');

    // 4. Missing required field on customer
    const badCust = await request('/customers', {
      method: 'POST',
      headers: salesHeaders,
      body: JSON.stringify({ customer_name: 'No Mobile Store' }),
    });
    assert(badCust.status === 400, 'Missing mobile rejected with 400');

    // 5. Search & Pagination on Customers
    const searchCust = await request('/customers?search=Metro&page=1&limit=5', {
      headers: salesHeaders,
    });
    assert(searchCust.status === 200, 'Customer search returned 200');
    assert(searchCust.data.data.items.length >= 1, 'Search found created customer');
    assert(searchCust.data.data.pagination.page === 1, 'Pagination page is 1');

    console.log('\n===============================================================');
    console.log(' ALL 18 VERIFICATION STEPS & BOUNDARY TESTS PASSED PERFECTLY!');
    console.log('===============================================================');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await pool.end();
  }
}

runTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
