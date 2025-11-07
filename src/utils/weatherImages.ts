// src/utils/weatherImages.ts

import sunny from '../assets/images/icon-sunny.webp'
import rainy from '../assets/images/icon-rain.webp'
import foggy from '../assets/images/icon-fog.webp'
import cloudy from '../assets/images/icon-partly-cloudy.webp'
import storm from '../assets/images/icon-storm.webp'
import drizzle from '../assets/images/icon-drizzle.webp'
import overcast from '../assets/images/icon-overcast.webp'
import snow from '../assets/images/icon-snow.webp'

export const weatherImages: Record<string, string> = {
  clear: sunny,
  sunny,
  clouds: cloudy,
  cloudy,
  rain: rainy,
  drizzle: drizzle,
  thunderstorm: storm,
  storm,
  mist: foggy,
  fog: foggy,
  haze: foggy,
  overcast: overcast,
  snow: snow,
}
