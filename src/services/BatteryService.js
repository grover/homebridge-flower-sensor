'use strict';

const util = require('util');
const RetrieveBatteryLevelTask = require('../ble/RetrieveBatteryLevelTask');

let BatteryLevel, StatusLowBattery;

/** 
 * Refresh the battery level every 48 hours. Given that it lasts 180 days, this
 * should be plenty sufficient to take care of early warnings.
 */
const BATTERY_LEVEL_REFRESH_INTERVAL = 36 * 60 * 60 * 1000;

class BatteryService {

  constructor(log, api, executor) {
    this.log = log;
    this._executor = executor;
    this._batteryTimer = undefined;

    BatteryLevel = api.hap.Characteristic.BatteryLevel;
    StatusLowBattery = api.hap.Characteristic.StatusLowBattery;

    this._createService(api.hap);

    this._retrieveBatteryLevel();
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

  newAdvertisement(deviceStatus) {
    this._signalLowBatteryWarning(deviceStatus.lowBattery);
  }

  _signalLowBatteryWarning(isLow) {
    const value = isLow
      ? StatusLowBattery.BATTERY_LEVEL_LOW
      : StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this._batteryService
      .getCharacteristic(StatusLowBattery)
      .updateValue(value);
  }

  async _retrieveBatteryLevel() {
    try {
      const status = await this._executor.execute(new RetrieveBatteryLevelTask());
      this.log(`Retrieved battery status: ${util.inspect(status)}`);

      this._batteryService
        .getCharacteristic(BatteryLevel)
        .updateValue(status.level);
    }
    catch (e) {
      this.log(`Failed to retrieve the battery levels.Error: ${util.inspect(e)}`);
    }

    this._scheduleBatteryRefresh();
  }

  _scheduleBatteryRefresh() {
    if (this._batteryTimer) {
      clearTimeout(this._batteryTimer);
    }

    this._batteryTimer = setTimeout(this._retrieveBatteryLevel.bind(this), BATTERY_LEVEL_REFRESH_INTERVAL);
  }
}

module.exports = BatteryService;