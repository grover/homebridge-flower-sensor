'use strict';

const util = require('util');

const RetrieveFlowerPowerCalibratedDataTask = require('../parrot/RetrieveFlowerPowerCalibratedDataTask');

let CurrentAmbientLightLevel, CurrentRelativeHumidity, CurrentTemperature;

/** 
 * Refresh the plant data once per hour. Given that it lasts 180 days, this
 * should be plenty sufficient to take care of early warnings.
 */
const PLANT_DATA_REFRESH_INTERVAL = 60 * 60 * 1000;

class PlantService {

  constructor(log, api, name, executor) {
    this.log = log;
    this.name = name;
    this._executor = executor;
    this._dataTimer = undefined;

    CurrentAmbientLightLevel = api.hap.Characteristic.CurrentAmbientLightLevel;
    CurrentRelativeHumidity = api.hap.Characteristic.CurrentRelativeHumidity;
    CurrentTemperature = api.hap.Characteristic.CurrentTemperature;

    this._createService(api.hap);

    this._retrieveFlowerPowerData();
  }

  _createService(hap) {
    this._lightSensor = new hap.Service.LightSensor(this.name);
    this._humiditySensor = new hap.Service.HumiditySensor(this.name, 'soil');
    this._soilTemperatureSensor = new hap.Service.TemperatureSensor(this.name, 'soil');
  }

  getServices() {
    return [this._lightSensor, this._humiditySensor, this._soilTemperatureSensor];
  }

  newAdvertisement(deviceStatus) {
    // New entries, moved or started means we should refresh
    if (deviceStatus.unreadEntries || deviceStatus.moved || deviceStatus.started) {
      this._retrieveFlowerPowerData();
    }
  }

  async _retrieveFlowerPowerData() {
    try {
      const task = new RetrieveFlowerPowerCalibratedDataTask();
      const calibratedData = await this._executor.execute(task);
      this.log(`Retrieved calibrated data: ${util.inspect(calibratedData)}`);

      const lux = calibratedData.lightLevel * 11.574 * 53.93;
      this.log(`Lux values: Calibrated light level = ${calibratedData.lightLevel} x 11.574 x 53.93 = ${lux}lx`);

      this._lightSensor
        .getCharacteristic(CurrentAmbientLightLevel)
        .updateValue(lux);

      this._soilTemperatureSensor
        .getCharacteristic(CurrentTemperature)
        .updateValue(calibratedData.soilTemperature);

      this._humiditySensor
        .getCharacteristic(CurrentRelativeHumidity)
        .updateValue(calibratedData.soilMoisture);
    }
    catch (e) {
      this.log(`Failed to retrieve the flower power data. Error: ${util.inspect(e)}`);
    }

    this._scheduleDataRefresh();
  }
  _scheduleDataRefresh() {
    if (this._dataTimer) {
      clearTimeout(this._dataTimer);
    }

    this._dataTimer = setTimeout(this._retrieveFlowerPowerData.bind(this), PLANT_DATA_REFRESH_INTERVAL);
  }
}

module.exports = PlantService;