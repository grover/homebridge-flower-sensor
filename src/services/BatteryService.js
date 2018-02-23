'use strict';

let BatteryLevel, StatusLowBattery;

class BatteryService {

  constructor(log, api, device) {
    this.log = log;

    BatteryLevel = api.hap.Characteristic.BatteryLevel;
    StatusLowBattery = api.hap.Characteristic.StatusLowBattery;

    this._createService(api.hap);

    device
      .on('batteryInfoChanged', this._onBatteryInfoChanged.bind(this))
      .on('deviceStatusChanged', this._onDeviceStatusChanged.bind(this));

    this._onDeviceStatusChanged(device.getDeviceStatus());
    this._onBatteryInfoChanged(device.getBatteryInfo());
  }

  _createService(hap) {
    this._batteryService = new hap.Service.BatteryService();
    this._batteryService
      .getCharacteristic(hap.Characteristic.ChargingState)
      .updateValue(hap.Characteristic.ChargingState.NOT_CHARGEABLE);
  }

  getServices() {
    return [this._batteryService];
  }

  _onBatteryInfoChanged(batteryInfo) {
    this._batteryService
      .getCharacteristic(BatteryLevel)
      .updateValue(batteryInfo.level);
  }

  _onDeviceStatusChanged(deviceStatus) {
    const value = deviceStatus.lowBattery
      ? StatusLowBattery.BATTERY_LEVEL_LOW
      : StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this._batteryService
      .getCharacteristic(StatusLowBattery)
      .updateValue(value);
  }
}

module.exports = BatteryService;