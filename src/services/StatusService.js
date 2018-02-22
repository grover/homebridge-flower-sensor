'use strict';

const util = require('util');
const RetrieveTimestampsTask = require('../parrot/RetrieveTimestampsTask');

const moment = require('moment');

let Characteristic;

const preferredFormat = 'L LT';

class SensorStatusService {

  constructor(log, api, name, executor) {
    this.log = log;
    this.name = name;
    this._executor = executor;

    Characteristic = api.hap.Characteristic;

    this._createService(api.hap);

    this._retrieveTimestamps();
  }

  _createService(hap) {
    this._statusService = new hap.Service.SensorStatusService(this.name);
  }

  getServices() {
    return [this._statusService];
  }

  newAdvertisement(deviceStatus) {
    // TODO: Last Move
    // TODO: Restart
  }

  setLastUpdated() {
    this._statusService
      .getCharacteristic(Characteristic.LastUpdated)
      .updateValue(moment().format(preferredFormat));
  }

  async _retrieveTimestamps() {
    try {
      const status = await this._executor.execute(new RetrieveTimestampsTask());
      this.log(`Retrieved timestamps: ${util.inspect(status)}`);

      const now = moment();

      if (status.uptime) {
        const uptime = moment.duration(status.uptime, 's');
        const lastBatteryChange = now.subtract(uptime).format(preferredFormat);

        this._statusService
          .getCharacteristic(Characteristic.LastBatteryChange)
          .updateValue(lastBatteryChange);
      }

      if (status.lastMoved) {
        const moveTime = moment.duration(status.lastMoved);
        const lastMoved = now.subtract(uptime).add(moveTime).format(preferredFormat);

        this._statusService
          .getCharacteristic(Characteristic.LastMoved)
          .updateValue(lastMoved);
      }
    }
    catch (e) {
      this.log(`Failed to retrieve the battery levels.Error: ${util.inspect(e)}`);
    }
  }
}

module.exports = SensorStatusService;