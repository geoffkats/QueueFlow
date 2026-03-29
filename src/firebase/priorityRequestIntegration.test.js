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

describe('Priority Request Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('priority functions should be defined', () => {
    expect(queueService.requestPriorityReview).toBeDefined();
    expect(queueService.processPriorityRequest).toBeDefined();
    expect(queueService.updateUserPriority).toBeDefined();
    expect(queueService.getPriorityRequestStats).toBeDefined();
  });

  test('requestPriorityReview should return a document id', async () => {
    // Get mocks via require INSIDE the test so jest.mock has already run
    const firestore = require('firebase/firestore');

    firestore.addDoc.mockResolvedValue({ id: 'mock-doc-id' });
    firestore.collection.mockReturnValue('mockCollection');
    firestore.query.mockReturnValue('mockQuery');
    firestore.where.mockReturnValue('mockWhere');
    firestore.getDocs.mockResolvedValue({ empty: true });
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Test User', priority: 'normal' })
    });

    queueService.getQueuePosition = jest.fn().mockResolvedValue({ position: 3 });

    const result = await queueService.requestPriorityReview('user123', {
      requestType: 'senior',
      location: 'Waiting Area B',
      reason: 'Senior citizen',
      urgencyLevel: 6
    });

    expect(result).toBe('mock-doc-id');
  });
});