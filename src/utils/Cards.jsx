import React from "react";

const Cards = ({reasons}) => {
    if (reasons.length === 0) {
      return <p className="text-sm text-gray-500">No reasons to show yet.</p>;
    }
  
    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r, idx) => (
            <div
              key={idx}
              className="
                group relative overflow-hidden rounded-2xl border border-emerald-100
                bg-white/80 backdrop-blur-sm shadow-sm transition
               
              "
            >
              {/* Accent bar (teal → emerald gradient) */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500"
              />
      
              <div className="p-5">
                {/* Optional icon */}
                {r.icon && (
                  <div
                    className="
                      mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl
                      bg-gradient-to-br from-teal-50 to-emerald-50
                      text-teal-600
                    "
                  >
                    {r.icon}
                  </div>
                )}
      
                {/* Title / Reason */}
                <h3 className="text-base font-semibold text-gray-900 ">
                  {r.reason || r.feature}
                </h3>
      
                {/* Description */}
                {r.description && (
                  <p className="mt-2 text-sm leading-6 text-gray-600 ">
                    {r.description}
                  </p>
                )}
      
               
              </div>
      
              {/* Soft teal/green glow on hover */}
              <div
                aria-hidden="true"
                className="
                  pointer-events-none absolute -inset-20 rounded-[3rem]
                  bg-gradient-to-tr from-teal-100 via-emerald-100 to-green-100
                  opacity-0 blur-2xl transition group-hover:opacity-40
                  dark:from-teal-700/30 dark:via-emerald-700/20 dark:to-green-700/20
                "
              />
            </div>
          ))}
        </div>
      </div>
      
    );
};
   
export default Cards