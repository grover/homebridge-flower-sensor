
const version = require('../package.json').version;
const util = require('util');

const noble = require('noble');

const RecommendationServiceTypes = require('./hap/RecommendationServiceTypes');
const StatusServiceTypes = require('./hap/StatusServiceTypes');
const WateringServiceTypes = require('./hap/WateringServiceTypes');

const BleBrowser = require('./ble/BleBrowser');
const BleExecutor = require('./ble/BleExecutor');

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

  RecommendationServiceTypes.registerWith(homebridge.hap);
  StatusServiceTypes.registerWith(homebridge.hap);
  WateringServiceTypes.registerWith(homebridge.hap);

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
    let device = this._devices[peripheral.id];
    if (device === undefined) {
      this.log('Creating executor');
      const executor = new BleExecutor(peripheral, this._bleBrowser);
      this._devices[peripheral.id] = null;

      this.log('Creating device');
      device = await FlowerPower.createDevice(executor, peripheral);
      this._devices[peripheral.id] = device;

      const sensorConfig = this._findConfigurationForPeripheral(peripheral.advertisement.localName);
      if (sensorConfig) {
        this.log(`Creating accessory for device: ${peripheral.advertisement.localName}`);
        const accessory = await this._createAccessory(device, sensorConfig);
        this._accessories.push(accessory);
        this._tryToPublish();
      }
      else {
        this.log(`No device configured for ${util.inspect(peripheral)}`);
      }
    }
    else if (device !== null) {
      device.newAdvertisement(peripheral.advertisement);
    }
  }

  _findConfigurationForPeripheral(name) {
    return this.config.sensors.find(cfg => cfg.id === name);
  }

  async _createAccessory(device, sensorConfig) {
    return new FlowerPowerSensor(this.api, this.log, sensorConfig, device);
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
