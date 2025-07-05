import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 193 171"
      className={className}
      fill="currentColor"
    >
      <defs>
        <path
          id="s-shape-for-mask"
          d="M119.898 46.8571L89.6582 85.8095H124.719L110.975 112.524H146.036L96.5 157.143V117.619H66.2607L96.5 46.8571H119.898Z"
        />
        <mask id="s-mask">
          <rect width="100%" height="100%" fill="white" />
          <use href="#s-shape-for-mask" fill="black" />
        </mask>
      </defs>
      <path 
        d="M96.5 0L193 85.5L96.5 171L0 85.5L96.5 0Z"
        mask="url(#s-mask)"
      />
    </svg>
  );
}
