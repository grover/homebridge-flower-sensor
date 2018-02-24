'use strict';

const EventEmitter = require('events').EventEmitter;

const RingBuffer = require('../RingBuffer');

let TargetRelativeHumidity, TargetAmbientLightLevel, ContactSensorState;

class RecommendationService extends EventEmitter {

  constructor(log, api, name, device) {
    super();

    this.log = log;
    this.name = name;

    /**
     * RingBuffer for the measurements of a single day. Assume 6 samples per hour over 24 hours.
     */
    this._history = new RingBuffer(6 * 24);

    this._targetHumidity = 0;
    this._targetLightLevel = 0;

    TargetRelativeHumidity = api.hap.Characteristic.TargetRelativeHumidity;
    TargetAmbientLightLevel = api.hap.Characteristic.TargetAmbientLightLevel;
    ContactSensorState = api.hap.Characteristic.ContactSensorState;

    this._createService(api.hap);

    device.on('sensorData', this._onSensorData.bind(this));
  }

  _createService(hap) {
    this._recommendationService = new hap.Service.RecommendationService(this.name);
    this._recommendationService.getCharacteristic(TargetRelativeHumidity)
      .on('set', this._setTargetRelativeHumidity.bind(this));
    this._recommendationService.getCharacteristic(TargetAmbientLightLevel)
      .on('set', this._setTargetAmbientLightLevel.bind(this));

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
  }

  _setTargetAmbientLightLevel(value, callback) {
    this._targetLightLevel = value;
    callback();
  }

  _onSensorData(sensorData) {
    this._history.push(sensorData);

    this._calculateAverages();
  }

  _calculateAverages() {

    let lightLevel = 0;
    let soilMoisture = 0;

    // Do we have a full day's worth of samples?
    if (this._history.length < this._history.capacity) {
      return;
    }

    for (const entry of this._history) {
      lightLevel += entry.lightLevel;
      soilMoisture += entry.soilMoisture;
    }

    lightLevel /= this._history.capacity;
    soilMoisture /= this._history.capacity;

    this._updateSensor(this._lowAmbientLightSensor, lightLevel < this._targetLightLevel);
    this._updateSensor(this._lowHumiditySensor, soilMoisture < this._targetHumidity);
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