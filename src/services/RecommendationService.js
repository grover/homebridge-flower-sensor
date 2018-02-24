'use strict';

const EventEmitter = require('events').EventEmitter;

const RingBuffer = require('../RingBuffer');

let TargetRelativeHumidity, TargetAmbientLightLevel, ContactSensorState, CurrentAverageRelativeHumidity, CurrentAverageAmbientLightLevel;

class RecommendationService extends EventEmitter {

  constructor(log, api, name, device, config) {
    super();

    this.log = log;
    this.name = name;

    if (config.thresholdHumiditiy === undefined) {
      this.log(`Missing thresholdHumidity value for plant recommendations. Assuming minimum humidity level of zero and recommendations will not trigger.`);
    }
    if (config.thresholdLightLevel === undefined) {
      this.log(`Missing thresholdHumidity value for plant recommendations. Assuming minimum light level of zero and recommendations will not trigger.`);
    }

    /**
     * RingBuffer for the measurements of a single day. Assume 6 samples per hour over 24 hours.
     */
    this._history = new RingBuffer(6 * 24);

    this._targetHumidity = config.thresholdHumiditiy || 0;
    this._targetLightLevel = config.thresholdLightLevel || 0;

    TargetRelativeHumidity = api.hap.Characteristic.FlowerTargetRelativeHumidity;
    TargetAmbientLightLevel = api.hap.Characteristic.TargetAmbientLightLevel;
    CurrentAverageRelativeHumidity = api.hap.Characteristic.CurrentAverageRelativeHumidity;
    CurrentAverageAmbientLightLevel = api.hap.Characteristic.CurrentAverageAmbientLightLevel;
    ContactSensorState = api.hap.Characteristic.ContactSensorState;

    this._createService(api.hap);

    device.on('sensorData', this._onSensorData.bind(this));
  }

  _createService(hap) {
    this._recommendationService = new hap.Service.RecommendationService(`${this.name} Recommendations`);

    this._recommendationService.getCharacteristic(TargetRelativeHumidity)
      .updateValue(this._targetHumidity);

    this._recommendationService.getCharacteristic(TargetAmbientLightLevel)
      .updateValue(this._targetLightLevel);

    this._lowHumiditySensor = new hap.Service.ContactSensor(`${this.name} Low Humidity`, 'humidity');
    this._lowHumiditySensor.getCharacteristic(ContactSensorState)
      .updateValue(ContactSensorState.CONTACT_DETECTED);

    this._lowAmbientLightSensor = new hap.Service.ContactSensor(`${this.name} Low Light`, 'light');
    this._lowAmbientLightSensor.getCharacteristic(ContactSensorState)
      .updateValue(ContactSensorState.CONTACT_DETECTED);
  }

  getServices() {
    return [this._recommendationService, this._lowHumiditySensor, this._lowAmbientLightSensor];
  }

  _setTargetRelativeHumidity(value, callback) {
    this._targetHumidity = value;
    callback();

    this._updateAverage();
  }

  _setTargetAmbientLightLevel(value, callback) {
    this._targetLightLevel = value;
    callback();

    this._updateAverage();
  }

  _onSensorData(sensorData) {
    this._history.push(sensorData);
    this._updateAverage();
  }

  _updateAverage() {
    const averageSensorData = this._getAverageSensorData();

    const lowLightLevelWarning = averageSensorData.lightLevel < this._targetLightLevel;
    if (lowLightLevelWarning) {
      this.log(`Low light warning - average light level ${averageSensorData.lightLevel} lux`);
    }

    const lowHumidityWarning = averageSensorData.soilMoisture < this._targetHumidity;
    if (lowHumidityWarning) {
      this.log(`Low humidity warning - average moisture ${averageSensorData.soilMoisture} %`);
    }

    this._recommendationService.getCharacteristic(CurrentAverageAmbientLightLevel)
      .updateValue(averageSensorData.lightLevel);

    this._recommendationService.getCharacteristic(CurrentAverageRelativeHumidity)
      .updateValue(averageSensorData.soilMoisture);

    this._updateSensor(this._lowAmbientLightSensor, lowLightLevelWarning);
    this._updateSensor(this._lowHumiditySensor, lowHumidityWarning);
  }

  _getAverageSensorData() {
    const oldestTimestamp = Date.now() - (24 * 60 * 60 * 1000);
    let lightLevel = 0;
    let soilMoisture = 0;
    let items = 0;

    for (const entry of this._history.filter(item => item.timestamp >= oldestTimestamp)) {
      lightLevel += entry.lightLevel;
      soilMoisture += entry.soilMoisture;
      items++;
    }

    if (items > 1) {
      lightLevel /= items;
      soilMoisture /= items;
    }

    return {
      items: items,
      lightLevel: lightLevel,
      soilMoisture: soilMoisture
    };
  }

  _updateSensor(sensor, state) {
    const value = state
      ? ContactSensorState.CONTACT_NOT_DETECTED
      : ContactSensorState.CONTACT_DETECTED;

    sensor
      .getCharacteristic(ContactSensorState)
      .updateValue(value);
  }
}

module.exports = RecommendationService;