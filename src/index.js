
const version = require('../package.json').version;

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

    // this._createAccessories();

    noble.on('stateChange', this._onNobleStateChanged.bind(this));
    this.api.on('didFinishLaunching', this._didFinishLaunching.bind(this));
  }

  _onNobleStateChanged(state) {
    if (state === 'poweredOn' && this._accessoriesCallback) {
      this._bleBrowser.start();
    }
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
    this._bleBrowser.start();
  }

  async _onBleDeviceDiscovered(peripheral) {
    if (!FlowerPower.isFlowerPowerAdvertisement(peripheral.advertisement)) {
      return;
    }

    this.log(`Found flower power sensor "${peripheral.advertisement.localName}".`);
    const sensorConfig = this.config.sensors.find(cfg => cfg.id === peripheral.advertisement.localName);
    if (sensorConfig === undefined) {
      return;
    }

    const executor = new BleExecutor(peripheral);
    sensorConfig.accessoryInformation = await executor.execute(new RetrieveDeviceInformationTask());

    this._accessories = [
      new FlowerPowerSensor(this.api, this.log, sensorConfig, executor)
    ];

    this._accessoriesCallback(this._accessories);
  }
};