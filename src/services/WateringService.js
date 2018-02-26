'use strict';

const WaterPlantTask = require('../parrot/WaterPlantTask');

let ContactSensorState, On, WaterLevel, WateringMode, WateringStatus;

class WateringService {

  constructor(log, api, name, device) {
    this.log = log;
    this.name = name;
    this._device = device;

    ContactSensorState = api.hap.Characteristic.ContactSensorState;
    On = api.hap.Characteristic.On;
    WaterLevel = api.hap.Characteristic.WaterLevel;
    WateringMode = api.hap.Characteristic.WateringMode;
    WateringStatus = api.hap.Characteristic.WateringStatus;

    this._createService(api.hap);

    device
      .on('deviceStatusChanged', this._onDeviceStatusChanged.bind(this))
      .on('wateringStatus', this._onWateringData.bind(this));
  }

  _createService(hap) {
    this._wateringService = new hap.Service.WateringService(this.name);

    this._waterPlantSwitch = new hap.Service.Switch(`${this.name} Watering`);
    this._waterPlantSwitch.getCharacteristic(On)
      .on('set', this._waterPlant.bind(this))
      .updateValue(false)
      .displayName = 'Water Plant';

    this._wateringError = new hap.Service.ContactSensor(`${this.name} Watering Error`, 'watering-error');
  }

  getServices() {
    return [this._wateringService, this._waterPlantSwitch, this._wateringError];
  }

  _onDeviceStatusChanged(deviceStatus) {
    if (deviceStatus.lowWater === true) {
      this._device.requestWateringStatus();
    }
  }

  _onWateringData(wateringStatus) {
    this._wateringService.getCharacteristic(WaterLevel)
      .updateValue(wateringStatus.waterLevel);

    this._wateringService.getCharacteristic(WateringMode)
      .updateValue(wateringStatus.wateringMode);

    this._wateringService.getCharacteristic(WateringStatus)
      .updateValue(wateringStatus.wateringStatus);

    this._updateSensor(this._wateringError, wateringStatus.hasWateringError);
  }

  _updateSensor(sensor, state) {
    const value = state
      ? ContactSensorState.CONTACT_NOT_DETECTED
      : ContactSensorState.CONTACT_DETECTED;

    sensor.getCharacteristic(ContactSensorState)
      .updateValue(value);
  }

  async _waterPlant(value, callback) {
    if (!value) {
      callback();
    }

    try {
      await this._device.execute(new WaterPlantTask());

      setTimeout(this._resetWaterPlantSwitch.bind(this), 1000);
      callback();
    }
    catch (e) {
      callback(e);
    }
  }

  _resetWaterPlantSwitch() {
    this._waterPlantSwitch.getCharacteristic(On)
      .updateValue(false);
  }
}

module.exports = WateringService;
