import { useQuery } from "@tanstack/react-query";
import huts from "../assets/huts.json";
import { hutAvailabilityExampleResponse } from "../assets/hutAvailabilityExampleResponse";
import { useMemo } from "react";

interface HutCardProps {
  hutId: number;
}

interface AvailabilityData {
  // freeBedsPerCategory: { [key: string]: number };
  freeBeds: number;
  hutStatus: string;
  date: string;
  dateFormatted: string;
  totalSleepingPlaces: number;
  percentage: string;
}

const fetchHutData = async (hutId: number) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return hutAvailabilityExampleResponse;
};

const AvailabilityIndicator: React.FC<{ availability: AvailabilityData }> = ({ availability }) => {
  const date = new Date(availability.date);
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  
  let statusColor = "bg-green-100 text-green-800";
  if (availability.percentage === "FULL") {
    statusColor = "bg-red-100 text-red-800";
  } else if (availability.percentage === "LIMITED") {
    statusColor = "bg-yellow-100 text-yellow-800";
  }

  return (
    <div className={`p-3 rounded-lg ${statusColor}`}>
      <div className="text-sm font-medium">{dayName}</div>
      <div className="text-xs">{availability.dateFormatted}</div>
      <div className="mt-1 text-lg font-semibold">
        {availability.freeBeds}/{availability.totalSleepingPlaces}
      </div>
      <div className="text-xs mt-1">
        {availability.hutStatus === "SERVICED" ? "🍽️" : "🏠"}
      </div>
    </div>
  );
};

const HutCard: React.FC<HutCardProps> = ({ hutId }) => {
  const { data: hutAvailability, isLoading, error } = useQuery({
    queryKey: ['hut', hutId],
    queryFn: () => fetchHutData(hutId),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const hutData = useMemo(() => huts.find(hut => hut.hutId === hutId), [hutId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-20 bg-gray-200 rounded w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-md p-4 border border-red-200">
        <p className="text-red-600">Error loading hut data</p>
      </div>
    );
  }

  if (!hutAvailability) return null;

  // Assuming the mock data includes an array of availability for the next 7 days
  const nextWeekAvailability = hutAvailability.slice(0, 7);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{hutData?.hutName}</h3>
      
      <div className="grid grid-cols-7 gap-2">
        {nextWeekAvailability.map((day: AvailabilityData) => (
          <AvailabilityIndicator 
            key={day.date} 
            availability={day}
          />
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>🍽️ Serviced</span>
          <span>🏠 Self-serviced</span>
        </div>
      </div>
    </div>
  );
};

export default HutCard; 