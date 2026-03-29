/**
 * WhatsApp Click-to-Chat Helper
 * Zero-budget solution using WhatsApp's free Click-to-Chat API
 */

export const whatsappHelper = {
  /**
   * Format phone number for WhatsApp (remove spaces, dashes, etc.)
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';
    // Remove all non-numeric characters except +
    return phone.replace(/[^\d+]/g, '');
  },

  /**
   * Generate WhatsApp Click-to-Chat URL
   */
  generateWhatsAppURL(phoneNumber, message) {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  },

  /**
   * Send priority approval notification via WhatsApp
   */
  sendPriorityApprovalNotification(phoneNumber, customerName, newPriority, newPosition) {
    const message = `🎉 Great news ${customerName}!\n\nYour priority request has been APPROVED!\n\n✓ New Priority: ${newPriority.toUpperCase()}\n✓ New Position: #${newPosition}\n\nYou will be served ahead of regular customers. Please stay nearby - we'll call you soon!\n\n- SmartQueue Team`;
    
    const url = this.generateWhatsAppURL(phoneNumber, message);
    window.open(url, '_blank');
  },

  /**
   * Send priority denial notification via WhatsApp
   */
  sendPriorityDenialNotification(phoneNumber, customerName, reason) {
    const message = `Hello ${customerName},\n\nWe've reviewed your priority request. Unfortunately, we cannot approve it at this time.\n\nReason: ${reason}\n\nYou remain in the regular queue at your current position. We appreciate your patience!\n\n- SmartQueue Team`;
    
    const url = this.generateWhatsAppURL(phoneNumber, message);
    window.open(url, '_blank');
  },

  /**
   * Send general queue update via WhatsApp
   */
  sendQueueUpdate(phoneNumber, customerName, position, estimatedWait) {
    const message = `Hi ${customerName}!\n\n📍 Queue Update:\n• Position: #${position}\n• Estimated Wait: ${estimatedWait} minutes\n\nStay nearby - we'll call you soon!\n\n- SmartQueue Team`;
    
    const url = this.generateWhatsAppURL(phoneNumber, message);
    window.open(url, '_blank');
  },

  /**
   * Send "You're Next" notification via WhatsApp
   */
  sendYouAreNextNotification(phoneNumber, customerName) {
    const message = `🔔 ${customerName}, you're NEXT!\n\nPlease come to the service counter now. Your turn is coming up!\n\n- SmartQueue Team`;
    
    const url = this.generateWhatsAppURL(phoneNumber, message);
    window.open(url, '_blank');
  },

  /**
   * Check if phone number is valid for WhatsApp
   */
  isValidPhoneNumber(phone) {
    if (!phone) return false;
    const formatted = this.formatPhoneNumber(phone);
    // Basic validation: should have at least 10 digits
    return formatted.length >= 10;
  }
};
