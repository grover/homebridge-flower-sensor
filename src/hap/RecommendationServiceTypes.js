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

    ////////////////////////////////////////////////////////////////////////////
    // Recommendation Service
    ////////////////////////////////////////////////////////////////////////////
    Service.RecommendationService = function (displayName, subtype) {
      Service.call(this, displayName, Service.RecommendationService.UUID, subtype);

      // Required Characteristics
      this.addCharacteristic(Characteristic.TargetRelativeHumidity);
      this.addCharacteristic(Characteristic.TargetAmbientLightLevel);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.Name);
    };

    Service.RecommendationService.UUID = '33A4F3A3-D2B7-4019-8209-1D037840252D';
    util.inherits(Service.RecommendationService, Service);
  }
};
