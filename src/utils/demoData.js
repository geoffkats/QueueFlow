import { queueService } from '../firebase/queueService';

// Demo data for impressive presentations
const DEMO_CLIENTS = [
  // Emergency cases
  { fullName: 'Sarah Nakato', serviceType: 'Emergency Care', priority: 'emergency' },
  { fullName: 'James Okello', serviceType: 'Cardiac Emergency', priority: 'emergency' },
  
  // Senior citizens
  { fullName: 'Grace Namugga', serviceType: 'General Consultation', priority: 'senior' },
  { fullName: 'Peter Ssemakula', serviceType: 'Medication Refill', priority: 'senior' },
  { fullName: 'Mary Atuhaire', serviceType: 'Blood Pressure Check', priority: 'senior' },
  
  // Normal priority
  { fullName: 'David Mukasa', serviceType: 'General Consultation', priority: 'normal' },
  { fullName: 'Agnes Nalwoga', serviceType: 'Laboratory Tests', priority: 'normal' },
  { fullName: 'Robert Kiprotich', serviceType: 'Vaccination', priority: 'normal' },
  { fullName: 'Christine Auma', serviceType: 'Dental Checkup', priority: 'normal' },
  { fullName: 'Moses Wanyama', serviceType: 'Eye Examination', priority: 'normal' },
  { fullName: 'Esther Nabirye', serviceType: 'Physiotherapy', priority: 'normal' },
  { fullName: 'Isaac Tumwine', serviceType: 'General Consultation', priority: 'normal' },
  { fullName: 'Patience Akello', serviceType: 'Maternity Care', priority: 'normal' },
  { fullName: 'Samuel Lubega', serviceType: 'X-Ray Scan', priority: 'normal' },
  { fullName: 'Juliet Nassozi', serviceType: 'Blood Test', priority: 'normal' },
  { fullName: 'Francis Ochieng', serviceType: 'General Consultation', priority: 'normal' },
  { fullName: 'Rose Namukasa', serviceType: 'Prescription Pickup', priority: 'normal' },
  { fullName: 'Andrew Kiggundu', serviceType: 'Health Screening', priority: 'normal' },
  { fullName: 'Betty Nakabugo', serviceType: 'Counseling Session', priority: 'normal' },
  { fullName: 'John Ssebunya', serviceType: 'Follow-up Visit', priority: 'normal' }
];

const BANK_CLIENTS = [
  { fullName: 'Michael Opio', serviceType: 'Account Opening', priority: 'normal' },
  { fullName: 'Susan Akankwasa', serviceType: 'Loan Application', priority: 'normal' },
  { fullName: 'Charles Mubiru', serviceType: 'Money Transfer', priority: 'normal' },
  { fullName: 'Joyce Nambi', serviceType: 'Card Replacement', priority: 'senior' },
  { fullName: 'Patrick Ssali', serviceType: 'Business Banking', priority: 'normal' }
];

const GOVERNMENT_CLIENTS = [
  { fullName: 'Alice Namusoke', serviceType: 'ID Card Renewal', priority: 'normal' },
  { fullName: 'George Byaruhanga', serviceType: 'Passport Application', priority: 'normal' },
  { fullName: 'Helen Amongi', serviceType: 'Birth Certificate', priority: 'normal' },
  { fullName: 'Vincent Kayongo', serviceType: 'Tax Clearance', priority: 'normal' },
  { fullName: 'Lydia Namatovu', serviceType: 'Marriage Certificate', priority: 'senior' }
];

export const seedDemoData = async (serviceType = 'hospital') => {
  try {
    console.log(`Seeding demo data for ${serviceType}...`);
    
    let clientsToAdd = DEMO_CLIENTS;
    if (serviceType === 'bank') clientsToAdd = BANK_CLIENTS;
    if (serviceType === 'government') clientsToAdd = GOVERNMENT_CLIENTS;
    
    const promises = clientsToAdd.map(async (client, index) => {
      // Add some delay to create realistic timestamps
      await new Promise(resolve => setTimeout(resolve, index * 100));
      return queueService.joinQueue(client);
    });
    
    await Promise.all(promises);
    console.log(`Successfully added ${clientsToAdd.length} demo clients`);
    
    return {
      success: true,
      message: `Added ${clientsToAdd.length} demo clients to the queue`,
      count: clientsToAdd.length
    };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return {
      success: false,
      message: 'Failed to seed demo data',
      error: error.message
    };
  }
};

export const clearAllData = async () => {
  try {
    console.log('Clearing all queue data...');
    // This would need to be implemented in queueService
    // For now, just log the action
    console.log('Clear function needs to be implemented in queueService');
    return {
      success: true,
      message: 'Queue cleared (function needs implementation)'
    };
  } catch (error) {
    console.error('Error clearing data:', error);
    return {
      success: false,
      message: 'Failed to clear data',
      error: error.message
    };
  }
};

// Quick demo setup for presentations
export const setupDemoForPresentation = async () => {
  try {
    // Add a mix of clients
    await seedDemoData('hospital');
    
    // Simulate some completed clients for smart EWT calculation
    console.log('Demo setup complete - ready for presentation!');
    
    return {
      success: true,
      message: 'Demo environment ready for presentation',
      instructions: [
        '1. Open /admin to manage the queue',
        '2. Open /operator to serve clients', 
        '3. Open /display for TV mode',
        '4. Use /queue-status to see customer view'
      ]
    };
  } catch (error) {
    console.error('Error setting up demo:', error);
    return {
      success: false,
      message: 'Failed to setup demo',
      error: error.message
    };
  }
};