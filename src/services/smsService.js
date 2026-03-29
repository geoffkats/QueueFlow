// Simple client-side SMS service using Africa's Talking API directly
// Note: This is for development/demo only. In production, use Firebase Functions for security.

const API_KEY = process.env.REACT_APP_AFRICASTALKING_API_KEY;
const USERNAME = process.env.REACT_APP_AFRICASTALKING_USERNAME || 'sandbox';
const SMS_MODE = process.env.REACT_APP_SMS_MODE || 'demo';

export const smsService = {
  /**
   * Send SMS notification to a client
   * @param {string} phoneNumber - Phone number in +256XXXXXXXXX format
   * @param {string} message - SMS message content
   * @param {string} queueId - Queue ID for logging
   */
  async sendNotification(phoneNumber, message, queueId = null) {
    try {
      // Check if we have API key configured
      if (!API_KEY || API_KEY === 'your_sandbox_api_key_here') {
        console.log('📱 QueueFlow SMS Demo (No API Key):', {
          to: phoneNumber,
          message: message,
          queueId: queueId,
          timestamp: new Date().toLocaleString(),
          note: 'Add your API key to .env file to enable real SMS'
        });
        
        // Show browser notification for demo effect
        this.showBrowserNotification(phoneNumber, message);
        
        return {
          success: true,
          messageId: 'demo-' + Date.now(),
          status: 'demo-sent',
          note: 'Demo mode - Add API key to .env file for real SMS'
        };
      }

      // Real SMS sending using Africa's Talking API
      if (SMS_MODE === 'production' && API_KEY && API_KEY !== 'your_sandbox_api_key_here') {
        const response = await this.sendRealSMS(phoneNumber, message);
        return response;
      }
      
      // Demo mode with API key configured
      console.log('📱 QueueFlow SMS (Demo Mode):', {
        to: phoneNumber,
        message: message,
        queueId: queueId,
        timestamp: new Date().toLocaleString(),
        apiKey: API_KEY ? 'Configured' : 'Not Set',
        mode: SMS_MODE
      });
      
      this.showBrowserNotification(phoneNumber, message);
      
      return {
        success: true,
        messageId: 'demo-' + Date.now(),
        status: 'demo-sent',
        note: 'Demo mode - Set REACT_APP_SMS_MODE=production in .env for real SMS'
      };
      
    } catch (error) {
      console.error('SMS service failed:', error);
      return {
        success: false,
        error: error.message,
        note: 'SMS failed - check console for details'
      };
    }
  },

  /**
   * Send real SMS using Africa's Talking API (client-side)
   * Note: This is for demo purposes. Production should use server-side API calls.
   */
  async sendRealSMS(phoneNumber, message) {
    try {
      const response = await fetch('https://api.sandbox.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': API_KEY
        },
        body: new URLSearchParams({
          username: USERNAME,
          to: phoneNumber,
          message: message,
          from: 'QueueFlow'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Real SMS sent successfully:', data);
        return {
          success: true,
          messageId: data.SMSMessageData?.Recipients?.[0]?.messageId,
          status: data.SMSMessageData?.Recipients?.[0]?.status,
          note: 'Real SMS sent via Africa\'s Talking'
        };
      } else {
        throw new Error(data.message || 'SMS API request failed');
      }
    } catch (error) {
      console.error('Real SMS failed:', error);
      throw error;
    }
  },

  /**
   * Show browser notification for demo purposes
   */
  showBrowserNotification(phoneNumber, message) {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('QueueFlow SMS Sent', {
          body: `To ${phoneNumber}: ${message}`,
          icon: '/icons/icon-192x192.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('QueueFlow SMS Sent', {
              body: `To ${phoneNumber}: ${message}`,
              icon: '/icons/icon-192x192.png'
            });
          }
        });
      }
    }
  },

  /**
   * Send position update SMS
   * @param {string} phoneNumber - Client's phone number
   * @param {number} position - Current queue position
   * @param {number} estimatedWait - Estimated wait time in minutes
   * @param {string} serviceName - Name of the service
   */
  async sendPositionUpdate(phoneNumber, position, estimatedWait, serviceName) {
    const message = `🏥 QueueFlow Update: You are now #${position} in line for ${serviceName}. Estimated wait: ${estimatedWait} minutes. Stay nearby!`;
    
    return this.sendNotification(phoneNumber, message);
  },

  /**
   * Send "now serving" SMS
   * @param {string} phoneNumber - Client's phone number
   * @param {string} serviceName - Name of the service
   * @param {string} ticketNumber - Ticket/queue number
   */
  async sendNowServing(phoneNumber, serviceName, ticketNumber) {
    const message = `🏥 QueueFlow Alert: You are now being served for ${serviceName}! Please proceed to the service counter immediately. Ticket: #${ticketNumber}`;
    
    return this.sendNotification(phoneNumber, message);
  },

  /**
   * Send queue joined confirmation
   * @param {string} phoneNumber - Client's phone number
   * @param {number} position - Initial queue position
   * @param {number} estimatedWait - Estimated wait time
   * @param {string} serviceName - Name of the service
   */
  async sendJoinConfirmation(phoneNumber, position, estimatedWait, serviceName) {
    const message = `✅ QueueFlow: Successfully joined queue for ${serviceName}. You are #${position} with ~${estimatedWait} min wait. We'll notify you when it's your turn!`;
    
    return this.sendNotification(phoneNumber, message);
  },

  /**
   * Send reminder SMS for long waits
   * @param {string} phoneNumber - Client's phone number
   * @param {number} waitTime - How long they've been waiting (minutes)
   * @param {string} ticketNumber - Ticket number
   */
  async sendWaitReminder(phoneNumber, waitTime, ticketNumber) {
    const message = `🕐 QueueFlow Reminder: You've been waiting ${waitTime} minutes. Your position is being updated. Please stay nearby! Ticket: #${ticketNumber}`;
    
    return this.sendNotification(phoneNumber, message);
  },

  /**
   * Send bulk SMS (admin only)
   * @param {string[]} phoneNumbers - Array of phone numbers
   * @param {string} message - Message to send
   */
  async sendBulkNotification(phoneNumbers, message) {
    try {
      const results = [];
      
      for (const phoneNumber of phoneNumbers) {
        const result = await this.sendNotification(phoneNumber, message);
        results.push({ phoneNumber, ...result });
      }
      
      return {
        success: true,
        results: results,
        total: phoneNumbers.length,
        note: 'Bulk SMS completed'
      };
    } catch (error) {
      console.error('Bulk SMS failed:', error);
      throw new Error(error.message || 'Failed to send bulk SMS');
    }
  },

  /**
   * Get SMS delivery reports (demo version)
   */
  async getDeliveryReports() {
    try {
      // Return demo data since we don't have Firebase Functions
      return [
        {
          id: 'demo-1',
          phoneNumber: '+256701234567',
          message: 'Welcome to QueueFlow!',
          status: 'demo-sent',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'demo-2', 
          phoneNumber: '+256709876543',
          message: 'You are now #3 in queue',
          status: 'demo-sent',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ];
    } catch (error) {
      console.error('Failed to fetch SMS reports:', error);
      throw new Error('Failed to fetch SMS reports');
    }
  },

  /**
   * Validate Uganda phone number format
   * @param {string} phoneNumber - Phone number to validate
   */
  validatePhoneNumber(phoneNumber) {
    const ugandaPhoneRegex = /^\+256[0-9]{9}$/;
    return ugandaPhoneRegex.test(phoneNumber);
  },

  /**
   * Format phone number to Uganda international format
   * @param {string} phoneNumber - Phone number (various formats)
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('256')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+256' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '+256' + cleaned;
    }
    
    return phoneNumber; // Return original if can't format
  }
};

// SMS Templates for different scenarios
export const SMS_TEMPLATES = {
  QUEUE_JOINED: (position, wait, service) => 
    `✅ QueueFlow: Joined ${service} queue. Position #${position}, ~${wait}min wait. We'll notify you!`,
  
  POSITION_UPDATE: (position, wait, service) => 
    `🔄 QueueFlow: Now #${position} for ${service}. ~${wait}min remaining. Stay nearby!`,
  
  NOW_SERVING: (service, ticket) => 
    `🏥 QueueFlow: You're being served for ${service}! Proceed to counter now. Ticket #${ticket}`,
  
  LONG_WAIT_REMINDER: (waitTime, ticket) => 
    `🕐 QueueFlow: ${waitTime}min wait. Position updating. Stay nearby! Ticket #${ticket}`,
  
  QUEUE_CANCELLED: (service, reason) => 
    `❌ QueueFlow: ${service} queue cancelled. Reason: ${reason}. Please reschedule.`,
  
  SERVICE_DELAY: (delay, reason) => 
    `⏰ QueueFlow: ${delay}min delay due to ${reason}. Thank you for your patience.`
};