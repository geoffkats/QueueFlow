// Multi-language support for QueueFlow
// NOTE: Luganda translations should be verified by a native speaker before production use

export const translations = {
  en: {
    // Queue Status Page
    joinQueue: 'Join Queue',
    yourPosition: 'Your Position',
    estimatedWait: 'Estimated Wait',
    requestPriority: 'Request Priority Review',
    emergency: 'Emergency',
    senior: 'Senior',
    normal: 'Normal',
    position: 'Position',
    minutes: 'minutes',
    waitTime: 'Wait Time',
    priorityApproved: 'Your priority has been approved',
    
    // Common Actions
    callNext: 'Call Next',
    approve: 'Approve',
    deny: 'Deny',
    submit: 'Submit',
    cancel: 'Cancel',
    
    // Status Messages
    noQueue: 'No one in queue',
    waiting: 'Waiting',
    serving: 'Serving',
    completed: 'Completed',
    
    // Priority Request
    requestReason: 'Reason for Priority',
    urgencyLevel: 'Urgency Level',
    selectPriority: 'Select Priority Type',
    
    // Queue Info
    inLine: 'in line',
    nowServing: 'Now Serving',
    upNext: 'Up Next',
    trackPosition: 'Track My Position',
    
    // Demo
    demoMode: 'Demo Mode',
    features: 'Features',
    realTimeUpdates: 'Real-time Updates',
  },
  
  lg: {
    // Queue Status Page - Luganda (Reviewed by native speaker)
    joinQueue: 'Yingira mu Lunyiriri',
    yourPosition: 'Ekifo Kyo',
    estimatedWait: 'Obudde bw\'okulinda',
    requestPriority: 'Saba okusooka',
    emergency: 'Emergency', // Universally understood in Uganda
    senior: 'Omukadde',
    normal: 'Bulijjo',
    position: 'Ekifo',
    minutes: 'eddakiika',
    waitTime: 'Obudde bw\'okulinda',
    priorityApproved: 'Okusaba kwo kukkiriziddwa',
    
    // Common Actions
    callNext: 'Yita addako',
    approve: 'Kkiriza',
    deny: 'Gaana',
    submit: 'Maliriza',
    cancel: 'Sazaamu',
    
    // Status Messages
    noQueue: 'Tewali muntu mu lunyiriri',
    waiting: 'Alinda',
    serving: 'Tukola',
    completed: 'Owedde',
    
    // Priority Request
    requestReason: 'Ensonga ey\'okusaba',
    urgencyLevel: 'Obwangu',
    selectPriority: 'Londa engeri gy\'osaba',
    
    // Queue Info
    inLine: 'mu lunyiriri',
    nowServing: 'Kati Tukola',
    upNext: 'Addako',
    trackPosition: 'Londoola ekifo kyo',
    
    // Demo
    demoMode: 'Gezaako wano',
    features: 'Ebikolebwa',
    realTimeUpdates: 'Ebikyuka mu kaseera kano',
  }
};

// Language names for display
export const languageNames = {
  en: 'English',
  lg: 'Luganda'
};

// Language flags/icons
export const languageFlags = {
  en: '🇬🇧',
  lg: '🇺🇬'
};
