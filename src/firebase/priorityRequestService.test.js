import { queueService } from './queueService';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date())
}));

jest.mock('./config', () => ({
  db: {}
}));

describe('Priority Request System', () => {
  // Store originals so we can always restore them
  let originalUpdateUserPriority;
  let originalGetQueuePosition;

  beforeAll(() => {
    originalUpdateUserPriority = queueService.updateUserPriority;
    originalGetQueuePosition = queueService.getQueuePosition;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore real implementations before every test
    // so no test's mock leaks into the next one
    queueService.updateUserPriority = originalUpdateUserPriority;
    queueService.getQueuePosition = originalGetQueuePosition;
  });

  // ─── requestPriorityReview ────────────────────────────────────────────────

  describe('requestPriorityReview', () => {
    test('should create priority request with correct data structure', async () => {
      const { addDoc, getDocs, getDoc, collection, query, where } =
        require('firebase/firestore');

      collection.mockReturnValue('mockCollection');
      query.mockReturnValue('mockQuery');
      where.mockReturnValue('mockWhere');
      getDocs.mockResolvedValue({ empty: true });
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'John Doe', priority: 'normal' })
      });
      addDoc.mockResolvedValue({ id: 'request123' });

      // Safe to mock here — beforeEach will restore before the next test
      queueService.getQueuePosition = jest.fn().mockResolvedValue({ position: 5 });

      const result = await queueService.requestPriorityReview('user123', {
        requestType: 'senior',
        location: 'Waiting Area A',
        reason: 'I am 70 years old',
        urgencyLevel: 7
      });

      expect(result).toBe('request123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          requestType: 'senior',
          customerLocation: 'Waiting Area A',
          reason: 'I am 70 years old',
          urgencyLevel: 7,
          status: 'pending'
        })
      );
    });

    test('should reject duplicate priority requests', async () => {
      const { getDocs, collection, query, where } = require('firebase/firestore');

      collection.mockReturnValue('mockCollection');
      query.mockReturnValue('mockQuery');
      where.mockReturnValue('mockWhere');
      getDocs.mockResolvedValue({ empty: false });

      await expect(
        queueService.requestPriorityReview('user123', { requestType: 'senior' })
      ).rejects.toThrow('You already have a pending priority request');
    });
  });

  // ─── processPriorityRequest ───────────────────────────────────────────────

  describe('processPriorityRequest', () => {
    test('should approve priority request and update user priority', async () => {
      const { getDoc, updateDoc, doc } = require('firebase/firestore');

      doc.mockReturnValue('mockDocRef');
      updateDoc.mockResolvedValue(undefined);
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'user123',
          requestType: 'senior',
          createdAt: { toDate: () => new Date(Date.now() - 300000) } // 5 min ago
        })
      });

      // Mock updateUserPriority only for this test —
      // beforeEach will restore the real one before updateUserPriority's own test
      queueService.updateUserPriority = jest.fn().mockResolvedValue({ success: true });

      const result = await queueService.processPriorityRequest(
        'request123',
        'staff001',
        'approved',
        'Valid senior citizen'
      );

      expect(result.success).toBe(true);
      expect(result.responseTime).toBe(5);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'approved',
          staffId: 'staff001',
          notes: 'Valid senior citizen'
        })
      );
      expect(queueService.updateUserPriority).toHaveBeenCalledWith(
        'user123', 'senior', 'staff001'
      );
    });
  });

  // ─── updateUserPriority ───────────────────────────────────────────────────

  describe('updateUserPriority', () => {
    test('should update user priority and recalculate priority score', async () => {
      const { getDoc, updateDoc, doc, serverTimestamp } = require('firebase/firestore');

      doc.mockReturnValue('mockDocRef');
      serverTimestamp.mockReturnValue(new Date());
      updateDoc.mockResolvedValue(undefined);
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          name: 'John Doe',
          priority: 'normal',
          createdAt: new Date(),
          ageCategory: '65+',
          specialNeeds: []
        })
      });

      // Mock calculatePriorityScore only for this test
      const originalCalc = queueService.calculatePriorityScore;
      queueService.calculatePriorityScore = jest.fn().mockReturnValue(75);

      let result;
      try {
        // This now calls the REAL updateUserPriority (restored by beforeEach)
        result = await queueService.updateUserPriority('user123', 'senior', 'staff001');
      } finally {
        queueService.calculatePriorityScore = originalCalc;
      }

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.newPriority).toBe('senior');
      expect(result.newPriorityScore).toBe(75);
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Rate limiting ────────────────────────────────────────────────────────

  describe('Priority Request Rate Limiting', () => {
    test('should enforce one request per queue session', async () => {
      const { getDocs, collection, query, where } = require('firebase/firestore');

      collection.mockReturnValue('mockCollection');
      query.mockReturnValue('mockQuery');
      where.mockReturnValue('mockWhere');
      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'existing-request' }]
      });

      await expect(
        queueService.requestPriorityReview('user123', { requestType: 'emergency' })
      ).rejects.toThrow('You already have a pending priority request');
    });
  });

  // ─── Statistics ───────────────────────────────────────────────────────────

  describe('Priority Request Statistics', () => {
    test('should calculate correct approval rate and response time', async () => {
      const { getDocs, collection, query, where, orderBy } =
        require('firebase/firestore');

      collection.mockReturnValue('mockCollection');
      query.mockReturnValue('mockQuery');
      where.mockReturnValue('mockWhere');
      orderBy.mockReturnValue('mockOrderBy');

      const mockRequests = [
        { status: 'approved', responseTime: 5 },
        { status: 'approved', responseTime: 10 },
        { status: 'denied',   responseTime: 3 },
        { status: 'pending' }
      ];

      getDocs.mockResolvedValue({
        forEach: (cb) =>
          mockRequests.forEach((req, i) =>
            cb({ id: `req${i}`, data: () => req })
          )
      });

      const stats = await queueService.getPriorityRequestStats(7);

      expect(stats.totalRequests).toBe(4);
      expect(stats.approvedRequests).toBe(2);
      expect(stats.deniedRequests).toBe(1);
      expect(stats.pendingRequests).toBe(1);
      expect(stats.approvalRate).toBe(50);
      expect(stats.avgResponseTime).toBe(6);
    });
  });
});