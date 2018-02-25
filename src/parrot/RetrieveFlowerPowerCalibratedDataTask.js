'use strict';

const FLOWER_POWER_SOIL_EC_CHARACTERISTIC_UUID = '39e1fa0284a811e2afba0002a5d5c51b';
const FLOWER_POWER_SOIL_TEMP_CHARACTERISTIC_UUID = '39e1fa0384a811e2afba0002a5d5c51b';
const FLOWER_POWER_SOIL_VWC_CHARACTERISTIC_UUID = '39e1fa0984a811e2afba0002a5d5c51b';
const FLOWER_POWER_AIR_TEMP_CHARACTERISTIC_UUID = '39e1fa0a84a811e2afba0002a5d5c51b';
const FLOWER_POWER_LIGHT_LEVEL_CHARACTERISTIC_UUID = '39e1fa0b84a811e2afba0002a5d5c51b';

class RetrieveFlowerPowerCalibratedDataTask {
  constructor() {
  }

  async execute(device) {
    const soilEc = await device.readCharacteristic(FLOWER_POWER_SOIL_EC_CHARACTERISTIC_UUID);
    const lightLevel = await device.readCharacteristic(FLOWER_POWER_LIGHT_LEVEL_CHARACTERISTIC_UUID);
    const soilTemperature = await device.readCharacteristic(FLOWER_POWER_SOIL_TEMP_CHARACTERISTIC_UUID);
    const airTemperature = await device.readCharacteristic(FLOWER_POWER_AIR_TEMP_CHARACTERISTIC_UUID);
    const soilMoisture = await device.readCharacteristic(FLOWER_POWER_SOIL_VWC_CHARACTERISTIC_UUID);

    return {
      soilEc: soilEc.readUInt16LE(),
      lightLevel: lightLevel.readFloatLE(0),
      soilTemperature: this._convertTemperatureData(soilTemperature),
      airTemperature: airTemperature.readFloatLE(0),
      soilMoisture: soilMoisture.readFloatLE(0),
    };
  }

  _convertTemperatureData(data) {
    const rawValue = data.readUInt16LE(0) * 1.0;

    let temperature = 0.00000003044 * Math.pow(rawValue, 3.0) - 0.00008038 * Math.pow(rawValue, 2.0) + rawValue * 0.1149 - 30.449999999999999;
    if (temperature < -10.0) {
      temperature = -10.0;
    } else if (temperature > 55.0) {
      temperature = 55.0;
    }

    return temperature;
  }
}

module.exports = RetrieveFlowerPowerCalibratedDataTask;