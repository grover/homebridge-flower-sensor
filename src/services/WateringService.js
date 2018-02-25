'use strict';

let WaterLevel;

class WateringService {

  constructor(log, api, name, device) {
    this.log = log;
    this.name = name;
    this._device = device;

    WaterLevel = api.hap.Characteristic.WaterLevel;

    this._createService(api.hap);

    device
      .on('deviceStatusChanged', this._onDeviceStatusChanged.bind(this))
      .on('wateringStatus', this._onWateringData.bind(this));
  }

  _createService(hap) {
    this._wateringService = new hap.Service.WateringService(this.name);
  }

  getServices() {
    return [this._wateringService];
  }

  _onDeviceStatusChanged(/*deviceStatus*/) {
    // New entries, moved or started means we should refresh
    // if (deviceStatus.moved || deviceStatus.started) {
    //   this._device.requestSensorData();
    // }
  }

  _onWateringData(wateringStatus) {
    this._wateringService
      .getCharacteristic(WaterLevel)
      .updateValue(wateringStatus.waterLevel);
  }
}

module.exports = WateringService;
