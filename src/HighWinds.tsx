import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useWeatherData } from "./hooks";

const HighWinds: React.FC = () => {
  const latitude = 46.537;
  const longitude = 8.126;
  const { data, isLoading, error } = useWeatherData(latitude, longitude);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching weather data</p>;

  const chartData = data?.hourly.time.map((time, index) => ({
    name: time.toISOString(),
    twok: data.hourly.windSpeed800hPa[index],
    threek: data.hourly.windSpeed700hPa[index],
    fourk: data.hourly.windSpeed600hPa[index],
  }));

  return (
    <>
      <h3>Finsteraarhorn winds:</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tickCount={7} />
          <YAxis
            label={{
              value: "Wind Speed (km/h)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="fourk" stroke="#8884d8" name="2000m" />
          <Line
            type="monotone"
            dataKey="threek"
            stroke="#82ca9d"
            name="3000m"
          />
          <Line type="monotone" dataKey="twok" stroke="#ffc658" name="4000m" />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default HighWinds;
