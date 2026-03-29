import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  getDocs,
  limit,
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'queues';
const PRIORITY_REQUESTS_COLLECTION = 'priorityRequests';
const PROCESSING_SPEED_COLLECTION = 'processingSpeedHistory';

// Priority order for sorting
const PRIORITY_ORDER = {
  'emergency': 1,
  'senior': 2,
  'normal': 3
};

// Mathematical Triage Algorithm - Weight Constants
const EMERGENCY_WEIGHTS = {
  'emergency': 1.0,
  'senior': 0.7,
  'normal': 0.3
};

const AGE_WEIGHTS = {
  '65+': 1.0,
  'pregnant': 0.9,
  'disabled': 0.8,
  'regular': 0.2
};

const SPECIAL_NEEDS_WEIGHTS = {
  'wheelchair': 0.3,
  'interpreter': 0.2,
  'medical': 0.4,
  'none': 0.0
};

export const queueService = {
  // Mathematical Triage Algorithm Functions
  
  /**
   * Calculate priority score using weighted formula:
   * (Emergency_Weight × 40) + (Age_Weight × 30) + (Wait_Time_Weight × 20) + (Special_Needs_Weight × 10)
   */
  calculatePriorityScore(queueItem, currentTime = new Date()) {
    const emergencyWeight = this.getEmergencyWeight(queueItem.priority);
    const ageWeight = this.getAgeWeight(queueItem.ageCategory || 'regular');
    const waitTimeWeight = this.getWaitTimeWeight(queueItem.createdAt, currentTime);
    const specialNeedsWeight = this.getSpecialNeedsWeight(queueItem.specialNeeds || []);
    
    const baseScore = (emergencyWeight * 40) + (ageWeight * 30) + 
                     (waitTimeWeight * 20) + (specialNeedsWeight * 10);
    
    // Apply anti-starvation boost
    const antiStarvationBoost = this.calculateAntiStarvationBoost(queueItem.createdAt, currentTime);
    
    return Math.min(100, baseScore + antiStarvationBoost);
  },

  /**
   * Get emergency weight based on priority level
   */
  getEmergencyWeight(priority) {
    return EMERGENCY_WEIGHTS[priority] || EMERGENCY_WEIGHTS['normal'];
  },

  /**
   * Get age weight based on age category
   */
  getAgeWeight(ageCategory) {
    return AGE_WEIGHTS[ageCategory] || AGE_WEIGHTS['regular'];
  },

  /**
   * Calculate wait time weight - increases by 0.1 every 15 minutes, capped at 1.0
   */
  getWaitTimeWeight(createdAt, currentTime) {
    if (!createdAt) return 0;
    
    const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const waitTimeMinutes = (currentTime - createdDate) / (1000 * 60);
    const waitTimeWeight = Math.floor(waitTimeMinutes / 15) * 0.1;
    
    return Math.min(1.0, waitTimeWeight);
  },

  /**
   * Calculate special needs weight from array of special needs
   */
  getSpecialNeedsWeight(specialNeeds) {
    if (!Array.isArray(specialNeeds) || specialNeeds.length === 0) {
      return SPECIAL_NEEDS_WEIGHTS['none'];
    }
    
    // Sum all special needs weights, capped at 1.0
    const totalWeight = specialNeeds.reduce((sum, need) => {
      return sum + (SPECIAL_NEEDS_WEIGHTS[need] || 0);
    }, 0);
    
    return Math.min(1.0, totalWeight);
  },

  /**
   * Anti-starvation boost calculation: (Wait_Time_Minutes ÷ 15) × 0.1
   */
  calculateAntiStarvationBoost(createdAt, currentTime) {
    if (!createdAt) return 0;
    
    const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const waitTimeMinutes = (currentTime - createdDate) / (1000 * 60);
    
    return (waitTimeMinutes / 15) * 0.1;
  },

  /**
   * Recalculate priority scores for all queue items
   */
  recalculatePriorityScores(queueItems, currentTime = new Date()) {
    return queueItems.map(item => ({
      ...item,
      priorityScore: this.calculatePriorityScore(item, currentTime),
      lastPriorityUpdate: currentTime
    }));
  },

  // Add new person to queue
  async joinQueue(userData) {
    try {
      const currentTime = new Date();
      const queueItem = {
        name: userData.fullName,
        phoneNumber: userData.phoneNumber || null,
        service: userData.serviceType,
        priority: userData.priority,
        status: 'waiting',
        createdAt: serverTimestamp(),
        
        // Enhanced priority fields
        ageCategory: userData.ageCategory || 'regular',
        specialNeeds: userData.specialNeeds || [],
        priorityScore: 0, // Will be calculated after creation
        waitTimeBoost: 0,
        lastPriorityUpdate: serverTimestamp(),
        
        // ETA tracking
        estimatedWaitTime: 0,
        etaConfidence: 'learning',
        lastETAUpdate: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), queueItem);
      
      // Calculate initial priority score
      const createdItem = { ...queueItem, id: docRef.id, createdAt: currentTime };
      const priorityScore = this.calculatePriorityScore(createdItem, currentTime);
      
      // Update with calculated priority score
      await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
        priorityScore: priorityScore
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  },

  // Get queue position for a specific user
  async getQueuePosition(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'waiting'),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const waitingQueue = [];
      
      snapshot.forEach((doc) => {
        waitingQueue.push({ id: doc.id, ...doc.data() });
      });

      // Recalculate priority scores for all items
      const currentTime = new Date();
      const updatedQueue = this.recalculatePriorityScores(waitingQueue, currentTime);

      // Sort by mathematical triage algorithm while maintaining hierarchy
      const sortedQueue = this.sortQueueWithFairness(updatedQueue);

      const position = sortedQueue.findIndex(item => item.id === userId);
      
      // Smart EWT calculation with confidence levels
      const serviceTimeData = await this.getAverageServiceTime();
      const estimatedWaitTime = position >= 0 ? (position + 1) * serviceTimeData.avgTime : 0;

      return {
        position: position + 1, // 1-based position
        totalWaiting: sortedQueue.length,
        estimatedWaitTime: Math.round(estimatedWaitTime),
        avgServiceTime: serviceTimeData.avgTime,
        etaConfidence: serviceTimeData.confidence,
        sampleSize: serviceTimeData.sampleSize,
        queueData: position >= 0 ? sortedQueue[position] : null,
        priorityScore: position >= 0 ? sortedQueue[position].priorityScore : 0
      };
    } catch (error) {
      console.error('Error getting queue position:', error);
      throw error;
    }
  },

  /**
   * Sort queue with hierarchy preservation: Emergency > Senior > Normal
   * Within same hierarchy, sort by priority score (highest first)
   * For identical scores, maintain first-come-first-served
   */
  sortQueueWithHierarchy(queueItems) {
    return queueItems.sort((a, b) => {
      // First, sort by priority hierarchy
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Within same priority level, sort by priority score (highest first)
      const scoreDiff = (b.priorityScore || 0) - (a.priorityScore || 0);
      if (Math.abs(scoreDiff) > 0.01) return scoreDiff; // Allow for floating point precision
      
      // For identical scores, maintain first-come-first-served
      const aTime = a.createdAt?.seconds || a.createdAt?.getTime() / 1000 || 0;
      const bTime = b.createdAt?.seconds || b.createdAt?.getTime() / 1000 || 0;
      return aTime - bTime;
    });
  },

  /**
   * Apply anti-starvation fairness rules
   * Prevents more than 3 consecutive Senior/Emergency customers before 1 Normal
   */
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
  },

  /**
   * Enhanced queue sorting with anti-starvation fairness
   */
  sortQueueWithFairness(queueItems) {
    // First apply mathematical triage sorting
    const triageSorted = this.sortQueueWithHierarchy(queueItems);
    
    // Then apply anti-starvation fairness rules
    return this.applyAntiStarvationFairness(triageSorted);
  },

  // Calculate average service time from last 5 completed clients with confidence level
  async getAverageServiceTime() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'done'),
        orderBy('createdAt', 'desc'),
        limit(50) // Increased to get more data for confidence calculation
      );
      
      const snapshot = await getDocs(q);
      const completedClients = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        completedClients.push({
          ...data,
          createdAt: data.createdAt?.toDate(),
          completedAt: data.completedAt?.toDate()
        });
      });

      if (completedClients.length === 0) {
        return { 
          avgTime: 5, // Default 5 minutes if no data
          confidence: 'learning',
          sampleSize: 0
        };
      }

      // Calculate service times
      const serviceTimes = completedClients
        .filter(client => client.completedAt && client.createdAt)
        .map(client => {
          const serviceTime = (client.completedAt - client.createdAt) / (1000 * 60); // minutes
          return Math.max(1, Math.min(serviceTime, 30)); // Cap between 1-30 minutes
        });

      if (serviceTimes.length === 0) {
        return {
          avgTime: 5, // Default if no valid service times
          confidence: 'learning',
          sampleSize: 0
        };
      }

      // Use last 10 transactions for rolling average
      const recentServiceTimes = serviceTimes.slice(0, 10);
      const avgTime = recentServiceTimes.reduce((sum, time) => sum + time, 0) / recentServiceTimes.length;
      
      // Calculate confidence level based on sample size
      let confidence;
      if (serviceTimes.length >= 50) {
        confidence = 'high';
      } else if (serviceTimes.length >= 10) {
        confidence = 'medium';
      } else {
        confidence = 'learning';
      }

      return {
        avgTime: Math.max(3, Math.round(avgTime)), // Minimum 3 minutes
        confidence,
        sampleSize: serviceTimes.length
      };
    } catch (error) {
      console.error('Error calculating average service time:', error);
      return {
        avgTime: 5, // Default fallback
        confidence: 'learning',
        sampleSize: 0
      };
    }
  },

  // Real-time listener for queue updates
  subscribeToQueue(callback) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const waitingQueue = [];
      snapshot.forEach((doc) => {
        waitingQueue.push({ id: doc.id, ...doc.data() });
      });

      // Recalculate priority scores and sort with hierarchy preservation
      const currentTime = new Date();
      const updatedQueue = this.recalculatePriorityScores(waitingQueue, currentTime);
      const sortedQueue = this.sortQueueWithFairness(updatedQueue);

      callback(sortedQueue);
    });
  },

  // Admin: Get all queue data
  subscribeToAllQueue(callback) {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const allQueue = [];
      snapshot.forEach((doc) => {
        allQueue.push({ id: doc.id, ...doc.data() });
      });
      callback(allQueue);
    });
  },

  // Admin: Call next person (highest priority)
  async callNext() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'waiting'),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const waitingQueue = [];
      
      snapshot.forEach((doc) => {
        waitingQueue.push({ id: doc.id, ...doc.data() });
      });

      if (waitingQueue.length === 0) {
        throw new Error('No one in queue');
      }

      // Recalculate priority scores and sort with hierarchy preservation
      const currentTime = new Date();
      const updatedQueue = this.recalculatePriorityScores(waitingQueue, currentTime);
      const sortedQueue = this.sortQueueWithFairness(updatedQueue);

      const nextPerson = sortedQueue[0];
      
      // Update status to serving
      await updateDoc(doc(db, COLLECTION_NAME, nextPerson.id), {
        status: 'serving'
      });

      return nextPerson;
    } catch (error) {
      console.error('Error calling next person:', error);
      throw error;
    }
  },

  // Admin: Mark person as no-show (accountability feature)
  async markAsNoShow(userId) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, userId), {
        status: 'no-show',
        noShowTime: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking as no-show:', error);
      throw error;
    }
  },

  /**
   * Track processing speed when a customer is marked as done
   * This builds historical data for ETA confidence calculations
   */
  async trackProcessingSpeed(userId, staffId) {
    try {
      const userDoc = await getDoc(doc(db, COLLECTION_NAME, userId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const createdAt = userData.createdAt?.toDate();
      const completedAt = new Date();
      
      if (!createdAt) return;

      const processingTimeMinutes = (completedAt - createdAt) / (1000 * 60);
      
      // Store in processing speed history collection
      await addDoc(collection(db, PROCESSING_SPEED_COLLECTION), {
        staffId: staffId || 'unknown',
        processingTimeMinutes: Math.round(processingTimeMinutes * 10) / 10, // Round to 1 decimal
        customerPriority: userData.priority || 'normal',
        serviceType: userData.service || 'general',
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      });
    } catch (error) {
      console.error('Error tracking processing speed:', error);
    }
  },

  // Admin: Mark person as done
  async markAsDone(userId) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, userId), {
        status: 'done',
        completedAt: serverTimestamp()
      });
      
      // Track processing speed for analytics
      await this.trackProcessingSpeed(userId);
    } catch (error) {
      console.error('Error marking as done:', error);
      throw error;
    }
  },

  /**
   * Start automatic priority recalculation cycle (every 5 minutes)
   * This ensures dynamic priority updates as wait times increase
   */
  startPriorityRecalculationCycle() {
    // Clear any existing interval
    if (this.recalculationInterval) {
      clearInterval(this.recalculationInterval);
    }

    this.recalculationInterval = setInterval(async () => {
      try {
        await this.updateAllQueuePriorityScores();
      } catch (error) {
        console.error('Error in priority recalculation cycle:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return this.recalculationInterval;
  },

  /**
   * Stop the automatic priority recalculation cycle
   */
  stopPriorityRecalculationCycle() {
    if (this.recalculationInterval) {
      clearInterval(this.recalculationInterval);
      this.recalculationInterval = null;
    }
  },

  /**
   * Update priority scores for all waiting queue items in Firebase
   */
  async updateAllQueuePriorityScores() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'waiting')
      );
      
      const snapshot = await getDocs(q);
      const currentTime = new Date();
      const updatePromises = [];

      snapshot.forEach((docSnapshot) => {
        const queueItem = { id: docSnapshot.id, ...docSnapshot.data() };
        const newPriorityScore = this.calculatePriorityScore(queueItem, currentTime);
        
        // Only update if score has changed significantly (avoid unnecessary writes)
        if (Math.abs((queueItem.priorityScore || 0) - newPriorityScore) > 0.1) {
          const updatePromise = updateDoc(doc(db, COLLECTION_NAME, queueItem.id), {
            priorityScore: newPriorityScore,
            lastPriorityUpdate: serverTimestamp()
          });
          updatePromises.push(updatePromise);
        }
      });

      await Promise.all(updatePromises);
      console.log(`Updated priority scores for ${updatePromises.length} queue items`);
    } catch (error) {
      console.error('Error updating queue priority scores:', error);
      throw error;
    }
  },

  // Get comprehensive statistics
  subscribeToStats(callback) {
    const q = query(collection(db, COLLECTION_NAME));

    return onSnapshot(q, (snapshot) => {
      const allData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        allData.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });

      // Calculate comprehensive stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const todayData = allData.filter(item => 
        item.createdAt >= today
      );

      const waitingCount = allData.filter(item => item.status === 'waiting').length;
      const servingCount = allData.filter(item => item.status === 'serving').length;
      const doneToday = todayData.filter(item => item.status === 'done').length;
      
      // Calculate average wait time (rough estimate)
      const avgWaitTime = waitingCount > 0 ? Math.round(waitingCount * 4.5) : 0;
      
      // Peak hours data (mock realistic data based on current queue)
      const peakHoursData = Array.from({length: 8}, (_, i) => {
        const hour = 9 + i;
        const currentHour = now.getHours();
        let intensity = 0.3; // Base intensity
        
        // Higher intensity during typical busy hours
        if (hour >= 10 && hour <= 12) intensity = 0.8;
        if (hour >= 14 && hour <= 16) intensity = 0.6;
        if (hour === currentHour) intensity = Math.min(1, waitingCount / 10);
        
        return Math.round(intensity * 100);
      });

      const stats = {
        totalClients: todayData.length,
        averageWaitTime: avgWaitTime,
        activeQueue: waitingCount + servingCount,
        completedToday: doneToday,
        waitingCount,
        servingCount,
        peakHoursData,
        hourlyBreakdown: {
          morning: todayData.filter(item => item.createdAt.getHours() < 12).length,
          afternoon: todayData.filter(item => item.createdAt.getHours() >= 12 && item.createdAt.getHours() < 17).length,
          evening: todayData.filter(item => item.createdAt.getHours() >= 17).length
        }
      };

      callback(stats);
    });
  },

  // Get session statistics for operator
  subscribeToSessionStats(callback) {
    const q = query(collection(db, COLLECTION_NAME));

    return onSnapshot(q, (snapshot) => {
      const allData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        allData.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });

      // Calculate session stats (today's data)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayData = allData.filter(item => item.createdAt >= today);
      
      const completedToday = todayData.filter(item => item.status === 'done').length;
      const servingCount = allData.filter(item => item.status === 'serving').length;
      const waitingCount = allData.filter(item => item.status === 'waiting').length;
      const avgServiceTime = completedToday > 0 ? Math.round(480 / completedToday) : 6; // Rough estimate
      
      // Calculate session time (assuming 8 AM start)
      const sessionStart = new Date(today);
      sessionStart.setHours(8, 0, 0, 0);
      const sessionMinutes = Math.floor((now - sessionStart) / (1000 * 60));
      const sessionHours = Math.floor(sessionMinutes / 60);
      const sessionMins = sessionMinutes % 60;

      // Generate dynamic operator info
      const operatorId = `OP-${Math.floor(Math.random() * 9000) + 1000}`;
      const counterNumber = Math.floor(Math.random() * 8) + 1;
      const operatorStatus = servingCount > 0 ? 'Serving' : waitingCount > 0 ? 'Ready' : 'Idle';

      const sessionStats = {
        sessionTime: `${sessionHours.toString().padStart(2, '0')}:${sessionMins.toString().padStart(2, '0')}`,
        avgService: `${Math.floor(avgServiceTime / 60).toString().padStart(2, '0')}:${(avgServiceTime % 60).toString().padStart(2, '0')}`,
        clientsServed: completedToday,
        operatorInfo: {
          counterId: `Counter ${counterNumber.toString().padStart(2, '0')}`,
          operatorId: operatorId,
          status: operatorStatus,
          activeClients: servingCount,
          queueLength: waitingCount
        }
      };

      callback(sessionStats);
    });
  },

  // Get currently serving person
  subscribeToCurrentlyServing(callback) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'serving')
    );

    return onSnapshot(q, (snapshot) => {
      const serving = [];
      snapshot.forEach((doc) => {
        serving.push({ id: doc.id, ...doc.data() });
      });
      callback(serving[0] || null); // Return first serving person or null
    });
  },

  // Get recent activity (completed clients)
  subscribeToRecentActivity(callback) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'done'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const recentActivity = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        recentActivity.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      callback(recentActivity);
    });
  },

  // Priority Request System Functions

  /**
   * Submit a priority request from customer
   */
  async requestPriorityReview(userId, requestData) {
    try {
      // Check if user already has a pending priority request
      const existingRequestQuery = query(
        collection(db, PRIORITY_REQUESTS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const existingRequests = await getDocs(existingRequestQuery);
      if (!existingRequests.empty) {
        throw new Error('You already have a pending priority request. Please wait for staff review.');
      }

      // Get user's current queue data
      const userDoc = await getDoc(doc(db, COLLECTION_NAME, userId));
      if (!userDoc.exists()) {
        throw new Error('User not found in queue');
      }

      const userData = userDoc.data();
      
      const priorityRequest = {
        userId,
        customerName: userData.name,
        currentTicketNumber: `A-${(await this.getQueuePosition(userId)).position.toString().padStart(3, '0')}`,
        requestType: requestData.requestType, // 'senior', 'emergency', 'disability'
        customerLocation: requestData.location || 'Unknown Location',
        reason: requestData.reason || '',
        urgencyLevel: requestData.urgencyLevel || 5,
        supportingInfo: requestData.supportingInfo || '',
        
        // Processing fields
        status: 'pending', // 'pending', 'approved', 'denied', 'expired'
        staffId: null,
        processedAt: null,
        responseTime: null,
        notes: '',
        
        // Audit trail
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ipAddress: requestData.ipAddress || '',
        userAgent: requestData.userAgent || ''
      };

      const docRef = await addDoc(collection(db, PRIORITY_REQUESTS_COLLECTION), priorityRequest);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting priority request:', error);
      throw error;
    }
  },

  /**
   * Get pending priority requests for staff dashboard
   */
  subscribeToPriorityRequests(callback) {
    const q = query(
      collection(db, PRIORITY_REQUESTS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const requests = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      callback(requests);
    });
  },

  /**
   * Process priority request (approve/deny/request documentation)
   */
  async processPriorityRequest(requestId, staffId, decision, notes = '') {
    try {
      const requestRef = doc(db, PRIORITY_REQUESTS_COLLECTION, requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Priority request not found');
      }

      const requestData = requestDoc.data();
      const processedAt = new Date();
      const responseTime = Math.round((processedAt - requestData.createdAt.toDate()) / (1000 * 60)); // minutes

      // Update priority request status
      await updateDoc(requestRef, {
        status: decision, // 'approved', 'denied', 'request_documentation'
        staffId,
        processedAt: serverTimestamp(),
        responseTime,
        notes,
        updatedAt: serverTimestamp()
      });

      // If approved, update user's priority in queue
      if (decision === 'approved') {
        await this.updateUserPriority(requestData.userId, requestData.requestType, staffId);
      }

      return { success: true, responseTime };
    } catch (error) {
      console.error('Error processing priority request:', error);
      throw error;
    }
  },

  /**
   * Update user's priority level in queue
   */
  async updateUserPriority(userId, newPriorityType, staffId) {
    try {
      const userRef = doc(db, COLLECTION_NAME, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found in queue');
      }

      // Map request type to priority level
      const priorityMapping = {
        'senior': 'senior',
        'emergency': 'emergency',
        'disability': 'senior' // Disability gets senior priority
      };

      const newPriority = priorityMapping[newPriorityType] || 'normal';
      
      await updateDoc(userRef, {
        priority: newPriority,
        priorityVerifiedBy: staffId,
        priorityVerifiedAt: serverTimestamp(),
        lastPriorityUpdate: serverTimestamp()
      });

      // Recalculate priority score
      const userData = userDoc.data();
      const currentTime = new Date();
      const newPriorityScore = this.calculatePriorityScore({
        ...userData,
        priority: newPriority
      }, currentTime);

      await updateDoc(userRef, {
        priorityScore: newPriorityScore
      });

      return { success: true, newPriority, newPriorityScore };
    } catch (error) {
      console.error('Error updating user priority:', error);
      throw error;
    }
  },

  /**
   * Get priority request statistics for analytics
   */
  async getPriorityRequestStats(dateRange = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const q = query(
        collection(db, PRIORITY_REQUESTS_COLLECTION),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const requests = [];
      
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });

      const totalRequests = requests.length;
      const approvedRequests = requests.filter(r => r.status === 'approved').length;
      const deniedRequests = requests.filter(r => r.status === 'denied').length;
      const pendingRequests = requests.filter(r => r.status === 'pending').length;

      const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;
      
      const processedRequests = requests.filter(r => r.responseTime);
      const avgResponseTime = processedRequests.length > 0 
        ? processedRequests.reduce((sum, r) => sum + r.responseTime, 0) / processedRequests.length 
        : 0;

      const requestsByType = {
        senior: requests.filter(r => r.requestType === 'senior').length,
        emergency: requests.filter(r => r.requestType === 'emergency').length,
        disability: requests.filter(r => r.requestType === 'disability').length
      };

      return {
        totalRequests,
        approvedRequests,
        deniedRequests,
        pendingRequests,
        approvalRate: Math.round(approvalRate),
        avgResponseTime: Math.round(avgResponseTime),
        requestsByType
      };
    } catch (error) {
      console.error('Error getting priority request stats:', error);
      throw error;
    }
  },

  /**
   * Check if user has pending priority request
   */
  async checkUserPriorityRequestStatus(userId) {
    try {
      const q = query(
        collection(db, PRIORITY_REQUESTS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking priority request status:', error);
      return false;
    }
  },

  /**
   * Get user's priority request history
   */
  async getUserPriorityRequestHistory(userId) {
    try {
      const q = query(
        collection(db, PRIORITY_REQUESTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const history = [];
      
      snapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });

      return history;
    } catch (error) {
      console.error('Error getting priority request history:', error);
      return [];
    }
  }
};