
const version = require('../package.json').version;
const util = require('util');

const noble = require('noble');

const SequentialTaskQueue = require('sequential-task-queue').SequentialTaskQueue;

const RecommendationServiceTypes = require('./hap/RecommendationServiceTypes');
const StatusServiceTypes = require('./hap/StatusServiceTypes');
const WateringServiceTypes = require('./hap/WateringServiceTypes');

const BleBrowser = require('./ble/BleBrowser');
const BleExecutor = require('./ble/BleExecutor');

const DeviceFactory = require('./DeviceFactory');

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

    this._bleExecutor = new BleExecutor(this._bleBrowser);

    this._queue = new SequentialTaskQueue();

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

  _onBleDeviceDiscovered(peripheral) {
    if (!DeviceFactory.isSupportedDevice(peripheral.advertisement)) {
      return;
    }

    const sensorConfig = this._findConfigurationForPeripheral(peripheral.advertisement.localName);
    if (!sensorConfig) {
      return;
    }

    this.log(`Found sensor "${peripheral.advertisement.localName}". Manufacturer Data: ${util.inspect(peripheral.advertisement.manufacturerData)}.`);
    let device = this._devices[peripheral.id];
    if (device === undefined) {
      this._queue.push(this._createDevice.bind(this, peripheral, sensorConfig));
    }
    else {
      device.newAdvertisement(peripheral.advertisement);
    }
  }

  async _createDevice(peripheral, sensorConfig) {
    let device = this._devices[peripheral.id];
    if (device !== undefined) {
      // Might've already been created
      return;
    }

    this.log('Creating device');
    try {
      device = await DeviceFactory.createDevice(this._bleExecutor, peripheral);
      this._devices[peripheral.id] = device;

      this.log(`Creating accessory for device: ${peripheral.advertisement.localName}`);
      const accessory = await this._createAccessory(device, sensorConfig);
      this._accessories.push(accessory);
      this._tryToPublish();
    }
    catch (e) {
      this.log(`Failed to create device: ${util.inspect(e)}`);
      this._devices[peripheral.id] = undefined;
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
