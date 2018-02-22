'use strict';

const util = require('util');
const EventEmitter = require('events').EventEmitter;

const RetrieveFlowerPowerCalibratedDataTask = require('../parrot/RetrieveFlowerPowerCalibratedDataTask');

let CurrentAmbientLightLevel, CurrentRelativeHumidity, CurrentTemperature;

/** 
 * Refresh the plant data every 10 minutes. Given that it lasts 180 days, this
 * should be plenty sufficient to take care of early warnings.
 */
const PLANT_DATA_REFRESH_INTERVAL = 10 * 60 * 1000;

class PlantService extends EventEmitter {

  constructor(log, api, name, executor) {
    super();

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
    if (deviceStatus.moved || deviceStatus.started) {
      this._retrieveFlowerPowerData();
    }
  }

  async _retrieveFlowerPowerData() {
    try {
      const task = new RetrieveFlowerPowerCalibratedDataTask();
      const calibratedData = await this._executor.execute(task);
      const lux = this._getLightLevelInLux(calibratedData.lightLevel);

      this._lightSensor
        .getCharacteristic(CurrentAmbientLightLevel)
        .updateValue(lux);

      this._soilTemperatureSensor
        .getCharacteristic(CurrentTemperature)
        .updateValue(calibratedData.soilTemperature);

      this._humiditySensor
        .getCharacteristic(CurrentRelativeHumidity)
        .updateValue(calibratedData.soilMoisture);

      this.emit('updated');
    }
    catch (e) {
      this.log(`Failed to retrieve the flower power data. Error: ${util.inspect(e)}`);
    }

    this._scheduleDataRefresh();
  }

  _getLightLevelInLux(lightLevel) {
    // Factor 4659.293 was determined by sampling the lux conversion done by the Parrot app on iOS
    // over the course of several days.
    const ParrotFactor = 4659.293;
    const LowerLuxThreshold = 500.0;

    let lux = lightLevel * ParrotFactor;
    if (lux < LowerLuxThreshold) {
      lux = 0;
    }

    return lux;
  }

  _scheduleDataRefresh() {
    if (this._dataTimer) {
      clearTimeout(this._dataTimer);
    }

    this._dataTimer = setTimeout(this._retrieveFlowerPowerData.bind(this), PLANT_DATA_REFRESH_INTERVAL);
  }
}

module.exports = PlantService;