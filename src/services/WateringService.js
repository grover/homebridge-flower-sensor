'use strict';

const WaterPlantTask = require('../parrot/WaterPlantTask');

let On, WaterLevel;

class WateringService {

  constructor(log, api, name, device) {
    this.log = log;
    this.name = name;
    this._device = device;

    On = api.hap.Characteristic.On;
    WaterLevel = api.hap.Characteristic.WaterLevel;

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
  }

  getServices() {
    return [this._wateringService, this._waterPlantSwitch];
  }

  _onDeviceStatusChanged(/*deviceStatus*/) {
    // TODO: Look at the watering related flags
  }

  _onWateringData(wateringStatus) {
    this._wateringService
      .getCharacteristic(WaterLevel)
      .updateValue(wateringStatus.waterLevel);
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
