'use strict';

let Characteristic, Service;

const BatteryService = require('./services/BatteryService');
const PlantService = require('./services/PlantService');
const StatusService = require('./services/StatusService');
const RecommendationService = require('./services/RecommendationService');

class FlowerPowerSensor {
  constructor(api, log, config, device) {
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.api = api;
    this.log = log;
    this.name = config.name;
    this.displayName = this.name;
    this._config = config;
    this._device = device;

    this._services = this._createServices();
  }

  _createServices() {
    return [
      this._createAccessoryInformationService(),
      this._createBridgingStateService(),
      ...this._createBatteryService(),
      ...this._createPlantService(),
      ...this._createStatusService(),
      ...this._createRecommendationService()
    ];
  }

  _createAccessoryInformationService() {
    const info = this._device.getAccessoryInformation();

    this._accessoryInformation = new Service.AccessoryInformation();
    this._accessoryInformation
      .setCharacteristic(Characteristic.Name, info.name)
      .setCharacteristic(Characteristic.Manufacturer, info.manufacturer)
      .setCharacteristic(Characteristic.Model, info.model)
      .setCharacteristic(Characteristic.SerialNumber, info.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, info.firmwareRevision)
      .setCharacteristic(Characteristic.HardwareRevision, info.hardwareRevision);

    return this._accessoryInformation;
  }

  _createBridgingStateService() {
    this._bridgingService = new Service.BridgingState();

    this._bridgingService.getCharacteristic(Characteristic.Reachable)
      .updateValue(true);

    return this._bridgingService;
  }

  _createBatteryService() {
    this._batteryService = new BatteryService(this.log, this.api, this._device);
    return this._batteryService.getServices();
  }

  _createPlantService() {
    this._plantService = new PlantService(this.log, this.api, this.name, this._device);
    return this._plantService.getServices();
  }

  _createStatusService() {
    this._statusService = new StatusService(this.log, this.api, this.name, this._device);
    return this._statusService.getServices();
  }

  _createRecommendationService() {
    if (!this._config.recommendations) {
      return [];
    }

    this._recommendationService = new RecommendationService(this.log, this.api, this.name, this._device, this._config);
    return this._recommendationService.getServices();
  }

  getServices() {
    return this._services;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);

    this._device.identify()
      .then(callback)
      .catch(callback);
  }
}

module.exports = FlowerPowerSensor;
