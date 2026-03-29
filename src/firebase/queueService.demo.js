// Demo script to showcase the Mathematical Triage Algorithm
// This demonstrates the enhanced queue service capabilities

// Mock queue items for demonstration
const demoQueueItems = [
  {
    id: '1',
    name: 'John Normal',
    priority: 'normal',
    ageCategory: 'regular',
    specialNeeds: [],
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    status: 'waiting'
  },
  {
    id: '2', 
    name: 'Mary Emergency',
    priority: 'emergency',
    ageCategory: 'pregnant',
    specialNeeds: ['medical'],
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    status: 'waiting'
  },
  {
    id: '3',
    name: 'Robert Senior',
    priority: 'senior',
    ageCategory: '65+',
    specialNeeds: ['wheelchair'],
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    status: 'waiting'
  },
  {
    id: '4',
    name: 'Sarah Normal Long Wait',
    priority: 'normal',
    ageCategory: 'regular',
    specialNeeds: [],
    createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago (should get boost)
    status: 'waiting'
  },
  {
    id: '5',
    name: 'Ahmed Disabled',
    priority: 'normal',
    ageCategory: 'disabled',
    specialNeeds: ['interpreter', 'wheelchair'],
    createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
    status: 'waiting'
  }
];

// Mock the mathematical functions for demo (same as in tests)
const demoQueueService = {
  getEmergencyWeight(priority) {
    const weights = { 'emergency': 1.0, 'senior': 0.7, 'normal': 0.3 };
    return weights[priority] || weights['normal'];
  },

  getAgeWeight(ageCategory) {
    const weights = { '65+': 1.0, 'pregnant': 0.9, 'disabled': 0.8, 'regular': 0.2 };
    return weights[ageCategory] || weights['regular'];
  },

  getWaitTimeWeight(createdAt, currentTime) {
    const waitTimeMinutes = (currentTime - createdAt) / (1000 * 60);
    const waitTimeWeight = Math.floor(waitTimeMinutes / 15) * 0.1;
    return Math.min(1.0, waitTimeWeight);
  },

  getSpecialNeedsWeight(specialNeeds) {
    const weights = { 'wheelchair': 0.3, 'interpreter': 0.2, 'medical': 0.4 };
    if (!Array.isArray(specialNeeds) || specialNeeds.length === 0) return 0.0;
    
    const totalWeight = specialNeeds.reduce((sum, need) => sum + (weights[need] || 0), 0);
    return Math.min(1.0, totalWeight);
  },

  calculateAntiStarvationBoost(createdAt, currentTime) {
    const waitTimeMinutes = (currentTime - createdAt) / (1000 * 60);
    return (waitTimeMinutes / 15) * 0.1;
  },

  calculatePriorityScore(queueItem, currentTime = new Date()) {
    const emergencyWeight = this.getEmergencyWeight(queueItem.priority);
    const ageWeight = this.getAgeWeight(queueItem.ageCategory || 'regular');
    const waitTimeWeight = this.getWaitTimeWeight(queueItem.createdAt, currentTime);
    const specialNeedsWeight = this.getSpecialNeedsWeight(queueItem.specialNeeds || []);
    
    const baseScore = (emergencyWeight * 40) + (ageWeight * 30) + 
                     (waitTimeWeight * 20) + (specialNeedsWeight * 10);
    
    const antiStarvationBoost = this.calculateAntiStarvationBoost(queueItem.createdAt, currentTime);
    
    return Math.min(100, baseScore + antiStarvationBoost);
  }
};

// Demo function to show the algorithm in action
function demonstrateMathematicalTriage() {
  console.log('🏥 QUEUEFLOW MATHEMATICAL TRIAGE ALGORITHM DEMO');
  console.log('=' .repeat(60));
  
  const currentTime = new Date();
  
  console.log('\n📊 PRIORITY SCORE CALCULATIONS:');
  console.log('-'.repeat(60));
  
  demoQueueItems.forEach(item => {
    const score = demoQueueService.calculatePriorityScore(item, currentTime);
    const waitMinutes = Math.round((currentTime - item.createdAt) / (1000 * 60));
    
    console.log(`\n👤 ${item.name}`);
    console.log(`   Priority: ${item.priority.toUpperCase()}`);
    console.log(`   Age Category: ${item.ageCategory}`);
    console.log(`   Special Needs: ${item.specialNeeds.length > 0 ? item.specialNeeds.join(', ') : 'None'}`);
    console.log(`   Wait Time: ${waitMinutes} minutes`);
    console.log(`   🎯 PRIORITY SCORE: ${score.toFixed(1)}/100`);
    
    // Show calculation breakdown
    const emergencyWeight = demoQueueService.getEmergencyWeight(item.priority);
    const ageWeight = demoQueueService.getAgeWeight(item.ageCategory);
    const waitTimeWeight = demoQueueService.getWaitTimeWeight(item.createdAt, currentTime);
    const specialNeedsWeight = demoQueueService.getSpecialNeedsWeight(item.specialNeeds);
    const antiStarvationBoost = demoQueueService.calculateAntiStarvationBoost(item.createdAt, currentTime);
    
    console.log(`   📐 Formula: (${emergencyWeight} × 40) + (${ageWeight} × 30) + (${waitTimeWeight.toFixed(1)} × 20) + (${specialNeedsWeight} × 10) + ${antiStarvationBoost.toFixed(1)}`);
    console.log(`   📐 Result: ${(emergencyWeight * 40).toFixed(1)} + ${(ageWeight * 30).toFixed(1)} + ${(waitTimeWeight * 20).toFixed(1)} + ${(specialNeedsWeight * 10).toFixed(1)} + ${antiStarvationBoost.toFixed(1)} = ${score.toFixed(1)}`);
  });
  
  // Show queue ordering
  console.log('\n🔄 QUEUE ORDERING (Emergency > Senior > Normal + Mathematical Scoring):');
  console.log('-'.repeat(60));
  
  // Calculate scores and sort
  const scoredItems = demoQueueItems.map(item => ({
    ...item,
    priorityScore: demoQueueService.calculatePriorityScore(item, currentTime)
  }));
  
  // Sort by hierarchy first, then by score
  const PRIORITY_ORDER = { 'emergency': 1, 'senior': 2, 'normal': 3 };
  scoredItems.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return (b.priorityScore || 0) - (a.priorityScore || 0);
  });
  
  scoredItems.forEach((item, index) => {
    const waitMinutes = Math.round((currentTime - item.createdAt) / (1000 * 60));
    console.log(`${index + 1}. 👤 ${item.name} (${item.priority.toUpperCase()}) - Score: ${item.priorityScore.toFixed(1)} - Wait: ${waitMinutes}min`);
  });
  
  console.log('\n✨ KEY FEATURES DEMONSTRATED:');
  console.log('• Emergency patients get highest priority regardless of wait time');
  console.log('• Senior patients get medium priority with age bonuses');
  console.log('• Normal patients get anti-starvation boosts for long waits');
  console.log('• Special needs add extra priority points');
  console.log('• Mathematical transparency shows exactly how scores are calculated');
  console.log('• System prevents Normal customers from waiting indefinitely');
  
  console.log('\n🏆 HACKATHON WINNING FEATURES:');
  console.log('• Real mathematical algorithm (not just simple numbering)');
  console.log('• Fairness through anti-starvation protection');
  console.log('• Transparent scoring that can be explained to customers');
  console.log('• Handles complex priority scenarios automatically');
  console.log('• Zero-budget solution using only Firebase (free tier)');
}

// Run the demonstration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { demonstrateMathematicalTriage, demoQueueItems, demoQueueService };
} else {
  demonstrateMathematicalTriage();
}