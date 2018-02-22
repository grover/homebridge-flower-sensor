'use strict';

const util = require('util');

let Characteristic, Service;

const FlowerPower = require('./parrot/FlowerPower');

const WriteLedStateTask = require('./parrot/WriteLedStateTask');

const BatteryService = require('./services/BatteryService');
const PlantService = require('./services/PlantService');
const StatusService = require('./services/StatusService');

class FlowerPowerSensor {
  constructor(api, log, config, executor, peripheral) {
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.api = api;
    this.log = log;
    this.name = config.name;
    this.displayName = this.name;

    this._config = config;
    this._executor = executor;
    this._peripheral = peripheral;
    this._deviceInfo = FlowerPower.getDeviceInformation(peripheral.advertisement.manufacturerData);

    this._services = this._createServices();

    this.newAdvertisement(peripheral.advertisement);
  }

  newAdvertisement(advertisement) {
    this.log(`Advertisement changed? old=${util.inspect(this._peripheral.advertisement.manufacturerData)}, new=${util.inspect(advertisement.manufacturerData)}`);

    const deviceStatus = FlowerPower.getDeviceStatus(advertisement.manufacturerData);
    this._batteryService.newAdvertisement(deviceStatus);
    this._plantService.newAdvertisement(deviceStatus);
  }

  _createServices() {
    return [
      this._createAccessoryInformationService(),
      this._createBridgingStateService(),
      ...this._createBatteryService(),
      ...this._createPlantService(),
      ...this._createStatusService()
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
      .setCharacteristic(Characteristic.Model, this._deviceInfo.type)
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
    this._batteryService = new BatteryService(this.log, this.api, this._executor);
    return this._batteryService.getServices();
  }

  _createPlantService() {
    this._plantService = new PlantService(this.log, this.api, this.name, this._executor);
    this._plantService
      .on('updated', this._onPlantDataUpdated.bind(this));

    return this._plantService.getServices();
  }

  _createStatusService() {
    this._statusService = new StatusService(this.log, this.api, this.name, this._executor);
    return this._statusService.getServices();
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

  _onPlantDataUpdated() {
    this._statusService.setLastUpdated();
  }
}

module.exports = FlowerPowerSensor;