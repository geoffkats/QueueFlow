import React from 'react';

const EmptyQueueState = ({ userType = 'operator', serviceType = 'hospital' }) => {
  const getEmptyStateContent = () => {
    const serviceMessages = {
      hospital: {
        title: "No Patients in Queue",
        subtitle: "Great! All patients have been served efficiently.",
        recommendations: [
          "Use this quiet time to prepare for the next rush hour",
          "Review patient feedback to improve service quality",
          "Check medical supplies and equipment readiness",
          "Update patient records and documentation"
        ],
        benefits: [
          "Zero waiting time for walk-in patients",
          "Reduced overcrowding in waiting areas",
          "Staff can focus on quality care delivery"
        ],
        icon: "local_hospital",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50"
      },
      bank: {
        title: "No Customers in Queue",
        subtitle: "Excellent service delivery - all customers served!",
        recommendations: [
          "Prepare for peak hours (10 AM - 2 PM typically)",
          "Review transaction reports and daily targets",
          "Organize cash and update system records",
          "Train staff on new banking procedures"
        ],
        benefits: [
          "Immediate service for walk-in customers",
          "Reduced crowding in banking hall",
          "Time for staff development and training"
        ],
        icon: "account_balance",
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      },
      office: {
        title: "No Citizens in Queue",
        subtitle: "All service requests processed efficiently!",
        recommendations: [
          "Prepare documents for common service requests",
          "Review and update service delivery procedures",
          "Check system connectivity and equipment",
          "Plan for peak service hours"
        ],
        benefits: [
          "Instant service for urgent government needs",
          "Reduced bureaucratic delays",
          "Improved citizen satisfaction"
        ],
        icon: "business",
        color: "text-purple-600",
        bgColor: "bg-purple-50"
      }
    };

    return serviceMessages[serviceType] || serviceMessages.hospital;
  };

  const content = getEmptyStateContent();

  if (userType === 'customer') {
    return (
      <div className="text-center py-12 px-6">
        <div className={`w-20 h-20 ${content.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <span className={`material-symbols-outlined text-4xl ${content.color}`}>
            {content.icon}
          </span>
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2">You're First in Line!</h3>
        <p className="text-on-surface-variant mb-6">
          No queue ahead of you - you'll be served immediately when you arrive.
        </p>
        <div className={`${content.bgColor} rounded-lg p-4 mb-6`}>
          <p className={`text-sm font-semibold ${content.color} mb-2`}>Benefits of Smart Queue:</p>
          <ul className="text-xs text-gray-700 space-y-1">
            {content.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-8">
      <div className={`w-24 h-24 ${content.bgColor} rounded-full flex items-center justify-center mx-auto mb-8`}>
        <span className={`material-symbols-outlined text-5xl ${content.color}`}>
          {content.icon}
        </span>
      </div>
      
      <h2 className="text-2xl font-bold text-on-surface mb-3">{content.title}</h2>
      <p className="text-on-surface-variant text-lg mb-8">{content.subtitle}</p>
      
      {/* Impact Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-low rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">0 min</div>
          <div className="text-xs text-on-surface-variant uppercase tracking-wider">Wait Time</div>
        </div>
        <div className="bg-surface-container-low rounded-lg p-4">
          <div className="text-2xl font-bold text-tertiary">100%</div>
          <div className="text-xs text-on-surface-variant uppercase tracking-wider">Efficiency</div>
        </div>
        <div className="bg-surface-container-low rounded-lg p-4">
          <div className="text-2xl font-bold text-secondary">Ready</div>
          <div className="text-xs text-on-surface-variant uppercase tracking-wider">Status</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-surface-container-lowest rounded-xl p-6 mb-8 text-left">
        <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">lightbulb</span>
          Recommended Actions
        </h3>
        <ul className="space-y-3">
          {content.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-on-surface-variant">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* System Benefits */}
      <div className={`${content.bgColor} rounded-xl p-6 text-left`}>
        <h3 className={`font-bold ${content.color} mb-4 flex items-center gap-2`}>
          <span className="material-symbols-outlined">trending_up</span>
          SmartQueue Impact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-800 text-sm mb-2">For Service Providers:</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Reduced overcrowding and stress</li>
              <li>• Better resource planning with data</li>
              <li>• Improved staff productivity</li>
              <li>• Enhanced service quality</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm mb-2">For Citizens:</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Transparent waiting times</li>
              <li>• Priority for vulnerable groups</li>
              <li>• Reduced time wastage</li>
              <li>• Improved service experience</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-sm text-primary font-medium">
          Ready to serve the next {serviceType === 'hospital' ? 'patient' : serviceType === 'bank' ? 'customer' : 'citizen'}! 
          Your efficient service delivery is making a difference in Uganda.
        </p>
      </div>
    </div>
  );
};

export default EmptyQueueState;