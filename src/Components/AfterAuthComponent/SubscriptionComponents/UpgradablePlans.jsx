import { Check, ChevronRight, CreditCard, Info, Smartphone, X } from 'lucide-react';
import React from 'react'
import ComparisonTable from './ComparisonTable';
import PaymentMethods from './PaymentMethods';

const UpgradablePlans = ({upgradablePlans, selectedUpgrade, setSelectedUpgrade, rupee, setShowComparison, showComparison , allFeatures, currentPlan, setPaymentMethod, paymentMethod}) => {
  return (
    <div>
      {upgradablePlans.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upgrade Your Plan</h2>
            <p className="text-sm text-gray-600 mt-1">Get more features and increase your limits</p>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {upgradablePlans.map((plan) => {
                const isSelected = selectedUpgrade?.name === plan.name;
                const isEnterprise = typeof plan.pricing !== "number";

                return (
                  <button
                    key={plan.name}
                    onClick={() => !isEnterprise && setSelectedUpgrade(plan)}
                    className={`text-left p-5 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{plan.description}</p>
                    </div>

                    <div className="mb-4">
                      {isEnterprise ? (
                        <div className="text-xl font-bold text-gray-900">Custom Pricing</div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-gray-900">
                              {rupee(plan.pricing)}
                            </span>
                            <span className="text-gray-600 text-sm">/month</span>
                          </div>
                          <div className="text-xs text-green-600 font-medium mt-1">
                            +{rupee(plan.pricing - (currentPlan?.pricing || 0))} from current plan
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      {(plan.features || []).slice(0, 4).map((feature) => (
                        <div key={feature} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-700">{feature}</span>
                        </div>
                      ))}
                      {(plan.features || []).length > 4 && (
                        <div className="text-xs text-gray-500">+{(plan.features || []).length - 4} more features</div>
                      )}
                    </div>

                    {isEnterprise && (
                      <div className="mt-4">
                        <a href="#contact-sales" className="text-sm text-green-600 font-medium hover:text-green-700">
                          Contact Sales →
                        </a>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Comparison Toggle */}
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium mb-6"
            >
              <Info className="w-4 h-4" />
              {showComparison ? "Hide" : "Show"} detailed comparison
            </button>

            {/* Comparison Table */}
            <ComparisonTable 
                showComparison={showComparison} 
                upgradablePlans={upgradablePlans} 
                currentPlan={currentPlan}
                allFeatures={allFeatures}
            />

            {/* Payment Methods */}
            {/* <PaymentMethods
                selectedUpgrade={selectedUpgrade}
                setPaymentMethod={setPaymentMethod}
                paymentMethod={paymentMethod}
                rupee={rupee}
                currentPlan={currentPlan}
            /> */}
          </div>
        </div>
      )}
    </div>
  )
}

export default UpgradablePlans
