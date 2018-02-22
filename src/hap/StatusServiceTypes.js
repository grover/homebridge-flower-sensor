'use strict';

const util = require('util');

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;
    const Service = hap.Service;

    //////////////////////////////////////////////////////////////////////////////////////////
    // From homebridge-hue: LastUpdated
    //////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.LastUpdated = function () {
      Characteristic.call(this, 'Last Updated', Characteristic.LastUpdated.UUID);
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    util.inherits(Characteristic.LastUpdated, Characteristic);
    Characteristic.LastUpdated.UUID = '00000023-0000-1000-8000-656261617577';

    //////////////////////////////////////////////////////////////////////////////////////////
    // LastBatteryChange
    //////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.LastBatteryChange = function () {
      Characteristic.call(this, 'Last Battery Change', Characteristic.LastBatteryChange.UUID);
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    util.inherits(Characteristic.LastBatteryChange, Characteristic);
    Characteristic.LastBatteryChange.UUID = '9EE4FBB0-36E5-4AAE-97DF-FCAA0D4E9011';

    //////////////////////////////////////////////////////////////////////////////////////////
    // LastMoved
    //////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.LastMoved = function () {
      Characteristic.call(this, 'Last Moved', Characteristic.LastMoved.UUID);
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    util.inherits(Characteristic.LastMoved, Characteristic);
    Characteristic.LastMoved.UUID = '49C2564B-1B51-419E-924D-71129D226ACA';

    ////////////////////////////////////////////////////////////////////////////
    // SensorStatusService
    ////////////////////////////////////////////////////////////////////////////
    Service.SensorStatusService = function (displayName, subtype) {
      Service.call(this, displayName, Service.SensorStatusService.UUID, subtype);

      this.addOptionalCharacteristic(Characteristic.Name);

      // Required Characteristics
      this.addCharacteristic(Characteristic.LastUpdated);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.LastMoved);
      this.addOptionalCharacteristic(Characteristic.LastBatteryChange);
    };

    Service.SensorStatusService.UUID = '5E1B5EE9-393C-4377-BF6F-BDC9C9BAA487';
    util.inherits(Service.SensorStatusService, Service);
  }
};
