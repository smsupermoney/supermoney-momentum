import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 193 171"
      className={className}
      fill="currentColor"
    >
      <path 
        fillRule="evenodd"
        clipRule="evenodd"
        d="M96.5 0L193 85.5L96.5 171L0 85.5L96.5 0ZM119.898 46.8571L89.6582 85.8095H124.719L110.975 112.524H146.036L96.5 157.143V117.619H66.2607L96.5 46.8571H119.898Z" 
      />
    </svg>
  );
}
