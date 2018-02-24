'use strict';

const util = require('util');

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;
    const Service = hap.Service;

    //////////////////////////////////////////////////////////////////////////////////////////
    // Target Ambient Light Level
    //////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.TargetAmbientLightLevel = function () {
      Characteristic.call(this, 'Target Ambient Light Level', Characteristic.TargetAmbientLightLevel.UUID);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
        unit: Characteristic.Units.LUX,
        minValue: 0.0001,
        maxValue: 100000.0
      });
      this.value = this.getDefaultValue();
    };
    Characteristic.TargetAmbientLightLevel.UUID = '83343E2D-6766-4E0A-AD95-B6AEBC6A343C';
    util.inherits(Characteristic.TargetAmbientLightLevel, Characteristic);

    //////////////////////////////////////////////////////////////////////////////////////////
    // Current Average Ambient Light Level
    //////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.CurrentAverageAmbientLightLevel = function () {
      Characteristic.call(this, 'Current Average Ambient Light Level', Characteristic.CurrentAverageAmbientLightLevel.UUID);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: Characteristic.Units.LUX,
        minValue: 0.0,
        maxValue: 100000.0,
        minStep: 100.0
      });
      this.value = this.getDefaultValue();
    };
    Characteristic.CurrentAverageAmbientLightLevel.UUID = 'C9E1762F-FCD9-4F92-AC52-4A7DB4959707';
    util.inherits(Characteristic.CurrentAverageAmbientLightLevel, Characteristic);

    //////////////////////////////////////////////////////////////////////////////////////////
    // Current Average Relative Humidity
    //////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.CurrentAverageRelativeHumidity = function () {
      Characteristic.call(this, 'Current Average Relative Humidity', Characteristic.CurrentAverageRelativeHumidity.UUID);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: Characteristic.Units.PERCENTAGE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    Characteristic.CurrentAverageRelativeHumidity.UUID = 'CFD8DCC6-CE11-489F-854A-92688569B855';
    util.inherits(Characteristic.CurrentAverageRelativeHumidity, Characteristic);

    ////////////////////////////////////////////////////////////////////////////
    // Recommendation Service
    ////////////////////////////////////////////////////////////////////////////
    Service.RecommendationService = function (displayName, subtype) {
      Service.call(this, displayName, Service.RecommendationService.UUID, subtype);

      // Required Characteristics
      this.addCharacteristic(Characteristic.TargetRelativeHumidity);
      this.addCharacteristic(Characteristic.TargetAmbientLightLevel);
      this.addCharacteristic(Characteristic.CurrentAverageRelativeHumidity);
      this.addCharacteristic(Characteristic.CurrentAverageAmbientLightLevel);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.Name);
    };

    Service.RecommendationService.UUID = '33A4F3A3-D2B7-4019-8209-1D037840252D';
    util.inherits(Service.RecommendationService, Service);
  }
};
