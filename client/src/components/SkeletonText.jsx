import React from "react";

const SkeletonText = ({ 
  className = "", 
  width = "100%", 
  height = "1rem", 
  rounded = "rounded" 
}) => {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
};

export default SkeletonText;
