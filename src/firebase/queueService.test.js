// Unit tests for mathematical triage algorithm functions
// Testing the core logic without Firebase dependencies

// Mock the queueService object with just the functions we need to test
const queueService = {
  // Emergency weights
  getEmergencyWeight(priority) {
    const EMERGENCY_WEIGHTS = {
      'emergency': 1.0,
      'senior': 0.7,
      'normal': 0.3
    };
    return EMERGENCY_WEIGHTS[priority] || EMERGENCY_WEIGHTS['normal'];
  },

  // Age weights
  getAgeWeight(ageCategory) {
    const AGE_WEIGHTS = {
      '65+': 1.0,
      'pregnant': 0.9,
      'disabled': 0.8,
      'regular': 0.2
    };
    return AGE_WEIGHTS[ageCategory] || AGE_WEIGHTS['regular'];
  },

  // Wait time weight calculation
  getWaitTimeWeight(createdAt, currentTime) {
    if (!createdAt) return 0;
    
    const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const waitTimeMinutes = (currentTime - createdDate) / (1000 * 60);
    const waitTimeWeight = Math.floor(waitTimeMinutes / 15) * 0.1;
    
    return Math.min(1.0, waitTimeWeight);
  },

  // Special needs weight calculation
  getSpecialNeedsWeight(specialNeeds) {
    const SPECIAL_NEEDS_WEIGHTS = {
      'wheelchair': 0.3,
      'interpreter': 0.2,
      'medical': 0.4,
      'none': 0.0
    };

    if (!Array.isArray(specialNeeds) || specialNeeds.length === 0) {
      return SPECIAL_NEEDS_WEIGHTS['none'];
    }
    
    const totalWeight = specialNeeds.reduce((sum, need) => {
      return sum + (SPECIAL_NEEDS_WEIGHTS[need] || 0);
    }, 0);
    
    return Math.min(1.0, totalWeight);
  },

  // Anti-starvation boost calculation
  calculateAntiStarvationBoost(createdAt, currentTime) {
    if (!createdAt) return 0;
    
    const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const waitTimeMinutes = (currentTime - createdDate) / (1000 * 60);
    
    return (waitTimeMinutes / 15) * 0.1;
  },

  // Priority score calculation
  calculatePriorityScore(queueItem, currentTime = new Date()) {
    const emergencyWeight = this.getEmergencyWeight(queueItem.priority);
    const ageWeight = this.getAgeWeight(queueItem.ageCategory || 'regular');
    const waitTimeWeight = this.getWaitTimeWeight(queueItem.createdAt, currentTime);
    const specialNeedsWeight = this.getSpecialNeedsWeight(queueItem.specialNeeds || []);
    
    const baseScore = (emergencyWeight * 40) + (ageWeight * 30) + 
                     (waitTimeWeight * 20) + (specialNeedsWeight * 10);
    
    const antiStarvationBoost = this.calculateAntiStarvationBoost(queueItem.createdAt, currentTime);
    
    return Math.min(100, baseScore + antiStarvationBoost);
  },

  // Queue sorting with hierarchy
  sortQueueWithHierarchy(queueItems) {
    const PRIORITY_ORDER = {
      'emergency': 1,
      'senior': 2,
      'normal': 3
    };

    return queueItems.sort((a, b) => {
      // First, sort by priority hierarchy
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Within same priority level, sort by priority score (highest first)
      const scoreDiff = (b.priorityScore || 0) - (a.priorityScore || 0);
      if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
      
      // For identical scores, maintain first-come-first-served
      const aTime = a.createdAt?.seconds || a.createdAt?.getTime() / 1000 || 0;
      const bTime = b.createdAt?.seconds || b.createdAt?.getTime() / 1000 || 0;
      return aTime - bTime;
    });
  },

  // Anti-starvation fairness algorithm
  applyAntiStarvationFairness(queueItems) {
    const result = [];
    let consecutiveHighPriority = 0;
    let normalQueue = [];
    let highPriorityQueue = [];

    // Separate normal and high priority customers
    queueItems.forEach(item => {
      if (item.priority === 'normal') {
        normalQueue.push(item);
      } else {
        highPriorityQueue.push(item);
      }
    });

    // Sort each queue by priority score
    normalQueue.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    highPriorityQueue.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    // Apply fairness rules
    while (highPriorityQueue.length > 0 || normalQueue.length > 0) {
      // If we've had 3 consecutive high priority, force a normal customer
      if (consecutiveHighPriority >= 3 && normalQueue.length > 0) {
        result.push(normalQueue.shift());
        consecutiveHighPriority = 0;
      }
      // If high priority queue has customers and we haven't hit the limit
      else if (highPriorityQueue.length > 0 && consecutiveHighPriority < 3) {
        result.push(highPriorityQueue.shift());
        consecutiveHighPriority++;
      }
      // Otherwise, take from normal queue
      else if (normalQueue.length > 0) {
        result.push(normalQueue.shift());
        consecutiveHighPriority = 0;
      }
      // Fallback: take from high priority if normal is empty
      else if (highPriorityQueue.length > 0) {
        result.push(highPriorityQueue.shift());
        consecutiveHighPriority++;
      }
    }

    return result;
  }
};

describe('Mathematical Triage Algorithm', () => {
  describe('Priority Score Calculation', () => {
    test('should calculate correct priority score for emergency patient', () => {
      const queueItem = {
        priority: 'emergency',
        ageCategory: '65+',
        specialNeeds: ['wheelchair'],
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      };

      const score = queueService.calculatePriorityScore(queueItem);
      
      // Expected: (1.0 * 40) + (1.0 * 30) + (0.2 * 20) + (0.3 * 10) + anti-starvation boost
      // Emergency: 40, Age 65+: 30, Wait time (30min = 2 * 15min = 0.2): 4, Wheelchair: 3
      // Anti-starvation: (30/15) * 0.1 = 0.2
      // Total: 40 + 30 + 4 + 3 + 0.2 = 77.2
      expect(score).toBeCloseTo(77.2, 1);
    });

    test('should calculate correct priority score for normal patient with long wait', () => {
      const queueItem = {
        priority: 'normal',
        ageCategory: 'regular',
        specialNeeds: [],
        createdAt: new Date(Date.now() - 90 * 60 * 1000) // 90 minutes ago
      };

      const score = queueService.calculatePriorityScore(queueItem);
      
      // Expected: (0.3 * 40) + (0.2 * 30) + (1.0 * 20) + (0.0 * 10) + anti-starvation boost
      // Normal: 12, Regular age: 6, Wait time (90min = 6 * 15min = 1.0 capped): 20, No special needs: 0
      // Anti-starvation: (90/15) * 0.1 = 0.6
      // Total: 12 + 6 + 20 + 0 + 0.6 = 38.6
      // But wait time weight is capped at 1.0, so actual wait time weight = 1.0 * 20 = 20
      // But wait time weight calculation: Math.floor(90/15) * 0.1 = Math.floor(6) * 0.1 = 0.6, capped at 1.0
      // So wait time weight = 0.6, wait time score = 0.6 * 20 = 12
      // Total: 12 + 6 + 12 + 0 + 0.6 = 30.6
      expect(score).toBeCloseTo(30.6, 1);
    });

    test('should cap priority score at 100', () => {
      const queueItem = {
        priority: 'emergency',
        ageCategory: '65+',
        specialNeeds: ['wheelchair', 'interpreter', 'medical'],
        createdAt: new Date(Date.now() - 300 * 60 * 1000) // 5 hours ago
      };

      const score = queueService.calculatePriorityScore(queueItem);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Weight Assignment Functions', () => {
    test('should assign correct emergency weights', () => {
      expect(queueService.getEmergencyWeight('emergency')).toBe(1.0);
      expect(queueService.getEmergencyWeight('senior')).toBe(0.7);
      expect(queueService.getEmergencyWeight('normal')).toBe(0.3);
      expect(queueService.getEmergencyWeight('invalid')).toBe(0.3); // Default to normal
    });

    test('should assign correct age weights', () => {
      expect(queueService.getAgeWeight('65+')).toBe(1.0);
      expect(queueService.getAgeWeight('pregnant')).toBe(0.9);
      expect(queueService.getAgeWeight('disabled')).toBe(0.8);
      expect(queueService.getAgeWeight('regular')).toBe(0.2);
      expect(queueService.getAgeWeight('invalid')).toBe(0.2); // Default to regular
    });

    test('should calculate wait time weight correctly', () => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000);
      const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
      const twoHoursAgo = new Date(now - 120 * 60 * 1000);

      expect(queueService.getWaitTimeWeight(fifteenMinutesAgo, now)).toBe(0.1);
      expect(queueService.getWaitTimeWeight(thirtyMinutesAgo, now)).toBe(0.2);
      expect(queueService.getWaitTimeWeight(twoHoursAgo, now)).toBe(0.8);
    });

    test('should cap wait time weight at 1.0', () => {
      const now = new Date();
      const longTimeAgo = new Date(now - 300 * 60 * 1000); // 5 hours ago

      expect(queueService.getWaitTimeWeight(longTimeAgo, now)).toBe(1.0);
    });

    test('should calculate special needs weight correctly', () => {
      expect(queueService.getSpecialNeedsWeight([])).toBe(0.0);
      expect(queueService.getSpecialNeedsWeight(['wheelchair'])).toBe(0.3);
      expect(queueService.getSpecialNeedsWeight(['wheelchair', 'interpreter'])).toBe(0.5);
      expect(queueService.getSpecialNeedsWeight(['wheelchair', 'interpreter', 'medical'])).toBe(0.9);
    });

    test('should cap special needs weight at 1.0', () => {
      const manyNeeds = ['wheelchair', 'interpreter', 'medical', 'wheelchair', 'medical'];
      expect(queueService.getSpecialNeedsWeight(manyNeeds)).toBe(1.0);
    });
  });

  describe('Queue Sorting with Hierarchy', () => {
    test('should maintain Emergency > Senior > Normal hierarchy', () => {
      const queueItems = [
        { id: '1', priority: 'normal', priorityScore: 50, createdAt: { seconds: 1000 } },
        { id: '2', priority: 'emergency', priorityScore: 40, createdAt: { seconds: 2000 } },
        { id: '3', priority: 'senior', priorityScore: 45, createdAt: { seconds: 1500 } }
      ];

      const sorted = queueService.sortQueueWithHierarchy(queueItems);
      
      expect(sorted[0].priority).toBe('emergency');
      expect(sorted[1].priority).toBe('senior');
      expect(sorted[2].priority).toBe('normal');
    });

    test('should sort by priority score within same hierarchy level', () => {
      const queueItems = [
        { id: '1', priority: 'normal', priorityScore: 30, createdAt: { seconds: 1000 } },
        { id: '2', priority: 'normal', priorityScore: 50, createdAt: { seconds: 2000 } },
        { id: '3', priority: 'normal', priorityScore: 40, createdAt: { seconds: 1500 } }
      ];

      const sorted = queueService.sortQueueWithHierarchy(queueItems);
      
      expect(sorted[0].priorityScore).toBe(50);
      expect(sorted[1].priorityScore).toBe(40);
      expect(sorted[2].priorityScore).toBe(30);
    });

    test('should maintain first-come-first-served for identical scores', () => {
      const queueItems = [
        { id: '1', priority: 'normal', priorityScore: 40, createdAt: { seconds: 2000 } },
        { id: '2', priority: 'normal', priorityScore: 40, createdAt: { seconds: 1000 } },
        { id: '3', priority: 'normal', priorityScore: 40, createdAt: { seconds: 1500 } }
      ];

      const sorted = queueService.sortQueueWithHierarchy(queueItems);
      
      expect(sorted[0].id).toBe('2'); // Earliest timestamp
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1'); // Latest timestamp
    });
  });

  describe('Anti-Starvation Algorithm', () => {
    test('should calculate anti-starvation boost correctly', () => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000);
      const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
      const sixtyMinutesAgo = new Date(now - 60 * 60 * 1000);

      expect(queueService.calculateAntiStarvationBoost(fifteenMinutesAgo, now)).toBeCloseTo(0.1, 2);
      expect(queueService.calculateAntiStarvationBoost(thirtyMinutesAgo, now)).toBeCloseTo(0.2, 2);
      expect(queueService.calculateAntiStarvationBoost(sixtyMinutesAgo, now)).toBeCloseTo(0.4, 2);
    });

    test('should prevent more than 3 consecutive high priority customers', () => {
      const queueItems = [
        { id: '1', priority: 'emergency', priorityScore: 80 },
        { id: '2', priority: 'emergency', priorityScore: 75 },
        { id: '3', priority: 'senior', priorityScore: 70 },
        { id: '4', priority: 'senior', priorityScore: 65 },
        { id: '5', priority: 'normal', priorityScore: 40 },
        { id: '6', priority: 'normal', priorityScore: 35 }
      ];

      const sorted = queueService.applyAntiStarvationFairness(queueItems);
      
      // Should have at most 3 consecutive high priority before a normal
      let consecutiveHighPriority = 0;
      let maxConsecutive = 0;
      
      sorted.forEach(item => {
        if (item.priority !== 'normal') {
          consecutiveHighPriority++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveHighPriority);
        } else {
          consecutiveHighPriority = 0;
        }
      });
      
      expect(maxConsecutive).toBeLessThanOrEqual(3);
    });
  });
});