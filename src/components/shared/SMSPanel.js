import React, { useState, useEffect } from 'react';
import { smsService } from '../../services/smsService';

const SMSPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('send');
  const [smsData, setSmsData] = useState({
    phoneNumber: '',
    message: '',
    bulkNumbers: '',
    bulkMessage: ''
  });
  const [deliveryReports, setDeliveryReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'reports') {
      loadDeliveryReports();
    }
  }, [isOpen, activeTab]);

  const loadDeliveryReports = async () => {
    try {
      setIsLoading(true);
      const reports = await smsService.getDeliveryReports();
      setDeliveryReports(reports);
    } catch (error) {
      console.error('Failed to load SMS reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleSMS = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formattedNumber = smsService.formatPhoneNumber(smsData.phoneNumber);
      
      if (!smsService.validatePhoneNumber(formattedNumber)) {
        alert('Please enter a valid Uganda phone number (+256XXXXXXXXX)');
        return;
      }

      await smsService.sendNotification(formattedNumber, smsData.message);
      alert('SMS sent successfully!');
      setSmsData(prev => ({ ...prev, phoneNumber: '', message: '' }));
    } catch (error) {
      alert('Failed to send SMS: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSMS = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const numbers = smsData.bulkNumbers
        .split('\n')
        .map(num => smsService.formatPhoneNumber(num.trim()))
        .filter(num => smsService.validatePhoneNumber(num));

      if (numbers.length === 0) {
        alert('Please enter valid Uganda phone numbers');
        return;
      }

      await smsService.sendBulkNotification(numbers, smsData.bulkMessage);
      alert(`Bulk SMS sent to ${numbers.length} recipients!`);
      setSmsData(prev => ({ ...prev, bulkNumbers: '', bulkMessage: '' }));
    } catch (error) {
      alert('Failed to send bulk SMS: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">SMS Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'send'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Send SMS
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'bulk'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bulk SMS
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'reports'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Delivery Reports
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Send Single SMS */}
          {activeTab === 'send' && (
            <form onSubmit={handleSingleSMS} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={smsData.phoneNumber}
                  onChange={(e) => setSmsData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+256 700 123 456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter Uganda phone number in international format
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={smsData.message}
                  onChange={(e) => setSmsData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your SMS message..."
                  rows={4}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {smsData.message.length}/160 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send SMS'}
              </button>
            </form>
          )}

          {/* Bulk SMS */}
          {activeTab === 'bulk' && (
            <form onSubmit={handleBulkSMS} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Numbers (one per line)
                </label>
                <textarea
                  value={smsData.bulkNumbers}
                  onChange={(e) => setSmsData(prev => ({ ...prev, bulkNumbers: e.target.value }))}
                  placeholder="+256700123456&#10;+256701234567&#10;+256702345678"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter one phone number per line in +256XXXXXXXXX format
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={smsData.bulkMessage}
                  onChange={(e) => setSmsData(prev => ({ ...prev, bulkMessage: e.target.value }))}
                  placeholder="Enter your bulk SMS message..."
                  rows={4}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {smsData.bulkMessage.length}/160 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send Bulk SMS'}
              </button>
            </form>
          )}

          {/* Delivery Reports */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent SMS Activity</h3>
                <button
                  onClick={loadDeliveryReports}
                  disabled={isLoading}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {deliveryReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block">sms</span>
                  <p>No SMS activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveryReports.map((report, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {report.phoneNumber}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'sent' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{report.message}</p>
                      <p className="text-xs text-gray-500">
                        {report.timestamp?.toDate?.()?.toLocaleString() || 'Unknown time'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SMSPanel;