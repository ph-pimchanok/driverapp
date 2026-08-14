import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

export const WeatherCard: React.FC = () => {
  const [temp, setTemp] = useState<number | null>(null);
  const [conditionText, setConditionText] = useState("กำลังโหลด...");
  const [locationName, setLocationName] = useState("กำลังหาตำแหน่ง...");
  const [weatherIcon, setWeatherIcon] = useState<keyof typeof Ionicons.glyphMap>("partly-sunny");
  const [weatherIconColor, setWeatherIconColor] = useState("#f59e0b");

  const updateWeatherIcon = (code: number, isDay: number) => {
    if (code === 1000) {
      setWeatherIcon(isDay === 1 ? "sunny" : "moon");
      setWeatherIconColor(isDay === 1 ? "#f59e0b" : "#94a3b8");
    } else if (code === 1003) {
      setWeatherIcon(isDay === 1 ? "partly-sunny" : "cloudy-night");
      setWeatherIconColor("#f59e0b");
    } else if (code === 1006 || code === 1009 || code === 1030 || code === 1135) {
      setWeatherIcon("cloud");
      setWeatherIconColor("#64748b");
    } else if ((code >= 1063 && code <= 1201) || (code >= 1240 && code <= 1252)) {
      setWeatherIcon("rainy");
      setWeatherIconColor("#0284c7");
    } else if (code === 1087 || (code >= 1273 && code <= 1282)) {
      setWeatherIcon("thunderstorm");
      setWeatherIconColor("#8b5cf6");
    } else {
      setWeatherIcon("partly-sunny");
      setWeatherIconColor("#f59e0b");
    }
  };

  useEffect(() => {
    const fetchWeatherByCurrentLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setConditionText("ถูกปฏิเสธการเข้าถึงตำแหน่ง");
          setLocationName("กรุงเทพมหานคร");
          fetchWeather("Bangkok");
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = location.coords;

        const apiKey = "1519f53aec7c4b298d7173547261108";
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}&lang=th`
        );
        const data = await response.json();

        if (data && data.current) {
          setTemp(data.current.temp_c);
          setConditionText(data.current.condition.text);
          setLocationName(data.location.name);
          updateWeatherIcon(data.current.condition.code, data.current.is_day);
        }
      } catch (error) {
        console.error("Failed to fetch location or weather", error);
        setConditionText("ไม่สามารถโหลดสภาพอากาศได้");
        setLocationName("พื้นที่ปัจจุบัน");
      }
    };

    const fetchWeather = async (city: string) => {
      try {
        const apiKey = "1519f53aec7c4b298d7173547261108";
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&lang=th`
        );
        const data = await response.json();
        if (data && data.current) {
          setTemp(data.current.temp_c);
          setConditionText(data.current.condition.text);
          setLocationName(data.location.name);
          updateWeatherIcon(data.current.condition.code, data.current.is_day);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchWeatherByCurrentLocation();
  }, []);

  return (
    <View style={styles.weatherCard}>
      <View style={styles.weatherLeft}>
        <View style={styles.weatherIconContainer}>
          <Ionicons name={weatherIcon} size={26} color={weatherIconColor} />
        </View>
        <View style={styles.weatherTextContainer}>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={13} color="#0284c7" />
            <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
          </View>
          <Text style={styles.conditionText} numberOfLines={1}>{conditionText}</Text>
        </View>
      </View>
      <Text style={styles.temperatureText}>
        {temp !== null ? `${Math.round(temp)}°` : "--°"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  weatherCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  weatherLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  weatherIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  weatherTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284c7",
    marginLeft: 2,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginTop: 2,
  },
  temperatureText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
  },
});