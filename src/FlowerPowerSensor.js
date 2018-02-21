'use strict';

const util = require('util');

let Characteristic, Service;

const RetrieveBatteryLevelTask = require('./ble/RetrieveBatteryLevelTask');

const RetrieveFlowerPowerDataTask = require('./parrot/RetrieveFlowerPowerDataTask');
const WriteLedStateTask = require('./parrot/WriteLedStateTask');

class FlowerPowerSensor {
  constructor(api, log, config, executor) {
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;

    this._config = config;
    this._executor = executor;

    this._services = this._createServices();

    // Once per day?
    this._retrieveBatteryLevel();

    // Once every 10mins for FakegatoHistory
    this._retrieveFlowerPowerData();
  }

  _createServices() {
    return [
      this._createAccessoryInformationService(),
      this._createBridgingStateService(),
      this._createBatteryService(),
      this._createLightSensor(),
      this._createAirTemperatureSensor(),
      this._createHumiditySensor(),
      this._createSoilTemperatureSensor()
    ];
  }

  _createAccessoryInformationService() {
    const info = this._config.accessoryInformation;
    this.log(`Info: ${util.inspect(info)}`);

    const firmwareVersion = this._extractVersion(info.firmwareRevision);
    const hardwareVersion = this._extractVersion(info.hardwareRevision);

    this._accessoryInformation = new Service.AccessoryInformation();
    this._accessoryInformation
      .setCharacteristic(Characteristic.Name, info.name)
      .setCharacteristic(Characteristic.Manufacturer, info.manufacturer)
      .setCharacteristic(Characteristic.Model, info.model)
      .setCharacteristic(Characteristic.SerialNumber, info.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, firmwareVersion)
      .setCharacteristic(Characteristic.HardwareRevision, hardwareVersion);

    return this._accessoryInformation;
  }

  _extractVersion(value) {
    const versionRegEx = /.*-(\d+\.{1}\d+\.?\d*)_.*/;
    try {
      return versionRegEx.exec(value)[1];
    }
    catch (e) {
      this.log(`Failed to extract version from ${value}`);
    }

    return '';
  }

  _createBridgingStateService() {
    this._bridgingService = new Service.BridgingState();

    this._bridgingService.getCharacteristic(Characteristic.Reachable)
      .updateValue(true);

    return this._bridgingService;
  }

  _createBatteryService() {
    this._batteryService = new Service.BatteryService();
    this._batteryService
      .getCharacteristic(Characteristic.ChargingState)
      .updateValue(Characteristic.ChargingState.NOT_CHARGEABLE);

    return this._batteryService;
  }

  _createLightSensor() {
    this._lightSensor = new Service.LightSensor(this.name);
    return this._lightSensor;
  }

  _createHumiditySensor() {
    this._humiditySensor = new Service.HumiditySensor(this.name);
    return this._humiditySensor;
  }

  _createAirTemperatureSensor() {
    this._airTemperatureSensor = new Service.TemperatureSensor(`${this.name} Air`, 'air');
    return this._airTemperatureSensor;
  }

  _createSoilTemperatureSensor() {
    this._soilTemperatureSensor = new Service.TemperatureSensor(`${this.name} Soil`, 'soil');
    return this._soilTemperatureSensor;
  }

  getServices() {
    return this._services;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);

    this._executor
      .execute(new WriteLedStateTask(true))
      .then(() => {
        callback();
        setTimeout(() => this._disableLED(), 5000);
      })
      .catch(e => callback(e));

  }

  _disableLED() {
    this._executor
      .execute(new WriteLedStateTask(false))
      .catch(e => {
        this.log(`Failed to disable the LED: ${util.inspect(e)}`);
      });
  }

  async _retrieveBatteryLevel() {
    try {
      const status = await this._executor.execute(new RetrieveBatteryLevelTask());
      this.log(`Retrieved battery status: ${util.inspect(status)}`);

      this._batteryService
        .getCharacteristic(Characteristic.BatteryLevel)
        .updateValue(status.level);

      const isLow = status.level < 15
        ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
        : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

      this._batteryService
        .getCharacteristic(Characteristic.StatusLowBattery)
        .updateValue(isLow);
    }
    catch (e) {
      this.log(`Failed to retrieve the battery levels. Error: ${util.inspect(e)}`);
    }
  }

  async _retrieveFlowerPowerData() {
    try {
      const task = new RetrieveFlowerPowerDataTask();
      const status = await this._executor.execute(task);
      this.log(`Retrieved data: ${util.inspect(status)}`);

      this._lightSensor
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .updateValue(status.lightLevel);

      this._soilTemperatureSensor
        .getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(status.soilTemperature);

      this._airTemperatureSensor
        .getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(status.airTemperature);

      this._humiditySensor
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .updateValue(status.soilMoisture);
    }
    catch (e) {
      this.log(`Failed to retrieve the flower power data. Error: ${util.inspect(e)}`);
    }
  }
}

module.exports = FlowerPowerSensor;
