const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Agent = require('./models/Agent');
const Feedback = require('./models/Feedback');
const Message = require('./models/Message');

// Helper to make HTTP requests
const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING COMPLAINT MANAGEMENT SYSTEM E2E TESTS ---');

  // Load .env values
  require('dotenv').config();

  // 1. Database Cleanup
  console.log('Connecting to database for cleanup...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/complaint_management');
  
  const testEmails = ['test_user@test.com', 'test_agent@test.com', 'test_admin@test.com'];
  const testUsers = await User.find({ email: { $in: testEmails } });
  const testUserIds = testUsers.map(u => u._id);

  await Complaint.deleteMany({ user: { $in: testUserIds } });
  await Agent.deleteMany({ agent: { $in: testUserIds } });
  await Feedback.deleteMany({ user: { $in: testUserIds } });
  await Message.deleteMany({ sender: { $in: testUserIds } });
  await User.deleteMany({ email: { $in: testEmails } });
  
  await mongoose.disconnect();
  console.log('Stale test data deleted. MongoDB disconnected.');

  // 2. Start server
  console.log('Starting application server...');
  const server = require('./server'); // This automatically starts server on PORT 5000
  
  // Wait 2 seconds for server and database connection
  await new Promise(r => setTimeout(r, 2000));

  let userToken = '';
  let agentToken = '';
  let adminToken = '';
  let complaintId = '';
  let agentId = '';

  const host = '127.0.0.1';
  const port = 5000;

  try {
    // 3. Register USER
    console.log('\nStep 1: Registering new Customer User...');
    const regUserRes = await makeRequest({
      host,
      port,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Test Customer',
      email: 'test_user@test.com',
      password: 'password123',
      role: 'USER'
    });
    
    if (regUserRes.status !== 201 || !regUserRes.body.success) {
      throw new Error(`Failed to register user: ${JSON.stringify(regUserRes.body)}`);
    }
    userToken = regUserRes.body.token;
    console.log('✓ Customer Registered Successfully.');

    // 4. Register AGENT
    console.log('\nStep 2: Registering new Support Agent...');
    const regAgentRes = await makeRequest({
      host,
      port,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Test Agent',
      email: 'test_agent@test.com',
      password: 'password123',
      role: 'AGENT'
    });
    
    if (regAgentRes.status !== 201 || !regAgentRes.body.success) {
      throw new Error(`Failed to register agent: ${JSON.stringify(regAgentRes.body)}`);
    }
    agentToken = regAgentRes.body.token;
    agentId = regAgentRes.body.user.id;
    console.log('✓ Support Agent Registered Successfully.');

    // 5. Register ADMIN
    console.log('\nStep 3: Registering new Admin...');
    const regAdminRes = await makeRequest({
      host,
      port,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Test Admin',
      email: 'test_admin@test.com',
      password: 'password123',
      role: 'ADMIN'
    });
    
    if (regAdminRes.status !== 201 || !regAdminRes.body.success) {
      throw new Error(`Failed to register admin: ${JSON.stringify(regAdminRes.body)}`);
    }
    adminToken = regAdminRes.body.token;
    console.log('✓ Admin Registered Successfully.');

    // 6. User submits a complaint
    console.log('\nStep 4: Submitting complaint as customer User...');
    const submitRes = await makeRequest({
      host,
      port,
      path: '/api/complaints',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    }, {
      title: 'Broadband Unstable Connection',
      category: 'Sanitation',
      description: 'The fiber connection drops packets every 5 minutes.'
    });

    if (submitRes.status !== 201 || !submitRes.body.success) {
      throw new Error(`Failed to submit complaint: ${JSON.stringify(submitRes.body)}`);
    }
    complaintId = submitRes.body.data._id;
    console.log(`✓ Complaint Submitted Successfully (ID: ${complaintId}). Status: ${submitRes.body.data.status}`);

    // 7. Admin assigns Agent to complaint
    console.log('\nStep 5: Assigning agent to complaint as Admin...');
    const assignRes = await makeRequest({
      host,
      port,
      path: `/api/complaints/${complaintId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      agentId: agentId
    });

    if (assignRes.status !== 200 || !assignRes.body.success) {
      throw new Error(`Failed to assign agent: ${JSON.stringify(assignRes.body)}`);
    }
    console.log(`✓ Agent Assigned. Ticket Status updated to: ${assignRes.body.data.status}`);
    console.log(`✓ Assigned Agent name: ${assignRes.body.data.agent.name}`);

    // 8. Agent resolves the complaint
    console.log('\nStep 6: Resolving the complaint as Agent...');
    const resolveRes = await makeRequest({
      host,
      port,
      path: `/api/complaints/${complaintId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`
      }
    }, {
      status: 'Resolved'
    });

    if (resolveRes.status !== 200 || !resolveRes.body.success) {
      throw new Error(`Failed to resolve complaint: ${JSON.stringify(resolveRes.body)}`);
    }
    console.log(`✓ Complaint Status updated by Agent to: ${resolveRes.body.data.status}`);

    // 9. User submits feedback and closes the complaint
    console.log('\nStep 7: Submitting feedback and closing complaint as User...');
    const feedbackRes = await makeRequest({
      host,
      port,
      path: '/api/feedback',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    }, {
      complaintId: complaintId,
      rating: 5,
      comments: 'Excellent and swift service! The technician resolved my issue.'
    });

    if (feedbackRes.status !== 201 || !feedbackRes.body.success) {
      throw new Error(`Failed to submit feedback: ${JSON.stringify(feedbackRes.body)}`);
    }
    console.log('✓ Feedback Submitted. Rating: 5/5 stars.');

    // Set complaint status to Closed
    const closeRes = await makeRequest({
      host,
      port,
      path: `/api/complaints/${complaintId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    }, {
      status: 'Closed'
    });

    if (closeRes.status !== 200 || !closeRes.body.success) {
      throw new Error(`Failed to close complaint: ${JSON.stringify(closeRes.body)}`);
    }
    console.log(`✓ Complaint Status set to: ${closeRes.body.data.status}`);

    // 10. Admin checks system statistics
    console.log('\nStep 8: Retrieving system stats as Admin...');
    const statsRes = await makeRequest({
      host,
      port,
      path: '/api/agents/stats',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (statsRes.status !== 200 || !statsRes.body.success) {
      throw new Error(`Failed to get stats: ${JSON.stringify(statsRes.body)}`);
    }
    console.log('✓ System Stats Retrieved successfully:');
    console.log(`  - Total tickets: ${statsRes.body.data.summary.total}`);
    console.log(`  - Closed tickets: ${statsRes.body.data.summary.closed}`);
    console.log(`  - Avg Customer Rating: ${statsRes.body.data.feedback.averageRating} stars`);

    console.log('\n==================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('==================================================');

    process.exit(0);

  } catch (err) {
    console.error('\n❌ TEST RUN ENCOUNTERED ERROR:');
    console.error(err.message);
    process.exit(1);
  }
};

runTests();
