
'use strict';

const debug = require('debug')('flower:ble');

const BleUtils = require('../ble/BleUtils');

const FLOWER_POWER_LIVE_SERVICE_UUID = '39e1fa0084a811e2afba0002a5d5c51b';

/** 
 * Must keep these sorted as they're used sorted.
 */
const LiveCharacteristics = [
  '39e1fa0384a811e2afba0002a5d5c51b', // FLOWER_POWER_SOIL_TEMP_CHARACTERISTIC_UUID (not calibrated)
  '39e1fa0984a811e2afba0002a5d5c51b', // FLOWER_POWER_SOIL_VWC_CHARACTERISTIC_UUID
  '39e1fa0a84a811e2afba0002a5d5c51b', // FLOWER_POWER_AIR_TEMP_CHARACTERISTIC_UUID
  '39e1fa0b84a811e2afba0002a5d5c51b', // FLOWER_POWER_LIGHT_LEVEL_CHARACTERISTIC_UUID
];

class RetrieveFlowerPowerCalibratedDataTask {
  constructor() {
  }

  async execute(peripheral) {
    const [service] = await BleUtils.discoverServices(peripheral, [FLOWER_POWER_LIVE_SERVICE_UUID]);
    debug('Discovered flower power live service');

    const [soilTemp, soilMoisture, airTemp, lightLevel] =
      await BleUtils.discoverCharacteristics(service, LiveCharacteristics);
    debug('Discovered characteristics');

    const rawSoilTemp = await BleUtils.readCharacteristic(soilTemp);
    const rawSoilMoisture = await BleUtils.readCharacteristic(soilMoisture);
    const rawAirTemp = await BleUtils.readCharacteristic(airTemp);
    const rawLightLevel = await BleUtils.readCharacteristic(lightLevel);

    return {
      lightLevel: rawLightLevel.readFloatLE(0),
      soilTemperature: this._convertTemperatureData(rawSoilTemp),
      airTemperature: rawAirTemp.readFloatLE(0),
      soilMoisture: rawSoilMoisture.readFloatLE(0),
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