'use strict';

const EventEmitter = require('events').EventEmitter;

let TargetRelativeHumidity, TargetAmbientLightLevel, ContactSensorState;

class RecommendationService extends EventEmitter {

  constructor(log, api, name, device) {
    super();

    this.log = log;
    this.name = name;

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
    callback();
  }

  _setTargetAmbientLightLevel(value, callback) {
    callback();
  }

  _onSensorData(/*sensorData*/) {
  }
}

module.exports = RecommendationService;