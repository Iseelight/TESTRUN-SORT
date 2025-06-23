// Mock backend service for testing proctoring features without real backend
export class MockBackendService {
  private static instance: MockBackendService;
  private candidates: any[] = [];
  private conversations: any[] = [];
  private violations: any[] = [];

  static getInstance(): MockBackendService {
    if (!MockBackendService.instance) {
      MockBackendService.instance = new MockBackendService();
    }
    return MockBackendService.instance;
  }

  // Mock API methods
  async createCandidate(candidateData: any) {
    const candidate = {
      id: 'candidate_' + Date.now(),
      ...candidateData,
      created_at: new Date().toISOString(),
      proctoring_violations: []
    };
    
    this.candidates.push(candidate);
    return candidate;
  }

  async createConversation(conversationData: any) {
    const conversation = {
      id: 'conv_' + Date.now(),
      ...conversationData,
      messages: [],
      started_at: new Date().toISOString(),
      proctoring_enabled: true,
      violations: []
    };
    
    this.conversations.push(conversation);
    return conversation;
  }

  async addMessage(conversationId: string, messageData: any) {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const message = {
      id: 'msg_' + Date.now(),
      conversation_id: conversationId,
      ...messageData,
      timestamp: new Date().toISOString()
    };

    conversation.messages.push(message);
    return message;
  }

  async recordViolation(conversationId: string, violationData: any) {
    const violation = {
      id: 'violation_' + Date.now(),
      conversation_id: conversationId,
      ...violationData,
      timestamp: new Date().toISOString()
    };

    this.violations.push(violation);
    
    // Add to conversation
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.violations.push(violation);
    }

    return violation;
  }

  async endConversation(conversationId: string, reason?: string) {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');

    conversation.ended_at = new Date().toISOString();
    conversation.end_reason = reason;
    
    // Calculate duration
    const startTime = new Date(conversation.started_at).getTime();
    const endTime = new Date().getTime();
    conversation.duration = Math.round((endTime - startTime) / 1000); // in seconds

    return conversation;
  }

  async uploadSessionRecording(conversationId: string, videoBlob: Blob) {
    // Mock upload - in real implementation, this would upload to cloud storage
    const mockUrl = `https://storage.example.com/recordings/${conversationId}.webm`;
    
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.recording_url = mockUrl;
      conversation.recording_size = videoBlob.size;
    }

    return { url: mockUrl, size: videoBlob.size };
  }

  // Get methods for testing
  getCandidates() {
    return this.candidates;
  }

  getConversations() {
    return this.conversations;
  }

  getViolations() {
    return this.violations;
  }

  getConversation(id: string) {
    return this.conversations.find(c => c.id === id);
  }

  // Clear data for testing
  clearData() {
    this.candidates = [];
    this.conversations = [];
    this.violations = [];
  }
}