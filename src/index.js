
const version = require('../package.json').version;
const util = require('util');

const noble = require('noble');

const BleBrowser = require('./ble/BleBrowser');
const BleExecutor = require('./ble/BleExecutor');
const RetrieveDeviceInformationTask = require('./ble/RetrieveDeviceInformationTask');

const FlowerPower = require('./parrot/FlowerPower');

const FlowerPowerSensor = require('./FlowerPowerSensor');

const HOMEBRIDGE = {
  Accessory: null,
  Service: null,
  Characteristic: null,
  UUIDGen: null
};

const platformName = 'homebridge-flower-sensor';
const platformPrettyName = 'FlowerSensors';

module.exports = (homebridge) => {
  HOMEBRIDGE.Accessory = homebridge.platformAccessory;
  HOMEBRIDGE.Service = homebridge.hap.Service;
  HOMEBRIDGE.Characteristic = homebridge.hap.Characteristic;
  HOMEBRIDGE.UUIDGen = homebridge.hap.uuid;
  HOMEBRIDGE.homebridge = homebridge;

  homebridge.registerPlatform(platformName, platformPrettyName, FlowerSensorPlatform, false);
};

const FlowerSensorPlatform = class {
  constructor(log, config, api) {
    this.log = log;
    this.log(`Flower Sensor Platform Plugin Loaded - version ${version}`);
    this.config = config;
    this.api = api;

    this._accessories = [];
    this._remotes = [];
    this._devices = {};

    this._bleBrowser = new BleBrowser(this.log, noble);
    this._bleBrowser.on('discovered', this._onBleDeviceDiscovered.bind(this));
    this._bleBrowser.start();

    this.api.on('didFinishLaunching', this._didFinishLaunching.bind(this));
  }

  _createAccessories() {
    this._accessories = this.config.sensors
      .map(sensorConfig => {
        this.log(`Found flower sensor in config: "${sensorConfig.name}"`);
        return new FlowerPowerSensor(this.api, this.log, sensorConfig, noble);
      });
  }

  _didFinishLaunching() {
    this.log('DidFinishLaunching');
  }

  accessories(callback) {
    this._accessoriesCallback = callback;
    this._tryToPublish();
  }

  async _onBleDeviceDiscovered(peripheral) {
    if (!FlowerPower.isFlowerPowerAdvertisement(peripheral.advertisement)) {
      return;
    }

    this.log(`Found flower power sensor "${peripheral.advertisement.localName}". Manufacturer Data: ${util.inspect(peripheral.advertisement.manufacturerData)}.`);
    const accessory = this._devices[peripheral.id];
    if (accessory === undefined) {
      this._devices[peripheral.id] = null;

      const sensorConfig = this._findConfigurationForPeripheral(peripheral.advertisement.localName);
      if (sensorConfig) {
        this.log(`Creating accessory for device: ${peripheral.advertisement.localName}`);
        const accessory = await this._createAccessory(peripheral, sensorConfig);

        this._devices[peripheral.id] = accessory;
        this._accessories.push(accessory);

        this._tryToPublish();
      }
    }
    else if (accessory !== null) {
      accessory.newAdvertisement(peripheral.advertisement);
    }
  }

  _findConfigurationForPeripheral(name) {
    return this.config.sensors.find(cfg => cfg.id === name);
  }

  async _createAccessory(peripheral, sensorConfig) {
    const executor = new BleExecutor(peripheral);
    sensorConfig.accessoryInformation = await executor.execute(new RetrieveDeviceInformationTask());
    return new FlowerPowerSensor(this.api, this.log, sensorConfig, executor, peripheral);
  }

  async _tryToPublish() {
    const allFound = this._allDevicesFound();
    if (allFound) {
      this._publishAccessories();
    }
    else {
      this.log('Not all accessories have their devices. Not publishing yet.');
    }
  }

  _allDevicesFound() {
    return this._accessories.length === this.config.sensors.length;
  }

  _publishAccessories() {
    if (this._accessoriesCallback) {
      this._accessoriesCallback(this._accessories);
      this._accessoriesCallback = undefined;
    }
  }
};