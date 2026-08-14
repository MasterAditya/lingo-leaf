export default function LingoLeafLogo({ size = 32 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Leaf shape with bird silhouette */}
      <path 
        d="M16 2C16 2 8 8 8 16C8 22 12 26 16 30C20 26 24 22 24 16C24 8 16 2 16 2Z" 
        fill="url(#leafGradient)"
      />
      {/* Bird silhouette in leaf */}
      <path 
        d="M16 8C14 8 12 10 12 12C12 14 13 15 14 16C13 17 12 18 12 20C12 22 14 24 16 24C18 24 20 22 20 20C20 18 19 17 18 16C19 15 20 14 20 12C20 10 18 8 16 8Z" 
        fill="#fff"
        opacity="0.3"
      />
      {/* Bird eye */}
      <circle cx="14" cy="11" r="1" fill="#fff" opacity="0.8"/>
      {/* Leaf vein */}
      <path 
        d="M16 6V28" 
        stroke="#fff" 
        strokeWidth="1" 
        opacity="0.3"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="leafGradient" x1="8" y1="2" x2="24" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981"/>
          <stop offset="1" stopColor="#059669"/>
        </linearGradient>
      </defs>
    </svg>
  );
}