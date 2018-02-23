'use strict';

let CurrentAmbientLightLevel, CurrentRelativeHumidity, CurrentTemperature;

class PlantService {

  constructor(log, api, name, device) {
    this.log = log;
    this.name = name;
    this._device = device;

    CurrentAmbientLightLevel = api.hap.Characteristic.CurrentAmbientLightLevel;
    CurrentRelativeHumidity = api.hap.Characteristic.CurrentRelativeHumidity;
    CurrentTemperature = api.hap.Characteristic.CurrentTemperature;

    this._createService(api.hap);

    device
      .on('deviceStatusChanged', this._onDeviceStatusChanged.bind(this))
      .on('sensorData', this._onSensorData.bind(this));
  }

  _createService(hap) {
    this._lightSensor = new hap.Service.LightSensor(this.name);
    this._humiditySensor = new hap.Service.HumiditySensor(this.name, 'soil');
    this._soilTemperatureSensor = new hap.Service.TemperatureSensor(this.name, 'soil');
  }

  getServices() {
    return [this._lightSensor, this._humiditySensor, this._soilTemperatureSensor];
  }

  _onDeviceStatusChanged(deviceStatus) {
    // New entries, moved or started means we should refresh
    if (deviceStatus.moved || deviceStatus.started) {
      this._device.requestSensorData();
    }
  }

  _onSensorData(sensorData) {
    this._lightSensor
      .getCharacteristic(CurrentAmbientLightLevel)
      .updateValue(sensorData.lightLevel);

    this._soilTemperatureSensor
      .getCharacteristic(CurrentTemperature)
      .updateValue(sensorData.soilTemperature);

    this._humiditySensor
      .getCharacteristic(CurrentRelativeHumidity)
      .updateValue(sensorData.soilMoisture);
  }
}

module.exports = PlantService;