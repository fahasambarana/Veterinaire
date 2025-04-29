import React from "react";

const DashboardCard = ({ title, value, icon, bgColor }) => {
  return (
    <div
      className={`p-7 rounded-xl shadow-md flex items-center justify-between ${bgColor} text-white`}
    >
      <div>
        <h4 className="text-lg font-medium">{title}</h4>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  );
};

export default DashboardCard;
